-- ========================================================================
-- LANturn - Complete Database Setup Script
-- Network Power Management System Database Schema
-- ========================================================================
-- Version: 2.0
-- Updated: October 27, 2025
-- Description: Complete database schema for LANturn application including
--              all tables, relationships, indexes, and sample data
-- ========================================================================

-- Set MySQL configuration
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- ========================================================================
-- DATABASE CREATION
-- ========================================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `power_management` 
    /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ 
    /*!80016 DEFAULT ENCRYPTION='N' */;

USE `power_management`;

-- ========================================================================
-- TABLE: users
-- Purpose: User authentication and authorization
-- ========================================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin', 'user') NOT NULL DEFAULT 'user',
  `email` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `login_attempts` int DEFAULT '0',
  `locked_until` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username_active` (`username`, `is_active`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='User authentication and profile management';

-- ========================================================================
-- TABLE: machines
-- Purpose: Network machines/computers to be managed
-- ========================================================================

CREATE TABLE IF NOT EXISTS `machines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `mac_address` varchar(17) NOT NULL,
  `ip_address` varchar(15) NOT NULL,
  `subnet_mask` varchar(15) NOT NULL DEFAULT '255.255.255.0',
  `broadcast_address` varchar(15) NOT NULL,
  `username` varchar(255) NOT NULL,
  `encrypted_password` text NOT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `os_type` enum('windows', 'linux', 'macos', 'other') DEFAULT 'windows',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_online` tinyint(1) DEFAULT '0',
  `last_ping` timestamp NULL DEFAULT NULL,
  `wol_port` int DEFAULT '9',
  `ssh_port` int DEFAULT '22',
  `rdp_port` int DEFAULT '3389',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mac_address` (`mac_address`),
  UNIQUE KEY `ip_address` (`ip_address`),
  KEY `idx_name` (`name`),
  KEY `idx_ip_mac` (`ip_address`, `mac_address`),
  KEY `idx_active_online` (`is_active`, `is_online`),
  KEY `fk_machines_created_by` (`created_by`),
  CONSTRAINT `fk_machines_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='Network machines and their connection details';

-- ========================================================================
-- TABLE: clusters
-- Purpose: Grouping machines for bulk operations
-- ========================================================================

CREATE TABLE IF NOT EXISTS `clusters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#3b82f6',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`),
  KEY `idx_active` (`is_active`),
  KEY `fk_clusters_created_by` (`created_by`),
  CONSTRAINT `fk_clusters_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='Machine clusters for group management';

-- ========================================================================
-- TABLE: machine_cluster
-- Purpose: Many-to-many relationship between machines and clusters
-- ========================================================================

CREATE TABLE IF NOT EXISTS `machine_cluster` (
  `machine_id` int NOT NULL,
  `cluster_id` int NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `added_by` int DEFAULT NULL,
  PRIMARY KEY (`machine_id`, `cluster_id`),
  KEY `cluster_id` (`cluster_id`),
  KEY `idx_machine_cluster` (`machine_id`, `cluster_id`),
  KEY `fk_machine_cluster_added_by` (`added_by`),
  CONSTRAINT `machine_cluster_ibfk_1` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE CASCADE,
  CONSTRAINT `machine_cluster_ibfk_2` FOREIGN KEY (`cluster_id`) REFERENCES `clusters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_machine_cluster_added_by` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='Machine-cluster membership relationships';

-- ========================================================================
-- TABLE: power_events
-- Purpose: Logging all power management operations
-- ========================================================================

CREATE TABLE IF NOT EXISTS `power_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `machine_id` int NOT NULL,
  `action` enum('wake', 'shutdown', 'restart', 'ping', 'kiosk_start', 'kiosk_stop') NOT NULL,
  `status` enum('pending', 'success', 'failed', 'timeout') NOT NULL DEFAULT 'pending',
  `initiated_by` varchar(255) NOT NULL,
  `user_id` int DEFAULT NULL,
  `command` text DEFAULT NULL,
  `response` text DEFAULT NULL,
  `response_time` decimal(8,3) DEFAULT NULL COMMENT 'Response time in milliseconds',
  `error_message` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP address of the initiator',
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `machine_id` (`machine_id`),
  KEY `idx_action_status` (`action`, `status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_initiated_by` (`initiated_by`),
  KEY `fk_power_events_user_id` (`user_id`),
  CONSTRAINT `power_events_ibfk_1` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_power_events_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='Power management operation audit log';

-- ========================================================================
-- TABLE: system_logs
-- Purpose: General system operation logging
-- ========================================================================

CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level` enum('info', 'warning', 'error', 'debug') NOT NULL DEFAULT 'info',
  `category` varchar(50) NOT NULL DEFAULT 'system',
  `message` text NOT NULL,
  `details` json DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_level_category` (`level`, `category`),
  KEY `idx_created_at` (`created_at`),
  KEY `fk_system_logs_user_id` (`user_id`),
  CONSTRAINT `fk_system_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='System operation and error logging';

-- ========================================================================
-- TABLE: user_sessions
-- Purpose: Track user login sessions
-- ========================================================================

CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `last_activity` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `user_id` (`user_id`),
  KEY `idx_token_active` (`session_token`, `is_active`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='User authentication sessions';

-- ========================================================================
-- TABLE: application_settings
-- Purpose: System configuration and settings
-- ========================================================================

CREATE TABLE IF NOT EXISTS `application_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(50) DEFAULT 'general',
  `data_type` enum('string', 'number', 'boolean', 'json') DEFAULT 'string',
  `is_editable` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_category` (`category`),
  KEY `fk_settings_updated_by` (`updated_by`),
  CONSTRAINT `fk_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='Application configuration settings';

-- ========================================================================
-- VIEWS FOR REPORTING AND ANALYTICS
-- ========================================================================

-- Machine status summary view
CREATE OR REPLACE VIEW `v_machine_status` AS
SELECT 
    m.id,
    m.name,
    m.ip_address,
    m.mac_address,
    m.is_active,
    m.is_online,
    m.last_ping,
    COUNT(DISTINCT mc.cluster_id) as cluster_count,
    GROUP_CONCAT(DISTINCT c.name ORDER BY c.name) as clusters,
    (SELECT COUNT(*) FROM power_events pe WHERE pe.machine_id = m.id AND pe.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as events_24h,
    (SELECT pe.status FROM power_events pe WHERE pe.machine_id = m.id ORDER BY pe.created_at DESC LIMIT 1) as last_event_status
FROM machines m
LEFT JOIN machine_cluster mc ON m.id = mc.machine_id
LEFT JOIN clusters c ON mc.cluster_id = c.id AND c.is_active = 1
WHERE m.is_active = 1
GROUP BY m.id, m.name, m.ip_address, m.mac_address, m.is_active, m.is_online, m.last_ping;

-- Power events summary view
CREATE OR REPLACE VIEW `v_power_events_summary` AS
SELECT 
    DATE(pe.created_at) as event_date,
    pe.action,
    pe.status,
    COUNT(*) as event_count,
    AVG(pe.response_time) as avg_response_time,
    COUNT(DISTINCT pe.machine_id) as unique_machines,
    COUNT(DISTINCT pe.initiated_by) as unique_users
FROM power_events pe
WHERE pe.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(pe.created_at), pe.action, pe.status
ORDER BY event_date DESC, pe.action, pe.status;

-- ========================================================================
-- DEFAULT DATA INSERTION
-- ========================================================================

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO `users` (`username`, `password_hash`, `role`, `full_name`, `email`) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator', 'admin@lanturn.local');

-- Insert default application settings
INSERT IGNORE INTO `application_settings` (`setting_key`, `setting_value`, `description`, `category`, `data_type`) VALUES
('app_name', 'LANturn', 'Application name', 'general', 'string'),
('app_version', '2.0.0', 'Application version', 'general', 'string'),
('max_login_attempts', '5', 'Maximum login attempts before lockout', 'security', 'number'),
('session_timeout', '3600', 'Session timeout in seconds', 'security', 'number'),
('ping_timeout', '5000', 'Ping timeout in milliseconds', 'network', 'number'),
('wol_timeout', '10000', 'Wake-on-LAN timeout in milliseconds', 'network', 'number'),
('shutdown_timeout', '30000', 'Shutdown command timeout in milliseconds', 'network', 'number'),
('log_retention_days', '90', 'Number of days to keep logs', 'maintenance', 'number'),
('enable_clustering', 'true', 'Enable machine clustering feature', 'features', 'boolean'),
('enable_kiosk_mode', 'true', 'Enable kiosk mode functionality', 'features', 'boolean'),
('default_theme', 'dark', 'Default UI theme', 'ui', 'string'),
('items_per_page', '20', 'Default items per page for pagination', 'ui', 'number');

-- Insert sample clusters
INSERT IGNORE INTO `clusters` (`id`, `name`, `description`, `color`) VALUES
(1, 'Production Servers', 'Critical production infrastructure', '#dc2626'),
(2, 'Development Lab', 'Development and testing machines', '#059669'),
(3, 'Office Workstations', 'Employee desktop computers', '#3b82f6');

-- ========================================================================
-- STORED PROCEDURES
-- ========================================================================

DELIMITER $$

-- Procedure to clean up old logs
CREATE PROCEDURE IF NOT EXISTS `sp_cleanup_old_logs`(IN days_to_keep INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Clean up old power events
    DELETE FROM power_events 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    -- Clean up old system logs
    DELETE FROM system_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    -- Clean up expired sessions
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR last_activity < DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    COMMIT;
END$$

-- Procedure to get machine statistics
CREATE PROCEDURE IF NOT EXISTS `sp_get_machine_stats`()
BEGIN
    SELECT 
        COUNT(*) as total_machines,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_machines,
        SUM(CASE WHEN is_online = 1 THEN 1 ELSE 0 END) as online_machines,
        SUM(CASE WHEN last_ping > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1 ELSE 0 END) as recently_pinged
    FROM machines;
    
    SELECT 
        action,
        status,
        COUNT(*) as count
    FROM power_events 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    GROUP BY action, status;
END$$

DELIMITER ;

-- ========================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ========================================================================

-- Additional indexes for power_events table (high-traffic table)
CREATE INDEX IF NOT EXISTS `idx_power_events_machine_action` ON `power_events` (`machine_id`, `action`);
CREATE INDEX IF NOT EXISTS `idx_power_events_status_created` ON `power_events` (`status`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_power_events_user_created` ON `power_events` (`user_id`, `created_at`);

-- Additional indexes for machines table
CREATE INDEX IF NOT EXISTS `idx_machines_active_online` ON `machines` (`is_active`, `is_online`);
CREATE INDEX IF NOT EXISTS `idx_machines_last_ping` ON `machines` (`last_ping`);

-- Additional indexes for user_sessions table
CREATE INDEX IF NOT EXISTS `idx_user_sessions_user_active` ON `user_sessions` (`user_id`, `is_active`);

-- ========================================================================
-- TRIGGERS FOR AUDIT LOGGING
-- ========================================================================

DELIMITER $$

-- Trigger to log machine changes
CREATE TRIGGER IF NOT EXISTS `tr_machines_audit` 
AFTER UPDATE ON `machines`
FOR EACH ROW
BEGIN
    IF OLD.is_online != NEW.is_online THEN
        INSERT INTO system_logs (level, category, message, details)
        VALUES (
            'info', 
            'machine_status', 
            CONCAT('Machine ', NEW.name, ' status changed'),
            JSON_OBJECT(
                'machine_id', NEW.id,
                'old_status', IF(OLD.is_online = 1, 'online', 'offline'),
                'new_status', IF(NEW.is_online = 1, 'online', 'offline'),
                'ip_address', NEW.ip_address
            )
        );
    END IF;
END$$

DELIMITER ;

-- ========================================================================
-- CLEANUP AND FINALIZATION
-- ========================================================================

-- Restore MySQL settings
/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

-- ========================================================================
-- VERIFICATION QUERIES (OPTIONAL - FOR TESTING)
-- ========================================================================

/*
-- Uncomment these queries to verify the setup:

-- Check all tables
SHOW TABLES;

-- Check table structures
DESCRIBE users;
DESCRIBE machines;
DESCRIBE clusters;
DESCRIBE machine_cluster;
DESCRIBE power_events;
DESCRIBE system_logs;
DESCRIBE user_sessions;
DESCRIBE application_settings;

-- Check views
SELECT * FROM v_machine_status LIMIT 5;
SELECT * FROM v_power_events_summary LIMIT 10;

-- Check default data
SELECT * FROM users;
SELECT * FROM application_settings;
SELECT * FROM clusters;

-- Test stored procedures
CALL sp_get_machine_stats();
*/

-- ========================================================================
-- SETUP COMPLETE
-- ========================================================================

SELECT 'LANturn Database Setup Complete!' as Status,
       NOW() as Timestamp,
       '2.0' as Version;