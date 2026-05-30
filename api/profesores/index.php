<?php
require '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// ==================== GET - Traer todos los profesores ====================
if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT 
            id,
            nombre AS name,
            email,
            identificacion,
            especialidad AS specialty
        FROM profesor 
        ORDER BY nombre ASC
    ");
    $profesores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($profesores);
}

// ==================== POST - Crear nuevo profesor ====================
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['name']) || empty($data['email']) || empty($data['identificacion'])) {
        http_response_code(400);
        echo json_encode(["error" => "Nombre, email e identificación son obligatorios"]);
        exit;
    }

    // Verificar duplicado
    $check = $pdo->prepare("SELECT id FROM profesor WHERE identificacion = ? OR email = ?");
    $check->execute([$data['identificacion'], $data['email']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Ya existe un profesor con ese email o identificación"]);
        exit;
    }

    // Insertar profesor
    $stmt = $pdo->prepare("
        INSERT INTO profesor (nombre, email, identificacion, especialidad)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['name'],                          // convertir name → nombre
        $data['email'],
        $data['identificacion'],
        $data['specialty'] ?? null              // convertir specialty → especialidad
    ]);
    $profesorId = $pdo->lastInsertId();

    // Crear usuario con credenciales automáticas (RF2, con el hash))
    // Contraseña inicial = su número de identificación
    $passwordHash = hash('sha256', $data['identificacion']);
    $userCheck = $pdo->prepare("SELECT id FROM usuario WHERE email = ?");
    $userCheck->execute([$data['email']]);

    if (!$userCheck->fetch()) {
        $userStmt = $pdo->prepare("
            INSERT INTO usuario (email, password_hash, rol, nombre, id_referencia)
            VALUES (?, ?, 'profesor', ?, ?)
        ");
        $userStmt->execute([
            $data['email'],
            $passwordHash,
            $data['name'],
            $profesorId
        ]);
    }

    http_response_code(201);
    echo json_encode([
        "success"  => true,
        "id"       => $profesorId,
        "message"  => "Profesor creado. Credenciales: email = {$data['email']} / contraseña = {$data['identificacion']}"
    ]);
}

// ==================== PUT - Editar profesor ====================
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID requerido para editar"]);
        exit;
    }

    // Verificar duplicado excluyendo al propio profesor
    $check = $pdo->prepare("
        SELECT id FROM profesor 
        WHERE (identificacion = ? OR email = ?) AND id != ?
    ");
    $check->execute([$data['identificacion'], $data['email'], $data['id']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Ese email o identificación ya está en uso por otro profesor"]);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE profesor 
        SET nombre = ?, email = ?, identificacion = ?, especialidad = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $data['name'],                          // convertir name → nombre
        $data['email'],
        $data['identificacion'],
        $data['specialty'] ?? null,             // convertir specialty → especialidad
        $data['id']
    ]);

    // Sincronizar email y nombre en la tabla usuario también
    $userStmt = $pdo->prepare("
        UPDATE usuario SET email = ?, nombre = ?
        WHERE id_referencia = ? AND rol = 'profesor'
    ");
    $userStmt->execute([$data['email'], $data['name'], $data['id']]);

    echo json_encode(["success" => true, "message" => "Profesor actualizado"]);
}
?>