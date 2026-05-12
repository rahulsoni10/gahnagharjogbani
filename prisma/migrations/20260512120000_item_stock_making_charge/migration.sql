-- Making charge at stock acquisition (mirrors fields on Sale for sale-time charges).
ALTER TABLE "Item" ADD COLUMN "makingChargePct" DOUBLE PRECISION,
ADD COLUMN "makingChargeAmount" DOUBLE PRECISION;
