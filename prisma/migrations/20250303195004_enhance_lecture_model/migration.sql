/*
  Warnings:

  - You are about to drop the `_ConceptToLecture` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `concept_prerequisites` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `concepts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `watch_points` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `duration` on the `lectures` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `lectures` table. All the data in the column will be lost.
  - You are about to drop the column `conceptId` on the `progress` table. All the data in the column will be lost.
  - Added the required column `category` to the `lectures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentType` to the `lectures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentUrl` to the `lectures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `evaluationPrompt` to the `lectures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initialPrompt` to the `lectures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lecturerName` to the `lectures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `masteryPrompt` to the `lectures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceAttribution` to the `lectures` table without a default value. This is not possible if the table is not empty.
  - Made the column `lectureId` on table `progress` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "_ConceptToLecture_B_index";

-- DropIndex
DROP INDEX "_ConceptToLecture_AB_unique";

-- DropIndex
DROP INDEX "concept_prerequisites_prerequisiteId_dependentConceptId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ConceptToLecture";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "concept_prerequisites";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "concepts";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "watch_points";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "philosophical_entities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "birthplace" TEXT,
    "nationality" TEXT,
    "biography" TEXT,
    "primaryText" TEXT,
    "keyTerms" TEXT,
    "centralQuestion" TEXT,
    "stillRelevant" BOOLEAN DEFAULT true,
    "scope" TEXT,
    "geographicalFocus" TEXT,
    "historicalContext" TEXT
);

-- CreateTable
CREATE TABLE "philosophical_relations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceEntityId" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "relationTypes" TEXT NOT NULL,
    "description" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "philosophical_relations_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "philosophical_entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "philosophical_relations_targetEntityId_fkey" FOREIGN KEY ("targetEntityId") REFERENCES "philosophical_entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lecture_prerequisites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lectureId" TEXT NOT NULL,
    "prerequisiteLectureId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "importanceLevel" INTEGER NOT NULL DEFAULT 3,
    CONSTRAINT "lecture_prerequisites_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lecture_prerequisites_prerequisiteLectureId_fkey" FOREIGN KEY ("prerequisiteLectureId") REFERENCES "lectures" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_LectureToPhilosophicalEntity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_LectureToPhilosophicalEntity_A_fkey" FOREIGN KEY ("A") REFERENCES "lectures" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_LectureToPhilosophicalEntity_B_fkey" FOREIGN KEY ("B") REFERENCES "philosophical_entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_lectures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contentUrl" TEXT NOT NULL,
    "lecturerName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "embedAllowed" BOOLEAN NOT NULL DEFAULT true,
    "sourceAttribution" TEXT NOT NULL,
    "initialPrompt" TEXT NOT NULL,
    "masteryPrompt" TEXT NOT NULL,
    "evaluationPrompt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_lectures" ("createdAt", "description", "id", "order", "title", "updatedAt") SELECT "createdAt", "description", "id", "order", "title", "updatedAt" FROM "lectures";
DROP TABLE "lectures";
ALTER TABLE "new_lectures" RENAME TO "lectures";
CREATE TABLE "new_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "lastViewed" DATETIME,
    "completedAt" DATETIME,
    "decayFactor" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "progress_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_progress" ("completedAt", "createdAt", "decayFactor", "id", "lastViewed", "lectureId", "status", "updatedAt", "userId") SELECT "completedAt", "createdAt", "decayFactor", "id", "lastViewed", "lectureId", "status", "updatedAt", "userId" FROM "progress";
DROP TABLE "progress";
ALTER TABLE "new_progress" RENAME TO "progress";
CREATE UNIQUE INDEX "progress_userId_lectureId_key" ON "progress"("userId", "lectureId");
CREATE TABLE "new_reflection_prompts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conceptId" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "promptType" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reflection_prompts_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "philosophical_entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_reflection_prompts" ("conceptId", "createdAt", "difficulty", "id", "promptText", "promptType", "updatedAt") SELECT "conceptId", "createdAt", "difficulty", "id", "promptText", "promptType", "updatedAt" FROM "reflection_prompts";
DROP TABLE "reflection_prompts";
ALTER TABLE "new_reflection_prompts" RENAME TO "reflection_prompts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "philosophical_relations_sourceEntityId_targetEntityId_description_key" ON "philosophical_relations"("sourceEntityId", "targetEntityId", "description");

-- CreateIndex
CREATE UNIQUE INDEX "lecture_prerequisites_lectureId_prerequisiteLectureId_key" ON "lecture_prerequisites"("lectureId", "prerequisiteLectureId");

-- CreateIndex
CREATE UNIQUE INDEX "_LectureToPhilosophicalEntity_AB_unique" ON "_LectureToPhilosophicalEntity"("A", "B");

-- CreateIndex
CREATE INDEX "_LectureToPhilosophicalEntity_B_index" ON "_LectureToPhilosophicalEntity"("B");
