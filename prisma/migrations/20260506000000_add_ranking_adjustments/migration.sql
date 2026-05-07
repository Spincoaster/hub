-- CreateTable
CREATE TABLE "ranking_adjustments" (
    "id" BIGSERIAL NOT NULL,
    "record_id" BIGINT,
    "track_id" BIGINT,
    "score_delta" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_adjustments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ranking_adjustments_single_target_check" CHECK (
        ("record_id" IS NOT NULL AND "track_id" IS NULL) OR
        ("record_id" IS NULL AND "track_id" IS NOT NULL)
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "ranking_adjustments_record_id_key" ON "ranking_adjustments"("record_id");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_adjustments_track_id_key" ON "ranking_adjustments"("track_id");

-- AddForeignKey
ALTER TABLE "ranking_adjustments" ADD CONSTRAINT "ranking_adjustments_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_adjustments" ADD CONSTRAINT "ranking_adjustments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
