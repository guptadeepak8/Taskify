import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { env } from '../config/env';
import { Database } from './types';

const isLocal =
  env.DATABASE_URL.includes('localhost') ||
  env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: !isLocal && env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});
