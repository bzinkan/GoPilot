import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // schools
  await knex.schema.createTable('schools', (t) => {
    t.increments('id').primary();
    t.string('name', 255).notNullable();
    t.string('slug', 100).unique().notNullable();
    t.text('address');
    t.string('phone', 20);
    t.string('timezone', 50).defaultTo('America/New_York');
    t.time('dismissal_time').defaultTo('15:00');
    t.jsonb('settings').defaultTo('{}');
    t.timestamps(true, true);
  });

  // users
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('email', 255).unique().notNullable();
    t.string('password_hash', 255);
    t.string('google_id', 255).unique();
    t.string('first_name', 100).notNullable();
    t.string('last_name', 100).notNullable();
    t.string('phone', 20);
    t.text('photo_url');
    t.string('check_in_method', 20).defaultTo('app');
    t.jsonb('notification_prefs').defaultTo(JSON.stringify({
      push: true, sms: true, email: false,
      dismissal_alerts: true, change_confirmations: true, arrival_reminders: true,
    }));
    t.timestamps(true, true);
  });

  // school_memberships
  await knex.schema.createTable('school_memberships', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('school_id').notNullable().references('id').inTable('schools').onDelete('CASCADE');
    t.string('role', 20).notNullable();
    t.string('status', 20).defaultTo('active');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'school_id', 'role']);
  });

  // homerooms
  await knex.schema.createTable('homerooms', (t) => {
    t.increments('id').primary();
    t.integer('school_id').notNullable().references('id').inTable('schools').onDelete('CASCADE');
    t.integer('teacher_id').references('id').inTable('users');
    t.string('name', 100).notNullable();
    t.string('grade', 10).notNullable();
    t.string('room', 20);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // students
  await knex.schema.createTable('students', (t) => {
    t.increments('id').primary();
    t.integer('school_id').notNullable().references('id').inTable('schools').onDelete('CASCADE');
    t.integer('homeroom_id').references('id').inTable('homerooms');
    t.string('external_id', 100);
    t.string('first_name', 100).notNullable();
    t.string('last_name', 100).notNullable();
    t.string('grade', 10);
    t.string('email', 255);
    t.text('photo_url');
    t.string('dismissal_type', 20).defaultTo('car');
    t.string('bus_route', 20);
    t.string('student_code', 6).unique();
    t.string('status', 20).defaultTo('active');
    t.timestamps(true, true);
  });

  // parent_student
  await knex.schema.createTable('parent_student', (t) => {
    t.increments('id').primary();
    t.integer('parent_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('student_id').notNullable().references('id').inTable('students').onDelete('CASCADE');
    t.string('relationship', 50).notNullable();
    t.boolean('is_primary').defaultTo(false);
    t.string('status', 20).defaultTo('approved');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['parent_id', 'student_id']);
  });

  // authorized_pickups
  await knex.schema.createTable('authorized_pickups', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable().references('id').inTable('students').onDelete('CASCADE');
    t.integer('added_by').notNullable().references('id').inTable('users');
    t.string('name', 255).notNullable();
    t.string('relationship', 100).notNullable();
    t.string('phone', 20);
    t.text('photo_url');
    t.string('status', 20).defaultTo('pending');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // custody_alerts
  await knex.schema.createTable('custody_alerts', (t) => {
    t.increments('id').primary();
    t.integer('student_id').notNullable().references('id').inTable('students').onDelete('CASCADE');
    t.string('person_name', 255).notNullable();
    t.string('alert_type', 50).notNullable();
    t.text('notes');
    t.string('court_order', 100);
    t.integer('created_by').references('id').inTable('users');
    t.boolean('active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // bus_routes
  await knex.schema.createTable('bus_routes', (t) => {
    t.increments('id').primary();
    t.integer('school_id').notNullable().references('id').inTable('schools').onDelete('CASCADE');
    t.string('route_number', 20).notNullable();
    t.time('departure_time');
    t.string('status', 20).defaultTo('waiting');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // walker_zones
  await knex.schema.createTable('walker_zones', (t) => {
    t.increments('id').primary();
    t.integer('school_id').notNullable().references('id').inTable('schools').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.string('status', 20).defaultTo('closed');
  });
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    'walker_zones', 'bus_routes', 'custody_alerts', 'authorized_pickups',
    'parent_student', 'students', 'homerooms', 'school_memberships', 'users', 'schools',
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
}
