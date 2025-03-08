/*
  Warnings:

  - You are about to drop the `_LectureToPhilosophicalEntity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reflection_prompts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `promptId` on the `reflections` table. All the data in the column will be lost.
  - Added the required column `discussionPrompts` to the `lectures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preLecturePrompt` to the `lectures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promptType` to the `reflections` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_LectureToPhilosophicalEntity_B_index";

-- DropIndex
DROP INDEX "_LectureToPhilosophicalEntity_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_LectureToPhilosophicalEntity";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "reflection_prompts";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "lecture_entity_relations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lectureId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    CONSTRAINT "lecture_entity_relations_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lecture_entity_relations_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "philosophical_entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "preLecturePrompt" TEXT NOT NULL,
    "initialPrompt" TEXT NOT NULL,
    "masteryPrompt" TEXT NOT NULL,
    "evaluationPrompt" TEXT NOT NULL,
    "discussionPrompts" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_lectures" ("category", "contentType", "contentUrl", "createdAt", "description", "embedAllowed", "evaluationPrompt", "id", "initialPrompt", "lecturerName", "masteryPrompt", "order", "sourceAttribution", "title", "updatedAt") SELECT "category", "contentType", "contentUrl", "createdAt", "description", "embedAllowed", "evaluationPrompt", "id", "initialPrompt", "lecturerName", "masteryPrompt", "order", "sourceAttribution", "title", "updatedAt" FROM "lectures";
DROP TABLE "lectures";
ALTER TABLE "new_lectures" RENAME TO "lectures";
CREATE TABLE "new_philosophical_entities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "birthplace" TEXT,
    "nationality" TEXT,
    "biography" TEXT,
    "ontologicalPosition" TEXT,
    "primaryText" TEXT,
    "keyTerms" TEXT,
    "centralQuestion" TEXT,
    "stillRelevant" BOOLEAN DEFAULT true,
    "scope" TEXT,
    "geographicalFocus" TEXT,
    "historicalContext" TEXT,
    "lectureId" TEXT,
    CONSTRAINT "philosophical_entities_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_philosophical_entities" ("biography", "birthplace", "centralQuestion", "createdAt", "description", "endYear", "geographicalFocus", "historicalContext", "id", "keyTerms", "name", "nationality", "ontologicalPosition", "primaryText", "scope", "startYear", "stillRelevant", "type", "updatedAt") SELECT "biography", "birthplace", "centralQuestion", "createdAt", "description", "endYear", "geographicalFocus", "historicalContext", "id", "keyTerms", "name", "nationality", "ontologicalPosition", "primaryText", "scope", "startYear", "stillRelevant", "type", "updatedAt" FROM "philosophical_entities";
DROP TABLE "philosophical_entities";
ALTER TABLE "new_philosophical_entities" RENAME TO "philosophical_entities";
CREATE TABLE "new_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
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
CREATE TABLE "new_reflections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "promptType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "aiEvaluation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "score" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reflections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reflections_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_reflections" ("aiEvaluation", "content", "createdAt", "id", "lectureId", "score", "updatedAt", "userId") SELECT "aiEvaluation", "content", "createdAt", "id", "lectureId", "score", "updatedAt", "userId" FROM "reflections";
DROP TABLE "reflections";
ALTER TABLE "new_reflections" RENAME TO "reflections";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "lecture_entity_relations_lectureId_entityId_relationType_key" ON "lecture_entity_relations"("lectureId", "entityId", "relationType");
