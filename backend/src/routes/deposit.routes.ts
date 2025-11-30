import { Router } from 'express';
import { DepositService } from '../services/deposit.service';
import { WithdrawalService } from '../services/withdrawal.service';
import { authenticate, requireAdmin, AuthRequest, maybeAuthenticate } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();
const depositService = new DepositService();
const withdrawalService = new WithdrawalService();

// Get available payment methods (optional bank_id)
router.get('/payment-methods', maybeAuthenticate, async (req: AuthRequest, res) => {
  try {
    const bankId = req.query.bank_id as string | undefined;
    const paymentMethods = await depositService.getPaymentMethods(bankId);
    res.json({ success: true, data: paymentMethods } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Get available banks for deposits (requires authentication)
router.get('/banks', maybeAuthenticate, async (req: AuthRequest, res) => {
  try {
    // return banks that have at least one active payment method
    const banks = await depositService.getBanksForDeposits();
    res.json({
      success: true,
      data: banks
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Create deposit request
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
      const { amount, payment_method, account_number, depositor_name, deposit_number, deposit_reference, receipt_url } = req.body;

      if (!amount || !payment_method || !account_number || !depositor_name || !deposit_number || !deposit_reference) {
        return res.status(400).json({
          success: false,
          error: 'amount, payment_method, account_number, depositor_name, deposit_number and deposit_reference are required'
        } as ApiResponse);
      }

      const deposit = await depositService.createDeposit(userId, {
        amount,
        payment_method,
        account_number,
        depositor_name,
        deposit_number,
        deposit_reference,
        receipt_url
      });

    res.json({
      success: true,
      data: deposit,
      message: 'Deposit request created successfully. Waiting for admin approval.'
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Get user's deposits
router.get('/my-deposits', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const deposits = await depositService.getUserDeposits(userId, limit);
    
    res.json({
      success: true,
      data: deposits
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Admin: Get all deposits
router.get('/all', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const deposits = await depositService.getAllDeposits(status, limit);
    
    res.json({
      success: true,
      data: deposits
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Admin: Approve deposit
router.post('/:id/approve', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const depositId = req.params.id;
    const adminId = req.user!.id;
    const { notes } = req.body;

    const deposit = await depositService.approveDeposit(depositId, adminId, notes);

    res.json({
      success: true,
      data: deposit,
      message: 'Deposit approved successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Admin: Reject deposit
router.post('/:id/reject', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const depositId = req.params.id;
    const adminId = req.user!.id;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({
        success: false,
        error: 'Rejection notes are required'
      } as ApiResponse);
    }

    const deposit = await depositService.rejectDeposit(depositId, adminId, notes);

    res.json({
      success: true,
      data: deposit,
      message: 'Deposit rejected'
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

export default router;
