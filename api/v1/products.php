<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once "./config/database.php";

$db = (new Database())->getConnection();

$baseQuery = "SELECT p.product_id, p.brand_id, p.category_id, p.type_id,
              p.product_name, p.product_description, p.Price,
              p.stock_quantity, p.stock_status, p.image_filename, p.image_mime_type,
              p.created_at, p.updated_at, p.is_active,
              b.brand_name, c.category_name, t.type_name
              FROM PRODUCTS p
              LEFT JOIN BRANDS b ON p.brand_id = b.brand_id
              LEFT JOIN CATEGORIES c ON p.category_id = c.category_id
              LEFT JOIN PRODUCT_TYPES t ON p.type_id = t.type_id";

$params = [];
$response = [
    "success" => false,
    "message" => "An error occurred.",
    "data" => null,
];

try {
    if (isset($_GET["id"])) {
        $id = filter_var($_GET["id"], FILTER_SANITIZE_NUMBER_INT);
        if (!$id || $id <= 0) {
            http_response_code(400);
            $response["message"] = "Invalid Product ID.";
            echo json_encode($response);
            exit();
        }

        $stmt = $db->prepare("$baseQuery WHERE p.product_id = ? AND p.is_active = 1");
        $stmt->execute([$id]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($product) {
            $specStmt = $db->prepare(
                "SELECT frame_material, frame_color, lens_coating, style FROM PRODUCT_SPECIFICATIONS WHERE product_id = ?",
            );
            $specStmt->execute([$id]);
            $specs = $specStmt->fetch(PDO::FETCH_ASSOC);
            $product["specifications"] = $specs ?: null;

            $docStmt = $db->prepare(
                "SELECT document_id, original_filename, mime_type FROM PRODUCT_DOCUMENT WHERE product_id = ?",
            );
            $docStmt->execute([$id]);
            $product["documents"] = $docStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

            $response["success"] = true;
            $response["message"] = "Product details loaded.";
            $response["data"] = $product;
            http_response_code(200);
        } else {
            http_response_code(404);
            $response["message"] = "Product not found.";
        }
    } elseif (isset($_GET["ids"])) {
        $ids_string = $_GET["ids"] ?? "";
        $ids = explode(",", $ids_string);
        $ids = array_filter(array_map("intval", $ids), fn($id) => $id > 0);

        if (empty($ids)) {
            http_response_code(400);
            $response["message"] =
                "No valid Product IDs provided for comparison.";
        } else {
            $placeholders = implode(",", array_fill(0, count($ids), "?"));

            $stmt = $db->prepare(
                "$baseQuery WHERE p.product_id IN ($placeholders) AND p.is_active = 1",
            );
            $stmt->execute($ids);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if ($products) {
                $specStmt = $db->prepare(
                    "SELECT product_id, frame_material, frame_color, lens_coating, style FROM PRODUCT_SPECIFICATIONS WHERE product_id IN ($placeholders)",
                );
                $specStmt->execute($ids);
                $allSpecs = $specStmt->fetchAll(PDO::FETCH_ASSOC);

                $specsMap = [];
                foreach ($allSpecs as $spec) {
                    $specsMap[$spec["product_id"]] = $spec;
                }

                foreach ($products as $i => $product) {
                    $products[$i]["specifications"] =
                        $specsMap[$product["product_id"]] ?? null;
                }
                $response["success"] = true;
                $response["message"] = "Comparison products loaded.";
                $response["data"] = $products;
                http_response_code(200);
            } else {
                $response["message"] = "No products found for the given IDs.";
                http_response_code(200);
                $response["data"] = [];
                $response["success"] = true;
            }
        }
    } else {
        $where = ["p.is_active = 1"];
        $min_price_val = null;

        if (isset($_GET["brand_id"]) && !empty($_GET["brand_id"])) {
            $brand_id = filter_var(
                $_GET["brand_id"],
                FILTER_SANITIZE_NUMBER_INT,
            );
            if ($brand_id) {
                $where[] = "p.brand_id = ?";
                $params[] = $brand_id;
            }
        }
        if (isset($_GET["category_id"]) && !empty($_GET["category_id"])) {
            $category_id = filter_var(
                $_GET["category_id"],
                FILTER_SANITIZE_NUMBER_INT,
            );
            if ($category_id) {
                $where[] = "p.category_id = ?";
                $params[] = $category_id;
            }
        }
        if (isset($_GET["min_price"]) && is_numeric($_GET["min_price"])) {
            $min_price = filter_var(
                $_GET["min_price"],
                FILTER_SANITIZE_NUMBER_FLOAT,
                FILTER_FLAG_ALLOW_FRACTION,
            );
            if ($min_price >= 0) {
                $where[] = "p.Price >= ?";
                $params[] = $min_price;
                $min_price_val = $min_price;
            }
        }
        if (isset($_GET["max_price"]) && is_numeric($_GET["max_price"])) {
            $max_price = filter_var(
                $_GET["max_price"],
                FILTER_SANITIZE_NUMBER_FLOAT,
                FILTER_FLAG_ALLOW_FRACTION,
            );
            if (
                $max_price > 0 &&
                ($min_price_val === null || $max_price >= $min_price_val)
            ) {
                $where[] = "p.Price <= ?";
                $params[] = $max_price;
            }
        }
        if (isset($_GET["search"]) && !empty($_GET["search"])) {
            $search = trim($_GET["search"]);
            $where[] = "(p.product_name LIKE ? OR p.product_description LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $sql = $baseQuery;
        if (count($where) > 0) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }
        $sql .= " ORDER BY p.created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response["success"] = true;
        $response["message"] = "Products loaded.";
        $response["data"] = $products;
        http_response_code(200);
    }
} catch (PDOException $e) {
    http_response_code(500);
    $response["message"] = "Database Error: " . $e->getMessage();
} catch (Exception $e) {
    http_response_code(500);
    $response["message"] = "Server Error: " . $e->getMessage();
}

echo json_encode($response);
?>