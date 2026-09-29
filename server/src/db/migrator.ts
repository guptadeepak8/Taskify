import { Migrator, MigrationProvider, Migration, MigrationResult } from 'kysely/migration';
import { db } from './database';
import * as m001 from './migrations/001_create_users_table';

class StaticMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return {
      '001_create_users_table': m001,
    };
  }
}

export async function migrateToLatest(): Promise<MigrationResult[] | undefined> {
  const migrator = new Migrator({
    db,
    provider: new StaticMigrationProvider(),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it: MigrationResult) => {
    if (it.status === 'Success') {
      console.log(`Migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`Failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('Failed to run migrations', error);
    throw error;
  }

  return results;
}

if (require.main === module) {
  migrateToLatest()
    .then(() => {
      console.log('Migrations completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
