-- --------------------------------------------------------
-- Host:                         localhost
-- Server version:               9.2.0 - MySQL Community Server - GPL
-- Server OS:                    Linux
-- HeidiSQL Version:             12.11.0.7096
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for power_management
CREATE DATABASE IF NOT EXISTS `power_management` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `power_management`;

-- Dumping structure for table power_management.clusters
CREATE TABLE IF NOT EXISTS `clusters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table power_management.clusters: ~2 rows (approximately)
INSERT INTO `clusters` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
	(1, 'bit cloud', 'IT infra', '2025-07-10 05:20:21', '2025-07-10 05:20:21'),
	(2, 'vedhanayagam', 'PS Skill', '2025-07-10 05:42:27', '2025-07-10 05:42:27');

-- Dumping structure for table power_management.machines
CREATE TABLE IF NOT EXISTS `machines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `mac_address` varchar(17) NOT NULL,
  `ip_address` varchar(15) NOT NULL,
  `subnet_mask` varchar(15) NOT NULL,
  `broadcast_address` varchar(15) NOT NULL,
  `username` varchar(255) NOT NULL,
  `encrypted_password` text NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table power_management.machines: ~13 rows (approximately)
INSERT INTO `machines` (`id`, `name`, `mac_address`, `ip_address`, `subnet_mask`, `broadcast_address`, `username`, `encrypted_password`, `is_active`, `created_at`, `updated_at`) VALUES
		(15, '13', '28:C5:C8jnkj:7F:54:18', 'dfvf', '255.4445.254.0', '10.144420.123457.2555', 'Administrator', '25', 1, '2025-07-11 10:53:52', '2025-07-11 10:53:52');

-- Dumping structure for table power_management.machine_cluster
CREATE TABLE IF NOT EXISTS `machine_cluster` (
  `machine_id` int NOT NULL,
  `cluster_id` int NOT NULL,
  PRIMARY KEY (`machine_id`,`cluster_id`),
  KEY `cluster_id` (`cluster_id`),
  CONSTRAINT `machine_cluster_ibfk_1` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE CASCADE,
  CONSTRAINT `machine_cluster_ibfk_2` FOREIGN KEY (`cluster_id`) REFERENCES `clusters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table power_management.machine_cluster: ~2 rows (approximately)
INSERT INTO `machine_cluster` (`machine_id`, `cluster_id`) VALUES
	(1, 2),
	(2, 2);

-- Dumping structure for table power_management.power_events
CREATE TABLE IF NOT EXISTS `power_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `machine_id` int NOT NULL,
  `action` enum('shutdown','restart','wake') NOT NULL,
  `status` enum('pending','success','failed') NOT NULL,
  `initiated_by` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `machine_id` (`machine_id`),
  CONSTRAINT `power_events_ibfk_1` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=393 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table power_management.power_events: ~76 rows (approximately)
INSERT INTO `power_events` (`id`, `machine_id`, `action`, `status`, `initiated_by`, `created_at`) VALUES
	(315, 1, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(316, 2, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(317, 3, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(318, 4, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(319, 5, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(320, 6, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(321, 7, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(322, 10, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(323, 11, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(324, 12, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(325, 13, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(326, 14, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(327, 15, 'wake', 'success', 'admin', '2025-07-11 10:55:35'),
	(328, 1, 'shutdown', 'success', 'admin', '2025-07-11 10:56:18'),
	(329, 2, 'shutdown', 'success', 'admin', '2025-07-11 10:56:19'),
	(330, 3, 'shutdown', 'success', 'admin', '2025-07-11 10:56:19'),
	(331, 1, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:19'),
	(332, 4, 'shutdown', 'success', 'admin', '2025-07-11 10:56:19'),
	(333, 2, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:19'),
	(334, 3, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:19'),
	(335, 4, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:19'),
	(336, 5, 'shutdown', 'success', 'admin', '2025-07-11 10:56:20'),
	(337, 5, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:20'),
	(338, 6, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:20'),
	(339, 6, 'shutdown', 'success', 'admin', '2025-07-11 10:56:20'),
	(340, 7, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:20'),
	(341, 7, 'shutdown', 'success', 'admin', '2025-07-11 10:56:20'),
	(342, 10, 'shutdown', 'success', 'admin', '2025-07-11 10:56:20'),
	(343, 10, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:20'),
	(344, 11, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:20'),
	(345, 11, 'shutdown', 'success', 'admin', '2025-07-11 10:56:20'),
	(346, 12, 'shutdown', 'success', 'admin', '2025-07-11 10:56:20'),
	(347, 12, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:20'),
	(348, 13, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:20'),
	(349, 13, 'shutdown', 'success', 'admin', '2025-07-11 10:56:20'),
	(350, 14, 'shutdown', 'success', 'admin', '2025-07-11 10:56:21'),
	(351, 14, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:21'),
	(352, 15, 'shutdown', 'success', 'admin', '2025-07-11 10:56:21'),
	(353, 15, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:21'),
	(354, 1, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:38'),
	(355, 2, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:38'),
	(356, 3, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:38'),
	(357, 4, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:38'),
	(358, 1, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:38'),
	(359, 2, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:39'),
	(360, 3, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:39'),
	(361, 4, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:39'),
	(362, 1, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:42'),
	(363, 2, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:42'),
	(364, 1, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:42'),
	(365, 3, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:42'),
	(366, 2, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:42'),
	(367, 4, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:42'),
	(368, 3, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:43'),
	(369, 1, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:43'),
	(370, 4, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:43'),
	(371, 2, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:43'),
	(372, 3, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:43'),
	(373, 4, 'shutdown', 'failed', 'admin', '2025-07-11 10:56:43'),
	(374, 5, 'shutdown', 'failed', 'admin', '2025-07-11 10:57:00'),
	(375, 5, 'shutdown', 'failed', 'admin', '2025-07-11 10:57:21'),
	(376, 6, 'shutdown', 'failed', 'admin', '2025-07-11 10:57:21'),
	(377, 5, 'shutdown', 'failed', 'admin', '2025-07-11 10:57:42'),
	(378, 6, 'shutdown', 'failed', 'admin', '2025-07-11 10:57:43'),
	(379, 7, 'shutdown', 'failed', 'admin', '2025-07-11 10:57:43'),
	(380, 7, 'shutdown', 'failed', 'admin', '2025-07-11 10:57:43'),
	(381, 5, 'shutdown', 'failed', 'admin', '2025-07-11 10:58:03'),
	(382, 5, 'shutdown', 'failed', 'admin', '2025-07-11 10:58:03'),
	(383, 6, 'shutdown', 'failed', 'admin', '2025-07-11 10:58:04'),
	(384, 10, 'shutdown', 'failed', 'admin', '2025-07-11 10:58:05'),
	(385, 6, 'shutdown', 'failed', 'admin', '2025-07-11 10:58:24'),
	(386, 6, 'shutdown', 'failed', 'admin', '2025-07-11 10:58:24'),
	(387, 7, 'shutdown', 'failed', 'admin', '2025-07-11 10:58:25'),
	(388, 7, 'shutdown', 'failed', 'admin', '2025-07-11 10:58:25'),
	(389, 7, 'shutdown', 'failed', 'admin', '2025-07-11 10:58:25'),
	(390, 10, 'shutdown', 'failed', 'admin', '2025-07-11 10:58:25'),
	(391, 11, 'shutdown', 'failed', 'admin', '2025-07-11 10:58:25'),
	(392, 11, 'shutdown', 'failed', 'admin', '2025-07-11 10:58:25');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
