-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REGISTERED');

-- CreateTable
CREATE TABLE "Nonce" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "creatorWallet" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nonce_nonce_key" ON "Nonce"("nonce");

-- CreateIndex
CREATE INDEX "Nonce_wallet_idx" ON "Nonce"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "Content_contractId_key" ON "Content"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "Content_sha256_key" ON "Content"("sha256");

-- CreateIndex
CREATE INDEX "Content_creatorWallet_idx" ON "Content"("creatorWallet");

-- CreateIndex
CREATE INDEX "Content_status_idx" ON "Content"("status");
