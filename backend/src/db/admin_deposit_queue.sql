-- Table pour tracker les dépôts en attente d'approbation admin
CREATE TABLE IF NOT EXISTS admin_deposit_approvals (
  id CHAR(36) PRIMARY KEY,
  deposit_id CHAR(36) NOT NULL UNIQUE,
  user_id CHAR(36) NOT NULL,
  user_name VARCHAR(255),
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(100),
  customer_mobile VARCHAR(20),
  transfer_id VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',
  approved_by VARCHAR(36),
  -- Use DATETIME NULL DEFAULT NULL to avoid invalid default timestamp errors (MySQL strict modes)
  approved_at DATETIME NULL DEFAULT NULL,
  rejected_at DATETIME NULL DEFAULT NULL,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_admin_deposits_status ON admin_deposit_approvals(status);
CREATE INDEX IF NOT EXISTS idx_admin_deposits_user ON admin_deposit_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_deposits_created ON admin_deposit_approvals(created_at);
