-- CreateEnum
CREATE TYPE "Metal" AS ENUM ('GOLD', 'SILVER');

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "purityPercent" DOUBLE PRECISION NOT NULL,
    "grossWeightGrams" DOUBLE PRECISION,
    "netWeightGrams" DOUBLE PRECISION NOT NULL,
    "makingChargePct" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "photoUrl" TEXT,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rate" (
    "id" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "pricePerGram" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_itemCode_key" ON "Item"("itemCode");

-- CreateIndex
CREATE UNIQUE INDEX "Rate_metal_key" ON "Rate"("metal");
