<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once '../config/database.php';
require_once '../middleware/AuthMiddleware.php';

$response = ['success' => false, 'message' => 'An error occurred.'];

try {
    // Check if user is authenticated and is admin
    $adminData = AuthMiddleware::checkAdmin();

    // Check if file and product_id are provided
    if (!isset($_FILES['image']) || !isset($_POST['product_id'])) {
        http_response_code(400);
        $response['message'] = 'Image file and product ID are required.';
        echo json_encode($response);
        exit();
    }

    $product_id = filter_var($_POST['product_id'], FILTER_SANITIZE_NUMBER_INT);
    if (!$product_id || $product_id <= 0) {
        http_response_code(400);
        $response['message'] = 'Invalid Product ID.';
        echo json_encode($response);
        exit();
    }

    $file = $_FILES['image'];

    // Check for upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        $response['message'] = 'File upload error: ' . $file['error'];
        echo json_encode($response);
        exit();
    }

    // Get file information
    $originalFilename = basename($file['name']);
    $fileSize = $file['size'];
    $fileTmpPath = $file['tmp_name'];

    // Validate file extension (primary validation)
    $fileExtension = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (!in_array($fileExtension, $allowedExtensions)) {
        http_response_code(400);
        $response['message'] = 'Invalid file type. Only JPG, PNG, GIF, and WEBP images are allowed.';
        echo json_encode($response);
        exit();
    }

    // Get MIME type for storage
    $mimeType = '';
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $fileTmpPath);
        finfo_close($finfo);
    }

    // Fallback MIME types based on extension if detection fails
    if (empty($mimeType)) {
        $mimeTypeMap = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp'
        ];
        $mimeType = $mimeTypeMap[$fileExtension] ?? 'application/octet-stream';
    }

    // Validate MIME type
    $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($mimeType, $allowedMimeTypes)) {
        http_response_code(400);
        $response['message'] = 'Invalid image MIME type.';
        echo json_encode($response);
        exit();
    }

    // Limit file size (e.g., 5MB)
    $maxFileSize = 5 * 1024 * 1024; // 5MB
    if ($fileSize > $maxFileSize) {
        http_response_code(400);
        $response['message'] = 'File size exceeds the maximum allowed size of 5MB.';
        echo json_encode($response);
        exit();
    }

    // Read file content
    $imageData = file_get_contents($fileTmpPath);

    if ($imageData === false) {
        http_response_code(500);
        $response['message'] = 'Failed to read image file.';
        echo json_encode($response);
        exit();
    }

    $db = (new Database())->getConnection();

    // Check if product exists
    $checkStmt = $db->prepare("SELECT product_id FROM PRODUCTS WHERE product_id = ?");
    $checkStmt->execute([$product_id]);
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        $response['message'] = 'Product not found.';
        echo json_encode($response);
        exit();
    }

    // Update product with image data
    $stmt = $db->prepare("UPDATE PRODUCTS SET image_data = ?, image_mime_type = ?, image_filename = ? WHERE product_id = ?");
    $stmt->execute([$imageData, $mimeType, $originalFilename, $product_id]);

    $response['success'] = true;
    $response['message'] = 'Image uploaded successfully.';
    $response['filename'] = $originalFilename;
    $response['product_id'] = $product_id;
    http_response_code(200);

} catch (PDOException $e) {
    http_response_code(500);
    $response['message'] = 'Database Error: ' . $e->getMessage();
} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Server Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
