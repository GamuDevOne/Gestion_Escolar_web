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
        $where[]  = "(nombre LIKE ? OR email LIKE ? OR especialidad LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    $whereSQL = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM profesor $whereSQL");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT id, nombre AS name, email, identificacion, especialidad AS specialty,
               password_inicial AS initialPassword
        FROM profesor
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

    $check = $pdo->prepare("SELECT id FROM profesor WHERE identificacion = ? OR email = ?");
    $check->execute([$data['identificacion'], $data['email']]);
    if ($check->fetch()) {
        sendError("Ya existe un profesor con ese email o identificación", 409);
    }

    $passwordPlain = !empty($data['initialPassword'])
        ? $data['initialPassword']
        : $data['identificacion'];

    $stmt = $pdo->prepare("
        INSERT INTO profesor (nombre, email, identificacion, especialidad, password_inicial)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['name'], $data['email'], $data['identificacion'],
        $data['specialty'] ?? null, $passwordPlain
    ]);
    $profesorId = $pdo->lastInsertId();

    $passwordHash = password_hash($passwordPlain, PASSWORD_BCRYPT, ['cost' => 12]);
    $userCheck = $pdo->prepare("SELECT id FROM usuario WHERE email = ?");
    $userCheck->execute([$data['email']]);
    if (!$userCheck->fetch()) {
        $pdo->prepare("INSERT INTO usuario (email, password_hash, rol, nombre, id_referencia) VALUES (?, ?, 'profesor', ?, ?)")
            ->execute([$data['email'], $passwordHash, $data['name'], $profesorId]);
    }

    sendCreated([
        "id"              => $profesorId,
        "initialPassword" => $passwordPlain,
        "message"         => "Profesor creado. Contraseña inicial: $passwordPlain"
    ]);
}

elseif ($method === 'PUT') {
    requireRole($pdo, 'admin');
    $data = json_decode(file_get_contents("php://input"), true);
    validateRequired($data, ['id', 'name', 'email', 'identificacion']);

    $check = $pdo->prepare("SELECT id FROM profesor WHERE (identificacion = ? OR email = ?) AND id != ?");
    $check->execute([$data['identificacion'], $data['email'], $data['id']]);
    if ($check->fetch()) {
        sendError("Ese email o identificación ya está en uso", 409);
    }

    $passwordPlain = !empty($data['initialPassword']) ? $data['initialPassword'] : null;

    $pdo->prepare("
        UPDATE profesor SET nombre=?, email=?, identificacion=?, especialidad=?,
        password_inicial = COALESCE(?, password_inicial)
        WHERE id=?
    ")->execute([
        $data['name'], $data['email'], $data['identificacion'],
        $data['specialty'] ?? null, $passwordPlain, $data['id']
    ]);

    $pdo->prepare("UPDATE usuario SET email=?, nombre=? WHERE id_referencia=? AND rol='profesor'")
        ->execute([$data['email'], $data['name'], $data['id']]);

    if ($passwordPlain) {
    $newHash = password_hash($passwordPlain, PASSWORD_BCRYPT, ['cost' => 12]);
    $pdo->prepare("UPDATE usuario SET password_hash=?, password_cambiada=0, preguntas_configuradas=0 WHERE id_referencia=? AND rol='profesor'")
        ->execute([$newHash, $data['id']]);
    $usuarioStmt = $pdo->prepare("SELECT id FROM usuario WHERE id_referencia=? AND rol='profesor'");
    $usuarioStmt->execute([$data['id']]);
    $usuarioId = $usuarioStmt->fetchColumn();
    if ($usuarioId) {
        $pdo->prepare("DELETE FROM usuario_pregunta WHERE usuario_id=?")->execute([$usuarioId]);
        }
    }

    sendSuccess(["message" => "Profesor actualizado"]);
}

else {
    sendError("Método no permitido", 405);
}
?>