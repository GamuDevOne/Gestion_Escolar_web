<?php
require '../config/db.php';
require '../config/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole($pdo, ['admin', 'profesor', 'estudiante']);

    $where  = [];
    $params = [];

    // Restricción automática por rol — el cliente no puede saltársela
    if ($authUser['rol'] === 'profesor') {
        $where[]  = "n.profesor_id = ?";
        $params[] = $authUser['id_referencia'];
    } elseif ($authUser['rol'] === 'estudiante') {
        $where[]  = "n.estudiante_id = ?";
        $params[] = $authUser['id_referencia'];
    } else {
        // Admin: filtros opcionales por query params
        if (!empty($_GET['estudiante_id'])) { $where[] = "n.estudiante_id = ?"; $params[] = $_GET['estudiante_id']; }
        if (!empty($_GET['materia_id']))    { $where[] = "n.materia_id = ?";    $params[] = $_GET['materia_id']; }
        if (!empty($_GET['trimestre']))     { $where[] = "n.trimestre = ?";     $params[] = $_GET['trimestre']; }
        if (!empty($_GET['profesor_id']))   { $where[] = "n.profesor_id = ?";   $params[] = $_GET['profesor_id']; }
    }

    // Para profesor/estudiante, también permitir filtros adicionales seguros
    if ($authUser['rol'] === 'profesor' && !empty($_GET['materia_id'])) {
        $where[]  = "n.materia_id = ?";
        $params[] = $_GET['materia_id'];
    }
    if ($authUser['rol'] === 'profesor' && !empty($_GET['estudiante_id'])) {
        $where[]  = "n.estudiante_id = ?";
        $params[] = $_GET['estudiante_id'];
    }
    if ($authUser['rol'] !== 'admin' && !empty($_GET['trimestre'])) {
        $where[]  = "n.trimestre = ?";
        $params[] = $_GET['trimestre'];
    }

    $whereSQL = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

    $stmt = $pdo->prepare("
        SELECT n.*, e.nombre AS estudiante_nombre, m.nombre AS materia_nombre, p.nombre AS profesor_nombre
        FROM nota n
        JOIN estudiante e ON n.estudiante_id = e.id
        JOIN materia    m ON n.materia_id    = m.id
        JOIN profesor   p ON n.profesor_id   = p.id
        $whereSQL
        ORDER BY n.fecha_registro DESC
    ");
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

elseif ($method === 'POST') {
    requireRole($pdo, 'profesor');
    $data = json_decode(file_get_contents("php://input"), true);

    // profesor_id viene del token, no del body (seguridad)
    $profesorId = $authUser['id_referencia'];

    if (empty($data['estudiante_id']) || empty($data['materia_id']) || empty($data['tipo']) || !isset($data['puntaje']) || empty($data['trimestre'])) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan campos obligatorios"]);
        exit;
    }

    $puntaje = floatval($data['puntaje']);
    if ($puntaje < 1.0 || $puntaje > 5.0) {
        http_response_code(400);
        echo json_encode(["error" => "La nota debe estar entre 1.0 y 5.0"]);
        exit;
    }

    if (!in_array($data['tipo'], ['parcial', 'taller', 'tarea'])) {
        http_response_code(400);
        echo json_encode(["error" => "Tipo de evaluación no válido"]);
        exit;
    }

    if (!in_array($data['trimestre'], ['I Trimestre', 'II Trimestre', 'III Trimestre'])) {
        http_response_code(400);
        echo json_encode(["error" => "Trimestre no válido"]);
        exit;
    }

    // Verificar que este profesor dicta la materia
    $checkMateria = $pdo->prepare("SELECT id FROM materia WHERE id = ? AND profesor_id = ?");
    $checkMateria->execute([$data['materia_id'], $profesorId]);
    if (!$checkMateria->fetch()) {
        http_response_code(403);
        echo json_encode(["error" => "No tienes asignada esta materia"]);
        exit;
    }

    // Verificar que el estudiante está matriculado
    $checkMatricula = $pdo->prepare("SELECT id FROM matricula WHERE estudiante_id = ? AND materia_id = ?");
    $checkMatricula->execute([$data['estudiante_id'], $data['materia_id']]);
    if (!$checkMatricula->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "El estudiante no está matriculado en esta materia"]);
        exit;
    }

    $pdo->prepare("INSERT INTO nota (estudiante_id, materia_id, profesor_id, tipo, puntaje, trimestre, comentario, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())")
        ->execute([$data['estudiante_id'], $data['materia_id'], $profesorId, $data['tipo'], $puntaje, $data['trimestre'], $data['comentario'] ?? null]);

    http_response_code(201);
    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
}

elseif ($method === 'PUT') {
    requireRole($pdo, 'profesor');
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID de nota requerido"]);
        exit;
    }

    $puntaje = floatval($data['puntaje']);
    if ($puntaje < 1.0 || $puntaje > 5.0) {
        http_response_code(400);
        echo json_encode(["error" => "La nota debe estar entre 1.0 y 5.0"]);
        exit;
    }

    // Verificar que la nota pertenece a este profesor
    $notaActual = $pdo->prepare("SELECT * FROM nota WHERE id = ? AND profesor_id = ?");
    $notaActual->execute([$data['id'], $authUser['id_referencia']]);
    $anterior = $notaActual->fetch(PDO::FETCH_ASSOC);

    if (!$anterior) {
        http_response_code(403);
        echo json_encode(["error" => "Nota no encontrada o no tienes permiso para editarla"]);
        exit;
    }

    $pdo->prepare("UPDATE nota SET puntaje=?, tipo=?, comentario=?, trimestre=? WHERE id=?")
        ->execute([$puntaje, $data['tipo'] ?? $anterior['tipo'], $data['comentario'] ?? $anterior['comentario'], $data['trimestre'] ?? $anterior['trimestre'], $data['id']]);

    // Auditoría — editor_id viene del token
    $pdo->prepare("INSERT INTO nota_auditoria (nota_id, editor_id, puntaje_anterior, puntaje_nuevo, fecha_cambio) VALUES (?, ?, ?, ?, NOW())")
        ->execute([$data['id'], $authUser['usuario_id'], $anterior['puntaje'], $puntaje]);

    echo json_encode(["success" => true, "message" => "Nota actualizada"]);
}

elseif ($method === 'DELETE') {
    requireRole($pdo, 'profesor');
    $data = json_decode(file_get_contents("php://input"), true);
    $id   = $data['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID requerido"]);
        exit;
    }

    // Solo puede eliminar sus propias notas
    $check = $pdo->prepare("SELECT id FROM nota WHERE id = ? AND profesor_id = ?");
    $check->execute([$id, $authUser['id_referencia']]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(["error" => "Nota no encontrada o no tienes permiso para eliminarla"]);
        exit;
    }

    $pdo->prepare("DELETE FROM nota WHERE id = ?")->execute([$id]);
    echo json_encode(["success" => true, "message" => "Nota eliminada"]);
}
?>