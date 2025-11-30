-- Create admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id VARCHAR(36) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  user_name VARCHAR(255),
  deposit_id VARCHAR(36),
  transaction_id VARCHAR(36),
  payment_method VARCHAR(100),
  customer_mobile VARCHAR(20),
  amount DECIMAL(15, 2),
  message TEXT,
  status VARCHAR(50) DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
