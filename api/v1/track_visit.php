<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
require_once 'lib/SimpleJWT.php';

$response = ['success' => false];

try {
    $db = (new Database())->getConnection();

    $data = json_decode(file_get_contents("php://input"), true);
    $pageUrl = $data['page_url'] ?? '/';

    $userId = null;
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    if (!empty($authHeader) && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        try {
            $decoded = SimpleJWT::decode($token, JWT_SECRET_KEY);
            $userId = $decoded['user_id'] ?? null;
        } catch (Exception $e) {
        }
    }

    $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

    $stmt = $db->prepare("
        INSERT INTO SITE_VISITS (user_id, ip_address, user_agent, page_url, visited_at)
        VALUES (?, ?, ?, ?, NOW())
    ");

    $stmt->execute([$userId, $ipAddress, $userAgent, $pageUrl]);

    $response['success'] = true;

} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Error tracking visit';
}

echo json_encode($response);
?>
