<?php
require '../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

$stmt = $pdo->prepare("SELECT * FROM usuario WHERE email = ? AND password_hash = SHA2(?, 256)");
$stmt->execute([$email, $password]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo json_encode([
        "success" => true,
        "rol" => $user['rol'],
        "nombre" => $user['nombre'],
        "id_referencia" => $user['id_referencia']
    ]);
} else {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Credenciales incorrectas"]);
}
?>