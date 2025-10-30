<?php
header("Access-Control-Allow-Methods: GET");

require_once "./config/database.php";

$response = ["success" => false, "message" => "An error occurred."];

try {
    if (!isset($_GET["id"]) || empty($_GET["id"])) {
        http_response_code(400);
        $response["message"] = "Document ID is required.";
        echo json_encode($response);
        exit();
    }

    $document_id = filter_var($_GET["id"], FILTER_SANITIZE_NUMBER_INT);
    if (!$document_id || $document_id <= 0) {
        http_response_code(400);
        $response["message"] = "Invalid Document ID.";
        echo json_encode($response);
        exit();
    }

    $db = (new Database())->getConnection();

    $stmt = $db->prepare(
        "SELECT original_filename, mime_type, file_content FROM PRODUCT_DOCUMENT WHERE document_id = ?",
    );
    $stmt->execute([$document_id]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$document) {
        http_response_code(404);
        $response["message"] = "Document not found.";
        echo json_encode($response);
        exit();
    }

    // Clear any previous output
    if (ob_get_level()) {
        ob_end_clean();
    }

    // Set appropriate headers for file download
    header("Content-Type: " . $document["mime_type"]);
    header(
        'Content-Disposition: attachment; filename="' .
            $document["original_filename"] .
            '"',
    );
    header("Content-Length: " . strlen($document["file_content"]));
    header("Cache-Control: must-revalidate");
    header("Pragma: public");

    // Output the file content
    echo $document["file_content"];
    exit();
} catch (PDOException $e) {
    http_response_code(500);
    $response["message"] = "Database Error: " . $e->getMessage();
    echo json_encode($response);
} catch (Exception $e) {
    http_response_code(500);
    $response["message"] = "Server Error: " . $e->getMessage();
    echo json_encode($response);
}
?>
