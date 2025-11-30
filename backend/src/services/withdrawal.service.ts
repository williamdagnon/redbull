import { query, queryOne, execute } from '../config/database';
import { Withdrawal, Bank } from '../types';
import { WalletService } from './wallet.service';
import { PLATFORM_CONFIG } from '../utils/constants';
import { getTodayStart, getTodayEnd } from '../utils/helpers';
import { generateUUID } from '../utils/uuid';

export class WithdrawalService {
  private walletService = new WalletService();

  async getBanks(): Promise<Bank[]> {
    const banks = await query<Bank>(
      'SELECT * FROM banks WHERE is_active = TRUE ORDER BY name ASC'
    );

    return banks || [];
  }

  async createWithdrawal(userId: string, data: {
    amount: number;
    payment_method_id: string;
    account_number: string;
    account_holder_name: string;
  }): Promise<Withdrawal> {
    // Validate minimum withdrawal
    if (data.amount < PLATFORM_CONFIG.minWithdrawal) {
      throw new Error(`Minimum withdrawal is ${PLATFORM_CONFIG.minWithdrawal} FCFA`);
    }

    // Check daily withdrawal limit
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();

    const todayStartStr = todayStart.toISOString().slice(0, 19).replace('T', ' ');
    const todayEndStr = todayEnd.toISOString().slice(0, 19).replace('T', ' ');
    
    const todayWithdrawals = await query<{id: string}>(
      `SELECT id FROM withdrawals 
       WHERE user_id = $1 
       AND created_at >= $2 
       AND created_at <= $3
       AND status IN ('pending', 'approved', 'completed')`,
      [userId, todayStartStr, todayEndStr]
    );

    const withdrawalCount = todayWithdrawals?.length || 0;
    if (withdrawalCount >= PLATFORM_CONFIG.maxDailyWithdrawals) {
      throw new Error(`Maximum ${PLATFORM_CONFIG.maxDailyWithdrawals} withdrawals per day`);
    }

    // Check wallet balance (including fees)
    const fees = data.amount * PLATFORM_CONFIG.withdrawalFeeRate;
    const totalDeduction = data.amount; // Full amount is deducted immediately

    const wallet = await this.walletService.getWallet(userId);
    if (!wallet || parseFloat(wallet.balance.toString()) < totalDeduction) {
      throw new Error('Insufficient balance');
    }

    // Calculate net amount
    const netAmount = data.amount - fees;

    // Verify payment method exists and get bank info
    const pm = await queryOne<any>(
      `SELECT pm.*, b.id as bank_id, b.name as bank_name
       FROM payment_methods pm
       LEFT JOIN banks b ON pm.bank_id = b.id
       WHERE pm.id = $1 AND pm.is_active = TRUE`,
      [data.payment_method_id]
    );

    if (!pm) {
      throw new Error('Invalid payment method selected');
    }

    const withdrawalId = generateUUID();

    // Create withdrawal (store bank info from payment method)
    await execute(
      `INSERT INTO withdrawals 
       (id, user_id, amount, fees, net_amount, bank_id, bank_name, payment_method_id, account_number, account_holder_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        withdrawalId,
        userId,
        data.amount,
        fees,
        netAmount,
        pm.bank_id,
        pm.bank_name,
        data.payment_method_id,
        data.account_number,
        data.account_holder_name,
        'pending'
      ]
    );

    const withdrawal = await queryOne<Withdrawal>(
      'SELECT * FROM withdrawals WHERE id = $1',
      [withdrawalId]
    );

    if (!withdrawal) {
      throw new Error('Failed to create withdrawal');
    }

    // IMMEDIATELY deduct from wallet (even before approval)
    await this.walletService.updateBalance(userId, totalDeduction, 'subtract');
    
    // Update wallet stats
    await this.walletService.updateWalletStats(userId, {
      total_withdrawn: data.amount
    });

    // Add transaction
    await this.walletService.addTransaction(
      userId,
      'withdrawal',
      data.amount,
      `Withdrawal request - ${pm.bank_name || pm.name || data.payment_method_id}`,
      withdrawal.id,
      'pending'
    );

    // Get user name for admin queue
    try {
      const ui = await queryOne<any>('SELECT full_name FROM users WHERE id = $1', [userId]);
      const userName = (ui && ui.full_name) ? ui.full_name : 'User';

      const approvalId = generateUUID();
      await execute(
        `INSERT INTO admin_withdrawal_approvals (id, withdrawal_id, user_id, user_name, amount, payment_method_id, bank_id, bank_name, account_number, account_holder_name, country, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [approvalId, withdrawalId, userId, userName, data.amount, data.payment_method_id, pm.bank_id || null, pm.bank_name || null, data.account_number, data.account_holder_name, ui?.country_code || null, 'pending']
      );
    } catch (err) {
      // Do not block withdrawal creation if admin queue insert fails
      console.error('Failed to enqueue withdrawal for admin approval:', err);
    }

    return withdrawal;
  }

