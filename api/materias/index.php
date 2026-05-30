<?php
require '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// ==================== GET - Traer todas las materias ====================
if ($method === 'GET') {
    // Hacemos JOIN con profesor para devolver el nombre directamente
    $stmt = $pdo->query("
        SELECT 
            m.id,
            m.nombre AS name,
            m.codigo AS code,
            m.creditos AS credits,
            m.profesor_id AS teacherId
        FROM materia m
        ORDER BY m.nombre ASC
    ");
    $materias = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($materias);
}

// ==================== POST - Crear nueva materia ====================
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['name']) || empty($data['code'])) {
        http_response_code(400);
        echo json_encode(["error" => "Nombre y código son obligatorios"]);
        exit;
    }

    // Verificar código duplicado
    $check = $pdo->prepare("SELECT id FROM materia WHERE codigo = ?");
    $check->execute([$data['code']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Ya existe una materia con ese código"]);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO materia (nombre, codigo, creditos, profesor_id)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['name'],                          // convertir name → nombre
        $data['code'],                          // convertir code → codigo
        $data['credits']    ?? 3,               // convertir credits → creditos
        $data['teacherId'] ?? null              // convertir teacherId → profesor_id
    ]);

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "id"      => $pdo->lastInsertId(),
        "message" => "Materia creada correctamente"
    ]);
}

// ==================== PUT - Editar materia ====================
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID requerido para editar"]);
        exit;
    }

    // Verificar código duplicado excluyendo la propia materia
    $check = $pdo->prepare("
        SELECT id FROM materia WHERE codigo = ? AND id != ?
    ");
    $check->execute([$data['code'], $data['id']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Ese código ya está en uso por otra materia"]);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE materia
        SET nombre = ?, codigo = ?, creditos = ?, profesor_id = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $data['name'],                          // convertir name → nombre
        $data['code'],                          // convertir code → codigo
        $data['credits']    ?? 3,               // convertir credits → creditos
        $data['teacherId'] ?? null,             // convertir teacherId → profesor_id
        $data['id']
    ]);

    echo json_encode(["success" => true, "message" => "Materia actualizada"]);
}
?>