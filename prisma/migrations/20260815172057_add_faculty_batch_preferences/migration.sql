-- CreateTable
CREATE TABLE "FacultyPreferredBatch" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "preferenceRank" INTEGER NOT NULL,

    CONSTRAINT "FacultyPreferredBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FacultyPreferredBatch_facultyId_idx" ON "FacultyPreferredBatch"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyPreferredBatch_batchId_idx" ON "FacultyPreferredBatch"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyPreferredBatch_facultyId_batchId_key" ON "FacultyPreferredBatch"("facultyId", "batchId");

-- AddForeignKey
ALTER TABLE "FacultyPreferredBatch" ADD CONSTRAINT "FacultyPreferredBatch_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyPreferredBatch" ADD CONSTRAINT "FacultyPreferredBatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
