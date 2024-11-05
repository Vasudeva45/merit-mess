/*
  Warnings:

  - A unique constraint covering the columns `[uid]` on the table `ProjectGroup` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uid` to the `ProjectGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProjectGroup" ADD COLUMN     "uid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectGroup_uid_key" ON "ProjectGroup"("uid");
