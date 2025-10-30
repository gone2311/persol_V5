<?php
header("Content-Type: application/json; charset=UTF-8");

require_once './config/database.php';
require_once './middleware/AuthMiddleware.php';

$userData = AuthMiddleware::checkAuth();
$db = (new Database())->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    $stmt = $db->prepare("SELECT customer_id FROM CUSTOMERS WHERE user_id = ?");
    $stmt->execute([$userData->id]);
    $customer = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$customer) {
        throw new Exception("Customer profile not found for this user.");
    }
    $customer_id = $customer['customer_id'];

    if ($method == 'GET') {
        $stmt = $db->prepare("
            SELECT order_id, order_code, order_status, total_amount, payment_status, created_at 
            FROM ORDERS 
            WHERE customer_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$customer_id]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $orders]);

    } elseif ($method == 'POST') {
        $data = json_decode(file_get_contents("php://input"));
        
        if (empty($data->cart) || !is_array($data->cart) || empty($data->shipping)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Cart and shipping info are required.']);
            exit();
        }

        $db->beginTransaction();
        
        $total_amount = 0;
        $product_ids = array_map(fn($item) => $item->id, $data->cart);
        $placeholders = implode(',', array_fill(0, count($product_ids), '?'));
        
        $stmt = $db->prepare("SELECT product_id, Price FROM PRODUCTS WHERE product_id IN ($placeholders)");
        $stmt->execute($product_ids);
        $products_data = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        foreach ($data->cart as $item) {
            if (!isset($products_data[$item->id])) {
                throw new Exception("Product ID {$item->id} not found.");
            }
            $total_amount += $products_data[$item->id] * $item->quantity;
        }

        $stmt = $db->prepare("
            INSERT INTO ORDERS (customer_id, order_code, total_amount, shipping_address, payment_method, recipient_name, recipient_number, order_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $order_code = 'PERSOL_' . time();
        $stmt->execute([
            $customer_id,
            $order_code,
            $total_amount,
            $data->shipping->address,
            $data->shipping->payment,
            $data->shipping->name,
            $data->shipping->phone,
            $data->shipping->notes ?? ''
        ]);
        
        $order_id = $db->lastInsertId();

        $itemStmt = $db->prepare("
            INSERT INTO ORDER_ITEMS (order_id, product_id, quantity, unit_price, subtotal)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        foreach ($data->cart as $item) {
            $unit_price = $products_data[$item->id];
            $subtotal = $unit_price * $item->quantity;
            $itemStmt->execute([
                $order_id,
                $item->id,
                $item->quantity,
                $unit_price,
                $subtotal
            ]);
        }

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Order created successfully.', 'order_id' => $order_id, 'order_code' => $order_code]);

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    }

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>