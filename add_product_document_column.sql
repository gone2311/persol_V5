-- Add document_filename column to PRODUCTS table for attaching product manuals/documents
ALTER TABLE `PRODUCTS`
ADD COLUMN `document_filename` VARCHAR(255) DEFAULT NULL AFTER `image_mime_type`;
