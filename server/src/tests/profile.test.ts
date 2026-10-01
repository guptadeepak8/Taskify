import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../db/prisma';
import bcrypt from 'bcryptjs';

describe('Profile Module', () => {
  let userToken: string;
  const userEmail = `profile_test_${Date.now()}@example.com`;

  beforeAll(async () => {
    await prisma.$connect();
  });

  it('requires authentication for profile endpoints', async () => {
    const res = await request(app).get('/api/v1/profile');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('validates Indian mobile number format', async () => {
    const password_hash = await bcrypt.hash('Password@123', 10);
    const user = await prisma.user.create({
      data: { email: userEmail, password_hash, is_verified: true },
    });

    userToken = jwt.sign({ userId: user.id, email: userEmail }, env.JWT_SECRET);

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

  it('saves and retrieves profile with normalized Indian phone and optional business name', async () => {
    const updateRes = await request(app)
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Vikram Singh',
        phone: '9876543210',
        address: 'Flat 402, Indirapuram, Ghaziabad',
        business_name: 'Singh Electric Works',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.phone).toBe('+919876543210');
    expect(updateRes.body.data.business_name).toBe('Singh Electric Works');

    const getRes = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${userToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.name).toBe('Vikram Singh');
    expect(getRes.body.data.phone).toBe('+919876543210');
    expect(getRes.body.data.address).toBe('Flat 402, Indirapuram, Ghaziabad');
  });
});
