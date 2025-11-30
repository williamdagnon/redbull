-- ============================================
-- APUIC CAPITAL - Database Schema (MySQL)
-- ============================================

-- ============================================
-- IMPORTANT: Run these commands first in MySQL
-- ============================================
-- CREATE DATABASE IF NOT EXISTS apuic_capital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE apuic_capital;
-- ============================================

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  country_code VARCHAR(5) NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_by CHAR(36),
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_users_phone (phone),
  INDEX idx_users_referral_code (referral_code),
  INDEX idx_users_referred_by (referred_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- WALLETS
-- ============================================

CREATE TABLE IF NOT EXISTS wallets (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) UNIQUE NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0,
  total_invested DECIMAL(15, 2) DEFAULT 0,
  total_earned DECIMAL(15, 2) DEFAULT 0,
  total_withdrawn DECIMAL(15, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_wallets_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VIP PRODUCTS
-- ============================================

CREATE TABLE IF NOT EXISTS vip_products (
  id CHAR(36) PRIMARY KEY,
  level INT UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  min_amount DECIMAL(15, 2) NOT NULL,
  daily_return DECIMAL(5, 4) NOT NULL DEFAULT 0.10,
  duration INT NOT NULL DEFAULT 90,
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vip_products_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VIP products seeded via application or admin API (no defaults)

-- ============================================
-- VIP INVESTMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS vip_investments (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  vip_level INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  daily_return_amount DECIMAL(15, 2) NOT NULL,
  purchase_time DATETIME NOT NULL,
  next_earning_time DATETIME NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  days_elapsed INT DEFAULT 0,
  total_earned DECIMAL(15, 2) DEFAULT 0,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vip_level) REFERENCES vip_products(level),
  INDEX idx_vip_investments_user_id (user_id),
  INDEX idx_vip_investments_status (status),
  INDEX idx_vip_investments_next_earning (next_earning_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DAILY EARNINGS (VIP)
-- ============================================

CREATE TABLE IF NOT EXISTS daily_earnings (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  investment_id CHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  earning_date DATE NOT NULL,
  earning_time DATETIME NOT NULL,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_investment_date (investment_id, earning_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (investment_id) REFERENCES vip_investments(id) ON DELETE CASCADE,
  INDEX idx_daily_earnings_user_id (user_id),
  INDEX idx_daily_earnings_investment_id (investment_id),
  INDEX idx_daily_earnings_date (earning_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BANKS (Managed by Admin)
-- ============================================

CREATE TABLE IF NOT EXISTS banks (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  country_code VARCHAR(5),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_banks_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Banks managed via admin API (no defaults)

-- ============================================
-- DEPOSITS
-- ============================================

CREATE TABLE IF NOT EXISTS deposits (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(255),
  transfer_id VARCHAR(255),
  receipt_url TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  admin_notes TEXT,
  is_first_deposit BOOLEAN DEFAULT FALSE,
  processed_by CHAR(36),
  processed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_deposits_user_id (user_id),
  INDEX idx_deposits_status (status),
  INDEX idx_deposits_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- WITHDRAWALS
-- ============================================

CREATE TABLE IF NOT EXISTS withdrawals (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  fees DECIMAL(15, 2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(15, 2) NOT NULL,
  bank_id CHAR(36),
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  admin_notes TEXT,
  processed_by CHAR(36),
  processed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_withdrawals_user_id (user_id),
  INDEX idx_withdrawals_status (status),
  INDEX idx_withdrawals_created_at (created_at),
  INDEX idx_withdrawals_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REFERRAL COMMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS referral_commissions (
  id CHAR(36) PRIMARY KEY,
  referrer_id CHAR(36) NOT NULL,
  referred_id CHAR(36) NOT NULL,
  deposit_id CHAR(36) NOT NULL,
  level INT NOT NULL,
  rate DECIMAL(5, 4) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status ENUM('pending', 'paid') DEFAULT 'pending',
  paid_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE CASCADE,
  INDEX idx_referral_commissions_referrer (referrer_id),
  INDEX idx_referral_commissions_referred (referred_id),
  INDEX idx_referral_commissions_deposit (deposit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRANSACTIONS (General)
-- ============================================

CREATE TABLE IF NOT EXISTS transactions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type ENUM('deposit', 'withdrawal', 'earning', 'commission', 'bonus', 'vip_purchase') NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'completed',
  description TEXT,
  reference_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_transactions_user_id (user_id),
  INDEX idx_transactions_type (type),
  INDEX idx_transactions_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ACTIVITY LOGS (Admin)
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  admin_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id CHAR(36),
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activity_logs_user_id (user_id),
  INDEX idx_activity_logs_admin_id (admin_id),
  INDEX idx_activity_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SYSTEM CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS system_config (
  config_key VARCHAR(100) PRIMARY KEY,
  config_value JSON NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System config hardcoded in application

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create wallet for new user
DROP TRIGGER IF EXISTS create_wallet_on_user_creation;

DELIMITER //
CREATE TRIGGER create_wallet_on_user_creation
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO wallets (id, user_id, balance, total_invested, total_earned, total_withdrawn)
  VALUES (UUID(), NEW.id, 0, 0, 0, 0);
END//
DELIMITER ;

-- ============================================
-- GIFT CODES & WELCOME BONUS
-- ============================================

-- Table for gift codes generated by admin
CREATE TABLE IF NOT EXISTS gift_codes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  amount DECIMAL(15, 2) NOT NULL,
  created_by CHAR(36) NOT NULL,
  redeemed_by CHAR(36) NULL,
  is_active BOOLEAN DEFAULT 1,
  redeemed_at TIMESTAMP NULL,
  expires_in_minutes INT DEFAULT 30 COMMENT 'Code expires this many minutes after creation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_gift_codes_code (code),
  KEY idx_gift_codes_redeemed_by (redeemed_by),
  KEY idx_gift_codes_is_active (is_active),
  KEY idx_gift_codes_created_by (created_by),
  KEY idx_gift_codes_created_at (created_at),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (redeemed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for welcome bonus tracking (optional, for auditing)
CREATE TABLE IF NOT EXISTS welcome_bonus_credits (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 500,
  credited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_welcome_bonus_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
