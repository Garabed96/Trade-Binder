export const up = async (client) => {
  await client.query(`
    ALTER TABLE users ADD COLUMN registration_complete BOOLEAN DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN latitude DOUBLE PRECISION;
    ALTER TABLE users ADD COLUMN longitude DOUBLE PRECISION;
    ALTER TABLE users ADD COLUMN location_name TEXT;
    ALTER TABLE users ADD COLUMN bio TEXT;
  `);
};

export const down = async (client) => {
  await client.query(`
    ALTER TABLE users DROP COLUMN IF EXISTS registration_complete;
    ALTER TABLE users DROP COLUMN IF EXISTS latitude;
    ALTER TABLE users DROP COLUMN IF EXISTS longitude;
    ALTER TABLE users DROP COLUMN IF EXISTS location_name;
    ALTER TABLE users DROP COLUMN IF EXISTS bio;
  `);
};
