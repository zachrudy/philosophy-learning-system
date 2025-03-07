/*
  Warnings:

  - You are about to drop the column `endDate` on the `philosophical_entities` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `philosophical_entities` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "historicalContext" TEXT
);
INSERT INTO "new_philosophical_entities" ("biography", "birthplace", "centralQuestion", "createdAt", "description", "geographicalFocus", "historicalContext", "id", "keyTerms", "name", "nationality", "primaryText", "scope", "stillRelevant", "type", "updatedAt") SELECT "biography", "birthplace", "centralQuestion", "createdAt", "description", "geographicalFocus", "historicalContext", "id", "keyTerms", "name", "nationality", "primaryText", "scope", "stillRelevant", "type", "updatedAt" FROM "philosophical_entities";
DROP TABLE "philosophical_entities";
ALTER TABLE "new_philosophical_entities" RENAME TO "philosophical_entities";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
