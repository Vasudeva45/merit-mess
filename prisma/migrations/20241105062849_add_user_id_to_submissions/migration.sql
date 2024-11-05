/*
  Warnings:

  - Added the required column `userId` to the `FormSubmissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FormSubmissions" ADD COLUMN     "userId" TEXT NOT NULL;
