UPDATE "Item"
SET "purityPercent" = 91.66
WHERE "metal" = 'GOLD'
  AND ABS("purityPercent" - 91.6) < 0.01
  AND ABS("purityPercent" - 91.66) >= 0.01;
