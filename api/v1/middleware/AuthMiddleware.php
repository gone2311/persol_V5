<?php
require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../config/database.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

class AuthMiddleware {
    
    private static function getBearerToken() {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }

    private static function sendError($code, $message) {
        http_response_code($code);
        echo json_encode(['success' => false, 'message' => $message]);
        exit();
    }

    public static function checkAuth() {
        $token = self::getBearerToken();
        if (!$token) {
            self::sendError(401, 'Access denied. No token provided.');
        }

        try {
            $decoded = JWT::decode($token, new Key(Database::$jwt_key, 'HS256'));
            return $decoded->data;
        } catch (Exception $e) {
            self::sendError(401, 'Access denied. Invalid token: ' . $e->getMessage());
        }
    }

    public static function checkAdmin() {
        $userData = self::checkAuth();
        
        if ($userData->role !== 'admin') {
            self::sendError(403, 'Forbidden. Admin access required.');
        }
        
        return $userData;
    }
}
?>