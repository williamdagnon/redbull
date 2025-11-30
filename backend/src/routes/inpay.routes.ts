import { Router } from 'express';
import { query, queryOne, execute } from '../config/database';
import { DepositService } from '../services/deposit.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const depositService = new DepositService();

// Poll/check endpoint used by the frontend (PaymentInpayPage.useOrderCheck)
// Expects POST to /inpay/check?orderid=I12345 or body { orderid }
router.post('/check', async (req, res) => {
  try {
    const orderid = (req.query.orderid as string) || req.body?.orderid || req.body?.orderId;
    if (!orderid) {
      return res.status(400).json({ code: 1, message: 'Missing orderid' });
    }

    // Find the deposit by transaction_id (we saved orderCode into deposits.transaction_id)
    const deposit = await queryOne<any>(`SELECT * FROM deposits WHERE transaction_id = $1 LIMIT 1`, [orderid]);
    if (!deposit) {
      return res.json({ code: 1, data: { result: { status: 'not_found' } } });
    }

    // Map local deposit.status to inpay style
    if (deposit.status === 'approved') {
      return res.json({ code: 0, data: { result: { status: 'payin_success' } } });
    }

    if (deposit.status === 'rejected') {
      return res.json({ code: 0, data: { result: { status: 'payin_failed' } } });
    }

    // Otherwise still pending
    return res.json({ code: 0, data: { result: { status: 'pending' } } });
  } catch (error: any) {
    console.error('/inpay/check error', error);
    return res.status(500).json({ code: 2, message: error.message || 'Internal error' });
  }
});

// Callback endpoint to be called by the payment provider (server-to-server).
// Must include a secret token in header 'x-inpay-secret' matching INPAY_SECRET env var.
router.post('/callback', async (req: any, res) => {
  try {
    const secret = process.env.INPAY_SECRET;

    // If a secret is configured, prefer HMAC signature verification using raw body
    if (secret) {
      const sigHeader = req.header('x-inpay-signature') || req.header('x-signature') || req.header('signature');
      if (!sigHeader) {
        return res.status(403).json({ success: false, error: 'Missing signature header' });
      }

      try {
        const crypto = await import('crypto');
        const raw = req.rawBody || JSON.stringify(req.body || {});
        const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
        // Compare in constant time
        const match = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigHeader));
        if (!match) {
          return res.status(403).json({ success: false, error: 'Invalid signature' });
        }
      } catch (e) {
        console.error('Signature verification error', e);
        return res.status(500).json({ success: false, error: 'Signature verification failed' });
      }
    } else {
      // Fallback: legacy header check
      const provided = req.header('x-inpay-secret');
      if (provided) {
        const envSecret = process.env.INPAY_SECRET_LEGACY;
        if (!envSecret || provided !== envSecret) {
          return res.status(403).json({ success: false, error: 'Invalid secret' });
        }
      }
    }

    const { orderid, status, amount } = req.body;
    if (!orderid) return res.status(400).json({ success: false, error: 'Missing orderid' });

    const deposit = await queryOne<any>(`SELECT * FROM deposits WHERE transaction_id = $1 LIMIT 1`, [orderid]);
    if (!deposit) return res.status(404).json({ success: false, error: 'Deposit not found' });

    // If provider says success, approve the deposit using service logic
    if (status === 'payin_success' || status === 'success') {
      try {
        await depositService.approveDeposit(deposit.id, 'system', 'Auto-approved via Inpay callback');
      } catch (e) {
        console.error('Error approving deposit from callback', e);
      }
      return res.json({ success: true });
    }

    // If failed, mark as rejected
    if (status === 'payin_failed' || status === 'failed') {
      try {
        await depositService.rejectDeposit(deposit.id, 'system', 'Marked failed by Inpay callback');
      } catch (e) {
        console.error('Error rejecting deposit from callback', e);
      }
      return res.json({ success: true });
    }

    return res.json({ success: false, error: 'Unknown status' });
  } catch (error: any) {
    console.error('/inpay/callback error', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal error' });
  }
});

export default router;
