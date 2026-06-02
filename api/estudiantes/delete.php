<?php
require '../config/db.php';
require '../config/auth_middleware.php';
requireRole($pdo, 'admin');

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendError("Método no permitido", 405);
}

$data = json_decode(file_get_contents("php://input"), true);
$id   = $data['id'] ?? null;

if (!$id) sendError("ID requerido", 400);

$checkNotas = $pdo->prepare("SELECT id FROM nota WHERE estudiante_id = ? LIMIT 1");
$checkNotas->execute([$id]);
if ($checkNotas->fetch()) {
    sendError("No se puede eliminar: el estudiante tiene notas registradas", 409);
}

$pdo->prepare("DELETE FROM matricula WHERE estudiante_id = ?")->execute([$id]);
$pdo->prepare("DELETE FROM usuario WHERE id_referencia = ? AND rol = 'estudiante'")->execute([$id]);
$pdo->prepare("DELETE FROM estudiante WHERE id = ?")->execute([$id]);

sendSuccess(["message" => "Estudiante eliminado"]);
?>