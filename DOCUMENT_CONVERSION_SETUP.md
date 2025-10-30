# Document Format Conversion Setup

## Current Status

The document download API (`api/v1/download_document.php`) supports format selection with the following features:

### Supported Formats
- **Original**: Download file in its original format (fully working)
- **TXT**: Convert DOCX to plain text (fully working - uses ZipArchive)
- **PDF**: Convert other formats to PDF (requires additional setup)
- **DOCX**: Convert other formats to DOCX (requires additional setup)

### Usage

Download endpoint with format parameter:
```
GET /api/v1/download_document.php?id=1&format=txt
GET /api/v1/download_document.php?id=1&format=original
```

## Setup Instructions for Full Format Conversion

To enable PDF and DOCX conversion, install these PHP libraries:

### 1. Install Composer Dependencies

```bash
cd /path/to/project
composer require phpoffice/phpword
composer require dompdf/dompdf
```

### 2. Update download_document.php

Replace the placeholder code with actual conversion logic using the installed libraries.

**For PDF conversion:**
```php
use PhpOffice\PhpWord\IOFactory;
use Dompdf\Dompdf;

// Convert DOCX to PDF
$phpWord = IOFactory::load($temp_file);
$htmlWriter = IOFactory::createWriter($phpWord, 'HTML');
$html = $htmlWriter->save('php://output');

$dompdf = new Dompdf();
$dompdf->loadHtml($html);
$dompdf->render();
$file_content = $dompdf->output();
```

**For DOCX conversion:**
```php
// Use PHPWord to create DOCX from other formats
// Implementation depends on source format
```

## Current Implementation

- ✅ Original format download working
- ✅ TXT extraction from DOCX working (basic)
- ⚠️ PDF conversion returns 501 (Not Implemented) error with instructions
- ⚠️ DOCX conversion returns 501 (Not Implemented) error

## Frontend Integration

The API accepts a `format` query parameter:
- `original` (default)
- `txt`
- `pdf`
- `docx`

Frontend can provide a dropdown for users to select their preferred format before downloading.

## Security Notes

- All format conversions use temporary files that are cleaned up after use
- Input validation ensures only allowed formats are processed
- File operations are contained within PHP's temp directory
