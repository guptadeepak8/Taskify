import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { db } from '../db/database';
import bcrypt from 'bcryptjs';

describe('Auth & Email OTP Lifecycle (Risky Logic)', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password@123';
  const knownOtp = '123456';

  describe('1. OTP Generation & Storage', () => {
    it('generates secure 6-digit OTP, stores as bcrypt hash, and marks user unverified', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.is_verified).toBe(false);
      expect(res.body.data.user.password_hash).toBeUndefined();

      // Inspect the generated OTP in database
      const otpRecord = await db
        .selectFrom('otps')
        .selectAll()
        .where('email', '=', testEmail)
        .where('is_used', '=', false)
        .executeTakeFirst();

      expect(otpRecord).toBeDefined();
      expect(otpRecord?.attempts).toBe(0);
      expect(otpRecord?.is_used).toBe(false);

      // Verify OTP is hashed with bcrypt (starts with $2a$ or $2b$), never plaintext
      expect(otpRecord?.otp_hash).toMatch(/^\$2[ab]\$\d{2}\$/);

      // Verify expiry is set to ~10 minutes in the future
      const expiresAt = new Date(otpRecord!.expires_at).getTime();
      const now = Date.now();
      const diffMinutes = (expiresAt - now) / (1000 * 60);
      expect(diffMinutes).toBeGreaterThan(9);
      expect(diffMinutes).toBeLessThanOrEqual(10.1);

      // Store a known hash for subsequent verification tests
      const knownHash = await bcrypt.hash(knownOtp, 10);
      await db
        .updateTable('otps')
        .set({ otp_hash: knownHash })
        .where('id', '=', otpRecord!.id)
        .execute();
    });
  });

  describe('2. OTP Expiry Enforcement', () => {
    it('rejects expired OTP with 400 OTP_EXPIRED', async () => {
      const expiredEmail = `expired_${Date.now()}@example.com`;
      const password_hash = await bcrypt.hash('Password@123', 10);
      const user = await db
        .insertInto('users')
        .values({ email: expiredEmail, password_hash, is_verified: false })
        .returningAll()
        .executeTakeFirstOrThrow();

      const otp_hash = await bcrypt.hash('654321', 10);
      await db
        .insertInto('otps')
        .values({
          user_id: user.id,
          email: expiredEmail,
          otp_hash,
          attempts: 0,
          expires_at: new Date(Date.now() - 60 * 1000), // expired 1 minute ago
          last_sent_at: new Date(Date.now() - 60 * 1000),
          is_used: false,
        })
        .execute();

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: expiredEmail,
          otp: '654321',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('OTP_EXPIRED');
      expect(res.body.error.message).toContain('expired');
    });
  });

  describe('3. Attempt Limits & Lockout', () => {
    it('tracks failed attempts and rejects wrong OTP with remaining attempts', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: testEmail,
          otp: '999999',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_OTP');
      expect(res.body.error.message).toContain('attempts remaining');
    });

    it('locks OTP when 5 failed attempts are reached', async () => {
      const lockoutEmail = `lockout_${Date.now()}@example.com`;
      const password_hash = await bcrypt.hash('Password@123', 10);
      const user = await db
        .insertInto('users')
        .values({ email: lockoutEmail, password_hash, is_verified: false })
        .returningAll()
        .executeTakeFirstOrThrow();

      const otp_hash = await bcrypt.hash('111222', 10);
      await db
        .insertInto('otps')
        .values({
          user_id: user.id,
          email: lockoutEmail,
          otp_hash,
          attempts: 4, // already 4 failed attempts
          expires_at: new Date(Date.now() + 10 * 60 * 1000),
          last_sent_at: new Date(),
          is_used: false,
        })
        .execute();

      // 5th attempt with wrong OTP -> triggers lockout
      const res5 = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: lockoutEmail,
          otp: '999999',
        });

      expect(res5.status).toBe(400);
      expect(res5.body.success).toBe(false);
      expect(res5.body.error.code).toBe('OTP_MAX_ATTEMPTS_EXCEEDED');

      // Subsequent attempt even with the correct OTP is blocked
      const resLocked = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: lockoutEmail,
          otp: '111222',
        });

      expect(resLocked.status).toBe(400);
      expect(resLocked.body.success).toBe(false);
      expect(resLocked.body.error.code).toBe('OTP_MAX_ATTEMPTS_EXCEEDED');
    });
  });

  describe('4. Resend Cooldown Rules', () => {
    it('enforces 30-second cooldown on resend OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/resend-otp')
        .send({ email: testEmail });

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESEND_COOLDOWN');
      expect(res.body.error.details?.retryAfter).toBeDefined();
    });
  });

  describe('5. Login Rules & Verification Lifecycle', () => {
    it('blocks unverified user from logging in with 403 EMAIL_NOT_VERIFIED', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('verifies user with correct OTP and issues Bearer token', async () => {
      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: testEmail,
          otp: knownOtp,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data.user.is_verified).toBe(true);
      expect(verifyRes.body.data.token).toBeDefined();
    });

    it('enforces single-use OTP by rejecting reuse of already verified OTP', async () => {
      const reuseRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: testEmail,
          otp: knownOtp,
        });

      expect(reuseRes.status).toBe(400);
      expect(reuseRes.body.success).toBe(false);
      expect(reuseRes.body.error.code).toBe('INVALID_OTP');
    });

    it('blocks resend OTP for already verified accounts', async () => {
      const res = await request(app)
        .post('/api/v1/auth/resend-otp')
        .send({ email: testEmail });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ALREADY_VERIFIED');
    });

    it('allows verified user to log in with correct credentials', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.user.email).toBe(testEmail);
      expect(loginRes.body.data.user.is_verified).toBe(true);
      expect(loginRes.body.data.user.password_hash).toBeUndefined();
      expect(loginRes.body.data.token).toBeDefined();

      // Verify the Bearer token authenticates protected endpoints
      const token = loginRes.body.data.token;
      const profileRes = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.email).toBe(testEmail);
    });

    it('rejects login with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'IncorrectPassword@999',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'non_existent_account@example.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('supports logout', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
