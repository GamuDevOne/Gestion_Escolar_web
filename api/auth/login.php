<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    http_response_code(200);
    exit;
}
require '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Método no permitido", 405);
}

$data     = json_decode(file_get_contents("php://input"), true);
$email    = trim($data['email']    ?? '');
$password = trim($data['password'] ?? '');

if (!$email || !$password) {
    sendError("Email y contraseña son requeridos", 400);
}

$stmt = $pdo->prepare("SELECT * FROM usuario WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

$valid = false;
if ($user) {
    if (password_verify($password, $user['password_hash'])) {
        $valid = true;
    } elseif ($user['password_hash'] === hash('sha256', $password)) {
        $newHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $pdo->prepare("UPDATE usuario SET password_hash = ? WHERE id = ?")
            ->execute([$newHash, $user['id']]);
        $valid = true;
    }
}

if (!$valid) {
    sendError("Credenciales incorrectas", 401);
}

$pdo->prepare("UPDATE sesion SET activa = 0 WHERE usuario_id = ?")
    ->execute([$user['id']]);

$token     = bin2hex(random_bytes(32));
$expiresAt = date('Y-m-d H:i:s', strtotime('+8 hours'));

$pdo->prepare("INSERT INTO sesion (usuario_id, token, expires_at, activa) VALUES (?, ?, ?, 1)")
    ->execute([$user['id'], $token, $expiresAt]);

sendSuccess([
    "token"         => $token,
    "rol"           => $user['rol'],
    "nombre"        => $user['nombre'],
    "id_referencia" => $user['id_referencia'],
    "password_cambiada" => (bool) $user['password_cambiada']
]);
?>