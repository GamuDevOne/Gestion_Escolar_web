<?php
require '../config/db.php';
require '../config/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole($pdo, 'admin');

    $page    = max(1, intval($_GET['page']     ?? 1));
    $perPage = max(1, min(100, intval($_GET['per_page'] ?? 10)));
    $search  = trim($_GET['search'] ?? '');
    $offset  = ($page - 1) * $perPage;

    $where  = [];
    $params = [];

    if ($search !== '') {
        $where[]  = "(nombre LIKE ? OR email LIKE ? OR identificacion LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    $whereSQL = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM estudiante $whereSQL");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT id, nombre AS name, email, identificacion, grado AS grade, seccion
        FROM estudiante
        $whereSQL
        ORDER BY nombre ASC
        LIMIT $perPage OFFSET $offset
    ");
    $stmt->execute($params);

    sendSuccess([
        "items"       => $stmt->fetchAll(PDO::FETCH_ASSOC),
        "total"       => $total,
        "page"        => $page,
        "per_page"    => $perPage,
        "total_pages" => (int) ceil($total / $perPage)
    ]);
}
elseif ($method === 'POST') {
    requireRole($pdo, 'admin');
    $data = json_decode(file_get_contents("php://input"), true);
    validateRequired($data, ['name', 'email', 'identificacion']);

    $check = $pdo->prepare("SELECT id FROM estudiante WHERE identificacion = ? OR email = ?");
    $check->execute([$data['identificacion'], $data['email']]);
    if ($check->fetch()) {
        sendError("Ya existe un estudiante con ese email o identificación", 409);
    }

    $stmt = $pdo->prepare("INSERT INTO estudiante (nombre, email, identificacion, grado, seccion) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$data['name'], $data['email'], $data['identificacion'], $data['grade'] ?? null, $data['seccion'] ?? null]);
    $estudianteId = $pdo->lastInsertId();

    $passwordHash = password_hash($data['identificacion'], PASSWORD_BCRYPT, ['cost' => 12]);
    $userCheck = $pdo->prepare("SELECT id FROM usuario WHERE email = ?");
    $userCheck->execute([$data['email']]);
    if (!$userCheck->fetch()) {
        $pdo->prepare("INSERT INTO usuario (email, password_hash, rol, nombre, id_referencia) VALUES (?, ?, 'estudiante', ?, ?)")
            ->execute([$data['email'], $passwordHash, $data['name'], $estudianteId]);
    }

    sendCreated(["id" => $estudianteId, "message" => "Estudiante creado. Contraseña inicial: {$data['identificacion']}"]);
}

elseif ($method === 'PUT') {
    requireRole($pdo, 'admin');
    $data = json_decode(file_get_contents("php://input"), true);
    validateRequired($data, ['id', 'name', 'email', 'identificacion']);

    $check = $pdo->prepare("SELECT id FROM estudiante WHERE (identificacion = ? OR email = ?) AND id != ?");
    $check->execute([$data['identificacion'], $data['email'], $data['id']]);
    if ($check->fetch()) {
        sendError("Ese email o identificación ya está en uso", 409);
    }

    $pdo->prepare("UPDATE estudiante SET nombre=?, email=?, identificacion=?, grado=?, seccion=? WHERE id=?")
        ->execute([$data['name'], $data['email'], $data['identificacion'], $data['grade'] ?? null, $data['seccion'] ?? null, $data['id']]);

    $pdo->prepare("UPDATE usuario SET email=?, nombre=? WHERE id_referencia=? AND rol='estudiante'")
        ->execute([$data['email'], $data['name'], $data['id']]);

    sendSuccess(["message" => "Estudiante actualizado"]);
}

else {
    sendError("Método no permitido", 405);
}
?>