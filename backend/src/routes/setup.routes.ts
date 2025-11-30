import { Router } from 'express';
import { generateToken, getErrorMessage } from '../utils/helpers';
import { ApiResponse } from '../types';

const router = Router();

// Setup: Create initial admin user (only works if no admin exists)
// Security: This endpoint should only work once. In production, delete this route or protect it with a setup token.
router.post('/admin-init', async (req, res) => {
  try {
    const { phone, password, full_name, country_code } = req.body;

    if (!phone || !password || !full_name || !country_code) {
      return res.status(400).json({
        success: false,
        error: 'Phone, password, full_name, and country_code are required'
      } as ApiResponse);
    }

    // Check if any admin already exists
    const { query } = await import('../config/database');
    const adminExists = await query('SELECT id FROM users WHERE is_admin = TRUE LIMIT 1');
    
    if (adminExists && adminExists.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Admin user already exists. This endpoint can only be used once.'
      } as ApiResponse);
    }

    // Create admin user manually (bypass regular signup flow)
    const { generateUUID } = await import('../utils/uuid');
    const { hashPassword } = await import('../utils/helpers');
    const { execute, queryOne } = await import('../config/database');
    const { generateReferralCode } = await import('../utils/helpers');

    const userId = generateUUID();
    const referralCode = generateReferralCode();
    const passwordHash = await hashPassword(password);

    await execute(
      `INSERT INTO users (id, phone, country_code, password_hash, full_name, referral_code, referred_by, is_active, is_admin)
       VALUES (?, ?, ?, ?, ?, ?, NULL, TRUE, TRUE)`,
      [userId, phone, country_code, passwordHash, full_name, referralCode]
    );

    // Create wallet for admin
    const walletId = generateUUID();
    try {
      await execute(
        `INSERT INTO wallets (id, user_id, balance, total_invested, total_earned, total_withdrawn)
         VALUES (?, ?, 0, 0, 0, 0)`,
        [walletId, userId]
      );
    } catch (err) {
      console.error('Failed to create wallet for admin:', err);
    }

    // Fetch admin user
    const user = await queryOne(
      'SELECT id, phone, country_code, full_name, referral_code, is_admin FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new Error('Failed to create admin user');
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user,
        token,
        message: 'Admin user created successfully'
      },
      message: 'Admin initialized'
    } as ApiResponse);
  } catch (error: unknown) {
    console.error('Setup error:', error);
    res.status(400).json({
      success: false,
      error: getErrorMessage(error)
    } as ApiResponse);
  }
});

export default router;
