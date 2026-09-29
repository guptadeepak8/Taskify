import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

describe('API Input Validation & Error Handling', () => {
  const dummyToken = jwt.sign({ userId: '00000000-0000-0000-0000-000000000001', email: 'test@example.com' }, env.JWT_SECRET);

  it('handles malformed JSON body with 400 BAD_REQUEST', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "broken-json", ');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.message).toContain('Malformed JSON');
  });

  it('returns 404 for unknown endpoints with consistent error shape', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBeDefined();
  });

  describe('Auth Validation', () => {
    it('validates register payload: missing fields and invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: '123', // shorter than 6 characters
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);

      const fields = res.body.error.details.map((d: any) => d.field);
      expect(fields).toContain('email');
      expect(fields).toContain('password');
    });

    it('validates login payload: empty body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('validates OTP verification: invalid otp format (not 6 digits)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: 'user@example.com',
          otp: 'abc', // not 6 digits
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].field).toBe('otp');
    });
  });

  describe('Profile Validation', () => {
    it('rejects short address and invalid phone formats', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${dummyToken}`)
        .send({
          name: 'A', // too short
          phone: '12345678', // invalid phone length
          address: 'No', // too short
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Tasks Validation', () => {
    it('validates task selection: empty taskIds array', async () => {
      const res = await request(app)
        .post('/api/v1/tasks/select')
        .set('Authorization', `Bearer ${dummyToken}`)
        .send({ taskIds: [] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('at least one task');
    });

    it('validates task selection: non-UUID elements', async () => {
      const res = await request(app)
        .post('/api/v1/tasks/select')
        .set('Authorization', `Bearer ${dummyToken}`)
        .send({ taskIds: ['invalid-uuid-1', 'not-a-uuid-2'] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].field).toContain('taskIds');
    });

    it('validates task search query parameters: max length limits', async () => {
      const oversizedSearch = 'a'.repeat(101);
      const res = await request(app).get(`/api/v1/tasks?search=${oversizedSearch}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].field).toBe('search');
    });
  });
});
