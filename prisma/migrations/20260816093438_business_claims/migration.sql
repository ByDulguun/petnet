-- CreateEnum
CREATE TYPE "BusinessClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "BusinessClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "district" TEXT,
    "description" TEXT,
    "status" "BusinessClaimStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessClaim_status_idx" ON "BusinessClaim"("status");

-- CreateIndex
CREATE INDEX "BusinessClaim_userId_idx" ON "BusinessClaim"("userId");

-- AddForeignKey
ALTER TABLE "BusinessClaim" ADD CONSTRAINT "BusinessClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClaim" ADD CONSTRAINT "BusinessClaim_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClaim" ADD CONSTRAINT "BusinessClaim_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BusinessCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
