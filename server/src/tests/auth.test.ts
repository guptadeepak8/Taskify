import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { db } from '../db/database';
import bcrypt from 'bcryptjs';

describe('Auth & Email OTP Lifecycle', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password@123';
  const knownOtp = '123456';

  it('registers a new unverified user and creates an OTP record', async () => {
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

    const otpRecord = await db
      .selectFrom('otps')
      .selectAll()
      .where('email', '=', testEmail)
      .where('is_used', '=', false)
      .executeTakeFirst();

    expect(otpRecord).toBeDefined();
    expect(otpRecord?.attempts).toBe(0);

    const knownHash = await bcrypt.hash(knownOtp, 10);
    await db
      .updateTable('otps')
      .set({ otp_hash: knownHash })
      .where('id', '=', otpRecord!.id)
      .execute();
  });

  it('blocks unverified user from logging in', async () => {
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

  it('enforces 30-second cooldown on resend OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/resend-otp')
      .send({ email: testEmail });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RESEND_COOLDOWN');
  });

  it('rejects incorrect OTP and tracks attempts', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: testEmail,
        otp: '999999',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });

  it('verifies user with correct OTP and enables login with Bearer token', async () => {
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

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();

    // Verify Bearer token works on protected route
    const token = loginRes.body.data.token;
    const profileRes = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.email).toBe(testEmail);
  });

  it('supports logout', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
