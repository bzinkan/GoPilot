import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('students', (t) => {
    // Drop global unique constraint on student_code
    t.dropUnique(['student_code']);
  });

  // Add composite unique on (school_id, student_code)
  await knex.schema.alterTable('students', (t) => {
    t.unique(['school_id', 'student_code']);
  });

  // Widen student_code to support both old 6-char and new numeric codes
  await knex.raw('ALTER TABLE students ALTER COLUMN student_code TYPE varchar(10)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('students', (t) => {
    t.dropUnique(['school_id', 'student_code']);
  });
  await knex.raw('ALTER TABLE students ALTER COLUMN student_code TYPE varchar(6)');
  await knex.schema.alterTable('students', (t) => {
    t.unique(['student_code']);
  });
}
