<?php
require '../config/db.php';
require '../config/auth_middleware.php';
requireRole($pdo, 'admin');

$data = json_decode(file_get_contents("php://input"), true);
$id   = $data['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(["error" => "ID requerido"]);
    exit;
}

$checkNotas = $pdo->prepare("SELECT id FROM nota WHERE profesor_id = ? LIMIT 1");
$checkNotas->execute([$id]);
if ($checkNotas->fetch()) {
    http_response_code(409);
    echo json_encode(["error" => "No se puede eliminar: el profesor tiene notas registradas"]);
    exit;
}

$pdo->prepare("UPDATE materia SET profesor_id = NULL WHERE profesor_id = ?")->execute([$id]);
$pdo->prepare("DELETE FROM usuario WHERE id_referencia = ? AND rol = 'profesor'")->execute([$id]);
$pdo->prepare("DELETE FROM profesor WHERE id = ?")->execute([$id]);

echo json_encode(["success" => true, "message" => "Profesor eliminado"]);
?>