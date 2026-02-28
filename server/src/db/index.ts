import { Pool } from 'pg';
import knexLib from 'knex';
import knexConfig from '../../knexfile';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const knex = knexLib(knexConfig);

export default pool;
