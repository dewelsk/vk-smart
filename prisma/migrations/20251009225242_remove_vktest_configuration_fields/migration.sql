-- AlterTable
-- Remove configuration fields from vk_tests table
-- These values will now be read directly from the Test table

ALTER TABLE "vk_tests" DROP COLUMN "questionCount";
ALTER TABLE "vk_tests" DROP COLUMN "durationMinutes";
ALTER TABLE "vk_tests" DROP COLUMN "scorePerQuestion";
ALTER TABLE "vk_tests" DROP COLUMN "minScore";
ALTER TABLE "vk_tests" DROP COLUMN "questionSelectionMode";
