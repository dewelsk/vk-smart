-- CreateTable
CREATE TABLE "security_settings" (
    "id" TEXT NOT NULL,
    "maxFailedAttempts" INTEGER NOT NULL DEFAULT 5,
    "blockDurationMinutes" INTEGER NOT NULL DEFAULT 15,
    "blockWindowMinutes" INTEGER NOT NULL DEFAULT 15,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "security_settings" ADD CONSTRAINT "security_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
