import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('dismissal_queue', (t) => {
    t.timestamp('released_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('dismissal_queue', (t) => {
    t.dropColumn('released_at');
  });
}
