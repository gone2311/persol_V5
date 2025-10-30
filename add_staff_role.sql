-- Add 'staff' role to user_type enum
ALTER TABLE `USERS`
MODIFY COLUMN `user_type` ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'customer';
