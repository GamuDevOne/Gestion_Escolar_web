<?php
require '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

$data     = json_decode(file_get_contents("php://input"), true);
$email    = trim($data['email']    ?? '');
$password = trim($data['password'] ?? '');

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "Email y contraseña son requeridos"]);
    exit;
}

// Buscar usuario por email
$stmt = $pdo->prepare("SELECT * FROM usuario WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Verificar contraseña
// Soporta bcrypt (nuevo) y SHA256 (legado) con migración automática
$valid = false;
if ($user) {
    if (password_verify($password, $user['password_hash'])) {
        $valid = true;
    } elseif ($user['password_hash'] === hash('sha256', $password)) {
        // Migrar contraseña antigua a bcrypt en el momento del login
        $newHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $pdo->prepare("UPDATE usuario SET password_hash = ? WHERE id = ?")
            ->execute([$newHash, $user['id']]);
        $valid = true;
    }
}

if (!$valid) {
    // Mismo mensaje para email incorrecto o contraseña incorrecta (seguridad)
    http_response_code(401);
    echo json_encode(["error" => "Credenciales incorrectas"]);
    exit;
}

// Invalidar sesiones previas del mismo usuario
$pdo->prepare("UPDATE sesion SET activa = 0 WHERE usuario_id = ?")
    ->execute([$user['id']]);

// Generar token seguro y registrar sesión (8 horas de duración)
$token     = bin2hex(random_bytes(32));
$expiresAt = date('Y-m-d H:i:s', strtotime('+8 hours'));

$pdo->prepare("
    INSERT INTO sesion (usuario_id, token, expires_at, activa)
    VALUES (?, ?, ?, 1)
")->execute([$user['id'], $token, $expiresAt]);

echo json_encode([
    "success"       => true,
    "token"         => $token,
    "rol"           => $user['rol'],
    "nombre"        => $user['nombre'],
    "id_referencia" => $user['id_referencia']
]);
?>