import { query, queryOne, execute } from '../config/database';
import { hashPassword, comparePassword, generateReferralCode, validatePhoneNumber } from '../utils/helpers';
import { generateUUID } from '../utils/uuid';
import { User, Wallet, SignupRequest, LoginRequest } from '../types';

export class UserService {
  async createUser(data: SignupRequest, referredByCode?: string): Promise<{ user: User; wallet: Wallet }> {
    // Validate phone number
    if (!validatePhoneNumber(data.phone, data.country_code)) {
      throw new Error('Invalid phone number format for this country');
    }

    // Check if phone already exists
    const existingUser = await queryOne<User>(
      'SELECT id FROM users WHERE phone = $1 AND country_code = $2',
      [data.phone, data.country_code]
    );

    if (existingUser) {
      throw new Error('Phone number already registered');
    }

    // Generate unique referral code
    let referralCode = generateReferralCode();
    let isUnique = false;
    while (!isUnique) {
      const existing = await queryOne<User>(
        'SELECT id FROM users WHERE referral_code = $1',
        [referralCode]
      );
      
      if (!existing) {
        isUnique = true;
      } else {
        referralCode = generateReferralCode();
      }
    }

    // Find referrer if referral code provided
    let referredBy = null;
    if (referredByCode) {
      const referrer = await queryOne<User>(
        'SELECT id FROM users WHERE referral_code = $1',
        [referredByCode.toUpperCase()]
      );
      
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);
    const userId = generateUUID();

    // Create user
    try {
      await execute(
        `INSERT INTO users (id, phone, country_code, password_hash, full_name, referral_code, referred_by, is_active, is_admin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, data.phone, data.country_code, passwordHash, data.full_name, referralCode, referredBy, true, false]
      );
    } catch (err: any) {
      console.error('UserService.createUser - INSERT users failed:', err.message || err);
      console.error('SQL params:', { userId, phone: data.phone, country_code: data.country_code, referralCode, referredBy });
      throw err;
    }

    // Get created user
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      throw new Error('Failed to create user');
    }

    // Wallet is auto-created by trigger, fetch it; if missing, create it in app as fallback
    let wallet = await queryOne<Wallet>(
      'SELECT * FROM wallets WHERE user_id = ?',
      [userId]
    );

    if (!wallet) {
      // Fallback: create wallet if trigger didn't work
      const walletId = generateUUID();
      try {
        await execute(
          `INSERT INTO wallets (id, user_id, balance, total_invested, total_earned, total_withdrawn)
           VALUES (?, ?, 0, 0, 0, 0)`,
          [walletId, userId]
        );
        wallet = await queryOne<Wallet>(
          'SELECT * FROM wallets WHERE user_id = ?',
          [userId]
        );
      } catch (err) {
        console.error('Failed to create wallet for user:', userId, err);
      }
    }

    if (!wallet) {
      throw new Error('Failed to create wallet');
    }

    // Credit welcome bonus (500F) to new user
    try {
      const WELCOME_BONUS = 500;
      await execute(
        'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
        [WELCOME_BONUS, userId]
      );

      // Track welcome bonus credit for auditing
      const bonusId = require('../utils/uuid').generateUUID();
      await execute(
        'INSERT INTO welcome_bonus_credits (id, user_id, amount) VALUES (?, ?, ?)',
        [bonusId, userId, WELCOME_BONUS]
      );

      // Add transaction record
      await execute(
        `INSERT INTO transactions (id, user_id, type, amount, description, reference_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          require('../utils/uuid').generateUUID(),
          userId,
          'welcome_bonus',
          WELCOME_BONUS,
          'Welcome bonus - Sign up bonus',
          userId,
          'completed'
        ]
      );

      // Reload wallet to get updated balance
      wallet = await queryOne<Wallet>(
        'SELECT * FROM wallets WHERE user_id = ?',
        [userId]
      );
    } catch (err) {
      console.error('Failed to credit welcome bonus:', err);
      // Do not throw - bonus failure should not block signup
    }

    return { user, wallet };
  }

  async login(data: LoginRequest): Promise<{ user: Omit<User, 'password_hash'>; wallet: Wallet }> {
    // Find user by phone
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE phone = $1 AND country_code = $2',
      [data.phone, data.country_code]
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    // Verify password
    const isValid = await comparePassword(data.password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Get wallet
    const wallet = await queryOne<Wallet>(
      'SELECT * FROM wallets WHERE user_id = $1',
      [user.id]
    );

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, wallet };
  }

  async getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await queryOne<User>(
      `SELECT id, phone, country_code, full_name, referral_code, referred_by, is_active, is_admin, created_at, updated_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    return user;
  }

  async getUserByPhone(phone: string, countryCode: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await queryOne<User>(
      `SELECT id, phone, country_code, full_name, referral_code, referred_by, is_active, is_admin, created_at, updated_at 
       FROM users WHERE phone = $1 AND country_code = $2`,
      [phone, countryCode]
    );

    return user;
  }

  async getReferralTree(userId: string, level: number = 1, maxLevel: number = 3): Promise<any[]> {
    if (level > maxLevel) return [];

    const referrals = await query<{id: string; phone: string; full_name: string; referral_code: string; created_at: string}>(
      'SELECT id, phone, full_name, referral_code, created_at FROM users WHERE referred_by = $1',
      [userId]
    );

    if (!referrals || referrals.length === 0) return [];

    const result = [];
    for (const referral of referrals) {
      const children = await this.getReferralTree(referral.id, level + 1, maxLevel);
      result.push({
        ...referral,
        level,
        children
      });
    }

    return result;
  }
}