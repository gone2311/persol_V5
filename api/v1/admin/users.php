<?php
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';
require_once '../middleware/AuthMiddleware.php';

$adminData = AuthMiddleware::checkAdmin();

$db = (new Database())->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method == 'GET') {
        $stmt = $db->prepare("
            SELECT user_id, user_code, user_type, email, full_name, phone_number, created_at 
            FROM USERS 
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $users]);
    
    } elseif ($method == 'POST') {
        
    } elseif ($method == 'DELETE') {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->user_id)) {
             http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID required.']);
            exit();
        }
        
        $stmt = $db->prepare("UPDATE USERS SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?");
        $stmt->execute([$data->user_id]);
        echo json_encode(['success' => true, 'message' => 'User soft deleted.']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>