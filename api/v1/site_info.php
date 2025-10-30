<?php
header("Content-Type: application/json; charset=UTF-8");
require_once './config/database.php';

$db = (new Database())->getConnection();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS SITE_STATS (
        stat_key VARCHAR(50) PRIMARY KEY,
        stat_value BIGINT NOT NULL DEFAULT 0
    )");
    
    $stmt = $db->prepare("INSERT INTO SITE_STATS (stat_key, stat_value) 
                         VALUES ('visitor_count', 1) 
                         ON DUPLICATE KEY UPDATE stat_value = stat_value + 1");
    $stmt->execute();
    
    $stmt = $db->prepare("SELECT stat_value FROM SITE_STATS WHERE stat_key = 'visitor_count'");
    $stmt->execute();
    $count = $stmt->fetchColumn();

    echo json_encode(['success' => true, 'visitor_count' => $count]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'visitor_count' => 'N/A']);
}
?>