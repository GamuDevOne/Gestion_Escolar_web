<?php
require '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// ==================== GET - Traer notas ====================
if ($method === 'GET') {
    // Permite filtrar por estudiante, materia y/o trimestre via query params
    // Ejemplo: notas/index.php?estudiante_id=1&materia_id=2&trimestre=I+Trimestre

    $where  = [];
    $params = [];

    if (!empty($_GET['estudiante_id'])) {
        $where[]  = "n.estudiante_id = ?";
        $params[] = $_GET['estudiante_id'];
    }
    if (!empty($_GET['materia_id'])) {
        $where[]  = "n.materia_id = ?";
        $params[] = $_GET['materia_id'];
    }
    if (!empty($_GET['trimestre'])) {
        $where[]  = "n.trimestre = ?";
        $params[] = $_GET['trimestre'];
    }
    if (!empty($_GET['profesor_id'])) {
        $where[]  = "n.profesor_id = ?";
        $params[] = $_GET['profesor_id'];
    }

    $whereSQL = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

    $stmt = $pdo->prepare("
        SELECT
            n.*,
            e.nombre AS estudiante_nombre,
            m.nombre AS materia_nombre,
            p.nombre AS profesor_nombre
        FROM nota n
        JOIN estudiante e ON n.estudiante_id = e.id
        JOIN materia    m ON n.materia_id    = m.id
        JOIN profesor   p ON n.profesor_id   = p.id
        $whereSQL
        ORDER BY n.fecha_registro DESC
    ");
    $stmt->execute($params);
    $notas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($notas);
}

// ==================== POST - Registrar nota ====================
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // Validar campos obligatorios
    if (
        empty($data['estudiante_id']) ||
        empty($data['materia_id'])    ||
        empty($data['profesor_id'])   ||
        empty($data['tipo'])          ||
        !isset($data['puntaje'])      ||
        empty($data['trimestre'])
    ) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan campos obligatorios"]);
        exit;
    }

    // Validar rango de nota (RF4)
    $puntaje = floatval($data['puntaje']);
    if ($puntaje < 1.0 || $puntaje > 5.0) {
        http_response_code(400);
        echo json_encode(["error" => "La nota debe estar entre 1.0 y 5.0"]);
        exit;
    }

    // Validar que el tipo sea válido
    $tiposValidos = ['parcial', 'taller', 'tarea'];
    if (!in_array($data['tipo'], $tiposValidos)) {
        http_response_code(400);
        echo json_encode(["error" => "Tipo de evaluación no válido"]);
        exit;
    }

    // Validar que el trimestre sea válido
    $trimestresValidos = ['I Trimestre', 'II Trimestre', 'III Trimestre'];
    if (!in_array($data['trimestre'], $trimestresValidos)) {
        http_response_code(400);
        echo json_encode(["error" => "Trimestre no válido"]);
        exit;
    }

    // Verificar que el estudiante esté matriculado en esa materia
    $checkMatricula = $pdo->prepare("
        SELECT id FROM matricula 
        WHERE estudiante_id = ? AND materia_id = ?
    ");
    $checkMatricula->execute([$data['estudiante_id'], $data['materia_id']]);
    if (!$checkMatricula->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "El estudiante no está matriculado en esta materia"]);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO nota 
            (estudiante_id, materia_id, profesor_id, tipo, puntaje, trimestre, comentario, fecha_registro)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $data['estudiante_id'],
        $data['materia_id'],
        $data['profesor_id'],
        $data['tipo'],
        $puntaje,
        $data['trimestre'],
        $data['comentario'] ?? null
    ]);

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "id"      => $pdo->lastInsertId(),
        "message" => "Nota registrada correctamente"
    ]);
}

// ==================== PUT - Editar nota (con auditoría RF7) ====================
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id']) || empty($data['editor_id'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID de nota e ID del editor son obligatorios"]);
        exit;
    }

    // Validar rango
    $puntaje = floatval($data['puntaje']);
    if ($puntaje < 1.0 || $puntaje > 5.0) {
        http_response_code(400);
        echo json_encode(["error" => "La nota debe estar entre 1.0 y 5.0"]);
        exit;
    }

    // Obtener la nota actual antes de modificar (para el log)
    $notaActual = $pdo->prepare("SELECT * FROM nota WHERE id = ?");
    $notaActual->execute([$data['id']]);
    $anterior = $notaActual->fetch(PDO::FETCH_ASSOC);

    if (!$anterior) {
        http_response_code(404);
        echo json_encode(["error" => "Nota no encontrada"]);
        exit;
    }

    // Actualizar la nota
    $stmt = $pdo->prepare("
        UPDATE nota
        SET puntaje = ?, tipo = ?, comentario = ?, trimestre = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $puntaje,
        $data['tipo']       ?? $anterior['tipo'],
        $data['comentario'] ?? $anterior['comentario'],
        $data['trimestre']  ?? $anterior['trimestre'],
        $data['id']
    ]);

    // Registrar auditoría (RF7)
    $logStmt = $pdo->prepare("
        INSERT INTO nota_auditoria 
            (nota_id, editor_id, puntaje_anterior, puntaje_nuevo, fecha_cambio)
        VALUES (?, ?, ?, ?, NOW())
    ");
    $logStmt->execute([
        $data['id'],
        $data['editor_id'],
        $anterior['puntaje'],
        $puntaje
    ]);

    echo json_encode(["success" => true, "message" => "Nota actualizada"]);
}

// ==================== DELETE - Eliminar nota ====================
elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id   = $data['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID requerido"]);
        exit;
    }

    $check = $pdo->prepare("SELECT id FROM nota WHERE id = ?");
    $check->execute([$id]);
    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "Nota no encontrada"]);
        exit;
    }

    $pdo->prepare("DELETE FROM nota WHERE id = ?")->execute([$id]);

    echo json_encode(["success" => true, "message" => "Nota eliminada"]);
}
?>