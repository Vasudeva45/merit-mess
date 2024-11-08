/*
  Warnings:

  - A unique constraint covering the columns `[viewUrl]` on the table `ProjectFile` will be added. If there are existing duplicate values, this will fail.
  - The required column `viewUrl` was added to the `ProjectFile` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
-- Add viewUrl column as optional first
ALTER TABLE "ProjectFile" ADD COLUMN "viewUrl" TEXT;

-- Generate UUIDs for existing records
UPDATE "ProjectFile" 
SET "viewUrl" = gen_random_uuid()::TEXT
WHERE "viewUrl" IS NULL;

-- Make the column required and unique
ALTER TABLE "ProjectFile" 
ALTER COLUMN "viewUrl" SET NOT NULL,
ADD CONSTRAINT "ProjectFile_viewUrl_key" UNIQUE ("viewUrl");

-- Add the default for new records
ALTER TABLE "ProjectFile" 
ALTER COLUMN "viewUrl" SET DEFAULT gen_random_uuid()::TEXT;