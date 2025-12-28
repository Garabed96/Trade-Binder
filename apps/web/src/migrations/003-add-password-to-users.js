export const up = async (client) => {
  await client.query(`
    ALTER TABLE users ADD COLUMN password_hash TEXT;
  `);
};

export const down = async (client) => {
  await client.query(`
    ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
  `);
};
