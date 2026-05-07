-- Lock public.* tables from Supabase PostgREST (anon/authenticated roles).
-- Prisma connects as `postgres` which bypasses RLS, so app behavior is unchanged.
ALTER TABLE "public"."admins"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."albums"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."artists"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bars"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."feature_items"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."features"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."news_entries"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."owners"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."records"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tracks"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."likes"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."labels"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sync_jobs"      ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES    IN SCHEMA "public" FROM anon;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM anon;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES    IN SCHEMA "public" FROM authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM authenticated;
  END IF;
END
$$;
