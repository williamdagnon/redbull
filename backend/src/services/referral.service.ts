import { query, queryOne, execute } from '../config/database';
import { ReferralCommission } from '../types';
import { WalletService } from './wallet.service';
import { REFERRAL_RATES } from '../utils/constants';
import { generateUUID } from '../utils/uuid';

export class ReferralService {
  private walletService = new WalletService();

  /**
   * Process referral commissions for a deposit
   * Only processes on FIRST deposit
   * 3 levels: 30%, 3%, 3%
   */
  async processReferralCommissions(userId: string, depositId: string, depositAmount: number): Promise<void> {
    // Get user's referrer chain (up to 3 levels)
    const referrerChain = await this.getReferrerChain(userId, 3);

    if (referrerChain.length === 0) {
      return; // No referrers
    }

    for (let i = 0; i < referrerChain.length && i < 3; i++) {
      const referrerId = referrerChain[i];
      const level = (i + 1) as 1 | 2 | 3;
      
      // Get rate for this level
      const rate = level === 1 ? REFERRAL_RATES.level1 :
                   level === 2 ? REFERRAL_RATES.level2 :
                   REFERRAL_RATES.level3;

      const commissionAmount = depositAmount * rate;

      // Check if referrer is active
      const referrer = await queryOne<{id: string; is_active: boolean}>(
        'SELECT id, is_active FROM users WHERE id = $1',
        [referrerId]
      );

      if (!referrer || !referrer.is_active) {
        continue; // Skip inactive referrers
      }

      const commissionId = generateUUID();

      // Create commission record
      await execute(
        `INSERT INTO referral_commissions 
         (id, referrer_id, referred_id, deposit_id, level, rate, amount, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [commissionId, referrerId, userId, depositId, level, rate, commissionAmount, 'pending']
      );

      const commission = await queryOne<ReferralCommission>(
        'SELECT * FROM referral_commissions WHERE id = $1',
        [commissionId]
      );

      if (commission) {
        // Immediately pay the commission
        await this.payCommission(commission.id);
      }
    }
  }

  /**
   * Get referrer chain up to maxLevel
   */
  private async getReferrerChain(userId: string, maxLevel: number): Promise<string[]> {
    const chain: string[] = [];
    let currentUserId = userId;
    let level = 0;

    while (level < maxLevel) {
      const user = await queryOne<{referred_by: string | null}>(
        'SELECT referred_by FROM users WHERE id = $1',
        [currentUserId]
      );

      if (!user || !user.referred_by) {
        break;
      }

      chain.push(user.referred_by);
      currentUserId = user.referred_by;
      level++;
    }

    return chain;
  }

  /**
   * Pay a commission to referrer's wallet
   */
  async payCommission(commissionId: string): Promise<void> {
    const commission = await queryOne<ReferralCommission>(
      'SELECT * FROM referral_commissions WHERE id = $1',
      [commissionId]
    );

    if (!commission || commission.status === 'paid') {
      return;
    }

    // Add to referrer's wallet
    await this.walletService.updateBalance(commission.referrer_id, commission.amount, 'add');

    // Update wallet stats
    await this.walletService.updateWalletStats(commission.referrer_id, {
      total_earned: commission.amount
    });

    // Add transaction
    await this.walletService.addTransaction(
      commission.referrer_id,
      'commission',
      commission.amount,
      `Referral commission level ${commission.level}`,
      commission.id,
      'completed'
    );

    // Update commission status
    await execute(
      "UPDATE referral_commissions SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = $1",
      [commissionId]
    );
  }

  async getUserCommissions(userId: string, limit: number = 50): Promise<ReferralCommission[]> {
    const commissions = await query<any>(
      `SELECT rc.*, u.phone as from_user_phone, u.full_name as from_user_name, u.id as from_user_id, d.amount as deposit_amount, d.payment_method
       FROM referral_commissions rc
       LEFT JOIN users u ON rc.referred_id = u.id
       LEFT JOIN deposits d ON rc.deposit_id = d.id
       WHERE rc.referrer_id = $1
       ORDER BY rc.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return commissions || [];
  }

  async getReferralStats(userId: string): Promise<{
    total_referrals: number;
    active_referrals: number;
    level1_count: number;
    level2_count: number;
    level3_count: number;
    level1_commission: number;
    level2_commission: number;
    level3_commission: number;
    total_commission_earned: number;
    pending_commissions: number;
    pending_level1_commission: number;
    pending_level2_commission: number;
    pending_level3_commission: number;
  }> {
    // Get total referrals (all users where referred_by = userId)
    const totalReferralsRows = await query<{count: number}>(
      'SELECT COUNT(*) as count FROM users WHERE referred_by = $1',
      [userId]
    );
    const totalCount = totalReferralsRows?.[0]?.count || 0;

    // Get active direct referrals (users who were referred_by this user and are active)
    const activeRows = await query<{count: number}>(
      'SELECT COUNT(*) as count FROM users WHERE referred_by = $1 AND is_active = TRUE',
      [userId]
    );
    const activeCount = activeRows?.[0]?.count || 0;

    // Count UNIQUE users who generated PAID commissions at each level
    const level1Users = await query<{referred_id: string}>(
      `SELECT DISTINCT referred_id FROM referral_commissions 
       WHERE referrer_id = $1 AND level = 1 AND status = $2`,
      [userId, 'paid']
    );
    const level1Count = level1Users?.length || 0;

    const level2Users = await query<{referred_id: string}>(
      `SELECT DISTINCT referred_id FROM referral_commissions 
       WHERE referrer_id = $1 AND level = 2 AND status = $2`,
      [userId, 'paid']
    );
    const level2Count = level2Users?.length || 0;

    const level3Users = await query<{referred_id: string}>(
      `SELECT DISTINCT referred_id FROM referral_commissions 
       WHERE referrer_id = $1 AND level = 3 AND status = $2`,
      [userId, 'paid']
    );
    const level3Count = level3Users?.length || 0;

    // Get SUM of PAID commissions grouped by level
    const commissionsByLevel = await query<{level: number; total: number}>(
      `SELECT level, SUM(CAST(amount AS DECIMAL(15,2))) as total 
       FROM referral_commissions 
       WHERE referrer_id = $1 AND status = $2
       GROUP BY level`,
      [userId, 'paid']
    );

    const level1Commission = commissionsByLevel?.find((c: any) => c.level === 1)?.total || 0;
    const level2Commission = commissionsByLevel?.find((c: any) => c.level === 2)?.total || 0;
    const level3Commission = commissionsByLevel?.find((c: any) => c.level === 3)?.total || 0;

    const totalCommissions = (level1Commission || 0) + (level2Commission || 0) + (level3Commission || 0);

    // Get SUM of PENDING commissions grouped by level
    const pendingCommissionsByLevel = await query<{level: number; total: number}>(
      `SELECT level, SUM(CAST(amount AS DECIMAL(15,2))) as total 
       FROM referral_commissions 
       WHERE referrer_id = $1 AND status = $2
       GROUP BY level`,
      [userId, 'pending']
    );

    const pendingLevel1Commission = pendingCommissionsByLevel?.find((c: any) => c.level === 1)?.total || 0;
    const pendingLevel2Commission = pendingCommissionsByLevel?.find((c: any) => c.level === 2)?.total || 0;
    const pendingLevel3Commission = pendingCommissionsByLevel?.find((c: any) => c.level === 3)?.total || 0;

    const totalPendingCommissions = (pendingLevel1Commission || 0) + (pendingLevel2Commission || 0) + (pendingLevel3Commission || 0);

    return {
      total_referrals: totalCount,
      active_referrals: activeCount,
      level1_count: level1Count,
      level2_count: level2Count,
      level3_count: level3Count,
      level1_commission: parseFloat(level1Commission?.toString() || '0'),
      level2_commission: parseFloat(level2Commission?.toString() || '0'),
      level3_commission: parseFloat(level3Commission?.toString() || '0'),
      total_commission_earned: parseFloat(totalCommissions?.toString() || '0'),
      pending_commissions: parseFloat(totalPendingCommissions?.toString() || '0'),
      pending_level1_commission: parseFloat(pendingLevel1Commission?.toString() || '0'),
      pending_level2_commission: parseFloat(pendingLevel2Commission?.toString() || '0'),
      pending_level3_commission: parseFloat(pendingLevel3Commission?.toString() || '0')
    };
  }
}