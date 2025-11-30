-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : dim. 30 nov. 2025 à 16:51
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `apuic_capital`
--

DELIMITER $$
--
-- Procédures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `safe_require_bank_fk` ()   BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    -- ignore errors and continue
  END;

  -- attempt to drop commonly used FK names (no-op on error)
  ALTER TABLE payment_methods DROP FOREIGN KEY fk_payment_methods_bank;
  ALTER TABLE payment_methods DROP FOREIGN KEY fk_payment_methods_bank_id;
  ALTER TABLE payment_methods DROP FOREIGN KEY fk_payment_methods_bankid;

  -- Now make bank_id NOT NULL
  ALTER TABLE payment_methods
    MODIFY COLUMN bank_id CHAR(36) NOT NULL;

  -- Add foreign key constraint. Use ON DELETE RESTRICT because `bank_id` is NOT NULL.
  ALTER TABLE payment_methods
    ADD CONSTRAINT fk_payment_methods_bank_id FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE RESTRICT;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `admin_id` char(36) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `admin_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
('741cf4f2-3b7d-4b38-9407-9d6358bd423c', '596e019d-cdcc-4b5d-87a6-808cbac06a69', '5756dca9-b2db-415d-b618-dc8938261fc1', 'manual_credit', NULL, NULL, '{\"message\": \"Added 1000 - Reason: Admin adjustment\"}', NULL, NULL, '2025-11-28 11:27:31'),
('924f4957-8bd6-4c21-aa0f-75be17600e38', '596e019d-cdcc-4b5d-87a6-808cbac06a69', '5756dca9-b2db-415d-b618-dc8938261fc1', 'manual_debit', NULL, NULL, '{\"message\": \"Deducted 1000 - Reason: Admin adjustment\"}', NULL, NULL, '2025-11-28 11:26:26');

-- --------------------------------------------------------

--
-- Structure de la table `admin_deposit_approvals`
--

CREATE TABLE `admin_deposit_approvals` (
  `id` char(36) NOT NULL,
  `deposit_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(100) DEFAULT NULL,
  `customer_mobile` varchar(20) DEFAULT NULL,
  `transfer_id` varchar(20) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `approved_by` varchar(36) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `admin_deposit_approvals`
--

INSERT INTO `admin_deposit_approvals` (`id`, `deposit_id`, `user_id`, `user_name`, `amount`, `payment_method`, `customer_mobile`, `transfer_id`, `status`, `approved_by`, `approved_at`, `rejected_at`, `rejection_reason`, `created_at`) VALUES
('768cb56f-293c-4166-8a50-15b9e18df02f', 'ce95a9fe-8be8-42e8-8298-8fa5748316cd', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'william', 10000.00, 'Moov Bénin', '6789009', '45667788899', 'approved', '5756dca9-b2db-415d-b618-dc8938261fc1', '2025-11-29 13:28:17', NULL, NULL, '2025-11-29 13:27:17'),
('c0fef6f3-84ae-4d9a-88d9-65b06795dc59', 'bc4dd645-1234-4d2f-933b-6c5f493cd001', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'william', 10000.00, 'Flooz', '4567899', '123456778', 'pending', NULL, NULL, NULL, NULL, '2025-11-29 11:04:23'),
('dc115207-2bf8-4891-993b-1745386c2e2d', 'b8dfbc01-ca44-4a95-ae6f-3a8320897b2c', '0d4db5de-3a11-4316-a0b1-06ff15202a1f', 'Hello', 5000.00, 'MTN MOMO', '56789098', '4567890878', 'approved', '5756dca9-b2db-415d-b618-dc8938261fc1', '2025-11-29 15:28:01', NULL, NULL, '2025-11-29 15:27:42'),
('e6b95a22-25c6-4a7a-85e6-dca2a6d4bdd7', 'bab2d984-883f-48d0-903f-0764e53c0356', 'cc55cabc-9afa-42eb-a80b-934463759f96', 'SERTYU', 10000.00, 'MTN MOMO', '6567890', '123456788', 'approved', '5756dca9-b2db-415d-b618-dc8938261fc1', '2025-11-29 13:33:53', NULL, NULL, '2025-11-29 13:33:24'),
('ea1e72a3-eeee-47c4-a2e7-c41e0f0cb1d5', 'fd25be3e-ea7a-4588-ade8-8f95055879b7', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'william', 10000.00, 'Flooz', '4567890989', '4567890987', 'pending', NULL, NULL, NULL, NULL, '2025-11-30 15:29:29');

-- --------------------------------------------------------

--
-- Structure de la table `admin_withdrawal_approvals`
--

