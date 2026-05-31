<?php
require '../config/db.php';
require '../config/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole($pdo, 'admin');
    $stmt = $pdo->query("SELECT id, nombre AS name, email, identificacion, especialidad AS specialty FROM profesor ORDER BY nombre ASC");
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

    $check = $pdo->prepare("SELECT id FROM profesor WHERE identificacion = ? OR email = ?");
    $check->execute([$data['identificacion'], $data['email']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Ya existe un profesor con ese email o identificación"]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO profesor (nombre, email, identificacion, especialidad) VALUES (?, ?, ?, ?)");
    $stmt->execute([$data['name'], $data['email'], $data['identificacion'], $data['specialty'] ?? null]);
    $profesorId = $pdo->lastInsertId();

    // Crear usuario con bcrypt (ya no SHA256)
    $passwordHash = password_hash($data['identificacion'], PASSWORD_BCRYPT, ['cost' => 12]);
    $userCheck = $pdo->prepare("SELECT id FROM usuario WHERE email = ?");
    $userCheck->execute([$data['email']]);
    if (!$userCheck->fetch()) {
        $pdo->prepare("INSERT INTO usuario (email, password_hash, rol, nombre, id_referencia) VALUES (?, ?, 'profesor', ?, ?)")
            ->execute([$data['email'], $passwordHash, $data['name'], $profesorId]);
    }

    http_response_code(201);
    echo json_encode(["success" => true, "id" => $profesorId, "message" => "Profesor creado. Contraseña inicial: {$data['identificacion']}"]);
}

elseif ($method === 'PUT') {
    requireRole($pdo, 'admin');
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID requerido para editar"]);
        exit;
    }

    $check = $pdo->prepare("SELECT id FROM profesor WHERE (identificacion = ? OR email = ?) AND id != ?");
    $check->execute([$data['identificacion'], $data['email'], $data['id']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Ese email o identificación ya está en uso"]);
        exit;
    }

    $pdo->prepare("UPDATE profesor SET nombre=?, email=?, identificacion=?, especialidad=? WHERE id=?")
        ->execute([$data['name'], $data['email'], $data['identificacion'], $data['specialty'] ?? null, $data['id']]);

    $pdo->prepare("UPDATE usuario SET email=?, nombre=? WHERE id_referencia=? AND rol='profesor'")
        ->execute([$data['email'], $data['name'], $data['id']]);

    echo json_encode(["success" => true, "message" => "Profesor actualizado"]);
}
?>