-- Table pour tracker les retraits en attente d'approbation admin
CREATE TABLE IF NOT EXISTS admin_withdrawal_approvals (
  id CHAR(36) PRIMARY KEY,
  withdrawal_id CHAR(36) NOT NULL UNIQUE,
  user_id CHAR(36) NOT NULL,
  user_name VARCHAR(255),
  amount DECIMAL(15,2) NOT NULL,
  payment_method_id CHAR(36),
  bank_id CHAR(36),
  bank_name VARCHAR(255),
  account_number VARCHAR(100),
  account_holder_name VARCHAR(255),
  country VARCHAR(8),
  status VARCHAR(50) DEFAULT 'pending',
  approved_by CHAR(36),
  approved_at DATETIME NULL DEFAULT NULL,
  rejected_at DATETIME NULL DEFAULT NULL,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (withdrawal_id) REFERENCES withdrawals(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_admin_withdrawals_status ON admin_withdrawal_approvals(status);
CREATE INDEX IF NOT EXISTS idx_admin_withdrawals_user ON admin_withdrawal_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_withdrawals_created ON admin_withdrawal_approvals(created_at);
