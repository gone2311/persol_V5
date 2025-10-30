-- Add SITE_VISITS table for tracking page visits
CREATE TABLE IF NOT EXISTS `SITE_VISITS` (
  `visit_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `page_url` VARCHAR(255) DEFAULT NULL,
  `visited_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`visit_id`),
  KEY `idx_visited_at` (`visited_at`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_site_visits_user` FOREIGN KEY (`user_id`) REFERENCES `USERS` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
