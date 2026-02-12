-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" BIGSERIAL NOT NULL,
    "bar" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "result" TEXT,
    "error" TEXT,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_jobs_bar_status_idx" ON "sync_jobs"("bar", "status");
