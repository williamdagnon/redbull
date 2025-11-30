import { ApiResponse } from '../types';

// Lightweight SMS/OTP helper. This file provides two functions:
// - sendSMSCode(phone, countryCode, action): generates a 6-digit code and (optionally) sends via SMS provider.
// - verifySMSCode(phone, countryCode, code): verifies code; in this simplified version we store codes in-memory.

// For production, replace with persistent store (Redis) and real SMS provider integration.

const codes: Record<string, { code: string; expiresAt: number }> = {};

function keyFor(phone: string, countryCode: string) {
  return `${countryCode}:${phone}`;
}

export async function sendSMSCode(phone: string, countryCode: string, action: string = 'signup'): Promise<ApiResponse<{ code?: string }>> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  codes[keyFor(phone, countryCode)] = { code, expiresAt };

  // TODO: Integrate with real SMS gateway here (Twilio, Africa's Talking, etc.)
  // For now, return the code in the response only in non-production environments.
  const reveal = process.env.NODE_ENV !== 'production';

  return {
    success: true,
    data: reveal ? { code } : undefined
  };
}

export async function verifySMSCode(phone: string, countryCode: string, code: string): Promise<ApiResponse<any>> {
  const k = keyFor(phone, countryCode);
  const record = codes[k];
  if (!record) return { success: false, error: 'No code sent' };
  if (Date.now() > record.expiresAt) {
    delete codes[k];
    return { success: false, error: 'Code expired' };
  }
  if (record.code !== code) return { success: false, error: 'Invalid code' };

  delete codes[k];
  return { success: true };
}
