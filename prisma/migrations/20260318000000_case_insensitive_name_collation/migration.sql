-- Create a case-insensitive ICU collation for ORDER BY sorting
CREATE COLLATION IF NOT EXISTS "case_insensitive" (provider = icu, locale = 'und-u-ks-level2', deterministic = false);

-- Change name columns to use case-insensitive collation
ALTER TABLE "artists" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "case_insensitive";
ALTER TABLE "albums" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "case_insensitive";
ALTER TABLE "tracks" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "case_insensitive";
ALTER TABLE "records" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "case_insensitive";
ALTER TABLE "owners" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "case_insensitive";
