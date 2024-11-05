-- CreateTable
CREATE TABLE "Form" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '[]',
    "visits" INTEGER NOT NULL DEFAULT 0,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    "shareURL" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT '',
    "specialization" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmissions" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FormSubmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'student',
    "title" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "email" TEXT,
    "github" TEXT,
    "linkedin" TEXT,
    "organization" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ongoing_projects" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectGroup" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "formId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "ProjectGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Form_uid_key" ON "Form"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Form_shareURL_key" ON "Form"("shareURL");

-- CreateIndex
CREATE UNIQUE INDEX "Form_name_userId_key" ON "Form"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectGroup_uid_key" ON "ProjectGroup"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectGroup_formId_key" ON "ProjectGroup"("formId");

-- AddForeignKey
ALTER TABLE "FormSubmissions" ADD CONSTRAINT "FormSubmissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmissions" ADD CONSTRAINT "FormSubmissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectGroup" ADD CONSTRAINT "ProjectGroup_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProjectGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
