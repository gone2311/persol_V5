<?php
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';
require_once '../middleware/AuthMiddleware.php';

$adminData = AuthMiddleware::checkAdmin();

$db = (new Database())->getConnection();
$response = ['success' => false, 'message' => 'An error occurred.'];

try {
    $stats = [];

    // Total orders this month
    $stmt = $db->prepare("
        SELECT COUNT(*) as total_orders,
               COALESCE(SUM(total_amount), 0) as total_revenue
        FROM ORDERS
        WHERE MONTH(created_at) = MONTH(NOW())
          AND YEAR(created_at) = YEAR(NOW())
    ");
    $stmt->execute();
    $monthStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['monthly_orders'] = (int)$monthStats['total_orders'];
    $stats['monthly_revenue'] = (float)$monthStats['total_revenue'];

    // Orders by month for the last 6 months
    $stmt = $db->prepare("
        SELECT
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as order_count,
            COALESCE(SUM(total_amount), 0) as revenue
        FROM ORDERS
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
    ");
    $stmt->execute();
    $stats['orders_by_month'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Weekly visits for current month
    $stmt = $db->prepare("
        SELECT
            CONCAT('Week ', WEEK(visited_at, 1) - WEEK(DATE_SUB(visited_at, INTERVAL DAYOFMONTH(visited_at)-1 DAY), 1) + 1) as week,
            COUNT(*) as visits
        FROM SITE_VISITS
        WHERE MONTH(visited_at) = MONTH(NOW())
          AND YEAR(visited_at) = YEAR(NOW())
        GROUP BY WEEK(visited_at, 1)
        ORDER BY WEEK(visited_at, 1)
        LIMIT 4
    ");
    $stmt->execute();
    $weeklyVisits = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($weeklyVisits)) {
        $stats['weekly_visits'] = [
            ['week' => 'Week 1', 'visits' => 0],
            ['week' => 'Week 2', 'visits' => 0],
            ['week' => 'Week 3', 'visits' => 0],
            ['week' => 'Week 4', 'visits' => 0]
        ];
    } else {
        $stats['weekly_visits'] = $weeklyVisits;
    }

    // Low stock products (stock < 10)
    $stmt = $db->prepare("
        SELECT
            p.product_id,
            p.product_name,
            p.stock_quantity,
            b.brand_name
        FROM PRODUCTS p
        LEFT JOIN BRANDS b ON p.brand_id = b.brand_id
        WHERE p.stock_quantity < 10
          AND p.stock_quantity > 0
        ORDER BY p.stock_quantity ASC
        LIMIT 10
    ");
    $stmt->execute();
    $stats['low_stock_products'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Out of stock products
    $stmt = $db->prepare("
        SELECT COUNT(*) as count
        FROM PRODUCTS
        WHERE stock_quantity = 0
    ");
    $stmt->execute();
    $stats['out_of_stock_count'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Total active products
    $stmt = $db->prepare("
        SELECT COUNT(*) as count
        FROM PRODUCTS
        WHERE stock_quantity >= 0
    ");
    $stmt->execute();
    $stats['active_products_count'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Total customers
    $stmt = $db->prepare("
        SELECT COUNT(*) as count
        FROM USERS
        WHERE user_type = 'customer'
    ");
    $stmt->execute();
    $stats['total_customers'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Recent orders (last 10)
    $stmt = $db->prepare("
        SELECT
            o.order_id,
            o.order_code,
            o.created_at as order_date,
            o.total_amount,
            o.order_status,
            u.full_name as customer_name
        FROM ORDERS o
        LEFT JOIN CUSTOMERS c ON o.customer_id = c.customer_id
        LEFT JOIN USERS u ON c.user_id = u.user_id
        ORDER BY o.created_at DESC
        LIMIT 10
    ");
    $stmt->execute();
    $stats['recent_orders'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response = ['success' => true, 'data' => $stats];

} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Server error: ' . $e->getMessage();
}

echo json_encode($response);
?>
