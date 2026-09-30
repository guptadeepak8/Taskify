import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { getDb } from '../db/database';
import bcrypt from 'bcryptjs';

describe('Tasks Module', () => {
  let db: any;
  let userToken: string;
  let sampleTaskIds: string[] = [];

  beforeAll(async () => {
    db = await getDb();
  });

  it('retrieves at least 20 seeded tasks across at least 4 categories', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(20);

    const categories = new Set(res.body.data.map((t: any) => t.category));
    expect(categories.size).toBeGreaterThanOrEqual(4);

    // Save a couple of valid task IDs for subsequent selection tests
    sampleTaskIds = [res.body.data[0].id, res.body.data[1].id];

    // Verify task structure
    const sample = res.body.data[0];
    expect(sample).toHaveProperty('id');
    expect(sample).toHaveProperty('name');
    expect(sample).toHaveProperty('category');
    expect(sample).toHaveProperty('description');
  });

  it('supports searching tasks by keyword', async () => {
    const res = await request(app).get('/api/v1/tasks?search=plumbing');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].name.toLowerCase()).toContain('plumbing');
  });

  it('retrieves task categories', async () => {
    const res = await request(app).get('/api/v1/tasks/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
  });

  it('requires authentication to select or view user tasks', async () => {
    const postRes = await request(app)
      .post('/api/v1/tasks/select')
      .send({ taskIds: sampleTaskIds });
    expect(postRes.status).toBe(401);

    const getRes = await request(app).get('/api/v1/tasks/selected');
    expect(getRes.status).toBe(401);
  });

  it('saves and retrieves user task selection', async () => {
    const email = `task_user_${Date.now()}@example.com`;
    const password_hash = await bcrypt.hash('Password@123', 10);
    const user = await db
      .insertInto('users')
      .values({ email, password_hash, is_verified: true })
      .returningAll()
      .executeTakeFirstOrThrow();

    userToken = jwt.sign({ userId: user.id, email }, env.JWT_SECRET);

    // 1. Select tasks
    const selectRes = await request(app)
      .post('/api/v1/tasks/select')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ taskIds: sampleTaskIds });

    expect(selectRes.status).toBe(200);
    expect(selectRes.body.success).toBe(true);
    expect(selectRes.body.data.length).toBe(2);

    // 2. Retrieve selected tasks
    const getRes = await request(app)
      .get('/api/v1/tasks/selected')
      .set('Authorization', `Bearer ${userToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.length).toBe(2);
    const returnedIds = getRes.body.data.map((t: any) => t.id);
    expect(returnedIds).toContain(sampleTaskIds[0]);
    expect(returnedIds).toContain(sampleTaskIds[1]);
  });
});
