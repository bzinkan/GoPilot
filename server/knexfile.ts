import type { Knex } from 'knex';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || 'gopilot',
    password: process.env.POSTGRES_PASSWORD || 'gopilot_dev',
    database: process.env.POSTGRES_DB || 'gopilot',
  },
  migrations: {
    directory: './src/db/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './src/db/seeds',
    extension: 'ts',
  },
};

export default config;
