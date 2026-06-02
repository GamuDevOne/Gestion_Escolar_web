<?php
function getAuthToken(): ?string {
    $headers = getallheaders();
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $parts = explode(' ', $value);
            if (count($parts) === 2 && $parts[0] === 'Bearer') {
                return $parts[1];
            }
        }
    }
    return null;
}

function validateToken(PDO $pdo): array {
    $token = getAuthToken();

    if (!$token) {
        sendError("Token no proporcionado", 401);
    }

    $stmt = $pdo->prepare("
        SELECT s.id AS sesion_id, s.token,
               u.id AS usuario_id, u.rol, u.nombre, u.id_referencia
        FROM sesion s
        JOIN usuario u ON s.usuario_id = u.id
        WHERE s.token = ? AND s.activa = 1 AND s.expires_at > NOW()
    ");
    $stmt->execute([$token]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        sendError("Token inválido o expirado", 401);
    }

    return $session;
}

function requireRole(PDO $pdo, $roles): void {
    global $authUser;
    if (!is_array($roles)) $roles = [$roles];

    if (!in_array($authUser['rol'], $roles)) {
        sendError("No tienes permisos para esta acción", 403);
    }
}

global $authUser;
$authUser = validateToken($pdo);
?>