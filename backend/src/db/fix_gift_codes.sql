-- ============================================
-- FIX GIFT CODES TABLES - Foreign Key Issue
-- ============================================

-- Drop existing tables if they exist (with cascade)
DROP TABLE IF EXISTS welcome_bonus_credits;
DROP TABLE IF EXISTS gift_codes;

-- Recreate gift_codes table with simpler definition
CREATE TABLE gift_codes (
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

-- Recreate welcome_bonus_credits table with simpler definition
CREATE TABLE welcome_bonus_credits (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 500,
  credited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_welcome_bonus_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables created
SELECT 'Gift codes tables created successfully' AS status;
SHOW TABLES LIKE 'gift%';
SHOW TABLES LIKE 'welcome%';
