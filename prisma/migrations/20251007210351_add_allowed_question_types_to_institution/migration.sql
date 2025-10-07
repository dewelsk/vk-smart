-- AlterTable
ALTER TABLE "institutions" ADD COLUMN "allowedQuestionTypes" JSONB DEFAULT '["SINGLE_CHOICE"]';
