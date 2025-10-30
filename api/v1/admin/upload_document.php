<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output
ini_set('log_errors', 1);

require_once '../config/database.php';
require_once '../middleware/AuthMiddleware.php';

$response = ['success' => false, 'message' => 'An error occurred.'];

try {
    // Check if user is authenticated and is admin
    $adminData = AuthMiddleware::checkAdmin();

    // Check if file and product_id are provided
    if (!isset($_FILES['document']) || !isset($_POST['product_id'])) {
        http_response_code(400);
        $response['message'] = 'Document file and product ID are required.';
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

    $file = $_FILES['document'];

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

    // Validate file type (PDF, TXT, DOCX)
    $allowedMimeTypes = [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword' // .doc (optional, for older Word docs)
    ];

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $fileTmpPath);
    finfo_close($finfo);

    // Also check file extension as additional validation
    $fileExtension = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
    $allowedExtensions = ['pdf', 'txt', 'docx', 'doc'];

    if (!in_array($mimeType, $allowedMimeTypes) && !in_array($fileExtension, $allowedExtensions)) {
        http_response_code(400);
        $response['message'] = 'Invalid file type. Only PDF, TXT, and DOCX files are allowed.';
        echo json_encode($response);
        exit();
    }

    // Limit file size (e.g., 10MB)
    $maxFileSize = 10 * 1024 * 1024; // 10MB
    if ($fileSize > $maxFileSize) {
        http_response_code(400);
        $response['message'] = 'File size exceeds the maximum allowed size of 10MB.';
        echo json_encode($response);
        exit();
    }

    // Read file content
    $fileContent = file_get_contents($fileTmpPath);

    if ($fileContent === false) {
        http_response_code(500);
        $response['message'] = 'Failed to read file content.';
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

    // Insert document into database
    $stmt = $db->prepare("INSERT INTO PRODUCT_DOCUMENT (product_id, original_filename, mime_type, file_content) VALUES (?, ?, ?, ?)");
    $stmt->execute([$product_id, $originalFilename, $mimeType, $fileContent]);

    $document_id = $db->lastInsertId();

    $response['success'] = true;
    $response['message'] = 'Document uploaded successfully.';
    $response['document_id'] = $document_id;
    $response['filename'] = $originalFilename;
    http_response_code(201);

} catch (PDOException $e) {
    http_response_code(500);
    $response['message'] = 'Database Error: ' . $e->getMessage();
} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Server Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
