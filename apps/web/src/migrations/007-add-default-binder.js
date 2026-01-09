export async function up(client) {
  await client.query(`
    -- Add default_binder_id column to users table
    ALTER TABLE users
    ADD COLUMN default_binder_id uuid REFERENCES binders(id) ON DELETE SET NULL;

    -- Create index for performance
    CREATE INDEX idx_users_default_binder_id ON users(default_binder_id);

    -- Set existing users' first binder (alphabetically) as their default
    -- Only set if they have at least one binder
    WITH first_binders AS (
      SELECT DISTINCT ON (user_id)
        user_id,
        id as binder_id
      FROM binders
      ORDER BY user_id, name ASC
    )
    UPDATE users u
    SET default_binder_id = fb.binder_id
    FROM first_binders fb
    WHERE u.id = fb.user_id;
  `);
}

export async function down(client) {
  await client.query(`
    DROP INDEX IF EXISTS idx_users_default_binder_id;
    ALTER TABLE users DROP COLUMN IF EXISTS default_binder_id;
  `);
}
