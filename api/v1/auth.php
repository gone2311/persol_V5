<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../../vendor/autoload.php';
require_once './config/database.php';
use \Firebase\JWT\JWT;

$db = (new Database())->getConnection();
$data = json_decode(file_get_contents("php://input"));

if (empty($data->action)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Action required.']);
    exit();
}

try {
    if ($data->action == 'register') {
        if (empty($data->email) || empty($data->password) || empty($data->full_name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email, password, and full_name are required.']);
            exit();
        }

        $stmt = $db->prepare("SELECT user_id FROM USERS WHERE email = ?");
        $stmt->execute([$data->email]);
        if ($stmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Email already exists.']);
            exit();
        }
        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);

        $db->beginTransaction();

        $stmt = $db->prepare("INSERT INTO USERS (email, password_hash, full_name, user_type) VALUES (?, ?, ?, 'customer')");
        $stmt->execute([$data->email, $password_hash, $data->full_name]);
        $user_id = $db->lastInsertId();

        $stmt = $db->prepare("INSERT INTO CUSTOMERS (user_id, customer_code) VALUES (?, ?)");
        $stmt->execute([$user_id, 'CUS_' . str_pad($user_id, 6, '0', STR_PAD_LEFT)]);

        $db->commit();

        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'User registered successfully.']);

    } elseif ($data->action == 'login') {
        if (empty($data->email) || empty($data->password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
            exit();
        }

        $stmt = $db->prepare("SELECT user_id, email, password_hash, user_type FROM USERS WHERE email = ? AND deleted_at IS NULL");
        $stmt->execute([$data->email]);

        if ($stmt->rowCount() == 1) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            $trimmed_password = trim($data->password);

            if (password_verify($trimmed_password, $user['password_hash'])) { 
                $token_payload = [
                    "iss" => Database::$jwt_iss,
                    "aud" => Database::$jwt_aud,
                    "iat" => time(),
                    "exp" => time() + (60 * 60 * 24), 
                    "data" => [
                        "id" => $user['user_id'],
                        "email" => $user['email'],
                        "role" => $user['user_type']
                    ]
                ];

                $jwt = JWT::encode($token_payload, Database::$jwt_key, 'HS256');

                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Login successful.', 'token' => $jwt]);
            } else {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Invalid credentials (verify failed).']);
            }
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid credentials (user not found).']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action.']);
    }

} catch (Exception $e) {
    if ($db->inTransaction()) { 
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>