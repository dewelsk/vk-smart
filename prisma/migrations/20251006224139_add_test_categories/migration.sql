-- CreateTable
CREATE TABLE "test_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TestTyp",
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "test_categories_name_key" ON "test_categories"("name");

-- AlterTable
ALTER TABLE "tests" ADD COLUMN "categoryId" TEXT;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "test_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
