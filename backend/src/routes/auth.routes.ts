import { Router } from 'express';
import { UserService } from '../services/user.service';
import { generateToken } from '../utils/helpers';
import { ApiResponse, AuthResponse } from '../types';
import { sendSMSCode, verifySMSCode } from '../utils/sms';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const userService = new UserService();

// router for auth operations

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password, country_code } = req.body;

    if (!phone || !password || !country_code) {
      return res.status(400).json({
        success: false,
        error: 'Phone, password, and country_code are required'
      } as ApiResponse);
    }

    const { user, wallet } = await userService.login({ phone, password, country_code });
    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user,
        wallet,
        token
      } as AuthResponse
    } as ApiResponse<AuthResponse>);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { phone, password, full_name, country_code, referral_code } = req.body;

    if (!phone || !password || !full_name || !country_code) {
      return res.status(400).json({
        success: false,
        error: 'Phone, password, full_name, and country_code are required'
      } as ApiResponse);
    }

    const { user, wallet } = await userService.createUser(
      { phone, password, full_name, country_code },
      referral_code
    );

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user,
        wallet,
        token
      } as AuthResponse
    } as ApiResponse<AuthResponse>);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    } as ApiResponse);
  }
});

// Send OTP code (signup / verify)
router.post('/send-code', async (req, res) => {
  try {
    const { phone, country_code, action } = req.body;
    if (!phone || !country_code) return res.status(400).json({ success: false, error: 'phone and country_code required' } as ApiResponse);

    const result = await sendSMSCode(phone, country_code, action || 'signup');
    res.json({ success: true, data: result.data } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
});

// Verify OTP code
router.post('/verify-code', async (req, res) => {
  try {
    const { phone, country_code, code } = req.body;
    if (!phone || !country_code || !code) return res.status(400).json({ success: false, error: 'phone, country_code and code are required' } as ApiResponse);

    const result = await verifySMSCode(phone, country_code, code);
    if (!result.success) return res.status(400).json({ success: false, error: result.error } as ApiResponse);

    res.json({ success: true, message: 'Code vérifié' } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' } as ApiResponse);
    }
    res.json({ success: true, data: user } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
});

// Send OTP code (signup / verify)
router.post('/send-code', async (req, res) => {
  try {
    const { phone, country_code, action } = req.body;
    if (!phone || !country_code) return res.status(400).json({ success: false, error: 'phone and country_code required' } as ApiResponse);

    const result = await sendSMSCode(phone, country_code, action || 'signup');
    res.json({ success: true, data: result.data } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
});

// Verify OTP code
router.post('/verify-code', async (req, res) => {
  try {
    const { phone, country_code, code } = req.body;
    if (!phone || !country_code || !code) return res.status(400).json({ success: false, error: 'phone, country_code and code are required' } as ApiResponse);

    const result = await verifySMSCode(phone, country_code, code);
    if (!result.success) return res.status(400).json({ success: false, error: result.error } as ApiResponse);

    res.json({ success: true, message: 'Code vérifié' } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
});

export default router;
