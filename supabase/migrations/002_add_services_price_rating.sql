-- Migration: add price/rating columns and helpful indexes for services
-- Safe to run multiple times (IF NOT EXISTS guards where possible).

-- 1) Columns
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS price NUMERIC(10,2);

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) CHECK (rating >= 1 AND rating <= 5);

-- 2) Indexes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_services_price'
  ) THEN
    EXECUTE 'CREATE INDEX idx_services_price ON services(price)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_services_rating'
  ) THEN
    EXECUTE 'CREATE INDEX idx_services_rating ON services(rating)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_services_created_at'
  ) THEN
    EXECUTE 'CREATE INDEX idx_services_created_at ON services(created_at)';
  END IF;

  -- GIN index for array membership on tags
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_services_tags_gin'
  ) THEN
    EXECUTE 'CREATE INDEX idx_services_tags_gin ON services USING GIN (tags)';
  END IF;
END $$;

-- 3) Optional: set price=0 to NULL to unify "free" semantics (commented; enable if desired)
-- UPDATE services SET price = NULL WHERE price = 0;

