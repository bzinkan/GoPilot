import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add dismissal_mode to schools
  await knex.schema.alterTable('schools', (t) => {
    t.string('dismissal_mode', 10).notNullable().defaultTo('no_app');
  });

  // Family groups (admin-assigned car numbers, no app required)
  await knex.schema.createTable('family_groups', (t) => {
    t.increments('id').primary();
    t.integer('school_id').notNullable().references('id').inTable('schools').onDelete('CASCADE');
    t.string('car_number', 5).notNullable();
    t.string('family_name', 100).nullable();
    t.string('invite_token', 64).nullable();
    t.integer('claimed_by_user_id').nullable().references('id').inTable('users');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['school_id', 'car_number']);
  });

  await knex.raw(
    'CREATE UNIQUE INDEX family_groups_invite_token_unique ON family_groups (invite_token) WHERE invite_token IS NOT NULL'
  );

  // Join table: family group <-> students
  await knex.schema.createTable('family_group_students', (t) => {
    t.increments('id').primary();
    t.integer('family_group_id').notNullable().references('id').inTable('family_groups').onDelete('CASCADE');
    t.integer('student_id').notNullable().references('id').inTable('students').onDelete('CASCADE');
    t.unique(['family_group_id', 'student_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('family_group_students');
  await knex.schema.dropTableIfExists('family_groups');
  await knex.schema.alterTable('schools', (t) => {
    t.dropColumn('dismissal_mode');
  });
}
