import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@gopilot.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'changeme123';
  const hash = await bcrypt.hash(password, 12);

  await knex.raw(
    `INSERT INTO users (email, password_hash, first_name, last_name, is_super_admin)
     VALUES (?, ?, 'Super', 'Admin', true)
     ON CONFLICT (email) DO UPDATE SET is_super_admin = true`,
    [email, hash]
  );

  console.log(`Super admin seeded: ${email}`);
}
