-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "reported" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reportedAt" TIMESTAMP(3);
