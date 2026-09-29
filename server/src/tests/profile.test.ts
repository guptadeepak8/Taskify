import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { db } from '../db/database';
import bcrypt from 'bcryptjs';

describe('Profile Module', () => {
  let userToken: string;
  let userId: string;
  const userEmail = `profile_test_${Date.now()}@example.com`;

  it('sets up a verified test user and token', async () => {
    const password_hash = await bcrypt.hash('Password@123', 10);
    const createdUser = await db
      .insertInto('users')
      .values({
        email: userEmail,
        password_hash,
        is_verified: true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    userId = createdUser.id;
    userToken = jwt.sign({ userId, email: userEmail }, env.JWT_SECRET);
  });

  describe('Authentication Enforcement', () => {
    it('rejects GET /api/v1/profile without token', async () => {
      const res = await request(app).get('/api/v1/profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects PUT /api/v1/profile with invalid token', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          name: 'Vikram Singh',
          phone: '9876543210',
          address: 'Sector 62, Noida, UP',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Validation - Indian Mobile Number & Required Fields', () => {
    it('rejects non-Indian phone numbers or invalid length', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Vikram Singh',
          phone: '12345',
          address: 'Sector 62, Noida, UP',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects phone numbers not starting with 6, 7, 8, or 9', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Vikram Singh',
          phone: '5876543210',
          address: 'Sector 62, Noida, UP',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects name shorter than 2 characters', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'V',
          phone: '9876543210',
          address: 'Sector 62, Noida, UP',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects address shorter than 5 characters', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Vikram Singh',
          phone: '9876543210',
          address: 'No',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Profile Save & Retrieval', () => {
    it('saves profile with optional business name and normalizes Indian phone', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Vikram Singh',
          phone: '9876543210',
          address: 'Flat 402, Green Valley, Indirapuram, Ghaziabad',
          business_name: 'Singh Electric Works',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Vikram Singh');
      expect(res.body.data.phone).toBe('+919876543210');
      expect(res.body.data.address).toBe('Flat 402, Green Valley, Indirapuram, Ghaziabad');
      expect(res.body.data.business_name).toBe('Singh Electric Works');
    });

    it('retrieves saved profile via GET /api/v1/profile', async () => {
      const res = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Vikram Singh');
      expect(res.body.data.phone).toBe('+919876543210');
      expect(res.body.data.business_name).toBe('Singh Electric Works');
    });

    it('saves profile without business name (optional)', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Pooja Sharma',
          phone: '+91 9123456780',
          address: 'H-Block, Sector 15, Rohini, New Delhi',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Pooja Sharma');
      expect(res.body.data.phone).toBe('+919123456780');
      expect(res.body.data.business_name).toBeNull();
    });
  });
});
