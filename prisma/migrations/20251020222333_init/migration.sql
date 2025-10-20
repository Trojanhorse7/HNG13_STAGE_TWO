-- CreateTable
CREATE TABLE "StringAnalysis" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "isPalindrome" BOOLEAN NOT NULL,
    "uniqueCharacters" INTEGER NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "sha256Hash" TEXT NOT NULL,
    "characterFrequencyMap" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StringAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StringAnalysis_id_key" ON "StringAnalysis"("id");
