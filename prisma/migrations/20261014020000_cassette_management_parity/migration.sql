-- AlterTable
ALTER TABLE "cassettes" ADD COLUMN     "furigana" TEXT,
ADD COLUMN     "phonetic_name" TEXT;

-- AlterTable
ALTER TABLE "ranking_adjustments" ADD COLUMN     "cassette_id" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "ranking_adjustments_cassette_id_key" ON "ranking_adjustments"("cassette_id");

-- AddForeignKey
ALTER TABLE "ranking_adjustments" ADD CONSTRAINT "ranking_adjustments_cassette_id_fkey" FOREIGN KEY ("cassette_id") REFERENCES "cassettes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A correction still targets exactly one physical item or track.
ALTER TABLE "ranking_adjustments"
  DROP CONSTRAINT "ranking_adjustments_single_target_check",
  ADD CONSTRAINT "ranking_adjustments_single_target_check"
  CHECK (num_nonnulls("record_id", "track_id", "cassette_id") = 1);
