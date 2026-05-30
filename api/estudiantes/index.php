<?php
require '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// ==================== GET - Traer todos los estudiantes ====================
if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT 
            id, 
            nombre AS name,
            email,
            identificacion,
            grado AS grade,
            seccion
        FROM estudiante 
        ORDER BY nombre ASC
    ");
    $estudiantes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($estudiantes);
}

// ==================== POST - Crear nuevo estudiante ====================
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // Validar campos obligatorios - usar los nombres camelCase que viene el frontend
    if (empty($data['name']) || empty($data['email']) || empty($data['identificacion'])) {
        http_response_code(400);
        echo json_encode(["error" => "Nombre, email e identificación son obligatorios"]);
        exit;
    }

    // Verificar duplicado por identificación
    $check = $pdo->prepare("SELECT id FROM estudiante WHERE identificacion = ? OR email = ?");
    $check->execute([$data['identificacion'], $data['email']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Ya existe un estudiante con ese email o identificación"]);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO estudiante (nombre, email, identificacion, grado, seccion)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['name'],                          // convertir name → nombre
        $data['email'],
        $data['identificacion'],
        $data['grade']   ?? null,               // convertir grade → grado
        $data['seccion'] ?? null
    ]);

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "id"      => $pdo->lastInsertId(),
        "message" => "Estudiante creado correctamente"
    ]);
}

// ==================== PUT - Editar estudiante ====================
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID requerido para editar"]);
        exit;
    }

    // Verificar que el email/identificacion no pertenezca a OTRO estudiante
    $check = $pdo->prepare("
        SELECT id FROM estudiante 
        WHERE (identificacion = ? OR email = ?) AND id != ?
    ");
    $check->execute([$data['identificacion'], $data['email'], $data['id']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Ese email o identificación ya está en uso por otro estudiante"]);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE estudiante 
        SET nombre = ?, email = ?, identificacion = ?, grado = ?, seccion = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $data['name'],                          // convertir name → nombre
        $data['email'],
        $data['identificacion'],
        $data['grade']   ?? null,               // convertir grade → grado
        $data['seccion'] ?? null,
        $data['id']
    ]);

    echo json_encode(["success" => true, "message" => "Estudiante actualizado"]);
}
?>