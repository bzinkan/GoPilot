import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // dismissal_sessions
  await knex.schema.createTable('dismissal_sessions', (t) => {
    t.increments('id').primary();
    t.integer('school_id').notNullable().references('id').inTable('schools');
    t.date('date').notNullable().defaultTo(knex.fn.now());
    t.string('status', 20).defaultTo('pending');
    t.timestamp('started_at');
    t.timestamp('ended_at');
    t.jsonb('stats').defaultTo('{}');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['school_id', 'date']);
  });

  // dismissal_queue
  await knex.schema.createTable('dismissal_queue', (t) => {
    t.increments('id').primary();
    t.integer('session_id').notNullable().references('id').inTable('dismissal_sessions');
    t.integer('student_id').notNullable().references('id').inTable('students');
    t.integer('guardian_id').references('id').inTable('users');
    t.string('guardian_name', 255);
    t.timestamp('check_in_time').defaultTo(knex.fn.now());
    t.string('check_in_method', 20);
    t.string('status', 20).defaultTo('waiting');
    t.string('zone', 1);
    t.timestamp('called_at');
    t.timestamp('dismissed_at');
    t.string('hold_reason', 100);
    t.timestamp('delayed_until');
    t.integer('position');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_queue_session_status ON dismissal_queue(session_id, status)');
  await knex.schema.raw('CREATE INDEX idx_queue_student ON dismissal_queue(student_id)');

  // dismissal_changes
  await knex.schema.createTable('dismissal_changes', (t) => {
    t.increments('id').primary();
    t.integer('session_id').notNullable().references('id').inTable('dismissal_sessions');
    t.integer('student_id').notNullable().references('id').inTable('students');
    t.integer('requested_by').notNullable().references('id').inTable('users');
    t.string('from_type', 20).notNullable();
    t.string('to_type', 20).notNullable();
    t.string('bus_route', 20);
    t.text('note');
    t.string('status', 20).defaultTo('pending');
    t.integer('reviewed_by').references('id').inTable('users');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('reviewed_at');
  });

  // activity_log
  await knex.schema.createTable('activity_log', (t) => {
    t.increments('id').primary();
    t.integer('session_id').references('id').inTable('dismissal_sessions');
    t.integer('school_id').notNullable().references('id').inTable('schools');
    t.integer('actor_id').references('id').inTable('users');
    t.string('action', 50).notNullable();
    t.string('entity_type', 50);
    t.integer('entity_id');
    t.jsonb('details');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_activity_session ON activity_log(session_id)');
  await knex.schema.raw('CREATE INDEX idx_activity_school_date ON activity_log(school_id, created_at)');
}

export async function down(knex: Knex): Promise<void> {
  const tables = ['activity_log', 'dismissal_changes', 'dismissal_queue', 'dismissal_sessions'];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
}
