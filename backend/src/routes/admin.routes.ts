import { Router } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { query, execute, queryOne } from '../config/database';
import { AdminService } from '../services/admin.service';
import { CommissionService } from '../services/commission.service';
import { WithdrawalService } from '../services/withdrawal.service';
import { ApiResponse } from '../types';
import { hashPassword } from '../utils/helpers';
import { generateUUID } from '../utils/uuid';

const router = Router();
const withdrawalService = new WithdrawalService();

// ==================== STATS ====================
router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Get total users
    const totalUsersResult = await query<{count: number}>(
      'SELECT COUNT(*) as count FROM users WHERE is_admin = FALSE'
    );
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Get total deposits
    const deposits = await query<{amount: number; status: string}>(
      'SELECT amount, status FROM deposits'
    );

    const totalDeposits = deposits?.reduce((sum: number, d: any) => sum + parseFloat(d.amount.toString()), 0) || 0;
    const pendingDeposits = deposits?.filter((d: any) => d.status === 'pending').length || 0;

    // Get total withdrawals
    const withdrawals = await query<{amount: number; status: string}>(
      'SELECT amount, status FROM withdrawals'
    );

    const totalWithdrawals = withdrawals?.reduce((sum: number, w: any) => sum + parseFloat(w.amount.toString()), 0) || 0;
    const pendingWithdrawals = withdrawals?.filter((w: any) => w.status === 'pending').length || 0;

    // Get total VIP investments
    const investments = await query<{amount: number; status: string}>(
      'SELECT amount, status FROM vip_investments'
    );

    const totalInvestments = investments?.reduce((sum: number, i: any) => sum + parseFloat(i.amount.toString()), 0) || 0;
    const activeInvestments = investments?.filter((i: any) => i.status === 'active').length || 0;

    // Get total commissions paid
    const commissions = await query<{amount: number}>(
      "SELECT amount FROM referral_commissions WHERE status = 'paid'"
    );

    const totalCommissions = commissions?.reduce((sum: number, c: any) => sum + parseFloat(c.amount.toString()), 0) || 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDeposits,
        pendingDeposits,
        totalWithdrawals,
        pendingWithdrawals,
        totalInvestments,
        activeInvestments,
        totalCommissions
      }
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// ==================== USERS ====================
// Get all users
router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const users = await query<any>(
      `SELECT u.id, u.phone, u.country_code, u.full_name, u.referral_code, u.is_active, u.created_at,
              w.balance, w.total_invested, w.total_earned
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.is_admin = FALSE
       ORDER BY u.created_at DESC
       LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      data: users || []
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Toggle user status (ban/unban)
router.post('/users/:userId/toggle-status', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'is_active must be a boolean'
      } as ApiResponse);
    }

    await execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, userId]
    );

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'}`
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Adjust user balance (admin manual credit/debit)
router.post('/users/:userId/adjust-balance', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { amount, type, reason } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, error: 'amount must be a positive number' } as ApiResponse);
    }

    if (!type || (type !== 'credit' && type !== 'debit')) {
      return res.status(400).json({ success: false, error: "type must be 'credit' or 'debit'" } as ApiResponse);
    }

    const adminId = req.user?.id || null;

    if (type === 'credit') {
      await AdminService.addUserBalance(userId, amount, reason || 'Admin adjustment', adminId);
    } else {
      // deduct
      await AdminService.deductUserBalance(userId, amount, reason || 'Admin adjustment', adminId);
    }

    res.json({ success: true, message: 'Balance adjusted' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
});

