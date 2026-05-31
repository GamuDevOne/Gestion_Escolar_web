<?php
require '../config/db.php';
require '../config/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole($pdo, 'admin');
    $stmt = $pdo->query("
        SELECT id, nombre AS name, email, identificacion, grado AS grade, seccion
        FROM estudiante ORDER BY nombre ASC
    ");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

elseif ($method === 'POST') {
    requireRole($pdo, 'admin');
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['name']) || empty($data['email']) || empty($data['identificacion'])) {
        http_response_code(400);
        echo json_encode(["error" => "Nombre, email e identificación son obligatorios"]);
        exit;
    }

    $check = $pdo->prepare("SELECT id FROM estudiante WHERE identificacion = ? OR email = ?");
    $check->execute([$data['identificacion'], $data['email']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Ya existe un estudiante con ese email o identificación"]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO estudiante (nombre, email, identificacion, grado, seccion) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$data['name'], $data['email'], $data['identificacion'], $data['grade'] ?? null, $data['seccion'] ?? null]);

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

    $check = $pdo->prepare("SELECT id FROM estudiante WHERE (identificacion = ? OR email = ?) AND id != ?");
    $check->execute([$data['identificacion'], $data['email'], $data['id']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Ese email o identificación ya está en uso"]);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE estudiante SET nombre=?, email=?, identificacion=?, grado=?, seccion=? WHERE id=?");
    $stmt->execute([$data['name'], $data['email'], $data['identificacion'], $data['grade'] ?? null, $data['seccion'] ?? null, $data['id']]);

    echo json_encode(["success" => true, "message" => "Estudiante actualizado"]);
}
?>