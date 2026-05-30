<?php
require '../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);
$id   = $data['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(["error" => "ID requerido"]);
    exit;
}

// Bloquear si tiene notas registradas (RF8)
$checkNotas = $pdo->prepare("SELECT id FROM nota WHERE estudiante_id = ? LIMIT 1");
$checkNotas->execute([$id]);
if ($checkNotas->fetch()) {
    http_response_code(409);
    echo json_encode(["error" => "No se puede eliminar: el estudiante tiene notas registradas"]);
    exit;
}

// Eliminar matrículas primero, luego el estudiante
$pdo->prepare("DELETE FROM matricula WHERE estudiante_id = ?")->execute([$id]);
$pdo->prepare("DELETE FROM estudiante WHERE id = ?")->execute([$id]);

echo json_encode(["success" => true, "message" => "Estudiante eliminado"]);
?>