CREATE TABLE `admin_withdrawal_approvals` (
  `id` char(36) NOT NULL,
  `withdrawal_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method_id` char(36) DEFAULT NULL,
  `bank_id` char(36) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `account_holder_name` varchar(255) DEFAULT NULL,
  `country` varchar(8) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `admin_withdrawal_approvals`
--

INSERT INTO `admin_withdrawal_approvals` (`id`, `withdrawal_id`, `user_id`, `user_name`, `amount`, `payment_method_id`, `bank_id`, `bank_name`, `account_number`, `account_holder_name`, `country`, `status`, `approved_by`, `approved_at`, `rejected_at`, `rejection_reason`, `created_at`) VALUES
('28f3230d-a4e9-4242-9813-9b0065fa806f', '62b21ccd-d6ca-46c4-b10d-e75dc11b072e', '0d4db5de-3a11-4316-a0b1-06ff15202a1f', 'Hello', 2000.00, '077bbdc2-7328-4a58-876c-0d99f4f4a75e', '6af79123-6894-41a7-ab54-6782f0b7380f', 'Banque du Bénin', '45678909', 'WILL', NULL, 'approved', '5756dca9-b2db-415d-b618-dc8938261fc1', '2025-11-29 15:49:13', NULL, NULL, '2025-11-29 15:48:20'),
('2cacb036-ed3a-4cd2-9f77-6fcbf5d9bca0', '23b3488b-7bf3-4089-87da-2624ea37951f', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'william', 1000.00, '7d32ce3c-b14c-4853-821a-3bed5b54ddf3', 'ef11036f-009b-4220-a2f4-0a545491502f', 'Banque de Togo', '45678', 'RTYUI', NULL, 'pending', NULL, NULL, NULL, NULL, '2025-11-29 18:31:16'),
('7478c4a3-3b98-4142-b07e-e86dcea0af41', '4ef5a6a5-f429-4db7-9970-9f7b3b9f93c6', '0d4db5de-3a11-4316-a0b1-06ff15202a1f', 'Hello', 1000.00, '7d32ce3c-b14c-4853-821a-3bed5b54ddf3', 'ef11036f-009b-4220-a2f4-0a545491502f', 'Banque de Togo', '4567889', 'RTTY', NULL, 'pending', NULL, NULL, NULL, NULL, '2025-11-29 16:48:31'),
('83a80133-e62c-4fb3-a557-18ed76d48ba4', '851a37cd-f01a-460c-9d54-e4dc433b7fcf', 'cc55cabc-9afa-42eb-a80b-934463759f96', 'SERTYU', 10000.00, '7d32ce3c-b14c-4853-821a-3bed5b54ddf3', 'ef11036f-009b-4220-a2f4-0a545491502f', 'Banque de Togo', '56789087', 'RTYUI', NULL, 'approved', '5756dca9-b2db-415d-b618-dc8938261fc1', '2025-11-29 15:07:04', NULL, NULL, '2025-11-29 13:37:03'),
('f14ab1cb-12c3-4b06-8062-c389915410a2', 'a534859e-cdd9-4bcd-8b45-060376030e1c', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'william', 19000.00, '077bbdc2-7328-4a58-876c-0d99f4f4a75e', '6af79123-6894-41a7-ab54-6782f0b7380f', 'Banque du Bénin', '5677889990', 'RTYUU', NULL, 'approved', '5756dca9-b2db-415d-b618-dc8938261fc1', '2025-11-29 11:16:32', NULL, NULL, '2025-11-29 11:15:28');

-- --------------------------------------------------------

--
-- Structure de la table `banks`
--

CREATE TABLE `banks` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `country_code` varchar(5) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `banks`
--

INSERT INTO `banks` (`id`, `name`, `code`, `country_code`, `is_active`, `created_at`, `updated_at`) VALUES
('6af79123-6894-41a7-ab54-6782f0b7380f', 'Banque du Bénin', NULL, '+229', 1, '2025-11-28 08:40:11', '2025-11-28 08:40:11'),
('7c0ca7d7-ae1c-4491-8aa8-3f2b7a4ab010', 'MTN MOMO', NULL, NULL, 1, '2025-11-29 12:25:22', '2025-11-29 12:25:22'),
('ef11036f-009b-4220-a2f4-0a545491502f', 'Banque de Togo', '228', '228', 1, '2025-11-28 13:51:24', '2025-11-28 13:51:24');

-- --------------------------------------------------------

--
-- Structure de la table `daily_earnings`
--

CREATE TABLE `daily_earnings` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `investment_id` char(36) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `earning_date` date NOT NULL,
  `earning_time` datetime NOT NULL,
  `processed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `daily_earnings`
--

INSERT INTO `daily_earnings` (`id`, `user_id`, `investment_id`, `amount`, `earning_date`, `earning_time`, `processed_at`) VALUES
('5fbd3c55-8b2b-4f6a-a0d5-3cd443d27752', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'c6f99650-3523-4eb1-b16a-eae7ff245f27', 300.00, '2025-11-29', '2025-11-29 11:29:00', '2025-11-29 11:29:00');

-- --------------------------------------------------------

--
-- Structure de la table `deposits`
--

CREATE TABLE `deposits` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(100) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `transfer_id` varchar(255) DEFAULT NULL,
  `receipt_url` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `is_first_deposit` tinyint(1) DEFAULT 0,
  `processed_by` char(36) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `depositor_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `deposits`
--

INSERT INTO `deposits` (`id`, `user_id`, `amount`, `payment_method`, `account_number`, `transaction_id`, `transfer_id`, `receipt_url`, `status`, `admin_notes`, `is_first_deposit`, `processed_by`, `processed_at`, `created_at`, `updated_at`, `depositor_name`) VALUES
('141db25a-8993-4aef-97cc-429e6c2fdd35', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 10000.00, 'Flooz', '4567899', 'I1764410455266', '123456778', NULL, 'rejected', NULL, 0, NULL, NULL, '2025-11-29 10:00:55', '2025-11-29 10:01:18', NULL),
('1725ff56-abd1-4e7e-bfa8-6c5fea10c9ed', '47717599-5bac-438c-84f4-d93ae795f4c0', 5000.00, 'Moov Bénin', '67890876', 'I1764364181164', '5567890987', NULL, 'approved', NULL, 1, NULL, NULL, '2025-11-28 21:09:41', '2025-11-28 21:09:53', NULL),
('2c4c2065-2be1-48b6-a48d-e00f015edf57', 'da08ff02-671b-4505-bdca-79e83d5a277f', 5000.00, 'MTN MOMO', '56789098', 'I1764363692549', '457890987', NULL, 'rejected', NULL, 0, NULL, NULL, '2025-11-28 21:01:32', '2025-11-28 21:05:04', NULL),
('7bc7bf28-0c41-463d-99de-4959252dc49c', 'da08ff02-671b-4505-bdca-79e83d5a277f', 5000.00, 'MTN MOMO', '56789098', 'I1764363714943', '4578909877', NULL, 'approved', NULL, 0, NULL, NULL, '2025-11-28 21:01:54', '2025-11-28 21:05:15', NULL),
('b2865e56-07fe-4ffe-a0d6-982c7465e09c', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 10000.00, 'Flooz', '4567899', 'I1764410519461', '123456778', NULL, 'rejected', NULL, 0, NULL, NULL, '2025-11-29 10:01:59', '2025-11-29 10:03:23', NULL),
('b620a6ce-2e62-4eea-a374-d9edd48ece2c', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 10000.00, 'Flooz', '4567899', 'I1764410346063', '123456778', NULL, 'rejected', NULL, 0, NULL, NULL, '2025-11-29 09:59:06', '2025-11-29 09:59:53', NULL),
('b8dfbc01-ca44-4a95-ae6f-3a8320897b2c', '0d4db5de-3a11-4316-a0b1-06ff15202a1f', 5000.00, 'MTN MOMO', '56789098', 'I1764426461865', '4567890878', NULL, 'approved', NULL, 1, NULL, NULL, '2025-11-29 14:27:41', '2025-11-29 14:28:01', NULL),
('bab2d984-883f-48d0-903f-0764e53c0356', 'cc55cabc-9afa-42eb-a80b-934463759f96', 10000.00, 'MTN MOMO', '6567890', 'I1764419603876', '123456788', NULL, 'approved', NULL, 1, NULL, NULL, '2025-11-29 12:33:23', '2025-11-29 12:33:53', NULL),
('bc4dd645-1234-4d2f-933b-6c5f493cd001', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 10000.00, 'Flooz', '4567899', 'I1764410663434', '123456778', NULL, 'pending', NULL, 0, NULL, NULL, '2025-11-29 10:04:23', '2025-11-29 10:04:23', NULL),
('bef60c71-c6a3-49bd-8b57-c347dcedcd90', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 20000.00, 'Moov Bénin', '29098765', 'I1764343288515', '456767896', NULL, 'approved', NULL, 1, NULL, NULL, '2025-11-28 15:21:28', '2025-11-28 15:22:26', NULL),
('c5fb50c7-a1fb-49ac-96e7-f46c6b77626b', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 10000.00, 'Flooz', '4567899', 'I1764410523477', '123456778', NULL, 'rejected', NULL, 0, NULL, NULL, '2025-11-29 10:02:03', '2025-11-29 10:03:26', NULL),
('cd157a25-50f5-4afb-a07e-f8475afc5024', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 10000.00, 'Flooz', '4567899', 'I1764410335962', '123456778', NULL, 'rejected', NULL, 0, NULL, NULL, '2025-11-29 09:58:55', '2025-11-29 09:59:50', NULL),
('ce95a9fe-8be8-42e8-8298-8fa5748316cd', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 10000.00, 'Moov Bénin', '6789009', 'I1764419236910', '45667788899', NULL, 'approved', NULL, 0, NULL, NULL, '2025-11-29 12:27:16', '2025-11-29 12:28:18', NULL),
('fd25be3e-ea7a-4588-ade8-8f95055879b7', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 10000.00, 'Flooz', '4567890989', 'I1764512969266', '4567890987', NULL, 'pending', NULL, 0, NULL, NULL, '2025-11-30 14:29:29', '2025-11-30 14:29:29', NULL),
('ff4a7936-9d77-45df-8e2b-f1eb054a4b2e', 'da08ff02-671b-4505-bdca-79e83d5a277f', 5000.00, 'MTN MOMO', '56789098', 'I1764363677321', '457890987', NULL, 'rejected', NULL, 1, NULL, NULL, '2025-11-28 21:01:17', '2025-11-28 21:05:01', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `gift_codes`
--

CREATE TABLE `gift_codes` (
  `id` char(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `created_by` char(36) NOT NULL,
  `redeemed_by` char(36) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `redeemed_at` timestamp NULL DEFAULT NULL,
  `expires_in_minutes` int(11) DEFAULT 30 COMMENT 'Code expires this many minutes after creation',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `gift_codes`
--

INSERT INTO `gift_codes` (`id`, `code`, `amount`, `created_by`, `redeemed_by`, `is_active`, `redeemed_at`, `expires_in_minutes`, `created_at`, `updated_at`) VALUES
('7c327515-6e51-4095-adbf-934a012ee502', 'GIFT-HJ9CRICSS1', 100.00, '5756dca9-b2db-415d-b618-dc8938261fc1', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 0, '2025-11-29 15:44:58', 2, '2025-11-29 15:44:24', '2025-11-29 15:44:58');

-- --------------------------------------------------------

--
-- Structure de la table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `bank_id` char(36) NOT NULL,
  `account_holder_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `min_deposit` decimal(14,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ussd_code` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `name`, `code`, `description`, `bank_id`, `account_holder_name`, `account_number`, `min_deposit`, `is_active`, `created_at`, `updated_at`, `ussd_code`) VALUES
('077bbdc2-7328-4a58-876c-0d99f4f4a75e', 'Moov Bénin', 'Moov', NULL, '6af79123-6894-41a7-ab54-6782f0b7380f', 'WILLIAM', '64979934', 3000.00, 1, '2025-11-28 14:52:22', '2025-11-28 14:52:22', NULL),
('4e4e6baf-e626-49ae-b23c-720ab4ba8797', 'MTN MOMO', '0000', NULL, '6af79123-6894-41a7-ab54-6782f0b7380f', 'WILLIAM', '0022964979934', 3000.00, 1, '2025-11-28 08:51:46', '2025-11-28 08:51:46', NULL),
('7d32ce3c-b14c-4853-821a-3bed5b54ddf3', 'Flooz', '00228', NULL, 'ef11036f-009b-4220-a2f4-0a545491502f', 'WILLIAM', '0022864979934', 6000.00, 1, '2025-11-28 13:52:23', '2025-11-28 13:52:23', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `payment_methods_old`
--

CREATE TABLE `payment_methods_old` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `bank_id` char(36) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `account_holder_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `min_deposit` decimal(14,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `payment_methods_old`
--

INSERT INTO `payment_methods_old` (`id`, `name`, `code`, `description`, `bank_id`, `is_active`, `created_at`, `updated_at`, `account_holder_name`, `account_number`, `min_deposit`) VALUES
('15ddf68b-21cc-46fa-9bb0-748e8a9f5f9f', 'EULOGE AKOYOKO', '60287', 'jui', NULL, 1, '2025-11-28 08:26:20', '2025-11-28 08:26:20', NULL, NULL, 0.00);

-- --------------------------------------------------------

--
-- Structure de la table `referral_commissions`
--

CREATE TABLE `referral_commissions` (
  `id` char(36) NOT NULL,
  `referrer_id` char(36) NOT NULL,
  `referred_id` char(36) NOT NULL,
  `deposit_id` char(36) NOT NULL,
  `level` int(11) NOT NULL,
  `rate` decimal(5,4) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('pending','paid') DEFAULT 'pending',
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `referral_commissions`
--

INSERT INTO `referral_commissions` (`id`, `referrer_id`, `referred_id`, `deposit_id`, `level`, `rate`, `amount`, `status`, `paid_at`, `created_at`) VALUES
('4f2efa23-3a44-4f82-b61e-e5a221f6648a', '596e019d-cdcc-4b5d-87a6-808cbac06a69', '0d4db5de-3a11-4316-a0b1-06ff15202a1f', 'b8dfbc01-ca44-4a95-ae6f-3a8320897b2c', 0, 0.0000, 1500.00, '', NULL, '2025-11-29 14:28:02'),
('a3c25ca1-bfcb-4bb4-a87f-3293e82d8b9d', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'cc55cabc-9afa-42eb-a80b-934463759f96', 'bab2d984-883f-48d0-903f-0764e53c0356', 0, 0.0000, 3000.00, '', NULL, '2025-11-29 12:33:54');

-- --------------------------------------------------------

--
-- Structure de la table `system_config`
--

CREATE TABLE `system_config` (
  `config_key` varchar(100) NOT NULL,
  `config_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config_value`)),
  `description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `system_config`
--

INSERT INTO `system_config` (`config_key`, `config_value`, `description`, `updated_at`) VALUES
('max_daily_withdrawals', '\"2\"', 'Maximum withdrawals per user per day', '2025-11-21 16:29:29'),
('min_deposit', '\"3000\"', 'Minimum deposit amount', '2025-11-21 16:29:29'),
('min_withdrawal', '\"1000\"', 'Minimum withdrawal amount', '2025-11-21 16:29:29'),
('referral_rates', '{\"level1\": 0.30, \"level2\": 0.03, \"level3\": 0.03}', 'Referral commission rates', '2025-11-21 16:29:29'),
('vip_daily_return', '0.10', 'VIP daily return rate (10%)', '2025-11-21 16:29:29'),
('vip_duration', '90', 'VIP investment duration in days', '2025-11-21 16:29:29'),
('withdrawal_fee_rate', '0.06', 'Withdrawal fee rate (6%)', '2025-11-21 16:29:29');

-- --------------------------------------------------------

--
-- Structure de la table `transactions`
--

CREATE TABLE `transactions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `type` enum('deposit','withdrawal','earning','commission','bonus','vip_purchase') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('pending','approved','rejected','completed') DEFAULT 'completed',
  `description` text DEFAULT NULL,
  `reference_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `type`, `amount`, `status`, `description`, `reference_id`, `created_at`) VALUES
('014b474a-cbfa-4acc-afe4-3e28c95c1c36', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'vip_purchase', 3000.00, 'completed', 'VIP VIP Bronze purchase', 'c6f99650-3523-4eb1-b16a-eae7ff245f27', '2025-11-28 11:28:03'),
('0e559fe1-012d-4978-8f1d-f682d7ab37ea', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'deposit', 10000.00, 'pending', 'Inpay deposit - I1764410519461', 'b2865e56-07fe-4ffe-a0d6-982c7465e09c', '2025-11-29 10:01:59'),
('0fd760f2-ce60-4d44-91bb-a3321646d09e', 'da08ff02-671b-4505-bdca-79e83d5a277f', 'deposit', 5000.00, 'pending', 'Inpay deposit - I1764363692549', '2c4c2065-2be1-48b6-a48d-e00f015edf57', '2025-11-28 21:01:32'),
('1abb4f99-0f28-4c7e-8047-674e6dfec7fb', 'da08ff02-671b-4505-bdca-79e83d5a277f', 'deposit', 5000.00, 'pending', 'Inpay deposit - I1764363714943', '7bc7bf28-0c41-463d-99de-4959252dc49c', '2025-11-28 21:01:55'),
('2353ef39-0457-47a8-94d7-3a05b66d5489', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'commission', 1500.00, 'completed', 'Commission from 0d4db5de-3a11-4316-a0b1-06ff15202a1f\'s first deposit', '4f2efa23-3a44-4f82-b61e-e5a221f6648a', '2025-11-29 14:28:02'),
('24673d99-91e9-4a29-99cf-f73ebb571da4', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'withdrawal', 1000.00, 'pending', 'Withdrawal request - undefined', '46f06282-75f3-43d4-a45a-74d3db6a0f3b', '2025-11-29 09:49:26'),
('2e301fa6-28d6-4d18-80ae-9259f0895c47', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'commission', 3000.00, 'completed', 'Commission from cc55cabc-9afa-42eb-a80b-934463759f96\'s first deposit', 'a3c25ca1-bfcb-4bb4-a87f-3293e82d8b9d', '2025-11-29 12:33:55'),
('44050ba8-9352-4685-9e86-3d56b23f96b2', '0d4db5de-3a11-4316-a0b1-06ff15202a1f', 'withdrawal', 2000.00, 'completed', 'Withdrawal request - Banque du Bénin', '62b21ccd-d6ca-46c4-b10d-e75dc11b072e', '2025-11-29 14:48:20'),
('470a7749-cf8f-4c03-a2bf-b8b08a278411', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'deposit', 10000.00, 'pending', 'Inpay deposit - I1764410663434', 'bc4dd645-1234-4d2f-933b-6c5f493cd001', '2025-11-29 10:04:23'),
('50c34b60-4615-4281-9074-e8816fb832e3', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'deposit', 10000.00, 'pending', 'Inpay deposit - I1764410335962', 'cd157a25-50f5-4afb-a07e-f8475afc5024', '2025-11-29 09:58:56'),
('52fd00ec-cd7c-40ae-88fa-877568ef4895', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'deposit', 10000.00, 'pending', 'Inpay deposit - I1764512969266', 'fd25be3e-ea7a-4588-ade8-8f95055879b7', '2025-11-30 14:29:29'),
('54e688e1-7304-4f17-8260-6725584e620b', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'deposit', 10000.00, 'pending', 'Inpay deposit - I1764410346063', 'b620a6ce-2e62-4eea-a374-d9edd48ece2c', '2025-11-29 09:59:06'),
('5c893681-4b1e-46e2-a7f1-7ead464bf9c8', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'deposit', 10000.00, 'pending', 'Inpay deposit - I1764410523477', 'c5fb50c7-a1fb-49ac-96e7-f46c6b77626b', '2025-11-29 10:02:03'),
('618b91ce-9da0-462f-9789-e37c76374f62', 'bc88d7c6-d7dd-43c5-8957-aa76f351b09b', '', 500.00, 'completed', 'Welcome bonus - Sign up bonus', 'bc88d7c6-d7dd-43c5-8957-aa76f351b09b', '2025-11-30 07:02:41'),
('6207aa92-7f24-4e39-932f-4a9096274d5c', 'cc55cabc-9afa-42eb-a80b-934463759f96', 'withdrawal', 10000.00, 'completed', 'Withdrawal request - Banque de Togo', '851a37cd-f01a-460c-9d54-e4dc433b7fcf', '2025-11-29 12:37:03'),
('75327e72-4fa2-4515-a5ac-5a335b50077d', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'withdrawal', 1000.00, 'pending', 'Withdrawal request - Banque de Togo', '23b3488b-7bf3-4089-87da-2624ea37951f', '2025-11-29 17:31:16'),
('77a1888d-66b2-45df-aa51-35cdb0447faf', '0d4db5de-3a11-4316-a0b1-06ff15202a1f', 'deposit', 5000.00, 'completed', 'Inpay deposit - I1764426461865', 'b8dfbc01-ca44-4a95-ae6f-3a8320897b2c', '2025-11-29 14:27:42'),
('77da16e8-88a9-4866-8b67-58c8d34c8362', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'deposit', 10000.00, 'pending', 'Inpay deposit - I1764410455266', '141db25a-8993-4aef-97cc-429e6c2fdd35', '2025-11-29 10:00:55'),
('81b55628-f80b-4039-8feb-ca162d1c7003', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'deposit', 20000.00, 'pending', 'Inpay deposit - I1764343288515', 'bef60c71-c6a3-49bd-8b57-c347dcedcd90', '2025-11-28 15:21:28'),
('a58b9e53-d4d4-4283-9c8c-80403c78335e', '47717599-5bac-438c-84f4-d93ae795f4c0', 'deposit', 5000.00, 'pending', 'Inpay deposit - I1764364181164', '1725ff56-abd1-4e7e-bfa8-6c5fea10c9ed', '2025-11-28 21:09:41'),
('b7284253-844e-4b99-b000-bf3956a68df0', 'da08ff02-671b-4505-bdca-79e83d5a277f', 'deposit', 5000.00, 'pending', 'Inpay deposit - I1764363677321', 'ff4a7936-9d77-45df-8e2b-f1eb054a4b2e', '2025-11-28 21:01:17'),
('b8f940f2-b026-407d-b10f-cf21f65a30da', '596e019d-cdcc-4b5d-87a6-808cbac06a69', '', 100.00, 'completed', 'Redemption of gift code: GIFT-HJ9CRICSS1', '7c327515-6e51-4095-adbf-934a012ee502', '2025-11-29 15:44:58'),
('b903a24c-8fc9-4d31-8140-ed06b657903e', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'withdrawal', 19000.00, 'completed', 'Withdrawal request - Banque du Bénin', 'a534859e-cdd9-4bcd-8b45-060376030e1c', '2025-11-29 10:15:28'),
('c110b747-32d0-42dd-9463-04534402db96', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'deposit', 10000.00, 'completed', 'Inpay deposit - I1764419236910', 'ce95a9fe-8be8-42e8-8298-8fa5748316cd', '2025-11-29 12:27:17'),
('d95adf67-4e15-4689-b208-7abfdc931ea8', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 'earning', 300.00, 'completed', 'Daily VIP earning - Investment #c6f99650', 'c6f99650-3523-4eb1-b16a-eae7ff245f27', '2025-11-29 11:29:01'),
('dcdcbc3f-b984-4dd9-9b1b-cda0bbeb48da', 'cc55cabc-9afa-42eb-a80b-934463759f96', 'deposit', 10000.00, 'completed', 'Inpay deposit - I1764419603876', 'bab2d984-883f-48d0-903f-0764e53c0356', '2025-11-29 12:33:23'),
('ea3647b4-dcf8-4809-8105-c3a12304b287', '0d4db5de-3a11-4316-a0b1-06ff15202a1f', 'withdrawal', 1000.00, 'pending', 'Withdrawal request - Banque de Togo', '4ef5a6a5-f429-4db7-9970-9f7b3b9f93c6', '2025-11-29 15:48:31');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `country_code` varchar(5) NOT NULL,
  `password_hash` text NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `referral_code` varchar(20) NOT NULL,
  `referred_by` char(36) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_admin` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `phone`, `country_code`, `password_hash`, `full_name`, `referral_code`, `referred_by`, `is_active`, `is_admin`, `created_at`, `updated_at`) VALUES
('0d4db5de-3a11-4316-a0b1-06ff15202a1f', '66301873', 'TG', '$2a$10$mX3YswtqVAavTlwmbX8q4uuIVEMaa40VawjMiombeIGf6/g7t0VIi', 'Hello', 'APUICYY6G6', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 1, 0, '2025-11-29 14:20:20', '2025-11-29 14:20:20'),
('3c4e931c-0316-41e9-b089-0fdd028fad85', '64979935', 'TG', '$2a$10$hAxgAbplolDQxd0EUX2q8eZVMTNkvlvz1xYGDNlwfQzPGwCmdN9n6', 'William', 'APUICQE0MR', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 1, 0, '2025-11-26 13:32:56', '2025-11-26 13:32:56'),
('47717599-5bac-438c-84f4-d93ae795f4c0', '66301876', 'TG', '$2a$10$m5c3p/jWJvLuyqnPVO4gEuokRjb6JjagfCOWAUJwulvBYHq6juQm6', 'ARTHUR', 'APUICH1PA8', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 1, 0, '2025-11-28 21:08:44', '2025-11-28 21:08:44'),
('51ea9a2d-4257-4a1c-b8c2-5c930500259f', '66301878', 'TG', '$2a$10$Pls/b/SHLR0sKuQrIWw6H.zTfhWFuGcRkbwLuDOXuF2iMTOdu3HLa', 'William', 'APUIC0JYSI', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 1, 0, '2025-11-26 14:17:21', '2025-11-26 14:17:21'),
('5756dca9-b2db-415d-b618-dc8938261fc1', '64979934', 'BJ', '$2a$10$2zWXkvHRhMQu8It9hJzK/Osfp0GrHZsR18XscipWwr1YUq77We7SW', 'William1', 'APUICF1RI8', NULL, 1, 1, '2025-11-21 17:51:43', '2025-11-25 22:29:28'),
('596e019d-cdcc-4b5d-87a6-808cbac06a69', '66301879', 'TG', '$2a$10$dxdbHMa0otkEfDL6xOp3KeIvLHbNncVKpn52CQESCq/07D.6BeuiO', 'william', 'APUICB49IQ', NULL, 1, 0, '2025-11-25 14:07:56', '2025-11-25 14:07:56'),
('bc88d7c6-d7dd-43c5-8957-aa76f351b09b', '66301872', 'TG', '$2a$10$26grjkR5qgcTg9.cEZ093ernJcJxOiDjwzYDASHncxZucI8WwiCs.', 'DEV', 'APUICK3ZV6', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 1, 0, '2025-11-30 07:02:41', '2025-11-30 07:02:41'),
('cc55cabc-9afa-42eb-a80b-934463759f96', '66301875', 'TG', '$2a$10$BM969xPP0lbDeDZca3Oju.gE2zKA3j7ptt4SkscszOvaW9Zce2F9O', 'SERTYU', 'APUICR748K', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 1, 0, '2025-11-29 12:32:33', '2025-11-29 12:32:33'),
('da08ff02-671b-4505-bdca-79e83d5a277f', '66301877', 'TG', '$2a$10$/w.0dcGIiqe5bD6FvG8fd./N/LogB6IdUkFc6lnBtgj0SsknqVbeq', 'Willi', 'APUIC2O6MD', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 0, 0, '2025-11-28 20:59:34', '2025-11-28 21:07:16');

--
-- Déclencheurs `users`
--
DELIMITER $$
CREATE TRIGGER `create_wallet_on_user_creation` AFTER INSERT ON `users` FOR EACH ROW BEGIN
  INSERT INTO wallets (id, user_id, balance, total_invested, total_earned, total_withdrawn)
  VALUES (UUID(), NEW.id, 0, 0, 0, 0);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `vip_investments`
--

CREATE TABLE `vip_investments` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `vip_level` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `daily_return_amount` decimal(15,2) NOT NULL,
  `purchase_time` datetime NOT NULL,
  `next_earning_time` datetime NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `days_elapsed` int(11) DEFAULT 0,
  `total_earned` decimal(15,2) DEFAULT 0.00,
  `status` enum('active','completed','cancelled') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vip_investments`
--

INSERT INTO `vip_investments` (`id`, `user_id`, `vip_level`, `amount`, `daily_return_amount`, `purchase_time`, `next_earning_time`, `start_date`, `end_date`, `days_elapsed`, `total_earned`, `status`, `created_at`, `updated_at`) VALUES
('c6f99650-3523-4eb1-b16a-eae7ff245f27', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 1, 3000.00, 300.00, '2025-11-28 11:28:02', '2025-11-30 11:29:00', '2025-11-28 11:28:02', '2026-02-26 11:28:02', 1, 300.00, '', '2025-11-28 11:28:02', '2025-11-30 08:22:42');

-- --------------------------------------------------------

--
-- Structure de la table `vip_products`
--

CREATE TABLE `vip_products` (
  `id` char(36) NOT NULL,
  `level` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `min_amount` decimal(15,2) NOT NULL,
  `daily_return` decimal(5,4) NOT NULL DEFAULT 0.1000,
  `duration` int(11) NOT NULL DEFAULT 90,
  `color` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vip_products`
--

INSERT INTO `vip_products` (`id`, `level`, `name`, `min_amount`, `daily_return`, `duration`, `color`, `is_active`, `created_at`, `updated_at`) VALUES
('e2e9ba76-c6f5-11f0-8765-5820b176c82c', 1, 'VIP Bronze', 3000.00, 0.1000, 90, '#CD7F32', 1, '2025-11-21 16:19:42', '2025-11-21 16:19:42'),
('e2e9c9df-c6f5-11f0-8765-5820b176c82c', 2, 'VIP Silver', 10000.00, 0.1500, 90, '#C0C0C0', 1, '2025-11-21 16:19:42', '2025-11-25 14:28:56'),
('e2ecc4fb-c6f5-11f0-8765-5820b176c82c', 3, 'VIP Gold', 25000.00, 0.1000, 90, '#FFD700', 1, '2025-11-21 16:19:42', '2025-11-21 16:19:42'),
('e2ecc6d9-c6f5-11f0-8765-5820b176c82c', 4, 'VIP Platinum', 50000.00, 0.1000, 90, '#E5E4E2', 1, '2025-11-21 16:19:42', '2025-11-21 16:19:42'),
('e2ecc7f2-c6f5-11f0-8765-5820b176c82c', 5, 'VIP Diamond', 100000.00, 0.1000, 90, '#B9F2FF', 1, '2025-11-21 16:19:42', '2025-11-21 16:19:42'),
('e2ecc970-c6f5-11f0-8765-5820b176c82c', 6, 'VIP Elite', 250000.00, 0.1000, 90, '#800080', 1, '2025-11-21 16:19:42', '2025-11-21 16:19:42'),
('e2eccb25-c6f5-11f0-8765-5820b176c82c', 7, 'VIP Master', 500000.00, 0.1000, 90, '#FF1493', 1, '2025-11-21 16:19:42', '2025-11-21 16:19:42'),
('e2eccc5d-c6f5-11f0-8765-5820b176c82c', 8, 'VIP Legend', 1000000.00, 0.1000, 90, '#FF4500', 1, '2025-11-21 16:19:42', '2025-11-21 16:19:42'),
('e2eccddb-c6f5-11f0-8765-5820b176c82c', 9, 'VIP Supreme', 2000000.00, 0.1000, 90, '#8B0000', 1, '2025-11-21 16:19:42', '2025-11-21 16:19:42'),
('e2eccfde-c6f5-11f0-8765-5820b176c82c', 10, 'VIP Ultimate', 5000000.00, 0.1000, 90, '#000000', 1, '2025-11-21 16:19:42', '2025-11-21 16:19:42');

-- --------------------------------------------------------

--
-- Structure de la table `wallets`
--

CREATE TABLE `wallets` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `balance` decimal(15,2) DEFAULT 0.00,
  `total_invested` decimal(15,2) DEFAULT 0.00,
  `total_earned` decimal(15,2) DEFAULT 0.00,
  `total_withdrawn` decimal(15,2) DEFAULT 0.00,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `wallets`
--

INSERT INTO `wallets` (`id`, `user_id`, `balance`, `total_invested`, `total_earned`, `total_withdrawn`, `updated_at`) VALUES
('246728ca-ca08-11f0-9182-5820b176c82c', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 14900.00, 3000.00, 300.00, 21000.00, '2025-11-29 17:31:15'),
('24d82fd0-cc9d-11f0-a82e-5820b176c82c', 'da08ff02-671b-4505-bdca-79e83d5a277f', 5000.00, 0.00, 0.00, 0.00, '2025-11-28 21:05:15'),
('6b09193a-cacc-11f0-90e6-5820b176c82c', '3c4e931c-0316-41e9-b089-0fdd028fad85', 0.00, 0.00, 0.00, 0.00, '2025-11-26 13:32:56'),
('6c6998ff-cc9e-11f0-a82e-5820b176c82c', '47717599-5bac-438c-84f4-d93ae795f4c0', 5000.00, 0.00, 0.00, 0.00, '2025-11-28 21:09:54'),
('85e8bfb6-cd1f-11f0-a82e-5820b176c82c', 'cc55cabc-9afa-42eb-a80b-934463759f96', 0.00, 0.00, 0.00, 10000.00, '2025-11-29 12:37:03'),
('903b658a-cdba-11f0-ab1d-5820b176c82c', 'bc88d7c6-d7dd-43c5-8957-aa76f351b09b', 500.00, 0.00, 0.00, 0.00, '2025-11-30 07:02:41'),
('9478124a-cd2e-11f0-a82e-5820b176c82c', '0d4db5de-3a11-4316-a0b1-06ff15202a1f', 2000.00, 0.00, 0.00, 3000.00, '2025-11-29 15:48:30'),
('9f768208-cad2-11f0-90e6-5820b176c82c', '51ea9a2d-4257-4a1c-b8c2-5c930500259f', 0.00, 0.00, 0.00, 0.00, '2025-11-26 14:17:21'),
('be20e916-c702-11f0-8765-5820b176c82c', '5756dca9-b2db-415d-b618-dc8938261fc1', 0.00, 0.00, 0.00, 0.00, '2025-11-21 17:51:43');

-- --------------------------------------------------------

--
-- Structure de la table `welcome_bonus_credits`
--

CREATE TABLE `welcome_bonus_credits` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 500.00,
  `credited_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `welcome_bonus_credits`
--

INSERT INTO `welcome_bonus_credits` (`id`, `user_id`, `amount`, `credited_at`) VALUES
('76b53105-135c-4b81-9e39-327423efb9dd', 'bc88d7c6-d7dd-43c5-8957-aa76f351b09b', 500.00, '2025-11-30 07:02:41');

-- --------------------------------------------------------

--
-- Structure de la table `withdrawals`
--

CREATE TABLE `withdrawals` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `fees` decimal(15,2) NOT NULL DEFAULT 0.00,
  `net_amount` decimal(15,2) NOT NULL,
  `bank_id` char(36) DEFAULT NULL,
  `bank_name` varchar(255) NOT NULL,
  `account_number` varchar(100) NOT NULL,
  `account_holder_name` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected','completed') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `processed_by` char(36) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_method_id` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `withdrawals`
--

INSERT INTO `withdrawals` (`id`, `user_id`, `amount`, `fees`, `net_amount`, `bank_id`, `bank_name`, `account_number`, `account_holder_name`, `status`, `admin_notes`, `processed_by`, `processed_at`, `created_at`, `updated_at`, `payment_method_id`) VALUES
('23b3488b-7bf3-4089-87da-2624ea37951f', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 1000.00, 60.00, 940.00, 'ef11036f-009b-4220-a2f4-0a545491502f', 'Banque de Togo', '45678', 'RTYUI', 'pending', NULL, NULL, NULL, '2025-11-29 17:31:15', '2025-11-29 17:31:15', '7d32ce3c-b14c-4853-821a-3bed5b54ddf3'),
('46f06282-75f3-43d4-a45a-74d3db6a0f3b', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 1000.00, 60.00, 940.00, 'ef11036f-009b-4220-a2f4-0a545491502f', 'Banque de Togo', '456677', 'RTYU', 'rejected', NULL, NULL, NULL, '2025-11-29 09:49:26', '2025-11-29 14:18:51', '7d32ce3c-b14c-4853-821a-3bed5b54ddf3'),
('4ef5a6a5-f429-4db7-9970-9f7b3b9f93c6', '0d4db5de-3a11-4316-a0b1-06ff15202a1f', 1000.00, 60.00, 940.00, 'ef11036f-009b-4220-a2f4-0a545491502f', 'Banque de Togo', '4567889', 'RTTY', 'pending', NULL, NULL, NULL, '2025-11-29 15:48:30', '2025-11-29 15:48:30', '7d32ce3c-b14c-4853-821a-3bed5b54ddf3'),
('62b21ccd-d6ca-46c4-b10d-e75dc11b072e', '0d4db5de-3a11-4316-a0b1-06ff15202a1f', 2000.00, 120.00, 1880.00, '6af79123-6894-41a7-ab54-6782f0b7380f', 'Banque du Bénin', '45678909', 'WILL', 'completed', NULL, '5756dca9-b2db-415d-b618-dc8938261fc1', '2025-11-29 15:49:12', '2025-11-29 14:48:19', '2025-11-29 14:49:12', '077bbdc2-7328-4a58-876c-0d99f4f4a75e'),
('851a37cd-f01a-460c-9d54-e4dc433b7fcf', 'cc55cabc-9afa-42eb-a80b-934463759f96', 10000.00, 600.00, 9400.00, 'ef11036f-009b-4220-a2f4-0a545491502f', 'Banque de Togo', '56789087', 'RTYUI', 'completed', NULL, '5756dca9-b2db-415d-b618-dc8938261fc1', '2025-11-29 15:07:03', '2025-11-29 12:37:02', '2025-11-29 14:07:03', '7d32ce3c-b14c-4853-821a-3bed5b54ddf3'),
('a534859e-cdd9-4bcd-8b45-060376030e1c', '596e019d-cdcc-4b5d-87a6-808cbac06a69', 19000.00, 1140.00, 17860.00, '6af79123-6894-41a7-ab54-6782f0b7380f', 'Banque du Bénin', '5677889990', 'RTYUU', 'completed', NULL, '5756dca9-b2db-415d-b618-dc8938261fc1', '2025-11-29 11:16:32', '2025-11-29 10:15:27', '2025-11-29 10:16:32', '077bbdc2-7328-4a58-876c-0d99f4f4a75e');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_activity_logs_user_id` (`user_id`),
  ADD KEY `idx_activity_logs_admin_id` (`admin_id`),
  ADD KEY `idx_activity_logs_created_at` (`created_at`);

--
-- Index pour la table `admin_deposit_approvals`
--
ALTER TABLE `admin_deposit_approvals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `deposit_id` (`deposit_id`),
  ADD KEY `idx_admin_deposits_status` (`status`),
  ADD KEY `idx_admin_deposits_user` (`user_id`),
  ADD KEY `idx_admin_deposits_created` (`created_at`);

--
-- Index pour la table `admin_withdrawal_approvals`
--
ALTER TABLE `admin_withdrawal_approvals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `withdrawal_id` (`withdrawal_id`),
  ADD KEY `idx_admin_withdrawals_status` (`status`),
  ADD KEY `idx_admin_withdrawals_user` (`user_id`),
  ADD KEY `idx_admin_withdrawals_created` (`created_at`);

--
-- Index pour la table `banks`
--
ALTER TABLE `banks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_banks_active` (`is_active`);

--
-- Index pour la table `daily_earnings`
--
ALTER TABLE `daily_earnings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_investment_date` (`investment_id`,`earning_date`),
  ADD KEY `idx_daily_earnings_user_id` (`user_id`),
  ADD KEY `idx_daily_earnings_investment_id` (`investment_id`),
  ADD KEY `idx_daily_earnings_date` (`earning_date`);

--
-- Index pour la table `deposits`
--
ALTER TABLE `deposits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `processed_by` (`processed_by`),
  ADD KEY `idx_deposits_user_id` (`user_id`),
  ADD KEY `idx_deposits_status` (`status`),
  ADD KEY `idx_deposits_created_at` (`created_at`);

--
-- Index pour la table `gift_codes`
--
ALTER TABLE `gift_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_gift_codes_code` (`code`),
  ADD KEY `idx_gift_codes_redeemed_by` (`redeemed_by`),
  ADD KEY `idx_gift_codes_is_active` (`is_active`),
  ADD KEY `idx_gift_codes_created_by` (`created_by`),
  ADD KEY `idx_gift_codes_created_at` (`created_at`);

--
-- Index pour la table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_payment_methods_new_is_active` (`is_active`),
  ADD KEY `idx_payment_methods_new_bank_id` (`bank_id`);

--
-- Index pour la table `payment_methods_old`
--
ALTER TABLE `payment_methods_old`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_payment_methods_is_active` (`is_active`),
  ADD KEY `idx_payment_methods_bank_id` (`bank_id`);

--
-- Index pour la table `referral_commissions`
--
ALTER TABLE `referral_commissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_referral_commissions_referrer` (`referrer_id`),
  ADD KEY `idx_referral_commissions_referred` (`referred_id`),
  ADD KEY `idx_referral_commissions_deposit` (`deposit_id`);

--
-- Index pour la table `system_config`
--
ALTER TABLE `system_config`
  ADD PRIMARY KEY (`config_key`);

--
-- Index pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transactions_user_id` (`user_id`),
  ADD KEY `idx_transactions_type` (`type`),
  ADD KEY `idx_transactions_created_at` (`created_at`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD UNIQUE KEY `referral_code` (`referral_code`),
  ADD KEY `idx_users_phone` (`phone`),
  ADD KEY `idx_users_referral_code` (`referral_code`),
  ADD KEY `idx_users_referred_by` (`referred_by`);

--
-- Index pour la table `vip_investments`
--
ALTER TABLE `vip_investments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vip_level` (`vip_level`),
  ADD KEY `idx_vip_investments_user_id` (`user_id`),
  ADD KEY `idx_vip_investments_status` (`status`),
  ADD KEY `idx_vip_investments_next_earning` (`next_earning_time`);

--
-- Index pour la table `vip_products`
--
ALTER TABLE `vip_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `level` (`level`),
  ADD KEY `idx_vip_products_level` (`level`);

--
-- Index pour la table `wallets`
--
ALTER TABLE `wallets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_wallets_user_id` (`user_id`);

--
-- Index pour la table `welcome_bonus_credits`
--
ALTER TABLE `welcome_bonus_credits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_welcome_bonus_user_id` (`user_id`);

--
-- Index pour la table `withdrawals`
--
ALTER TABLE `withdrawals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bank_id` (`bank_id`),
  ADD KEY `processed_by` (`processed_by`),
  ADD KEY `idx_withdrawals_user_id` (`user_id`),
  ADD KEY `idx_withdrawals_status` (`status`),
  ADD KEY `idx_withdrawals_created_at` (`created_at`),
  ADD KEY `idx_withdrawals_user_date` (`user_id`,`created_at`);

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `activity_logs_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `admin_deposit_approvals`
--
ALTER TABLE `admin_deposit_approvals`
  ADD CONSTRAINT `admin_deposit_approvals_ibfk_1` FOREIGN KEY (`deposit_id`) REFERENCES `deposits` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_deposit_approvals_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `admin_withdrawal_approvals`
--
ALTER TABLE `admin_withdrawal_approvals`
  ADD CONSTRAINT `admin_withdrawal_approvals_ibfk_1` FOREIGN KEY (`withdrawal_id`) REFERENCES `withdrawals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_withdrawal_approvals_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `daily_earnings`
--
ALTER TABLE `daily_earnings`
  ADD CONSTRAINT `daily_earnings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `daily_earnings_ibfk_2` FOREIGN KEY (`investment_id`) REFERENCES `vip_investments` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `deposits`
--
ALTER TABLE `deposits`
  ADD CONSTRAINT `deposits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `deposits_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `gift_codes`
--
ALTER TABLE `gift_codes`
  ADD CONSTRAINT `gift_codes_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `gift_codes_ibfk_2` FOREIGN KEY (`redeemed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD CONSTRAINT `fk_payment_methods_new_bank` FOREIGN KEY (`bank_id`) REFERENCES `banks` (`id`);

--
-- Contraintes pour la table `payment_methods_old`
--
ALTER TABLE `payment_methods_old`
  ADD CONSTRAINT `fk_payment_methods_bank` FOREIGN KEY (`bank_id`) REFERENCES `banks` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `referral_commissions`
--
ALTER TABLE `referral_commissions`
  ADD CONSTRAINT `referral_commissions_ibfk_1` FOREIGN KEY (`referrer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `referral_commissions_ibfk_2` FOREIGN KEY (`referred_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `referral_commissions_ibfk_3` FOREIGN KEY (`deposit_id`) REFERENCES `deposits` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`referred_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `vip_investments`
--
ALTER TABLE `vip_investments`
  ADD CONSTRAINT `vip_investments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vip_investments_ibfk_2` FOREIGN KEY (`vip_level`) REFERENCES `vip_products` (`level`);

--
-- Contraintes pour la table `wallets`
--
ALTER TABLE `wallets`
  ADD CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `welcome_bonus_credits`
--
ALTER TABLE `welcome_bonus_credits`
  ADD CONSTRAINT `fk_welcome_bonus_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `withdrawals`
--
ALTER TABLE `withdrawals`
  ADD CONSTRAINT `withdrawals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `withdrawals_ibfk_2` FOREIGN KEY (`bank_id`) REFERENCES `banks` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `withdrawals_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
