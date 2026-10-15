-- AlterTable
ALTER TABLE "likes" ADD COLUMN     "cassette_id" BIGINT;

-- AlterTable
ALTER TABLE "sync_jobs" ADD COLUMN     "media_type" TEXT NOT NULL DEFAULT 'record';

-- CreateTable
CREATE TABLE "cassettes" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "bar" INTEGER NOT NULL,
    "side_a_first_track" TEXT,
    "side_b_first_track" TEXT,
    "comment" TEXT,
    "artist_id" BIGINT,
    "owner_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cassettes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cassettes_artist_id_idx" ON "cassettes"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "cassettes_bar_location_number_key" ON "cassettes"("bar", "location", "number");

-- CreateIndex
CREATE INDEX "likes_cassette_id_idx" ON "likes"("cassette_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_session_id_cassette_id_key" ON "likes"("session_id", "cassette_id");

-- AddForeignKey
ALTER TABLE "cassettes" ADD CONSTRAINT "cassettes_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cassettes" ADD CONSTRAINT "cassettes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_cassette_id_fkey" FOREIGN KEY ("cassette_id") REFERENCES "cassettes"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Match the existing protection of application tables.
ALTER TABLE "public"."cassettes" ENABLE ROW LEVEL SECURITY;
