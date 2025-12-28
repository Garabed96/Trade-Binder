import { createPool, sql } from 'slonik';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Create the pool
export const pool = await createPool(connectionString);

// Export sql for template literals
export { sql };
