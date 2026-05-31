<?php
require '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

$token = null;
foreach (getallheaders() as $key => $value) {
    if (strtolower($key) === 'authorization') {
        $parts = explode(' ', $value);
        if (count($parts) === 2 && $parts[0] === 'Bearer') {
            $token = $parts[1];
        }
    }
}

if ($token) {
    $pdo->prepare("UPDATE sesion SET activa = 0 WHERE token = ?")
        ->execute([$token]);
}

echo json_encode(["success" => true, "message" => "Sesión cerrada"]);
?>