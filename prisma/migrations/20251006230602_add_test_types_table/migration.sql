-- CreateTable
CREATE TABLE "test_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "test_types_name_key" ON "test_types"("name");

-- AlterTable
ALTER TABLE "test_categories" DROP COLUMN "type";
ALTER TABLE "test_categories" ADD COLUMN "typeId" TEXT;

-- AddForeignKey
ALTER TABLE "test_categories" ADD CONSTRAINT "test_categories_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "test_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
