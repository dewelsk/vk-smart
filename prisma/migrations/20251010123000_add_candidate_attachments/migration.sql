-- CreateEnum
CREATE TYPE "CandidateAttachmentType" AS ENUM ('CV', 'MOTIVATION', 'CERTIFICATE', 'OTHER', 'UNKNOWN');

-- CreateTable
CREATE TABLE "candidate_attachments" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "vkId" TEXT NOT NULL,
    "documentType" "CandidateAttachmentType" NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storedFileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_candidate_attachment_candidate_vk" ON "candidate_attachments"("candidateId", "vkId");

-- AddForeignKey
ALTER TABLE "candidate_attachments" ADD CONSTRAINT "candidate_attachments_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_attachments" ADD CONSTRAINT "candidate_attachments_vkId_fkey" FOREIGN KEY ("vkId") REFERENCES "vyberove_konania"("id") ON DELETE CASCADE ON UPDATE CASCADE;
