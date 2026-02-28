import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE dismissal_queue ALTER COLUMN zone TYPE VARCHAR(50)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE dismissal_queue ALTER COLUMN zone TYPE VARCHAR(1)`);
}
