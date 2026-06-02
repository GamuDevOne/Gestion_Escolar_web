<?php
require '../config/db.php';
require '../config/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole($pdo, ['admin', 'profesor', 'estudiante']);

    $where = []; $params = [];

    if ($authUser['rol'] === 'profesor') {
        $where[] = "n.profesor_id = ?"; $params[] = $authUser['id_referencia'];
        if (!empty($_GET['materia_id']))    { $where[] = "n.materia_id = ?";    $params[] = $_GET['materia_id']; }
        if (!empty($_GET['estudiante_id'])) { $where[] = "n.estudiante_id = ?"; $params[] = $_GET['estudiante_id']; }
        if (!empty($_GET['trimestre']))     { $where[] = "n.trimestre = ?";     $params[] = $_GET['trimestre']; }
    } elseif ($authUser['rol'] === 'estudiante') {
        $where[] = "n.estudiante_id = ?"; $params[] = $authUser['id_referencia'];
        if (!empty($_GET['trimestre']))     { $where[] = "n.trimestre = ?";     $params[] = $_GET['trimestre']; }
    } else {
        if (!empty($_GET['estudiante_id'])) { $where[] = "n.estudiante_id = ?"; $params[] = $_GET['estudiante_id']; }
        if (!empty($_GET['materia_id']))    { $where[] = "n.materia_id = ?";    $params[] = $_GET['materia_id']; }
        if (!empty($_GET['trimestre']))     { $where[] = "n.trimestre = ?";     $params[] = $_GET['trimestre']; }
        if (!empty($_GET['profesor_id']))   { $where[] = "n.profesor_id = ?";   $params[] = $_GET['profesor_id']; }
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
    sendSuccess($stmt->fetchAll(PDO::FETCH_ASSOC));
}

elseif ($method === 'POST') {
    requireRole($pdo, 'profesor');
    $data = json_decode(file_get_contents("php://input"), true);
    validateRequired($data, ['estudiante_id', 'materia_id', 'tipo', 'puntaje', 'trimestre']);

    $puntaje = floatval($data['puntaje']);
    if ($puntaje < 1.0 || $puntaje > 5.0) sendError("La nota debe estar entre 1.0 y 5.0", 400);
    if (!in_array($data['tipo'], ['parcial', 'taller', 'tarea'])) sendError("Tipo de evaluación no válido", 400);
    if (!in_array($data['trimestre'], ['I Trimestre', 'II Trimestre', 'III Trimestre'])) sendError("Trimestre no válido", 400);

    $profesorId = $authUser['id_referencia'];

    $checkMateria = $pdo->prepare("SELECT id FROM materia WHERE id = ? AND profesor_id = ?");
    $checkMateria->execute([$data['materia_id'], $profesorId]);
    if (!$checkMateria->fetch()) sendError("No tienes asignada esta materia", 403);

    $checkMatricula = $pdo->prepare("SELECT id FROM matricula WHERE estudiante_id = ? AND materia_id = ?");
    $checkMatricula->execute([$data['estudiante_id'], $data['materia_id']]);
    if (!$checkMatricula->fetch()) sendError("El estudiante no está matriculado en esta materia", 409);

    $pdo->prepare("INSERT INTO nota (estudiante_id, materia_id, profesor_id, tipo, puntaje, trimestre, comentario, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())")
        ->execute([$data['estudiante_id'], $data['materia_id'], $profesorId, $data['tipo'], $puntaje, $data['trimestre'], $data['comentario'] ?? null]);

    sendCreated(["id" => $pdo->lastInsertId()]);
}

elseif ($method === 'PUT') {
    requireRole($pdo, 'profesor');
    $data = json_decode(file_get_contents("php://input"), true);
    validateRequired($data, ['id', 'puntaje']);

    $puntaje = floatval($data['puntaje']);
    if ($puntaje < 1.0 || $puntaje > 5.0) sendError("La nota debe estar entre 1.0 y 5.0", 400);

    $notaActual = $pdo->prepare("SELECT * FROM nota WHERE id = ? AND profesor_id = ?");
    $notaActual->execute([$data['id'], $authUser['id_referencia']]);
    $anterior = $notaActual->fetch(PDO::FETCH_ASSOC);
    if (!$anterior) sendError("Nota no encontrada o sin permiso para editarla", 403);

    $pdo->prepare("UPDATE nota SET puntaje=?, tipo=?, comentario=?, trimestre=? WHERE id=?")
        ->execute([$puntaje, $data['tipo'] ?? $anterior['tipo'], $data['comentario'] ?? $anterior['comentario'], $data['trimestre'] ?? $anterior['trimestre'], $data['id']]);

    $pdo->prepare("INSERT INTO nota_auditoria (nota_id, editor_id, puntaje_anterior, puntaje_nuevo, fecha_cambio) VALUES (?, ?, ?, ?, NOW())")
        ->execute([$data['id'], $authUser['usuario_id'], $anterior['puntaje'], $puntaje]);

    sendSuccess(["message" => "Nota actualizada"]);
}

elseif ($method === 'DELETE') {
    requireRole($pdo, 'profesor');
    $data = json_decode(file_get_contents("php://input"), true);
    $id   = $data['id'] ?? null;

    if (!$id) sendError("ID requerido", 400);

    $check = $pdo->prepare("SELECT id FROM nota WHERE id = ? AND profesor_id = ?");
    $check->execute([$id, $authUser['id_referencia']]);
    if (!$check->fetch()) sendError("Nota no encontrada o sin permiso para eliminarla", 403);

    $pdo->prepare("DELETE FROM nota WHERE id = ?")->execute([$id]);
    sendSuccess(["message" => "Nota eliminada"]);
}

else {
    sendError("Método no permitido", 405);
}
?>