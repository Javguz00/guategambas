ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "images" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "brand" TEXT;

-- Backfill gallery from legacy single-image column for existing products
UPDATE "Product"
SET "images" = ARRAY["image"]
WHERE "image" IS NOT NULL
  AND "image" <> ''
  AND coalesce(array_length("images", 1), 0) = 0;
