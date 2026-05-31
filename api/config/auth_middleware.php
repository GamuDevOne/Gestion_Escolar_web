<?php
/**
 * Middleware de autenticación.
 * Requiere que $pdo ya esté disponible.
 *
 * Al incluirlo, valida automáticamente el token del header Authorization.
 * Deja disponible la variable global $authUser con los datos del usuario.
 *
 * Para restringir por rol usar: requireRole($pdo, 'admin')
 *                               requireRole($pdo, ['admin', 'profesor'])
 */

function getAuthToken(): ?string {
    $headers = getallheaders();
    // Normalizar el header (algunos servidores lo mandan en minúsculas)
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
        http_response_code(401);
        echo json_encode(["error" => "Token no proporcionado"]);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT s.id AS sesion_id, s.token,
               u.id AS usuario_id, u.rol, u.nombre, u.id_referencia
        FROM sesion s
        JOIN usuario u ON s.usuario_id = u.id
        WHERE s.token     = ?
          AND s.activa    = 1
          AND s.expires_at > NOW()
    ");
    $stmt->execute([$token]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        http_response_code(401);
        echo json_encode(["error" => "Token inválido o expirado. Inicia sesión nuevamente."]);
        exit;
    }

    return $session;
}

function requireRole(PDO $pdo, $roles): void {
    global $authUser;
    if (!is_array($roles)) $roles = [$roles];

    if (!in_array($authUser['rol'], $roles)) {
        http_response_code(403);
        echo json_encode(["error" => "No tienes permisos para esta acción"]);
        exit;
    }
}

// Ejecutar validación automáticamente al incluir el archivo
global $authUser;
$authUser = validateToken($pdo);
?>