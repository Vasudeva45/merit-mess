-- CreateTable
CREATE TABLE "MentorVerification" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "githubUsername" TEXT,
    "githubVerified" BOOLEAN NOT NULL DEFAULT false,
    "githubData" JSONB,
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "documents" JSONB DEFAULT '[]',
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorVerification_userId_key" ON "MentorVerification"("userId");

-- AddForeignKey
ALTER TABLE "MentorVerification" ADD CONSTRAINT "MentorVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
