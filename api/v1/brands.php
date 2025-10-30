<?php
header("Content-Type: application/json; charset=UTF-8");
require_once './config/database.php';

$db = (new Database())->getConnection();

try {
    $stmt = $db->prepare("SELECT brand_id, brand_name FROM BRANDS ORDER BY brand_name");
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $data]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>