import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('otps')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('email', 'varchar(255)', (col) => col.notNull())
    .addColumn('otp_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('attempts', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('last_sent_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('is_used', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('otps_email_idx')
    .on('otps')
    .column('email')
    .execute();

  await db.schema
    .createIndex('otps_user_id_idx')
    .on('otps')
    .column('user_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('otps').execute();
}
