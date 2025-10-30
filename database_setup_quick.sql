-- ========================================================================
-- LANturn - Quick Database Setup Script
-- Minimal setup for development and testing
-- ========================================================================

-- Create database
CREATE DATABASE IF NOT EXISTS `power_management` DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
USE `power_management`;

-- ========================================================================
-- CORE TABLES (REQUIRED)
-- ========================================================================

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin', 'user') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Machines table
CREATE TABLE IF NOT EXISTS `machines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `mac_address` varchar(17) NOT NULL,
  `ip_address` varchar(15) NOT NULL,
  `subnet_mask` varchar(15) NOT NULL DEFAULT '255.255.255.0',
  `broadcast_address` varchar(15) NOT NULL,
  `username` varchar(255) NOT NULL,
  `encrypted_password` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_ping` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Clusters table
CREATE TABLE IF NOT EXISTS `clusters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Machine-Cluster relationship table
CREATE TABLE IF NOT EXISTS `machine_cluster` (
  `machine_id` int NOT NULL,
  `cluster_id` int NOT NULL,
  PRIMARY KEY (`machine_id`, `cluster_id`),
  KEY `cluster_id` (`cluster_id`),
  CONSTRAINT `machine_cluster_ibfk_1` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE CASCADE,
  CONSTRAINT `machine_cluster_ibfk_2` FOREIGN KEY (`cluster_id`) REFERENCES `clusters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Power Events table
CREATE TABLE IF NOT EXISTS `power_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `machine_id` int NOT NULL,
  `action` enum('wake', 'shutdown', 'restart', 'ping', 'kiosk_start', 'kiosk_stop') NOT NULL,
  `status` enum('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
  `initiated_by` varchar(255) NOT NULL,
  `response_time` decimal(8,3) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `machine_id` (`machine_id`),
  CONSTRAINT `power_events_ibfk_1` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================================================
-- DEFAULT DATA
-- ========================================================================

-- Insert default admin user (username: admin, password: admin123)
INSERT IGNORE INTO `users` (`username`, `password_hash`, `role`) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert sample cluster
INSERT IGNORE INTO `clusters` (`id`, `name`, `description`) VALUES
(1, 'Default Cluster', 'Default cluster for testing');

-- ========================================================================
-- VERIFICATION
-- ========================================================================

SELECT 'LANturn Quick Setup Complete!' as Status, 
       COUNT(*) as UserCount FROM users;

-- Display setup summary
SELECT 
    'Tables Created' as Item,
    COUNT(*) as Count
FROM information_schema.tables 
WHERE table_schema = 'power_management' 
    AND table_name IN ('users', 'machines', 'clusters', 'machine_cluster', 'power_events');