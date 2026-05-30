<?php
require '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// ==================== GET - Traer todas las matrículas ====================
if ($method === 'GET') {
    // JOIN con las tres tablas para devolver nombres directamente
    $stmt = $pdo->query("
        SELECT 
            m.id,
            m.estudiante_id AS studentId,
            m.materia_id AS subjectId,
            m.fecha_asignacion AS enrollmentDate,
            e.nombre  AS studentName,
            e.grado   AS studentGrade,
            s.nombre  AS subjectName,
            s.codigo  AS subjectCode,
            p.nombre  AS teacherName
        FROM matricula m
        JOIN estudiante e ON m.estudiante_id = e.id
        JOIN materia    s ON m.materia_id    = s.id
        LEFT JOIN profesor p ON s.profesor_id = p.id
        ORDER BY e.nombre ASC
    ");
    $matriculas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($matriculas);
}

// ==================== POST - Crear matrícula ====================
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['studentId']) || empty($data['subjectId'])) {
        http_response_code(400);
        echo json_encode(["error" => "studentId y subjectId son obligatorios"]);
        exit;
    }

    // Verificar que el estudiante existe
    $checkEst = $pdo->prepare("SELECT id FROM estudiante WHERE id = ?");
    $checkEst->execute([$data['studentId']]);
    if (!$checkEst->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "El estudiante no existe"]);
        exit;
    }

    // Verificar que la materia existe
    $checkMat = $pdo->prepare("SELECT id FROM materia WHERE id = ?");
    $checkMat->execute([$data['subjectId']]);
    if (!$checkMat->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "La materia no existe"]);
        exit;
    }

    // Verificar matrícula duplicada
    $check = $pdo->prepare("
        SELECT id FROM matricula 
        WHERE estudiante_id = ? AND materia_id = ?
    ");
    $check->execute([$data['studentId'], $data['subjectId']]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Este estudiante ya está matriculado en esta materia"]);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO matricula (estudiante_id, materia_id, fecha_asignacion)
        VALUES (?, ?, CURDATE())
    ");
    $stmt->execute([
        $data['studentId'],
        $data['subjectId']
    ]);

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "id"      => $pdo->lastInsertId(),
        "message" => "Matrícula creada correctamente"
    ]);
}

// ==================== DELETE - Eliminar matrícula ====================
elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id   = $data['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID requerido"]);
        exit;
    }

    // Verificar que la matrícula existe
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