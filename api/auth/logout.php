<?php
require '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Método no permitido", 405);
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

sendSuccess(["message" => "Sesión cerrada"]);
?>