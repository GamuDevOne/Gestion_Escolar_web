<?php
require '../config/db.php';
require '../config/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole($pdo, ['admin', 'profesor', 'estudiante']);

    $where  = [];
    $params = [];

    if ($authUser['rol'] === 'estudiante') {
        $where[]  = "c.estudiante_id = ?";
        $params[] = $authUser['id_referencia'];
    } elseif ($authUser['rol'] === 'profesor') {
        $where[]  = "m.profesor_id = ?";
        $params[] = $authUser['id_referencia'];
    }

    $whereSQL = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

    $stmt = $pdo->prepare("
        SELECT c.id, c.estudiante_id, c.materia_id, c.comentario, c.fecha,
               e.nombre AS estudiante_nombre,
               m.nombre AS materia_nombre
        FROM comentario c
        JOIN estudiante e ON c.estudiante_id = e.id
        JOIN materia    m ON c.materia_id    = m.id
        $whereSQL
        ORDER BY c.fecha DESC
    ");
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

elseif ($method === 'POST') {
    requireRole($pdo, 'estudiante');
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['materia_id']) || empty($data['comentario'])) {
        http_response_code(400);
        echo json_encode(["error" => "Materia y comentario son obligatorios"]);
        exit;
    }

    // Solo puede comentar materias en las que está matriculado
    $check = $pdo->prepare("SELECT id FROM matricula WHERE estudiante_id = ? AND materia_id = ?");
    $check->execute([$authUser['id_referencia'], $data['materia_id']]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(["error" => "No estás matriculado en esta materia"]);
        exit;
    }

    $pdo->prepare("INSERT INTO comentario (estudiante_id, materia_id, comentario, fecha) VALUES (?, ?, ?, NOW())")
        ->execute([$authUser['id_referencia'], $data['materia_id'], trim($data['comentario'])]);

    http_response_code(201);
    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
}
?>