-- AlterTable
ALTER TABLE "AccessLink" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;
