<?php
require '../config/db.php';
require '../config/auth_middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Método no permitido", 405);
}

$stmt = $pdo->query("SELECT id, pregunta FROM pregunta_seguridad ORDER BY id ASC");
sendSuccess($stmt->fetchAll(PDO::FETCH_ASSOC));
?>