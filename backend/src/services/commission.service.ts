import { query, execute } from '../config/database';
import { generateUUID } from '../utils/uuid';

interface CommissionConfig {
  level1: number; // Direct referral (30%)
  level2: number; // Second level (3%)
  level3: number; // Third level (3%)
}

export class CommissionService {
  /**
   * Process referral commissions after first deposit approval
   * Only applies on first approved deposit
   */
  static async processFirstDepositCommissions(
    userId: string,
    depositId: string,
    amount: number
  ): Promise<void> {
    try {
      // Get user's referrer
      const userInfo = await query(
        `SELECT referred_by FROM users WHERE id = $1`,
        [userId]
      );

      if (!userInfo || userInfo.length === 0 || !userInfo[0].referred_by) {
        console.log(`No referrer found for user ${userId}`);
        return;
      }

      const referrerId = userInfo[0].referred_by;

      // Get commission rates from settings
      const rates = await this.getCommissionRates();

      // Level 1 Commission - Direct referrer
      await this.creditCommission(
        referrerId,
        userId,
        depositId,
        amount * rates.level1,
        'level1',
        `Commission from ${userId}'s first deposit`
      );

      // Level 2 Commission - Referrer's referrer
      const referrerInfo = await query(
        `SELECT referred_by FROM users WHERE id = $1`,
        [referrerId]
      );

      if (referrerInfo && referrerInfo.length > 0 && referrerInfo[0].referred_by) {
        const level2ReferrerId = referrerInfo[0].referred_by;
        await this.creditCommission(
          level2ReferrerId,
          userId,
          depositId,
          amount * rates.level2,
          'level2',
          `Commission from ${userId}'s first deposit (Level 2)`
        );

        // Level 3 Commission - Referrer's referrer's referrer
        const level2ReferrerInfo = await query(
          `SELECT referred_by FROM users WHERE id = $1`,
          [level2ReferrerId]
        );

        if (level2ReferrerInfo && level2ReferrerInfo.length > 0 && level2ReferrerInfo[0].referred_by) {
          const level3ReferrerId = level2ReferrerInfo[0].referred_by;
          await this.creditCommission(
            level3ReferrerId,
            userId,
            depositId,
            amount * rates.level3,
            'level3',
            `Commission from ${userId}'s first deposit (Level 3)`
          );
        }
      }

      console.log(`✓ Commissions processed for deposit ${depositId}`);
    } catch (error) {
      console.error('Error processing commissions:', error);
      // Don't throw - commissions should not block the approval
    }
  }

  /**
   * Credit commission to referrer's wallet
   */
  private static async creditCommission(
    referrerId: string,
    referredUserId: string,
    depositId: string,
    commissionAmount: number,
    level: string,
    description: string
  ): Promise<void> {
    try {
      const commissionId = generateUUID();

      // Record commission
      await execute(
        `INSERT INTO referral_commissions (id, referrer_id, referred_id, deposit_id, amount, level, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'credited')`,
        [commissionId, referrerId, referredUserId, depositId, commissionAmount, level]
      );

      // Credit wallet
      await execute(
        `UPDATE wallets SET balance = balance + $1 WHERE user_id = $2`,
        [commissionAmount, referrerId]
      );

      // Record transaction
      const txId = generateUUID();
      await execute(
        `INSERT INTO transactions (id, user_id, type, amount, status, description, reference_id)
         VALUES ($1, $2, 'commission', $3, 'completed', $4, $5)`,
        [txId, referrerId, commissionAmount, description, commissionId]
      );

      console.log(`✓ Commission credited to ${referrerId}: ${commissionAmount} XOF`);
    } catch (error) {
      console.error(`Error crediting commission to ${referrerId}:`, error);
      throw error;
    }
  }

  /**
   * Get commission rates from database settings
   */
  private static async getCommissionRates(): Promise<CommissionConfig> {
    try {
      const result = await query(
        `SELECT value FROM settings WHERE key = 'referral_rates'`,
        []
      );

      if (result && result.length > 0) {
        const rates = JSON.parse(result[0].value || '{}');
        return {
          level1: rates.level1 || 0.30,
          level2: rates.level2 || 0.03,
          level3: rates.level3 || 0.03,
        };
      }

      // Default rates
      return {
        level1: 0.30,
        level2: 0.03,
        level3: 0.03,
      };
    } catch (error) {
      console.error('Error fetching commission rates:', error);
      return {
        level1: 0.30,
        level2: 0.03,
        level3: 0.03,
      };
    }
  }
}
