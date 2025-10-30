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
        case 'POST':
            if (empty($_POST['product_name']) || !isset($_POST['Price'])) {
                http_response_code(400);
                $response['message'] = 'Product Name and Price are required.';
                echo json_encode($response);
                exit();
            }
            $sql = "INSERT INTO PRODUCTS (product_name, Price, brand_id, category_id, type_id, product_description, stock_quantity, main_image, document_filename, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                $_POST['product_name'],
                $_POST['Price'],
                $_POST['brand_id'] ?: null,
                $_POST['category_id'] ?: null,
                $_POST['type_id'] ?: null,
                $_POST['product_description'] ?? '',
                $_POST['stock_quantity'] ?? 0,
                $_POST['main_image'] ?? null,
                $_POST['document_filename'] ?? null
            ]);
            http_response_code(201);
            $response = ['success' => true, 'message' => 'Product created.', 'product_id' => $db->lastInsertId()];
            break;

        case 'GET':
            if (!empty($_GET['id'])) {
                $id = filter_var($_GET['id'], FILTER_SANITIZE_NUMBER_INT);
                $stmt = $db->prepare("SELECT * FROM PRODUCTS WHERE product_id = ?");
                $stmt->execute([$id]);
                $product = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($product) {
                    $response = ['success' => true, 'data' => $product];
                } else {
                    http_response_code(404);
                    $response['message'] = 'Product not found.';
                }
            } else {
                $search = $_GET['search'] ?? '';
                $whereClause = "WHERE 1=1";
                $params = [];

                if (!empty($search)) {
                    $whereClause .= " AND (p.product_name LIKE ? OR b.brand_name LIKE ?)";
                    $searchParam = "%{$search}%";
                    $params = [$searchParam, $searchParam];
                }

                $baseQuery = "SELECT p.product_id, p.product_name, p.Price as price, p.is_active,
                                     p.stock_quantity, p.product_description as description,
                                     p.image_filename, p.document_filename,
                                     b.brand_id, b.brand_name, c.category_id, c.category_name
                              FROM PRODUCTS p
                              LEFT JOIN BRANDS b ON p.brand_id = b.brand_id
                              LEFT JOIN CATEGORIES c ON p.category_id = c.category_id
                              $whereClause
                              ORDER BY p.product_id DESC";
                $stmt = $db->prepare($baseQuery);
                $stmt->execute($params);
                $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $response = ['success' => true, 'data' => $products];
            }
            break;

        case 'PUT':
            if (empty($_POST['product_id'])) {
                http_response_code(400);
                $response['message'] = 'product_id is required for update.';
                echo json_encode($response);
                exit();
            }
            $sql = "UPDATE PRODUCTS SET
                        product_name = ?, Price = ?, brand_id = ?, category_id = ?, type_id = ?,
                        product_description = ?, stock_quantity = ?, main_image = ?, document_filename = ?
                    WHERE product_id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                $_POST['product_name'],
                $_POST['Price'],
                $_POST['brand_id'] ?: null,
                $_POST['category_id'] ?: null,
                $_POST['type_id'] ?: null,
                $_POST['product_description'] ?? '',
                $_POST['stock_quantity'] ?? 0,
                $_POST['main_image'] ?? null,
                $_POST['document_filename'] ?? null,
                $_POST['product_id']
            ]);
            http_response_code(200);
            $response = ['success' => true, 'message' => 'Product updated.'];
            break;

        case 'TOGGLE_STATUS':
            if (empty($data->product_id) || !isset($data->new_status)) {
                http_response_code(400);
                $response['message'] = 'product_id and new_status are required.';
                echo json_encode($response);
                exit();
            }
            $new_status = (int)$data->new_status;
            $product_id = (int)$data->product_id;
            $stmt = $db->prepare("UPDATE PRODUCTS SET is_active = ? WHERE product_id = ?");
            $stmt->execute([$new_status, $product_id]);
            http_response_code(200);
            $response = ['success' => true, 'message' => 'Product status toggled.'];
            break;

        case 'DELETE':
            if (empty($data->product_id)) {
                http_response_code(400);
                $response["message"] = "Product ID is required for delete.";
                echo json_encode($response);
                exit();
            }
            $response = ['success' => false, 'message' => 'DELETE method is disabled. Use TOGGLE_STATUS.'];
            http_response_code(405);
            break;

        default:
            http_response_code(405);
            $response['message'] = 'Method Not Allowed.';
            break;
    }

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    http_response_code(500);
    $response['message'] = 'Server Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
