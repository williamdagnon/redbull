import { Router } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { GiftCodeService } from '../services/gift.service';
import { ApiResponse } from '../types';

const router = Router();
const giftService = new GiftCodeService();

// ==================== USER ENDPOINTS ====================

/**
 * User redeems a gift code
 * POST /gift/redeem
 */
router.post('/redeem', authenticate, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    const userId = req.user!.id;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required'
      } as ApiResponse);
    }

    const result = await giftService.redeemGiftCode(code, userId);

    res.json({
      success: true,
      data: result,
      message: result.message
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to redeem gift code'
    } as ApiResponse);
  }
});

// ==================== ADMIN ENDPOINTS ====================

/**
 * Admin creates a new gift code
 * POST /admin/gift-codes
 */
router.post('/admin/create', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { amount, expires_in_minutes } = req.body;
    const adminId = req.user!.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      } as ApiResponse);
    }

    const expiresInMinutes = expires_in_minutes || 30;

    if (expiresInMinutes <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Expiration time must be greater than 0 minutes'
      } as ApiResponse);
    }

    const result = await giftService.createGiftCode(amount, adminId, expiresInMinutes);

    res.json({
      success: true,
      data: result,
      message: 'Gift code created successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create gift code'
    } as ApiResponse);
  }
});

/**
 * Admin gets list of gift codes
 * GET /admin/gift-codes?include_redeemed=true&limit=100
 */
router.get('/admin/list', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const includeRedeemed = (req.query.include_redeemed as string) === 'true';
    const limit = parseInt(req.query.limit as string) || 100;

    const codes = await giftService.getGiftCodes(limit, includeRedeemed);

    res.json({
      success: true,
      data: codes
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch gift codes'
    } as ApiResponse);
  }
});

/**
 * Admin deletes a gift code (only unredeemed)
 * DELETE /admin/gift-codes/:codeId
 */
router.delete('/admin/:codeId', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { codeId } = req.params;

    await giftService.deleteGiftCode(codeId);

    res.json({
      success: true,
      message: 'Gift code deleted successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete gift code'
    } as ApiResponse);
  }
});

/**
 * Admin gets gift code statistics
 * GET /admin/gift-codes/stats
 */
router.get('/admin/stats', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const stats = await giftService.getGiftCodeStats();

    res.json({
      success: true,
      data: stats
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch statistics'
    } as ApiResponse);
  }
});

export default router;
