export const up = async client => {
  await client.query(`
    -- Add target_capacity to binders table
    ALTER TABLE binders ADD COLUMN target_capacity INTEGER DEFAULT 100;

    -- Set existing binders to NULL to distinguish them from newly created binders
    UPDATE binders SET target_capacity = NULL;

    -- Add check constraint to ensure positive capacity
    ALTER TABLE binders ADD CONSTRAINT binders_capacity_positive
      CHECK (target_capacity IS NULL OR target_capacity > 0);
  `);
};

export const down = async client => {
  await client.query(`
    ALTER TABLE binders DROP CONSTRAINT IF EXISTS binders_capacity_positive;
    ALTER TABLE binders DROP COLUMN IF EXISTS target_capacity;
  `);
};
