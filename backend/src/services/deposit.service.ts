import { query, queryOne, execute } from '../config/database';
import { Deposit } from '../types';
import { WalletService } from './wallet.service';
import { ReferralService } from './referral.service';
import { PLATFORM_CONFIG } from '../utils/constants';
import { generateUUID } from '../utils/uuid';

export class DepositService {
  private walletService = new WalletService();
  private referralService = new ReferralService();

  async getPaymentMethods(bankId?: string): Promise<any[]> {
    if (bankId) {
      const methods = await query<any>(
        `SELECT pm.*, b.id as bank_id, b.name as bank_name
         FROM payment_methods pm
         LEFT JOIN banks b ON pm.bank_id = b.id
         WHERE pm.is_active = TRUE AND pm.bank_id = $1
         ORDER BY pm.name ASC`,
        [bankId]
      );
      return methods || [];
    }

    const methods = await query<any>(
      `SELECT pm.*, b.id as bank_id, b.name as bank_name
       FROM payment_methods pm
       LEFT JOIN banks b ON pm.bank_id = b.id
       WHERE pm.is_active = TRUE
       ORDER BY pm.name ASC`
    );
    return methods || [];
  }

  // Return banks that are active and have at least one active payment method
  async getBanksForDeposits(): Promise<any[]> {
    const banks = await query<any>(
      `SELECT b.* FROM banks b
       WHERE b.is_active = TRUE
       AND EXISTS (
         SELECT 1 FROM payment_methods pm WHERE pm.bank_id = b.id AND pm.is_active = TRUE
       )
       ORDER BY b.name ASC`
    );

    return banks || [];
  }

  async createDeposit(userId: string, data: {
    amount: number;
    payment_method: string;
    account_number: string;
    depositor_name?: string;
    deposit_number?: string;
    deposit_reference?: string;
    receipt_url?: string;
  }): Promise<Deposit> {
    // Validate minimum deposit
    if (data.amount < PLATFORM_CONFIG.minDeposit) {
      throw new Error(`Minimum deposit is ${PLATFORM_CONFIG.minDeposit} FCFA`);
    }

    // Check if this is user's first deposit
    const previousDeposits = await query<{id: string}>(
      `SELECT id FROM deposits 
       WHERE user_id = $1 AND status IN ('approved', 'pending')
       LIMIT 1`,
      [userId]
    );

    const isFirstDeposit = !previousDeposits || previousDeposits.length === 0;

    const depositId = generateUUID();

    // Create deposit
    await execute(
      `INSERT INTO deposits 
       (id, user_id, amount, payment_method, account_number, depositor_name, transfer_id, transaction_id, receipt_url, status, is_first_deposit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        depositId,
        userId,
        data.amount,
        data.payment_method,
        data.account_number,
        data.depositor_name || null,
        data.deposit_number || null,
        data.deposit_reference || null,
        data.receipt_url || null,
        'pending',
        isFirstDeposit
      ]
    );

    const deposit = await queryOne<Deposit>(
      'SELECT * FROM deposits WHERE id = $1',
      [depositId]
    );

    if (!deposit) {
      throw new Error('Failed to create deposit');
    }

    // Add transaction record
    await this.walletService.addTransaction(
      userId,
      'deposit',
      data.amount,
      `Deposit request - ${data.payment_method}`,
      deposit.id,
      'pending'
    );

    return deposit;
  }

  async approveDeposit(depositId: string, adminId: string, notes?: string): Promise<Deposit> {
    // Get deposit
    const deposit = await queryOne<Deposit>(
      'SELECT * FROM deposits WHERE id = $1',
      [depositId]
    );

    if (!deposit) {
      throw new Error('Deposit not found');
    }

    if (deposit.status !== 'pending') {
      throw new Error(`Deposit is already ${deposit.status}`);
    }

    // Update deposit status
    await execute(
      `UPDATE deposits 
       SET status = 'approved', processed_by = $1, processed_at = CURRENT_TIMESTAMP, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [adminId, notes || null, depositId]
    );

    const updatedDeposit = await queryOne<Deposit>(
      'SELECT * FROM deposits WHERE id = $1',
      [depositId]
    );

    if (!updatedDeposit) {
      throw new Error('Failed to approve deposit');
    }

    // Add to wallet balance
    await this.walletService.updateBalance(deposit.user_id, deposit.amount, 'add');

    // Update transaction status
    await execute(
      "UPDATE transactions SET status = 'completed' WHERE reference_id = $1 AND type = 'deposit'",
      [depositId]
    );

    // Process referral commissions if this is first deposit
    if (deposit.is_first_deposit) {
      await this.referralService.processReferralCommissions(deposit.user_id, deposit.id, deposit.amount);
    }

    return updatedDeposit;
  }

  async rejectDeposit(depositId: string, adminId: string, notes: string): Promise<Deposit> {
    const deposit = await queryOne<Deposit>(
      'SELECT * FROM deposits WHERE id = $1',
      [depositId]
    );

    if (!deposit) {
      throw new Error('Deposit not found');
    }

    if (deposit.status !== 'pending') {
      throw new Error(`Deposit is already ${deposit.status}`);
    }

    await execute(
      `UPDATE deposits 
       SET status = 'rejected', processed_by = $1, processed_at = CURRENT_TIMESTAMP, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [adminId, notes, depositId]
    );

    const updatedDeposit = await queryOne<Deposit>(
      'SELECT * FROM deposits WHERE id = $1',
      [depositId]
    );

    if (!updatedDeposit) {
      throw new Error('Failed to reject deposit');
    }

    // Update transaction status
    await execute(
      "UPDATE transactions SET status = 'rejected' WHERE reference_id = $1 AND type = 'deposit'",
      [depositId]
    );

    return updatedDeposit;
  }

  async getUserDeposits(userId: string, limit: number = 50): Promise<Deposit[]> {
    const deposits = await query<Deposit>(
      'SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );

    return deposits || [];
  }

  async getAllDeposits(status?: string, limit: number = 100): Promise<Deposit[]> {
    let sql = `SELECT d.*, u.id as user_id, u.phone, u.full_name, u.country_code
               FROM deposits d
               LEFT JOIN users u ON d.user_id = u.id
               ORDER BY d.created_at DESC
               LIMIT $1`;
    
    const params: any[] = [limit];
    
    if (status) {
      sql = `SELECT d.*, u.id as user_id, u.phone, u.full_name, u.country_code
             FROM deposits d
             LEFT JOIN users u ON d.user_id = u.id
             WHERE d.status = $1
             ORDER BY d.created_at DESC
             LIMIT $2`;
      params.unshift(status);
    }

    const deposits = await query<Deposit>(sql, params);
    return deposits || [];
  }
}