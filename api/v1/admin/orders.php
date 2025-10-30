<?php
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';
require_once '../middleware/AuthMiddleware.php';

$adminData = AuthMiddleware::checkAdmin();
$db = (new Database())->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));

try {
    if ($method == 'GET') {
        $stmt = $db->prepare("
            SELECT o.*, u.full_name AS customer_name
            FROM ORDERS o
            JOIN CUSTOMERS c ON o.customer_id = c.customer_id
            JOIN USERS u ON c.user_id = u.user_id
            ORDER BY o.created_at DESC
        ");
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $orders]);

    } elseif ($method == 'POST' && isset($data->_method) && $data->_method == 'PUT') {
        if (empty($data->order_id) || empty($data->order_status)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'order_id and order_status are required.']);
            exit();
        }
        
        $stmt = $db->prepare("UPDATE ORDERS SET order_status = ? WHERE order_id = ?");
        $stmt->execute([$data->order_status, $data->order_id]);
        
        echo json_encode(['success' => true, 'message' => 'Order status updated.']);
        
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>