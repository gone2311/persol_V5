-- Add is_active column to PRODUCTS table
ALTER TABLE `PRODUCTS`
ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `image_mime_type`,
ADD INDEX `idx_is_active` (`is_active`);

-- Add is_active column to USERS table
ALTER TABLE `USERS`
ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `deleted_at`,
ADD INDEX `idx_is_active` (`is_active`);

-- Update existing records to be active
UPDATE `PRODUCTS` SET `is_active` = 1 WHERE `is_active` IS NULL;
UPDATE `USERS` SET `is_active` = 1 WHERE `is_active` IS NULL;
