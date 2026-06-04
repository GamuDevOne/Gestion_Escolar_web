<?php
require '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Método no permitido", 405);
}

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['identificacion']) || empty($data['respuestas']) || empty($data['password_nueva'])) {
    sendError("Faltan datos requeridos", 400);
}

if (!is_array($data['respuestas']) || count($data['respuestas']) !== 3) {
    sendError("Se requieren exactamente 3 respuestas", 400);
}

if (strlen($data['password_nueva']) < 6) {
    sendError("La nueva contraseña debe tener al menos 6 caracteres", 400);
}

$stmt = $pdo->prepare("
    SELECT u.id FROM usuario u
    JOIN estudiante e ON u.id_referencia = e.id AND u.rol = 'estudiante'
    WHERE e.identificacion = ?
    UNION
    SELECT u.id FROM usuario u
    JOIN profesor p ON u.id_referencia = p.id AND u.rol = 'profesor'
    WHERE p.identificacion = ?
");
$stmt->execute([$data['identificacion'], $data['identificacion']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    sendError("Usuario no encontrado", 404);
}

$stmt = $pdo->prepare("
    SELECT respuesta_hash FROM usuario_pregunta
    WHERE usuario_id = ?
    ORDER BY id ASC
");
$stmt->execute([$user['id']]);
$storedAnswers = $stmt->fetchAll(PDO::FETCH_COLUMN);

if (count($storedAnswers) === 0) {
    sendError("Este usuario no tiene preguntas de seguridad configuradas", 404);
}

foreach ($data['respuestas'] as $index => $respuesta) {
    if (!password_verify(strtolower(trim($respuesta)), $storedAnswers[$index])) {
        sendError("Las respuestas no son correctas", 401);
    }
}

$newHash = password_hash($data['password_nueva'], PASSWORD_BCRYPT, ['cost' => 12]);
$pdo->prepare("UPDATE usuario SET password_hash = ? WHERE id = ?")
    ->execute([$newHash, $user['id']]);

sendSuccess(["message" => "Contraseña actualizada correctamente"]);
?>