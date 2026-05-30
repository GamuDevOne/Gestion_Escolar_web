<?php
require '../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);
$id   = $data['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(["error" => "ID requerido"]);
    exit;
}

// Bloquear si tiene notas registradas (RF3 y RF8)
$checkNotas = $pdo->prepare("SELECT id FROM nota WHERE materia_id = ? LIMIT 1");
$checkNotas->execute([$id]);
if ($checkNotas->fetch()) {
    http_response_code(409);
    echo json_encode(["error" => "No se puede eliminar: la materia tiene calificaciones activas asociadas"]);
    exit;
}

// Eliminar matrículas asociadas primero
$pdo->prepare("DELETE FROM matricula WHERE materia_id = ?")->execute([$id]);

// Eliminar la materia
$pdo->prepare("DELETE FROM materia WHERE id = ?")->execute([$id]);

echo json_encode(["success" => true, "message" => "Materia eliminada"]);
?>