  async approveWithdrawal(withdrawalId: string, adminId: string, notes?: string): Promise<Withdrawal> {
    const withdrawal = await queryOne<Withdrawal>(
      'SELECT * FROM withdrawals WHERE id = $1',
      [withdrawalId]
    );

    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    if (withdrawal.status !== 'pending') {
      throw new Error(`Withdrawal is already ${withdrawal.status}`);
    }

    await execute(
      `UPDATE withdrawals 
       SET status = 'completed', processed_by = $1, processed_at = CURRENT_TIMESTAMP, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [adminId, notes || null, withdrawalId]
    );

    const updatedWithdrawal = await queryOne<Withdrawal>(
      'SELECT * FROM withdrawals WHERE id = $1',
      [withdrawalId]
    );

    if (!updatedWithdrawal) {
      throw new Error('Failed to approve withdrawal');
    }

    // Update transaction status
    await execute(
      "UPDATE transactions SET status = 'completed' WHERE reference_id = $1 AND type = 'withdrawal'",
      [withdrawalId]
    );

    return updatedWithdrawal;
  }

  async rejectWithdrawal(withdrawalId: string, adminId: string, notes: string): Promise<Withdrawal> {
    const withdrawal = await queryOne<Withdrawal>(
      'SELECT * FROM withdrawals WHERE id = $1',
      [withdrawalId]
    );

    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    if (withdrawal.status !== 'pending') {
      throw new Error(`Withdrawal is already ${withdrawal.status}`);
    }

    // Refund the amount back to wallet
    await this.walletService.updateBalance(withdrawal.user_id, withdrawal.amount, 'add');

    // Revert wallet stats
    await this.walletService.updateWalletStats(withdrawal.user_id, {
      total_withdrawn: -withdrawal.amount
    });

    await execute(
      `UPDATE withdrawals 
       SET status = 'rejected', processed_by = $1, processed_at = CURRENT_TIMESTAMP, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [adminId, notes, withdrawalId]
    );

    const updatedWithdrawal = await queryOne<Withdrawal>(
      'SELECT * FROM withdrawals WHERE id = $1',
      [withdrawalId]
    );

    if (!updatedWithdrawal) {
      throw new Error('Failed to reject withdrawal');
    }

    // Update transaction status
    await execute(
      "UPDATE transactions SET status = 'rejected' WHERE reference_id = $1 AND type = 'withdrawal'",
      [withdrawalId]
    );

    return updatedWithdrawal;
  }

  async getUserWithdrawals(userId: string, limit: number = 50): Promise<Withdrawal[]> {
    const withdrawals = await query<any>(
      `SELECT w.*, b.name as bank_name_display, b.code as bank_code
       FROM withdrawals w
       LEFT JOIN banks b ON w.bank_id = b.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return withdrawals || [];
  }

  async getAllWithdrawals(status?: string, limit: number = 100): Promise<Withdrawal[]> {
    let sql = `SELECT w.*, u.id as user_id, u.phone, u.full_name, u.country_code, b.name as bank_name_display, b.code as bank_code
               FROM withdrawals w
               LEFT JOIN users u ON w.user_id = u.id
               LEFT JOIN banks b ON w.bank_id = b.id
               ORDER BY w.created_at DESC
               LIMIT $1`;
    
    const params: any[] = [limit];
    
    if (status) {
      sql = `SELECT w.*, u.id as user_id, u.phone, u.full_name, u.country_code, b.name as bank_name_display, b.code as bank_code
             FROM withdrawals w
             LEFT JOIN users u ON w.user_id = u.id
             LEFT JOIN banks b ON w.bank_id = b.id
             WHERE w.status = $1
             ORDER BY w.created_at DESC
             LIMIT $2`;
      params.unshift(status);
    }

    const withdrawals = await query<Withdrawal>(sql, params);
    return withdrawals || [];
  }
}