import { query, queryOne, execute } from '../config/database';
import { generateUUID } from '../utils/uuid';

export class GiftCodeService {
  /**
   * Generate a random gift code
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'GIFT-';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Admin creates a new gift code
   * @param amount - Amount to credit
   * @param adminId - Admin user ID
   * @param expiresInMinutes - Minutes until code expires (default 30)
   */
  async createGiftCode(
    amount: number,
    adminId: string,
    expiresInMinutes: number = 30
  ): Promise<{ id: string; code: string; amount: number; expiresInMinutes: number }> {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (expiresInMinutes <= 0) {
      throw new Error('Expiration time must be greater than 0 minutes');
    }

    let code = this.generateCode();
    let isUnique = false;
    let attempts = 0;

    // Generate unique code with retries
    while (!isUnique && attempts < 10) {
      const existing = await queryOne<any>(
        'SELECT id FROM gift_codes WHERE code = $1',
        [code]
      );
      if (!existing) {
        isUnique = true;
      } else {
        code = this.generateCode();
        attempts++;
      }
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique gift code');
    }

    const id = generateUUID();
    await execute(
      `INSERT INTO gift_codes (id, code, amount, created_by, is_active, expires_in_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, code, amount, adminId, true, expiresInMinutes]
    );

    return { id, code, amount, expiresInMinutes };
  }

  /**
   * User redeems a gift code
   */
  async redeemGiftCode(code: string, userId: string): Promise<{ amount: number; message: string }> {
    // Normalize and validate code
    const normalizedCode = code.toUpperCase().trim();
    
    if (!normalizedCode) {
      throw new Error('Code must not be empty');
    }

    // Find gift code
    const giftCodes = await query<any>(
      `SELECT * FROM gift_codes WHERE code = $1`,
      [normalizedCode]
    );

    if (!giftCodes || giftCodes.length === 0) {
      throw new Error('Code invalide ou inexistant');
    }

    const giftCode = giftCodes[0];

    // Validate gift code status
    if (!giftCode.is_active) {
      throw new Error('Ce code n\'est pas actif');
    }

    if (giftCode.redeemed_by) {
      throw new Error('Ce code a déjà été utilisé');
    }

    // Check if code has expired
    if (giftCode.expires_in_minutes && giftCode.created_at) {
      const createdTime = new Date(giftCode.created_at).getTime();
      const expiryTime = createdTime + (giftCode.expires_in_minutes * 60 * 1000);
      const currentTime = new Date().getTime();
      
      if (currentTime > expiryTime) {
        throw new Error('Ce code a expiré');
      }
    }

    // Credit user wallet
    await execute(
      'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
      [giftCode.amount, userId]
    );

    // Mark code as redeemed
    await execute(
      `UPDATE gift_codes SET redeemed_by = $1, redeemed_at = CURRENT_TIMESTAMP, is_active = false WHERE id = $2`,
      [userId, giftCode.id]
    );

    // Add transaction
    const transactionId = generateUUID();
    await execute(
      `INSERT INTO transactions (id, user_id, type, amount, description, reference_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        transactionId,
        userId,
        'gift_code_redemption',
        giftCode.amount,
        `Redemption of gift code: ${normalizedCode}`,
        giftCode.id,
        'completed'
      ]
    );

    return {
      amount: giftCode.amount,
      message: `Félicitations! Vous avez reçu ${giftCode.amount} F. Le montant a été crédité à votre compte.`
    };
  }

  /**
   * Get gift codes (admin view)
   */
  async getGiftCodes(limit: number = 100, includeRedeemed: boolean = false): Promise<any[]> {
    const query_str = includeRedeemed
      ? `SELECT gc.*, u1.phone as created_by_phone, u1.full_name as created_by_name, 
                 u2.phone as redeemed_by_phone, u2.full_name as redeemed_by_name
         FROM gift_codes gc
         LEFT JOIN users u1 ON gc.created_by = u1.id
         LEFT JOIN users u2 ON gc.redeemed_by = u2.id
         ORDER BY gc.created_at DESC
         LIMIT $1`
      : `SELECT gc.*, u1.phone as created_by_phone, u1.full_name as created_by_name
         FROM gift_codes gc
         LEFT JOIN users u1 ON gc.created_by = u1.id
         WHERE gc.redeemed_by IS NULL
         ORDER BY gc.created_at DESC
         LIMIT $1`;

    const codes = await query<any>(query_str, [limit]);
    return codes || [];
  }

  /**
   * Delete a gift code (admin only)
   */
  async deleteGiftCode(codeId: string): Promise<void> {
    await execute(
      'DELETE FROM gift_codes WHERE id = $1 AND redeemed_by IS NULL',
      [codeId]
    );
  }

  /**
   * Get gift code stats
   */
  async getGiftCodeStats(): Promise<{
    totalCodes: number;
    redeemedCodes: number;
    totalRedeemed: number;
    totalValue: number;
  }> {
    const stats = await queryOne<any>(
      `SELECT 
         COUNT(*) as total_codes,
         SUM(CASE WHEN redeemed_by IS NOT NULL THEN 1 ELSE 0 END) as redeemed_codes,
         SUM(CASE WHEN redeemed_by IS NOT NULL THEN amount ELSE 0 END) as total_redeemed,
         SUM(amount) as total_value
       FROM gift_codes`,
      []
    );

    return {
      totalCodes: stats?.total_codes || 0,
      redeemedCodes: stats?.redeemed_codes || 0,
      totalRedeemed: parseFloat(stats?.total_redeemed || 0),
      totalValue: parseFloat(stats?.total_value || 0)
    };
  }
}
