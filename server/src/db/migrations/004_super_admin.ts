import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add is_super_admin to users
  await knex.schema.alterTable('users', (t) => {
    t.boolean('is_super_admin').defaultTo(false);
  });

  // Add status/billing/soft-delete fields to schools
  await knex.schema.alterTable('schools', (t) => {
    t.string('status', 20).defaultTo('active');
    t.integer('max_students');
    t.timestamp('trial_ends_at');
    t.string('billing_email', 255);
    t.timestamp('deleted_at');
  });

  // Trial requests table
  await knex.schema.createTable('trial_requests', (t) => {
    t.increments('id').primary();
    t.string('school_name', 255).notNullable();
    t.string('domain', 255);
    t.string('contact_name', 255).notNullable();
    t.string('contact_email', 255).notNullable();
    t.integer('estimated_students');
    t.text('message');
    t.string('status', 20).defaultTo('pending');
    t.text('notes');
    t.integer('converted_school_id').references('id').inTable('schools');
    t.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX trial_requests_status_idx ON trial_requests (status)');
  await knex.raw('CREATE INDEX trial_requests_email_idx ON trial_requests (LOWER(contact_email))');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('trial_requests');
  await knex.schema.alterTable('schools', (t) => {
    t.dropColumn('status');
    t.dropColumn('max_students');
    t.dropColumn('trial_ends_at');
    t.dropColumn('billing_email');
    t.dropColumn('deleted_at');
  });
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('is_super_admin');
  });
}