// Create user (admin)
router.post('/users', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { phone, password, full_name, country_code, is_active, is_admin } = req.body;
    if (!phone || !password || !country_code) {
      return res.status(400).json({ success: false, error: 'phone, password and country_code are required' } as ApiResponse);
    }

    const userId = generateUUID();
    const passwordHash = await hashPassword(password);

    await execute(
      'INSERT INTO users (id, phone, country_code, password_hash, full_name, referral_code, is_active, is_admin) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [userId, phone, country_code, passwordHash, full_name || null, null, is_active !== false, is_admin === true]
    );

    const user = await query<any>('SELECT id, phone, country_code, full_name, is_active, is_admin, created_at FROM users WHERE id = $1', [userId]);

    res.json({ success: true, data: user[0], message: 'User created' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
});

// Update user (admin)
router.put('/users/:userId', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { full_name, is_active, is_admin, password } = req.body;

    if (password) {
      const passwordHash = await hashPassword(password);
      await execute('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    }

    if (typeof full_name !== 'undefined') {
      await execute('UPDATE users SET full_name = $1 WHERE id = $2', [full_name, userId]);
    }

    if (typeof is_active !== 'undefined') {
      await execute('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, userId]);
    }

    if (typeof is_admin !== 'undefined') {
      await execute('UPDATE users SET is_admin = $1 WHERE id = $2', [is_admin, userId]);
    }

    const user = await query<any>('SELECT id, phone, country_code, full_name, is_active, is_admin, created_at FROM users WHERE id = $1', [userId]);
    res.json({ success: true, data: user[0], message: 'User updated' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
});

// Delete user (admin)
router.delete('/users/:userId', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    await execute('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ success: true, message: 'User deleted' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
});

// ==================== DEPOSITS ====================
// Get all deposits with filters
router.get('/deposits', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 100;

    let sql = `SELECT d.*, u.phone, u.full_name
               FROM deposits d
               LEFT JOIN users u ON d.user_id = u.id`;
    let params: any[] = [];

    if (status) {
      sql += ' WHERE d.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY d.created_at DESC LIMIT ?';
    params.push(limit);

    const deposits = await query<any>(sql, params);

    res.json({
      success: true,
      data: deposits || []
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Approve deposit
router.post('/deposits/:depositId/approve', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { depositId } = req.params;

    // Get deposit details
    const deposits = await query<any>(
      'SELECT d.*, u.id as user_id FROM deposits d LEFT JOIN users u ON d.user_id = u.id WHERE d.id = ?',
      [depositId]
    );

    if (!deposits || deposits.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Deposit not found'
      } as ApiResponse);
    }

    const deposit = deposits[0];

    // Update deposit status
    await execute(
      'UPDATE deposits SET status = ? WHERE id = ?',
      ['approved', depositId]
    );

    // Add to wallet balance
    await execute(
      'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
      [deposit.amount, deposit.user_id]
    );

    res.json({
      success: true,
      message: 'Deposit approved'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Reject deposit
router.post('/deposits/:depositId/reject', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { depositId } = req.params;

    await execute(
      'UPDATE deposits SET status = ? WHERE id = ?',
      ['rejected', depositId]
    );

    res.json({
      success: true,
      message: 'Deposit rejected'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// ==================== WITHDRAWALS ====================
// Get all withdrawals with filters
router.get('/withdrawals', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 100;

    let sql = `SELECT w.*, u.phone, u.full_name
               FROM withdrawals w
               LEFT JOIN users u ON w.user_id = u.id`;
    let params: any[] = [];

    if (status) {
      sql += ' WHERE w.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY w.created_at DESC LIMIT ?';
    params.push(limit);

    const withdrawals = await query<any>(sql, params);

    res.json({
      success: true,
      data: withdrawals || []
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Approve withdrawal
router.post('/withdrawals/:withdrawalId/approve', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { withdrawalId } = req.params;

    // Get withdrawal details
    const withdrawals = await query<any>(
      'SELECT w.*, u.id as user_id FROM withdrawals w LEFT JOIN users u ON w.user_id = u.id WHERE w.id = ?',
      [withdrawalId]
    );

    if (!withdrawals || withdrawals.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal not found'
      } as ApiResponse);
    }

    const withdrawal = withdrawals[0];

    // Update withdrawal status
    await execute(
      'UPDATE withdrawals SET status = ? WHERE id = ?',
      ['approved', withdrawalId]
    );

    // Deduct from wallet balance
    await execute(
      'UPDATE wallets SET balance = balance - ? WHERE user_id = ?',
      [withdrawal.amount, withdrawal.user_id]
    );

    res.json({
      success: true,
      message: 'Withdrawal approved'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Reject withdrawal
router.post('/withdrawals/:withdrawalId/reject', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { withdrawalId } = req.params;

    // Get withdrawal details to restore balance
    const withdrawals = await query<any>(
      'SELECT w.* FROM withdrawals w WHERE w.id = ?',
      [withdrawalId]
    );

    if (withdrawals && withdrawals.length > 0) {
      const withdrawal = withdrawals[0];
      // Restore balance
      await execute(
        'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
        [withdrawal.amount, withdrawal.user_id]
      );
    }

    // Update withdrawal status
    await execute(
      'UPDATE withdrawals SET status = ? WHERE id = ?',
      ['rejected', withdrawalId]
    );

    res.json({
      success: true,
      message: 'Withdrawal rejected'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// ==================== ADMIN - WITHDRAWAL APPROVAL QUEUE ====================
// List withdrawal approvals (detailed submissions)
router.get('/withdrawal-approvals', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const limit = parseInt(req.query.limit as string) || 100;
    const approvals = await query<any>(
      `SELECT a.*, u.phone, u.full_name FROM admin_withdrawal_approvals a LEFT JOIN users u ON a.user_id = u.id WHERE a.status = $1 ORDER BY a.created_at DESC LIMIT $2`,
      [status, limit]
    );

    res.json({ success: true, data: approvals || [] } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
});

// Approve a withdrawal approval entry (by approval id)
router.post('/withdrawal-approvals/:approvalId/approve', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { approvalId } = req.params;
    const adminId = req.user!.id;

    const approvals = await query<any>('SELECT * FROM admin_withdrawal_approvals WHERE id = $1', [approvalId]);
    if (!approvals || approvals.length === 0) {
      return res.status(404).json({ success: false, error: 'Approval entry not found' } as ApiResponse);
    }
    const approval = approvals[0];

    if (approval.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Approval is not pending' } as ApiResponse);
    }

    // Approve the underlying withdrawal using service
    const withdrawal = await withdrawalService.approveWithdrawal(approval.withdrawal_id, adminId, req.body.notes || null);

    await execute('UPDATE admin_withdrawal_approvals SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3', ['approved', adminId, approvalId]);

    res.json({ success: true, data: withdrawal, message: 'Withdrawal approved' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
});

// Reject a withdrawal approval entry (by approval id)
router.post('/withdrawal-approvals/:approvalId/reject', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { approvalId } = req.params;
    const adminId = req.user!.id;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ success: false, error: 'Rejection notes are required' } as ApiResponse);
    }

    const approvals = await query<any>('SELECT * FROM admin_withdrawal_approvals WHERE id = $1', [approvalId]);
    if (!approvals || approvals.length === 0) {
      return res.status(404).json({ success: false, error: 'Approval entry not found' } as ApiResponse);
    }
    const approval = approvals[0];

    if (approval.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Approval is not pending' } as ApiResponse);
    }

    // Reject underlying withdrawal via service (this will refund wallet)
    const withdrawal = await withdrawalService.rejectWithdrawal(approval.withdrawal_id, adminId, notes);

    await execute('UPDATE admin_withdrawal_approvals SET status = $1, approved_by = $2, rejected_at = CURRENT_TIMESTAMP, rejection_reason = $3 WHERE id = $4', ['rejected', adminId, notes, approvalId]);

    res.json({ success: true, data: withdrawal, message: 'Withdrawal rejected' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
});

// ==================== VIP INVESTMENTS ====================
// Get all VIP investments
router.get('/vip-investments', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 100;

    let sql = `SELECT vi.*, u.phone, u.full_name, vp.name as product_name, vp.daily_return
               FROM vip_investments vi
               LEFT JOIN users u ON vi.user_id = u.id
               LEFT JOIN vip_products vp ON vi.vip_level = vp.level`;
    let params: any[] = [];

    if (status) {
      sql += ' WHERE vi.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY vi.created_at DESC LIMIT ?';
    params.push(limit);

    const investments = await query<any>(sql, params);

    res.json({
      success: true,
      data: investments || []
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// ==================== VIP PRODUCTS (Admin CRUD) ====================
// Get all VIP products (including inactive)
router.get('/vip-products', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const products = await query<any>('SELECT * FROM vip_products ORDER BY level ASC');
    res.json({ success: true, data: products || [] } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
});

// Create VIP product
router.post('/vip-products', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { level, name, min_amount, daily_return, duration, color, is_active } = req.body;
    if (!level || !name || typeof min_amount === 'undefined') {
      return res.status(400).json({ success: false, error: 'level, name and min_amount are required' } as ApiResponse);
    }

    const id = generateUUID();
    await execute(
      'INSERT INTO vip_products (id, level, name, min_amount, daily_return, duration, color, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, level, name, min_amount, daily_return || 0.1, duration || 90, color || null, is_active !== false]
    );

    const product = await query<any>('SELECT * FROM vip_products WHERE id = $1', [id]);
    res.json({ success: true, data: product[0], message: 'VIP product created' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
});

// Update VIP product
router.put('/vip-products/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { level, name, min_amount, daily_return, duration, color, is_active } = req.body;

    if (typeof level !== 'undefined') await execute('UPDATE vip_products SET level = $1 WHERE id = $2', [level, id]);
    if (typeof name !== 'undefined') await execute('UPDATE vip_products SET name = $1 WHERE id = $2', [name, id]);
    if (typeof min_amount !== 'undefined') await execute('UPDATE vip_products SET min_amount = $1 WHERE id = $2', [min_amount, id]);
    if (typeof daily_return !== 'undefined') await execute('UPDATE vip_products SET daily_return = $1 WHERE id = $2', [daily_return, id]);
    if (typeof duration !== 'undefined') await execute('UPDATE vip_products SET duration = $1 WHERE id = $2', [duration, id]);
    if (typeof color !== 'undefined') await execute('UPDATE vip_products SET color = $1 WHERE id = $2', [color, id]);
    if (typeof is_active !== 'undefined') await execute('UPDATE vip_products SET is_active = $1 WHERE id = $2', [is_active, id]);

    const product = await query<any>('SELECT * FROM vip_products WHERE id = $1', [id]);
    res.json({ success: true, data: product[0], message: 'VIP product updated' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
});

// Delete VIP product
router.delete('/vip-products/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM vip_products WHERE id = $1', [id]);
    res.json({ success: true, message: 'VIP product deleted' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
});

// ==================== VIP INVESTMENTS - Admin control ====================
// Toggle investment status (stop / activate / cancel)
router.post('/vip-investments/:id/toggle-status', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expected 'active'|'completed'|'cancelled'
    if (!status) return res.status(400).json({ success: false, error: 'status is required' } as ApiResponse);

    await execute('UPDATE vip_investments SET status = $1 WHERE id = $2', [status, id]);
    const investment = await query<any>('SELECT * FROM vip_investments WHERE id = $1', [id]);
    res.json({ success: true, data: investment[0], message: 'Investment status updated' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
});

// ==================== BANKS ====================
// Get all banks
router.get('/banks', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const banks = await query<any>(
      'SELECT * FROM banks WHERE is_active = TRUE ORDER BY name ASC'
    );

    res.json({
      success: true,
      data: banks || []
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Create new bank
router.post('/banks', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, code, country_code } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Bank name is required'
      } as ApiResponse);
    }

    const { generateUUID } = await import('../utils/uuid');
    const bankId = generateUUID();

    await execute(
      'INSERT INTO banks (id, name, code, country_code, is_active) VALUES (?, ?, ?, ?, TRUE)',
      [bankId, name, code || null, country_code || null]
    );

    const bank = await query<any>(
      'SELECT * FROM banks WHERE id = ?',
      [bankId]
    );

    res.json({
      success: true,
      data: bank[0],
      message: 'Bank created successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Delete bank (optionally force reassign payment methods)
router.delete('/banks/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const force = (req.query.force as string) === 'true' || req.body?.force === true;

    const bank = await queryOne<any>('SELECT id, name FROM banks WHERE id = $1', [id]);
    if (!bank) return res.status(404).json({ success: false, error: 'Bank not found' } as ApiResponse);

    const countRow = await queryOne<any>('SELECT COUNT(*) as cnt FROM payment_methods WHERE bank_id = $1', [id]);
    const pmCount = countRow?.cnt ?? countRow?.COUNT ?? 0;

    if (pmCount > 0 && !force) {
      return res.status(400).json({ success: false, error: 'Bank has payment methods. Use ?force=true to reassign them or delete methods first.', data: { payment_methods_count: pmCount } } as ApiResponse);
    }

    if (pmCount > 0 && force) {
      // Try to find another existing bank to reassign to
      const other = await queryOne<any>('SELECT id FROM banks WHERE id != $1 LIMIT 1', [id]);
      let fallbackId: string | null = other?.id ?? null;

      // If no other bank exists, create a placeholder 'Unassigned' bank
      if (!fallbackId) {
        const { generateUUID } = await import('../utils/uuid');
        const newBankId = generateUUID();
        await execute('INSERT INTO banks (id, name, code, country_code, is_active) VALUES ($1, $2, $3, $4, TRUE)', [newBankId, 'Unassigned', 'UNASSIGNED', null]);
        fallbackId = newBankId;
      }

      // Reassign payment methods to fallback bank
      await execute('UPDATE payment_methods SET bank_id = $1 WHERE bank_id = $2', [fallbackId, id]);
    }

    // Now safe to delete the bank
    await execute('DELETE FROM banks WHERE id = $1', [id]);

    res.json({ success: true, message: 'Bank deleted successfully' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
});

// ==================== PAYMENT METHODS ====================
// Get all payment methods
router.get('/payment-methods', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const bankId = req.query.bank_id as string | undefined;
    let methods;
    if (bankId) {
      methods = await query<any>(
        `SELECT pm.*, b.id as bank_id, b.name as bank_name
         FROM payment_methods pm
         LEFT JOIN banks b ON pm.bank_id = b.id
         WHERE pm.bank_id = $1
         ORDER BY pm.name ASC`,
        [bankId]
      );
    } else {
      methods = await query<any>(
        `SELECT pm.*, b.id as bank_id, b.name as bank_name
         FROM payment_methods pm
         LEFT JOIN banks b ON pm.bank_id = b.id
         ORDER BY pm.name ASC`
      );
    }

    res.json({
      success: true,
      data: methods || []
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Create payment method
router.post('/payment-methods', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, code, description, bank_id, account_holder_name, account_number, min_deposit } = req.body;

    if (!name || !code || !bank_id) {
      return res.status(400).json({
        success: false,
        error: 'name, code and bank_id are required'
      } as ApiResponse);
    }

    // validate bank exists and is active
    const bank = await queryOne<any>('SELECT id, is_active FROM banks WHERE id = $1', [bank_id]);
    if (!bank) {
      return res.status(400).json({ success: false, error: 'bank not found' } as ApiResponse);
    }
    if (!bank.is_active) {
      return res.status(400).json({ success: false, error: 'bank is not active' } as ApiResponse);
    }

    const methodId = generateUUID();

    await execute(
      'INSERT INTO payment_methods (id, name, code, description, bank_id, account_holder_name, account_number, min_deposit, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)',
      [methodId, name, code, description || null, bank_id, account_holder_name || null, account_number || null, typeof min_deposit !== 'undefined' ? min_deposit : 0]
    );

    const method = await queryOne<any>(
      'SELECT pm.*, b.name as bank_name FROM payment_methods pm LEFT JOIN banks b ON pm.bank_id = b.id WHERE pm.id = $1',
      [methodId]
    );

    res.json({
      success: true,
      data: method,
      message: 'Payment method created successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Toggle payment method active status
router.put('/payment-methods/:id/toggle', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const method = await queryOne<any>(
      'SELECT is_active FROM payment_methods WHERE id = $1',
      [id]
    );

    if (!method) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      } as ApiResponse);
    }

    await execute(
      'UPDATE payment_methods SET is_active = $1 WHERE id = $2',
      [!method.is_active, id]
    );

    const updated = await queryOne<any>(
      'SELECT * FROM payment_methods WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      data: updated,
      message: `Payment method ${updated?.is_active ? 'activated' : 'deactivated'}`
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Delete payment method
router.delete('/payment-methods/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await execute(
      'DELETE FROM payment_methods WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// ==================== LOGS ====================
// Get activity logs
router.get('/logs', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 200;
    const logs = await query<any>(
      `SELECT al.*, u.phone as user_phone, u.full_name as user_name, 
              a.phone as admin_phone, a.full_name as admin_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN users a ON al.admin_id = a.id
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      data: logs || []
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// ==================== DEPOSIT APPROVAL QUEUE ====================
// Get pending deposits for admin approval
router.get('/deposit-approvals', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const status = req.query.status as string || 'pending';
    const limit = parseInt(req.query.limit as string) || 50;

    const approvals = await query(
      `SELECT * FROM admin_deposit_approvals 
       WHERE status = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [status, limit]
    );

    res.json({
      success: true,
      data: approvals || []
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Approve deposit and credit wallet
router.post('/deposit-approvals/:approvalId/approve', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { approvalId } = req.params;
    const adminId = req.user?.id;

    // Get approval record
    const approvals = await query(
      `SELECT * FROM admin_deposit_approvals WHERE id = $1`,
      [approvalId]
    );

    if (!approvals || approvals.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Approval record not found'
      } as ApiResponse);
    }

    const approval = approvals[0];

    // Update approval status
    await execute(
      `UPDATE admin_deposit_approvals SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [adminId, approvalId]
    );

    // Update deposit status
    await execute(
      `UPDATE deposits SET status = 'approved' WHERE id = $1`,
      [approval.deposit_id]
    );

    // Credit user wallet
    await execute(
      `UPDATE wallets SET balance = balance + $1 WHERE user_id = $2`,
      [approval.amount, approval.user_id]
    );

    // Update transaction status
    await execute(
      `UPDATE transactions SET status = 'completed' WHERE reference_id = $1`,
      [approval.deposit_id]
    );

    // Process referral commissions for first deposit
    try {
      await CommissionService.processFirstDepositCommissions(
        approval.user_id,
        approval.deposit_id,
        approval.amount
      );
    } catch (commError) {
      console.warn('Warning: Commission processing failed:', commError);
      // Don't fail the approval if commissions fail
    }

    res.json({
      success: true,
      message: 'Deposit approved and wallet credited'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Reject deposit
router.post('/deposit-approvals/:approvalId/reject', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { approvalId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;

    // Get approval record
    const approvals = await query(
      `SELECT * FROM admin_deposit_approvals WHERE id = $1`,
      [approvalId]
    );

    if (!approvals || approvals.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Approval record not found'
      } as ApiResponse);
    }

    const approval = approvals[0];

    // Update approval status
    await execute(
      `UPDATE admin_deposit_approvals 
       SET status = 'rejected', approved_by = $1, rejected_at = CURRENT_TIMESTAMP, rejection_reason = $2 
       WHERE id = $3`,
      [adminId, reason || 'No reason provided', approvalId]
    );

    // Update deposit status
    await execute(
      `UPDATE deposits SET status = 'rejected' WHERE id = $1`,
      [approval.deposit_id]
    );

    res.json({
      success: true,
      message: 'Deposit rejected'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

export default router;
