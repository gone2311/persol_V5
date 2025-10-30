<?php
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';
require_once '../middleware/AuthMiddleware.php';

$adminData = AuthMiddleware::checkAdmin();

$db = (new Database())->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$response = ['success' => false, 'message' => 'An error occurred.'];

try {
    $actual_method = $method;
    $data = json_decode(file_get_contents("php://input"));

    if ($method == 'POST') {
        if (isset($_POST['_method'])) {
            $actual_method = strtoupper($_POST['_method']);
        } elseif (isset($data->_method)) {
            $actual_method = strtoupper($data->_method);
        }
    }

    switch ($actual_method) {
        case 'GET':
            $search = $_GET['search'] ?? '';
            $whereClause = "WHERE deleted_at IS NULL";
            $params = [];

            if (!empty($search)) {
                $whereClause .= " AND (email LIKE ? OR full_name LIKE ? OR phone_number LIKE ?)";
                $searchParam = "%{$search}%";
                $params = [$searchParam, $searchParam, $searchParam];
            }

            $stmt = $db->prepare("
                SELECT user_id, user_code, user_type, email, full_name, phone_number, is_active, created_at
                FROM USERS
                $whereClause
                ORDER BY created_at DESC
            ");
            $stmt->execute($params);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $response = ['success' => true, 'data' => $users];
            break;

        case 'TOGGLE_STATUS':
            if (empty($data->user_id) || !isset($data->new_status)) {
                http_response_code(400);
                $response['message'] = 'user_id and new_status are required.';
                echo json_encode($response);
                exit();
            }

            $new_status = (int)$data->new_status;
            $user_id = (int)$data->user_id;

            $stmt = $db->prepare("UPDATE USERS SET is_active = ? WHERE user_id = ?");
            $stmt->execute([$new_status, $user_id]);
            http_response_code(200);
            $response = ['success' => true, 'message' => 'User status toggled.'];
            break;

        case 'DELETE':
            http_response_code(405);
            $response = ['success' => false, 'message' => 'DELETE method is disabled. Use TOGGLE_STATUS.'];
            break;

        default:
            http_response_code(405);
            $response['message'] = 'Method Not Allowed.';
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Server Error: ' . $e->getMessage();
}

echo json_encode($response);
?>