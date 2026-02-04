/**
 * Simple email verification with 6-digit codes
 * In production, use a proper email service (Resend, SendGrid, etc.)
 */

import { prisma } from "./prisma";
import crypto from "crypto";

// In-memory store for verification codes (use Redis in production)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

/**
 * Generate a 6-digit verification code
 */
function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create and store a verification code for an email
 */
export async function createVerificationCode(email: string): Promise<string> {
  const code = generateCode();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  verificationCodes.set(email.toLowerCase(), { code, expiresAt });

  // In production, send email here:
  // await sendEmail({
  //   to: email,
  //   subject: "Your verification code",
  //   body: `Your code is: ${code}`
  // });

  console.log(`[DEV] Verification code for ${email}: ${code}`);

  return code;
}

/**
 * Verify a code for an email
 */
export function verifyCode(email: string, code: string): boolean {
  const entry = verificationCodes.get(email.toLowerCase());

  if (!entry) {
    return false;
  }

  if (entry.expiresAt < Date.now()) {
    verificationCodes.delete(email.toLowerCase());
    return false;
  }

  if (entry.code !== code) {
    return false;
  }

  // Code is valid, remove it
  verificationCodes.delete(email.toLowerCase());
  return true;
}

/**
 * Check if email verification is enabled
 */
export function isEmailVerificationEnabled(): boolean {
  return process.env.ENABLE_EMAIL_VERIFICATION === "true";
}

// Clean up expired codes periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of verificationCodes.entries()) {
    if (entry.expiresAt < now) {
      verificationCodes.delete(email);
    }
  }
}, 60000);
