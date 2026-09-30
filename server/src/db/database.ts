import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { env } from '../config/env';
import { Database } from './types';

const isCloudDb =
  env.DATABASE_URL.includes('render.com') ||
  env.DATABASE_URL.includes('sslmode=require');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});
