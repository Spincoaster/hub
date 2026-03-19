-- Revert columns to default collation
ALTER TABLE "artists" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "default";
ALTER TABLE "albums" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "default";
ALTER TABLE "tracks" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "default";
ALTER TABLE "records" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "default";
ALTER TABLE "owners" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "default";

-- Drop and recreate collation as deterministic (allows LIKE/ILIKE)
DROP COLLATION IF EXISTS "case_insensitive";
CREATE COLLATION "case_insensitive" (provider = icu, locale = 'und-u-ks-level2', deterministic = true);

-- Re-apply collation to name columns
ALTER TABLE "artists" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "case_insensitive";
ALTER TABLE "albums" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "case_insensitive";
ALTER TABLE "tracks" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "case_insensitive";
ALTER TABLE "records" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "case_insensitive";
ALTER TABLE "owners" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "case_insensitive";
