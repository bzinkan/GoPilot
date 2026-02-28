import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('school_memberships', (t) => {
    t.string('car_number', 5).nullable();
  });
  await knex.raw(
    'CREATE UNIQUE INDEX school_memberships_car_number_unique ON school_memberships (school_id, car_number) WHERE car_number IS NOT NULL'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS school_memberships_car_number_unique');
  await knex.schema.alterTable('school_memberships', (t) => {
    t.dropColumn('car_number');
  });
}
