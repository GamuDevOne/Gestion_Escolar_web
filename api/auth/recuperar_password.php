<?php
require '../config/db.php';

// Forzar respuesta JSON incluso en errores fatales
error_reporting(E_ALL);
ini_set('display_errors', 0); // No mostrar errores en pantalla, solo en log

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Método no permitido", 405);
}

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['identificacion']) || empty($data['respuesta']) || empty($data['password_nueva']) || empty($data['pregunta_id'])) {
    sendError("Faltan datos requeridos (identificación, pregunta, respuesta o nueva contraseña)", 400);
}

if (strlen($data['password_nueva']) < 6) {
    sendError("La nueva contraseña debe tener al menos 6 caracteres", 400);
}

// Buscar usuario por identificación
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
    sendError("Usuario no encontrado con esa identificación", 404);
}

// Obtener el hash de la respuesta para la pregunta específica
$stmt = $pdo->prepare("
    SELECT respuesta_hash FROM usuario_pregunta
    WHERE usuario_id = ? AND pregunta_id = ?
");
$stmt->execute([$user['id'], $data['pregunta_id']]);
$storedHash = $stmt->fetchColumn();

if (!$storedHash) {
    sendError("La pregunta de seguridad no está asociada a este usuario", 400);
}

// Verificar la respuesta (case-insensitive)
if (!password_verify(strtolower(trim($data['respuesta'])), $storedHash)) {
    sendError("La respuesta es incorrecta", 401);
}

// Actualizar contraseña
$newHash = password_hash($data['password_nueva'], PASSWORD_BCRYPT, ['cost' => 12]);
$pdo->prepare("UPDATE usuario SET password_hash = ? WHERE id = ?")
    ->execute([$newHash, $user['id']]);

sendSuccess(["message" => "Contraseña actualizada correctamente"]);
?>