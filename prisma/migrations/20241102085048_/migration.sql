/*
  Warnings:

  - You are about to drop the column `domain` on the `Form` table. All the data in the column will be lost.
  - You are about to drop the column `specialization` on the `Form` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Form" DROP COLUMN "domain",
DROP COLUMN "specialization";
