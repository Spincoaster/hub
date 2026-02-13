-- CreateTable
CREATE TABLE "likes" (
    "id" BIGSERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "record_id" BIGINT,
    "track_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "likes_session_id_record_id_key" ON "likes"("session_id", "record_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_session_id_track_id_key" ON "likes"("session_id", "track_id");

-- CreateIndex
CREATE INDEX "likes_session_id_idx" ON "likes"("session_id");

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
