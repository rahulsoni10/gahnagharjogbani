-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "makingChargePct" DOUBLE PRECISION,
ADD COLUMN "makingChargeAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "makingChargePct",
DROP COLUMN "makingChargeAmount";
