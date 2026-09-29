import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { db } from '../db/database';
import bcrypt from 'bcryptjs';

describe('Health Endpoints', () => {
  it('GET /health returns 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/v1/health returns structured 200 ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('Auth Validation', () => {
  describe('POST /api/v1/auth/register', () => {
    it('rejects registration with missing required fields', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects registration with password less than 6 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'user@example.com', password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('rejects login with missing fields', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects login with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'invalid-email', password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    it('rejects verify-otp with non 6-digit code', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'user@example.com', otp: '123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Fallback 404 handler', () => {
    it('returns consistent 404 for unknown routes', async () => {
      const res = await request(app).get('/api/v1/non-existent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});

describe('Full Auth & Email OTP Lifecycle', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password@123';
  let knownOtp = '123456';

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

    // Verify OTP record exists in DB
    const otpRecord = await db
      .selectFrom('otps')
      .selectAll()
      .where('email', '=', testEmail)
      .where('is_used', '=', false)
      .executeTakeFirst();

    expect(otpRecord).toBeDefined();
    expect(otpRecord?.attempts).toBe(0);
    expect(otpRecord?.otp_hash).toBeDefined();
    // Update OTP hash in DB with known hash for controlled testing
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

  it('rejects incorrect OTP and increments attempt count', async () => {
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

  it('verifies user with correct OTP and issues JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: testEmail,
        otp: knownOtp,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.is_verified).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('allows verified user to log in and receive JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.is_verified).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });
});
