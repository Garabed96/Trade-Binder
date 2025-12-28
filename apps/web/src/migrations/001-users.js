export const up = async (client) => {
  await client.query(`
    CREATE TABLE users
    (
        id         uuid PRIMARY KEY         DEFAULT gen_random_uuid(),
        username   TEXT NOT NULL UNIQUE,
        email      TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE binders
    (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     uuid REFERENCES users (id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        description TEXT
    );
  `);
};

export const down = async (client) => {
  await client.query(`
    DROP TABLE IF EXISTS binders;
    DROP TABLE IF EXISTS users;
  `);
};
