import type { Kysely } from 'kysely';
import { Pool } from 'pg';
import { env } from '../config/env';
import { Database } from './types';

let dbInstance: Kysely<Database> | null = null;
let sharedDbPromise: Promise<Kysely<Database>> | null = null;

export function getDb(): Promise<Kysely<Database>> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (!sharedDbPromise) {
    sharedDbPromise = (async () => {
      try {
        const { Kysely, PostgresDialect } = await import('kysely');
        const isLocal =
          env.DATABASE_URL.includes('localhost') ||
          env.DATABASE_URL.includes('127.0.0.1');

        const pool = new Pool({
          connectionString: env.DATABASE_URL,
          ssl: !isLocal && env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
        });

        const instance = new Kysely<Database>({
          dialect: new PostgresDialect({ pool }),
        });
        dbInstance = instance;
        return instance;
      } catch (error) {
        sharedDbPromise = null;
        throw error;
      }
    })();
  }
  return sharedDbPromise;
}

export const dbPromise = {
  then: <TResult1 = Kysely<Database>, TResult2 = never>(
    onfulfilled?: ((value: Kysely<Database>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) => getDb().then(onfulfilled, onrejected),
  catch: <TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ) => getDb().catch(onrejected),
};
