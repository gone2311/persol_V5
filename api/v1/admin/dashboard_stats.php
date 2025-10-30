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
        WHERE MONTH(order_date) = MONTH(CURRENT_DATE())
          AND YEAR(order_date) = YEAR(CURRENT_DATE())
          AND deleted_at IS NULL
    ");
    $stmt->execute();
    $monthStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['monthly_orders'] = (int)$monthStats['total_orders'];
    $stats['monthly_revenue'] = (float)$monthStats['total_revenue'];

    // Orders by month for the last 6 months
    $stmt = $db->prepare("
        SELECT
            DATE_FORMAT(order_date, '%Y-%m') as month,
            COUNT(*) as order_count,
            COALESCE(SUM(total_amount), 0) as revenue
        FROM ORDERS
        WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
          AND deleted_at IS NULL
        GROUP BY DATE_FORMAT(order_date, '%Y-%m')
        ORDER BY month ASC
    ");
    $stmt->execute();
    $stats['orders_by_month'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Weekly visits for current month (simulated data - you need to implement tracking)
    $stats['weekly_visits'] = [
        ['week' => 'Week 1', 'visits' => rand(100, 500)],
        ['week' => 'Week 2', 'visits' => rand(100, 500)],
        ['week' => 'Week 3', 'visits' => rand(100, 500)],
        ['week' => 'Week 4', 'visits' => rand(100, 500)]
    ];

    // Low stock products (stock < 10)
    $stmt = $db->prepare("
        SELECT
            p.product_id,
            p.product_code,
            p.product_name,
            p.stock_quantity,
            b.brand_name
        FROM PRODUCTS p
        LEFT JOIN BRANDS b ON p.brand_id = b.brand_id
        WHERE p.stock_quantity < 10
          AND p.stock_quantity > 0
          AND p.deleted_at IS NULL
        ORDER BY p.stock_quantity ASC
        LIMIT 10
    ");
    $stmt->execute();
    $stats['low_stock_products'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Out of stock products
    $stmt = $db->prepare("
        SELECT COUNT(*) as count
        FROM PRODUCTS
        WHERE stock_quantity = 0 AND deleted_at IS NULL
    ");
    $stmt->execute();
    $stats['out_of_stock_count'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Total active products
    $stmt = $db->prepare("
        SELECT COUNT(*) as count
        FROM PRODUCTS
        WHERE is_active = 1 AND deleted_at IS NULL
    ");
    $stmt->execute();
    $stats['active_products_count'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Total customers
    $stmt = $db->prepare("
        SELECT COUNT(*) as count
        FROM USERS
        WHERE user_type = 'customer' AND deleted_at IS NULL
    ");
    $stmt->execute();
    $stats['total_customers'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Recent orders (last 10)
    $stmt = $db->prepare("
        SELECT
            o.order_id,
            o.order_code,
            o.order_date,
            o.total_amount,
            o.order_status,
            u.full_name as customer_name
        FROM ORDERS o
        LEFT JOIN CUSTOMERS c ON o.customer_id = c.customer_id
        LEFT JOIN USERS u ON c.user_id = u.user_id
        WHERE o.deleted_at IS NULL
        ORDER BY o.order_date DESC
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
