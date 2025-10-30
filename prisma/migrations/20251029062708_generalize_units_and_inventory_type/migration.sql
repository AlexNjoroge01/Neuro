BEGIN;

-- InventoryLog changes (as before)
ALTER TABLE "InventoryLog" ADD COLUMN "type" TEXT;

UPDATE "InventoryLog"
SET "type" = CASE
  WHEN "change" < 0 THEN 'REMOVE'
  ELSE 'ADD'
END;

UPDATE "InventoryLog" SET "change" = ABS("change");
ALTER TABLE "InventoryLog" ALTER COLUMN "type" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InventoryChangeType') THEN
    CREATE TYPE "InventoryChangeType" AS ENUM ('ADD', 'REMOVE');
  END IF;
END$$;

ALTER TABLE "InventoryLog"
ALTER COLUMN "type"
TYPE "InventoryChangeType"
USING "type"::"InventoryChangeType";

-- Product.unit: drop default first, then change type to TEXT
ALTER TABLE "Product" ALTER COLUMN "unit" DROP DEFAULT;
ALTER TABLE "Product"
ALTER COLUMN "unit" TYPE TEXT USING "unit"::text;

-- Finally, drop the old enum if it still exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductUnit') THEN
    DROP TYPE "ProductUnit";
  END IF;
END$$;

COMMIT;