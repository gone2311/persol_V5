-- Add missing columns to USERS table
-- This adds 'address' and 'is_active' columns which are required by the application

ALTER TABLE `USERS`
ADD COLUMN `address` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `phone_number`,
ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `address`;
