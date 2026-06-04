<?php
require '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Método no permitido", 405);
}

$identificacion = trim($_GET['identificacion'] ?? '');
if (!$identificacion) {
    sendError("Identificación requerida", 400);
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
$stmt->execute([$identificacion, $identificacion]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    sendError("Usuario no encontrado", 404);
}

$stmt = $pdo->prepare("
    SELECT ps.id AS pregunta_id, ps.pregunta
    FROM usuario_pregunta up
    JOIN pregunta_seguridad ps ON up.pregunta_id = ps.id
    WHERE up.usuario_id = ?
    ORDER BY up.id ASC
");
$stmt->execute([$user['id']]);
$preguntas = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($preguntas) === 0) {
    sendError("Este usuario no tiene preguntas de seguridad configuradas", 404);
}

sendSuccess($preguntas);
?>