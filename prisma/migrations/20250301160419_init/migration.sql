-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "concepts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "concept_prerequisites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prerequisiteId" TEXT NOT NULL,
    "dependentConceptId" TEXT NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "concept_prerequisites_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "concepts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "concept_prerequisites_dependentConceptId_fkey" FOREIGN KEY ("dependentConceptId") REFERENCES "concepts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lectures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "watch_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lectureId" TEXT NOT NULL,
    "timeInSec" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "prompt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "watch_points_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT,
    "lectureId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "lastViewed" DATETIME,
    "completedAt" DATETIME,
    "decayFactor" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reflections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "aiEvaluation" TEXT,
    "score" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reflections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reflections_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reflections_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "reflection_prompts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reflection_prompts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conceptId" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "promptType" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reflection_prompts_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ConceptToLecture" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ConceptToLecture_A_fkey" FOREIGN KEY ("A") REFERENCES "concepts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ConceptToLecture_B_fkey" FOREIGN KEY ("B") REFERENCES "lectures" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "concept_prerequisites_prerequisiteId_dependentConceptId_key" ON "concept_prerequisites"("prerequisiteId", "dependentConceptId");

-- CreateIndex
CREATE UNIQUE INDEX "progress_userId_lectureId_key" ON "progress"("userId", "lectureId");

-- CreateIndex
CREATE UNIQUE INDEX "_ConceptToLecture_AB_unique" ON "_ConceptToLecture"("A", "B");

-- CreateIndex
CREATE INDEX "_ConceptToLecture_B_index" ON "_ConceptToLecture"("B");
