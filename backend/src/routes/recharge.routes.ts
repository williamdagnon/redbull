import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateUUID } from '../utils/uuid';
import { execute, query } from '../config/database';
import { PLATFORM_CONFIG } from '../utils/constants';

const router = Router();

// Create a recharge order and store transfer details, then redirect to home
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { amount, pay_way_id, transfer_id, customer_mobile } = req.body;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ status: 0, msg: 'Invalid amount' });
    }

    // Check platform minimum
    if (numericAmount < PLATFORM_CONFIG.minDeposit) {
      return res.status(400).json({ status: 0, msg: `Montant minimum : ${PLATFORM_CONFIG.minDeposit} XOF` });
    }

    // Check payment method minimum if provided
    let methodMinDeposit = PLATFORM_CONFIG.minDeposit;
    if (pay_way_id) {
      try {
        const pm = await query(`SELECT min_deposit FROM payment_methods WHERE id = $1 LIMIT 1`, [pay_way_id]);
        if (pm && pm.length > 0 && pm[0].min_deposit) {
          methodMinDeposit = Number(pm[0].min_deposit);
          if (numericAmount < methodMinDeposit) {
            return res.status(400).json({ status: 0, msg: `Montant minimum pour cette méthode : ${methodMinDeposit} XOF` });
          }
        }
      } catch (e) {
        // Continue with platform minimum
      }
    }

    // Validate customer_mobile format (6-14 digits, no country code)
    if (!customer_mobile || !/^\d{6,14}$/.test(String(customer_mobile))) {
      return res.status(400).json({ status: 0, msg: 'Numéro mobile invalide (6-14 chiffres)' });
    }

    // Validate transfer_id format
    if (!transfer_id || !/^\d{9,11}$/.test(String(transfer_id))) {
      return res.status(400).json({ status: 0, msg: 'ID de transfert invalide (9-11 chiffres)' });
    }

    // Check if first deposit
    const prev = await query(`SELECT id FROM deposits WHERE user_id = $1 AND status IN ('approved', 'pending') LIMIT 1`, [userId]);
    const isFirstDeposit = !prev || prev.length === 0;

    const depositId = generateUUID();
    const orderCode = 'I' + Date.now();

    // Resolve payment method name if provided (pay_way_id may be an id referencing payment_methods)
    let paymentMethodName = 'inpay';
    if (pay_way_id) {
      try {
        const pm = await query(`SELECT * FROM payment_methods WHERE id = $1 LIMIT 1`, [pay_way_id]);
        if (pm && pm.length > 0) {
          paymentMethodName = pm[0].name || pm[0].payment_method || String(pay_way_id);
        } else {
          paymentMethodName = String(pay_way_id);
        }
      } catch (e) {
        paymentMethodName = String(pay_way_id);
      }
    }

    // Insert deposit record with transfer_id and customer mobile from frontend
    await execute(
      `INSERT INTO deposits (id, user_id, amount, payment_method, account_number, transaction_id, transfer_id, receipt_url, status, is_first_deposit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [depositId, userId, numericAmount, paymentMethodName, customer_mobile || '', orderCode, transfer_id || '', null, 'pending', isFirstDeposit]
    );

    // Create pending transaction
    const txId = generateUUID();
    await execute(
      `INSERT INTO transactions (id, user_id, type, amount, status, description, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [txId, userId, 'deposit', numericAmount, 'pending', `Inpay deposit - ${orderCode}`, depositId]
    );

    // Get user info for admin approval queue (use full_name from users table)
    const userInfo = await query(
      `SELECT full_name FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const userName = userInfo?.[0] ? (userInfo[0].full_name || 'User') : 'User';

    // Add to admin approval queue with all details
    const approvalId = generateUUID();
    await execute(
      `INSERT INTO admin_deposit_approvals (id, deposit_id, user_id, user_name, amount, payment_method, customer_mobile, transfer_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [approvalId, depositId, userId, userName, numericAmount, paymentMethodName, customer_mobile || '', transfer_id || '', 'pending']
    );

    // Return success - frontend will redirect to home
    return res.json({ 
      status: 1, 
      msg: 'Dépôt créé et en attente d\'approbation', 
      result: { 
        depositId,
        orderCode
      } 
    });
  } catch (error: any) {
    console.error('Recharge error:', error);
    return res.status(500).json({ status: 0, msg: error.message || 'Internal error' });
  }
});

export default router;
