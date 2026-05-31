<?php
require '../config/db.php';
require '../config/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole($pdo, ['admin', 'profesor', 'estudiante']);
    $stmt = $pdo->query("SELECT m.id, m.nombre AS name, m.codigo AS code, m.creditos AS credits, m.profesor_id AS teacherId FROM materia m ORDER BY m.nombre ASC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

elseif ($method === 'POST') {
    requireRole($pdo, 'admin');
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['name']) || empty($data['code'])) {
        http_response_code(400);
        echo json_encode(["error" => "Nombre y código son obligatorios"]);
        exit;
    }

    $check = $pdo->prepare("SELECT id FROM materia WHERE codigo = ?");
    $check->execute([$data['code']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Ya existe una materia con ese código"]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO materia (nombre, codigo, creditos, profesor_id) VALUES (?, ?, ?, ?)");
    $stmt->execute([$data['name'], $data['code'], $data['credits'] ?? 3, $data['teacherId'] ?? null]);

    http_response_code(201);
    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
}

elseif ($method === 'PUT') {
    requireRole($pdo, 'admin');
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID requerido para editar"]);
        exit;
    }

    $check = $pdo->prepare("SELECT id FROM materia WHERE codigo = ? AND id != ?");
    $check->execute([$data['code'], $data['id']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Ese código ya está en uso"]);
        exit;
    }

    $pdo->prepare("UPDATE materia SET nombre=?, codigo=?, creditos=?, profesor_id=? WHERE id=?")
        ->execute([$data['name'], $data['code'], $data['credits'] ?? 3, $data['teacherId'] ?? null, $data['id']]);

    echo json_encode(["success" => true, "message" => "Materia actualizada"]);
}
?>