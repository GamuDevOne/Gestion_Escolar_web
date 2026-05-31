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

$checkNotas = $pdo->prepare("SELECT id FROM nota WHERE materia_id = ? LIMIT 1");
$checkNotas->execute([$id]);
if ($checkNotas->fetch()) {
    http_response_code(409);
    echo json_encode(["error" => "No se puede eliminar: la materia tiene calificaciones activas"]);
    exit;
}

$pdo->prepare("DELETE FROM matricula WHERE materia_id = ?")->execute([$id]);
$pdo->prepare("DELETE FROM materia WHERE id = ?")->execute([$id]);

echo json_encode(["success" => true, "message" => "Materia eliminada"]);
?>