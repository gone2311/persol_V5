<?php
header("Access-Control-Allow-Methods: GET");

require_once "./config/database.php";

try {
    if (!isset($_GET["id"]) || empty($_GET["id"])) {
        http_response_code(400);
        echo "Product ID is required.";
        exit();
    }

    $product_id = filter_var($_GET["id"], FILTER_SANITIZE_NUMBER_INT);
    if (!$product_id || $product_id <= 0) {
        http_response_code(400);
        echo "Invalid Product ID.";
        exit();
    }

    $db = (new Database())->getConnection();

    $stmt = $db->prepare(
        "SELECT image_data, image_mime_type FROM PRODUCTS WHERE product_id = ?",
    );
    $stmt->execute([$product_id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product || !$product["image_data"]) {
        // Return placeholder image or 404
        http_response_code(404);
        header("Content-Type: image/svg+xml");
        // Simple SVG placeholder
        echo '<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="300" fill="#e0e0e0"/>
                <text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="20" dy=".3em">No Image</text>
              </svg>';
        exit();
    }

    // Clear any previous output
    if (ob_get_level()) {
        ob_end_clean();
    }

    // Set appropriate headers for image display
    header("Content-Type: " . $product["image_mime_type"]);
    header("Content-Length: " . strlen($product["image_data"]));
    header("Cache-Control: public, max-age=31536000"); // Cache for 1 year
    header("Expires: " . gmdate("D, d M Y H:i:s", time() + 31536000) . " GMT");

    // Output the image data
    echo $product["image_data"];
    exit();
} catch (PDOException $e) {
    http_response_code(500);
    echo "Database Error: " . $e->getMessage();
} catch (Exception $e) {
    http_response_code(500);
    echo "Server Error: " . $e->getMessage();
}
?>
