import { query, execute } from '../config/database';
import { WalletService } from './wallet.service';

const walletService = new WalletService();

interface DashboardStats {
  totalUsers: number;
  totalDeposits: number;
  pendingDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalInvestments: number;
  activeInvestments: number;
  totalCommissions: number;
}

interface UserManagementData {
  id: string;
  phone: string;
  full_name?: string;
  country_code: string;
  balance: number;
  total_invested: number;
  total_earned: number;
  is_active: boolean;
  referral_code: string;
  created_at: string;
  deposit_count: number;
  withdrawal_count: number;
  total_deposits: number;
  total_withdrawals: number;
}

export class AdminService {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    const totalUsersResult = await query<{count: number}>(
      'SELECT COUNT(*) as count FROM users WHERE is_admin = FALSE'
    );
    const totalUsers = totalUsersResult[0]?.count || 0;

    const deposits = await query<{amount: number; status: string}>(
      'SELECT amount, status FROM deposits'
    );
    const totalDeposits = deposits?.reduce((sum: number, d: any) => sum + parseFloat(d.amount.toString()), 0) || 0;
    const pendingDeposits = deposits?.filter((d: any) => d.status === 'pending').length || 0;

    const withdrawals = await query<{amount: number; status: string}>(
      'SELECT amount, status FROM withdrawals'
    );
    const totalWithdrawals = withdrawals?.reduce((sum: number, w: any) => sum + parseFloat(w.amount.toString()), 0) || 0;
    const pendingWithdrawals = withdrawals?.filter((w: any) => w.status === 'pending').length || 0;

    const investments = await query<{amount: number; status: string}>(
      'SELECT amount, status FROM vip_investments'
    );
    const totalInvestments = investments?.reduce((sum: number, i: any) => sum + parseFloat(i.amount.toString()), 0) || 0;
    const activeInvestments = investments?.filter((i: any) => i.status === 'active').length || 0;

    const commissions = await query<{amount: number}>(
      "SELECT amount FROM referral_commissions WHERE status = 'paid'"
    );
    const totalCommissions = commissions?.reduce((sum: number, c: any) => sum + parseFloat(c.amount.toString()), 0) || 0;

