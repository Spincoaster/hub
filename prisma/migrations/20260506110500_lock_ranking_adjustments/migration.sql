-- Lock ranking_adjustments from Supabase PostgREST (anon/authenticated roles).
-- Prisma connects as `postgres` which bypasses RLS, so app behavior is unchanged.
ALTER TABLE "public"."ranking_adjustments" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "public"."ranking_adjustments" FROM anon;
    REVOKE ALL ON SEQUENCE "public"."ranking_adjustments_id_seq" FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "public"."ranking_adjustments" FROM authenticated;
    REVOKE ALL ON SEQUENCE "public"."ranking_adjustments_id_seq" FROM authenticated;
  END IF;
END
$$;
