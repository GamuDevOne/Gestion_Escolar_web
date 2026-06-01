<?php
require '../config/db.php';
require '../config/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole($pdo, ['admin', 'profesor', 'estudiante']);

    $where  = [];
    $params = [];

    // Restricción automática por rol
    if ($authUser['rol'] === 'estudiante') {
        $where[]  = "m.estudiante_id = ?";
        $params[] = $authUser['id_referencia'];
    } elseif ($authUser['rol'] === 'profesor') {
        $where[]  = "s.profesor_id = ?";
        $params[] = $authUser['id_referencia'];
    }

    $whereSQL = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

    $stmt = $pdo->prepare("
    SELECT m.id, m.estudiante_id AS studentId, m.materia_id AS subjectId,
           m.fecha_asignacion AS enrollmentDate,
           e.nombre AS studentName, e.grado AS studentGrade, e.email AS studentEmail,
           s.nombre AS subjectName, s.codigo AS subjectCode,
           p.nombre AS teacherName
    FROM matricula m
    JOIN estudiante e ON m.estudiante_id = e.id
    JOIN materia    s ON m.materia_id    = s.id
    LEFT JOIN profesor p ON s.profesor_id = p.id
    $whereSQL
    ORDER BY e.nombre ASC
");
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

elseif ($method === 'POST') {
    requireRole($pdo, 'admin');
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['studentId']) || empty($data['subjectId'])) {
        http_response_code(400);
        echo json_encode(["error" => "studentId y subjectId son obligatorios"]);
        exit;
    }

    $checkEst = $pdo->prepare("SELECT id FROM estudiante WHERE id = ?");
    $checkEst->execute([$data['studentId']]);
    if (!$checkEst->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "El estudiante no existe"]);
        exit;
    }

    $checkMat = $pdo->prepare("SELECT id FROM materia WHERE id = ?");
    $checkMat->execute([$data['subjectId']]);
    if (!$checkMat->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "La materia no existe"]);
        exit;
    }

    $check = $pdo->prepare("SELECT id FROM matricula WHERE estudiante_id = ? AND materia_id = ?");
    $check->execute([$data['studentId'], $data['subjectId']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Este estudiante ya está matriculado en esta materia"]);
        exit;
    }

    $pdo->prepare("INSERT INTO matricula (estudiante_id, materia_id, fecha_asignacion) VALUES (?, ?, CURDATE())")
        ->execute([$data['studentId'], $data['subjectId']]);

    http_response_code(201);
    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
}

elseif ($method === 'DELETE') {
    requireRole($pdo, 'admin');
    $data = json_decode(file_get_contents("php://input"), true);
    $id   = $data['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID requerido"]);
        exit;
    }

    $check = $pdo->prepare("SELECT id FROM matricula WHERE id = ?");
    $check->execute([$id]);
    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "Matrícula no encontrada"]);
        exit;
    }

    $pdo->prepare("DELETE FROM matricula WHERE id = ?")->execute([$id]);
    echo json_encode(["success" => true, "message" => "Matrícula eliminada"]);
}
?>