    return {
      totalUsers,
      totalDeposits,
      pendingDeposits,
      totalWithdrawals,
      pendingWithdrawals,
      totalInvestments,
      activeInvestments,
      totalCommissions
    };
  }

  /**
   * Get detailed user information
   */
  static async getUserDetails(userId: string): Promise<UserManagementData | null> {
    const users = await query<UserManagementData>(
      `SELECT u.id, u.phone, u.full_name, u.country_code, u.referral_code, u.is_active, u.created_at,
              w.balance, w.total_invested, w.total_earned,
              (SELECT COUNT(*) FROM deposits WHERE user_id = u.id) as deposit_count,
              (SELECT COUNT(*) FROM withdrawals WHERE user_id = u.id) as withdrawal_count,
              (SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE user_id = u.id AND status = 'approved') as total_deposits,
              (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE user_id = u.id AND status = 'approved') as total_withdrawals
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.id = ?`,
      [userId]
    );

    return users?.[0] || null;
  }

  /**
   * Get all deposits for a specific user
   */
  static async getUserDeposits(userId: string) {
    return query(
      `SELECT d.* FROM deposits d WHERE d.user_id = ? ORDER BY d.created_at DESC`,
      [userId]
    );
  }

  /**
   * Get all withdrawals for a specific user
   */
  static async getUserWithdrawals(userId: string) {
    return query(
      `SELECT w.* FROM withdrawals w WHERE w.user_id = ? ORDER BY w.created_at DESC`,
      [userId]
    );
  }

  /**
   * Ban/Unban a user account
   */
  static async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    await execute(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [isActive, userId]
    );
  }

  /**
   * Reset user balance (careful with this!)
   */
  static async resetUserBalance(userId: string, newBalance: number = 0): Promise<void> {
    await execute(
      'UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [newBalance, userId]
    );
  }

  /**
   * Manually add funds to user wallet
   */
  static async addUserBalance(userId: string, amount: number, reason: string, adminId: string | null = null): Promise<void> {
    // Use WalletService to update balance (checks and consistency)
    await walletService.updateBalance(userId, amount, 'add');

    // Create a transaction record for traceability
    try {
      await walletService.addTransaction(userId, 'manual_credit', amount, `Admin manual credit - ${reason}`);
    } catch (err) {
      // non-fatal: log but continue to record admin action
      console.error('Failed to create manual credit transaction', err);
    }

    // Log the action with admin id if provided
    await this.logAdminAction(adminId, userId, 'manual_credit', `Added ${amount} - Reason: ${reason}`);
  }

  /**
   * Manually deduct funds from user wallet
   */
  static async deductUserBalance(userId: string, amount: number, reason: string, adminId: string | null = null): Promise<void> {
    // Use WalletService to update balance (will throw if insufficient)
    await walletService.updateBalance(userId, amount, 'subtract');

    // Create a transaction record for traceability
    try {
      await walletService.addTransaction(userId, 'manual_debit', amount, `Admin manual debit - ${reason}`);
    } catch (err) {
      console.error('Failed to create manual debit transaction', err);
    }

    // Log the action with admin id if provided
    await this.logAdminAction(adminId, userId, 'manual_debit', `Deducted ${amount} - Reason: ${reason}`);
  }

  /**
   * Get revenue statistics for date range
   */
  static async getRevenueStats(startDate?: string, endDate?: string) {
    let sql = 'SELECT SUM(amount) as total, COUNT(*) as count, status FROM deposits WHERE 1=1';
    const params: any[] = [];

    if (startDate) {
      sql += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND created_at <= ?';
      params.push(endDate);
    }

    sql += ' GROUP BY status';

    return query(sql, params);
  }

  /**
   * Get top users by investment
   */
  static async getTopUsers(limit: number = 10) {
    return query(
      `SELECT u.id, u.phone, u.full_name, u.country_code, u.created_at,
              w.balance, w.total_invested, w.total_earned
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.is_admin = FALSE
       ORDER BY w.total_invested DESC
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Get active users (logged in last 7 days)
   */
  static async getActiveUsers(daysAgo: number = 7) {
    return query(
      `SELECT COUNT(*) as count FROM users 
       WHERE is_admin = FALSE 
       AND last_login >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysAgo]
    );
  }

  /**
   * Log admin action
   */
  static async logAdminAction(
    adminId: string | null,
    userId: string | null,
    action: string,
    details?: string
  ): Promise<void> {
    const { generateUUID } = await import('../utils/uuid');
    const logId = generateUUID();

    if (typeof details !== 'undefined' && details !== null) {
      // Insert details as a JSON object with a 'message' field to ensure valid JSON
      await execute(
        `INSERT INTO activity_logs (id, admin_id, user_id, action, details, created_at)
         VALUES (?, ?, ?, ?, JSON_OBJECT('message', ?), CURRENT_TIMESTAMP)`,
        [logId, adminId, userId, action, details]
      );
    } else {
      await execute(
        `INSERT INTO activity_logs (id, admin_id, user_id, action, details, created_at)
         VALUES (?, ?, ?, ?, NULL, CURRENT_TIMESTAMP)`,
        [logId, adminId, userId, action]
      );
    }
  }

  /**
   * Get suspicious activity (multiple rejections, etc.)
   */
  static async getSuspiciousActivity() {
    return query(
      `SELECT u.id, u.phone, u.full_name,
              (SELECT COUNT(*) FROM deposits WHERE user_id = u.id AND status = 'rejected') as rejected_deposits,
              (SELECT COUNT(*) FROM withdrawals WHERE user_id = u.id AND status = 'rejected') as rejected_withdrawals
       FROM users u
       WHERE u.is_admin = FALSE
       HAVING rejected_deposits > 3 OR rejected_withdrawals > 3`
    );
  }

  /**
   * System health check
   */
  static async getSystemHealth() {
    const dbStatus = await this.checkDatabaseConnection();
    const stats = await this.getDashboardStats();

    return {
      database: dbStatus,
      stats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check database connection
   */
  private static async checkDatabaseConnection(): Promise<boolean> {
    try {
      const result = await query<{count: number}>(
        'SELECT COUNT(*) as count FROM users LIMIT 1'
      );
      return !!result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Export data for reporting
   */
  static async exportUserData(filters?: {startDate?: string; endDate?: string; status?: string}) {
    let sql = `SELECT u.id, u.phone, u.full_name, u.country_code, u.is_active, u.created_at,
              w.balance, w.total_invested, w.total_earned
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.is_admin = FALSE`;
    const params: any[] = [];

    if (filters?.startDate) {
      sql += ' AND u.created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      sql += ' AND u.created_at <= ?';
      params.push(filters.endDate);
    }

    if (filters?.status) {
      sql += ' AND u.is_active = ?';
      params.push(filters.status === 'active' ? 1 : 0);
    }

    return query(sql, params);
  }
}
