/*
  Warnings:

  - The primary key for the `Container` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `Container` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Container" DROP CONSTRAINT "Container_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_containerId_fkey";

-- DropForeignKey
ALTER TABLE "Share" DROP CONSTRAINT "Share_containerId_fkey";

-- DropForeignKey
ALTER TABLE "_ContainerToTag" DROP CONSTRAINT "_ContainerToTag_A_fkey";

-- AlterTable
ALTER TABLE "Container" DROP CONSTRAINT "Container_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "parentId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Container_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Container_id_seq";

-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "containerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Share" ALTER COLUMN "containerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_ContainerToTag" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Container_id_key" ON "Container"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Container"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContainerToTag" ADD CONSTRAINT "_ContainerToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;
