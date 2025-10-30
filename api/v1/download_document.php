<?php
header("Access-Control-Allow-Methods: GET");

require_once "./config/database.php";

function convertToText($content, $extension) {
    if ($extension === "txt") {
        return $content;
    }

    if ($extension === "docx") {
        $zip = new ZipArchive();
        $temp_file = tempnam(sys_get_temp_dir(), 'docx');
        file_put_contents($temp_file, $content);

        if ($zip->open($temp_file) === TRUE) {
            $xml_content = $zip->getFromName("word/document.xml");
            $zip->close();
            unlink($temp_file);

            if ($xml_content) {
                $xml_content = str_replace('</w:r></w:p>', "\r\n", $xml_content);
                $xml_content = str_replace('</w:p>', "\r\n\r\n", $xml_content);
                return strip_tags($xml_content);
            }
        }
        unlink($temp_file);
    }

    return "Text extraction not supported for this file type. Original format: " . $extension;
}

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

    $format = $_GET["format"] ?? "original";
    $allowed_formats = ["original", "pdf", "docx", "txt"];

    if (!in_array($format, $allowed_formats)) {
        http_response_code(400);
        $response["message"] = "Invalid format. Allowed: " . implode(", ", $allowed_formats);
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

    $file_content = $document["file_content"];
    $filename = $document["original_filename"];
    $mime_type = $document["mime_type"];

    if ($format !== "original") {
        $original_ext = pathinfo($filename, PATHINFO_EXTENSION);
        $base_name = pathinfo($filename, PATHINFO_FILENAME);

        if ($format === "txt") {
            $file_content = convertToText($file_content, $original_ext);
            $filename = $base_name . ".txt";
            $mime_type = "text/plain";
        } elseif ($format === "pdf" && $original_ext !== "pdf") {
            http_response_code(501);
            $response["message"] = "PDF conversion requires external library (not installed). Please use original format or install phpoffice/phpword + dompdf";
            echo json_encode($response);
            exit();
        } elseif ($format === "docx" && $original_ext !== "docx") {
            http_response_code(501);
            $response["message"] = "DOCX conversion requires external library (not installed). Please use original format.";
            echo json_encode($response);
            exit();
        }
    }

    if (ob_get_level()) {
        ob_end_clean();
    }

    header("Content-Type: " . $mime_type);
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header("Content-Length: " . strlen($file_content));
    header("Cache-Control: must-revalidate");
    header("Pragma: public");

    echo $file_content;
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
