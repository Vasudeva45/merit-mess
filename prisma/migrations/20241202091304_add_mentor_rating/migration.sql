-- CreateTable
CREATE TABLE "MentorRating" (
    "id" SERIAL NOT NULL,
    "mentorId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorRating_mentorId_raterId_key" ON "MentorRating"("mentorId", "raterId");

-- AddForeignKey
ALTER TABLE "MentorRating" ADD CONSTRAINT "MentorRating_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Profile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorRating" ADD CONSTRAINT "MentorRating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "Profile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
