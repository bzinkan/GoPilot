import { Pool } from 'pg';
import knexLib from 'knex';
import type { Knex } from 'knex';

const knexConfig: Knex.Config = {
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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const knex = knexLib(knexConfig);

export default pool;
