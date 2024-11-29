-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "availableForMentorship" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mentorExpertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mentorRating" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "mentoredProjects" JSONB[] DEFAULT ARRAY[]::JSONB[],
ADD COLUMN     "yearsOfExperience" INTEGER;

-- AlterTable
ALTER TABLE "ProjectGroup" ADD COLUMN     "mentorId" TEXT;

-- AddForeignKey
ALTER TABLE "ProjectGroup" ADD CONSTRAINT "ProjectGroup_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Profile"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
