import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config();

const prisma = new PrismaClient();

const GOLD_22K_PURITY = 91.66;

function normalizePurityPercent(purityPercent) {
  if (Math.abs(purityPercent - GOLD_22K_PURITY) < 0.01) return GOLD_22K_PURITY;
  if (Math.abs(purityPercent - 91.6) < 0.01) return GOLD_22K_PURITY;
  return purityPercent;
}

function calcStockMetalCost(netWeightGrams, purityPercent, stockRatePerGram) {
  const purity = normalizePurityPercent(purityPercent);
  return ((netWeightGrams * purity) / 100) * stockRatePerGram;
}

function calcTotalItemCost(netWeightGrams, purityPercent, ratePerGram, makingChargePct = 0, makingChargeAmount = 0) {
  const purity = normalizePurityPercent(purityPercent);
  const marketPrice = ((netWeightGrams * purity) / 100) * ratePerGram;
  return marketPrice + marketPrice * (makingChargePct / 100) + makingChargeAmount;
}

const CURRENT_RATES = {
  GOLD: 14100,
  SILVER: 300,
};

const STOCK_RATES = {
  GOLD: 13850,
  SILVER: 285,
};

const demoItems = [
  {
    itemCode: "GLD-RING-001",
    name: "Gents Ring",
    type: "Ring",
    metal: "GOLD",
    purityPercent: GOLD_22K_PURITY,
    grossWeightGrams: 8.4,
    netWeightGrams: 8,
    notes: "22K gents ring, classic band.",
    sold: true,
    customerName: "Dipak",
    customerPhone: "9876543210",
    makingChargePct: 8,
    makingChargeAmount: 500,
  },
  {
    itemCode: "GLD-CHAIN-002",
    name: "Ladies Chain",
    type: "Chain",
    metal: "GOLD",
    purityPercent: GOLD_22K_PURITY,
    grossWeightGrams: 12.2,
    netWeightGrams: 11.75,
    notes: "Light daily-wear chain.",
    sold: true,
    customerName: "Priya",
    customerPhone: "9123456780",
    makingChargePct: 6,
    makingChargeAmount: 0,
  },
  {
    itemCode: "GLD-BNG-003",
    name: "Pair Bangles",
    type: "Bangle",
    metal: "GOLD",
    purityPercent: GOLD_22K_PURITY,
    grossWeightGrams: 24.5,
    netWeightGrams: 23.9,
    notes: "Matching pair, polished finish.",
  },
  {
    itemCode: "GLD-ER-004",
    name: "Jhumka Earrings",
    type: "Jhumka",
    metal: "GOLD",
    purityPercent: GOLD_22K_PURITY,
    grossWeightGrams: 6.8,
    netWeightGrams: 6.35,
    notes: "Traditional jhumka set.",
  },
  {
    itemCode: "GLD-PND-005",
    name: "Heart Pendant",
    type: "Pendant",
    metal: "GOLD",
    purityPercent: 75,
    grossWeightGrams: 3.1,
    netWeightGrams: 2.85,
    notes: "18K pendant without chain.",
  },
  {
    itemCode: "SLV-PAYAL-001",
    name: "Silver Payal",
    type: "Payal",
    metal: "SILVER",
    purityPercent: 92.5,
    grossWeightGrams: 45,
    netWeightGrams: 42.5,
    notes: "Ghungroo payal.",
    sold: true,
    customerName: "Meena",
    customerPhone: null,
    makingChargePct: 0,
    makingChargeAmount: 1200,
  },
  {
    itemCode: "SLV-RING-002",
    name: "Silver Toe Ring",
    type: "Bichiya",
    metal: "SILVER",
    purityPercent: 92.5,
    grossWeightGrams: 4.2,
    netWeightGrams: 3.95,
    notes: "Pair of bichiya.",
  },
  {
    itemCode: "SLV-BRC-003",
    name: "Silver Bracelet",
    type: "Bracelet",
    metal: "SILVER",
    purityPercent: 92.5,
    grossWeightGrams: 18.6,
    netWeightGrams: 17.8,
    notes: "Broad kada-style bracelet.",
  },
  {
    itemCode: "GLD-MS-006",
    name: "Mangalsutra",
    type: "Mangalsutra",
    metal: "GOLD",
    purityPercent: GOLD_22K_PURITY,
    grossWeightGrams: 5.6,
    netWeightGrams: 5.1,
    notes: "Black beads with gold pendant.",
  },
  {
    itemCode: "SLV-COIN-004",
    name: "Silver Coin",
    type: "Coin",
    metal: "SILVER",
    purityPercent: 99.9,
    grossWeightGrams: 50,
    netWeightGrams: 50,
    notes: "50g commemorative coin.",
  },
];

async function main() {
  await prisma.sale.deleteMany();
  await prisma.item.deleteMany();

  await prisma.rate.upsert({
    where: { metal: "GOLD" },
    update: { pricePerGram: CURRENT_RATES.GOLD },
    create: { metal: "GOLD", pricePerGram: CURRENT_RATES.GOLD },
  });
  await prisma.rate.upsert({
    where: { metal: "SILVER" },
    update: { pricePerGram: CURRENT_RATES.SILVER },
    create: { metal: "SILVER", pricePerGram: CURRENT_RATES.SILVER },
  });

  let stockCount = 0;
  let soldCount = 0;

  for (const demo of demoItems) {
    const stockRatePerGram = STOCK_RATES[demo.metal];
    const purityPercent = normalizePurityPercent(demo.purityPercent);
    const stockMetalCost = calcStockMetalCost(demo.netWeightGrams, purityPercent, stockRatePerGram);
    const soldAt = demo.sold ? new Date(Date.now() - Math.floor(Math.random() * 10 + 1) * 86400000) : null;

    const item = await prisma.item.create({
      data: {
        itemCode: demo.itemCode,
        name: demo.name,
        type: demo.type,
        metal: demo.metal,
        purityPercent,
        grossWeightGrams: demo.grossWeightGrams ?? null,
        netWeightGrams: demo.netWeightGrams,
        stockRatePerGram,
        stockMetalCost,
        notes: demo.notes ?? null,
        soldAt,
      },
    });

    if (demo.sold) {
      const saleRate = CURRENT_RATES[demo.metal];
      const makingChargePct = demo.makingChargePct ?? 0;
      const makingChargeAmount = demo.makingChargeAmount ?? 0;
      const sellingPrice = Math.round(
        calcTotalItemCost(
          demo.netWeightGrams,
          purityPercent,
          saleRate,
          makingChargePct,
          makingChargeAmount
        )
      );

      await prisma.sale.create({
        data: {
          itemId: item.id,
          sellingPrice,
          ratePerGram: saleRate,
          makingChargePct,
          makingChargeAmount,
          customerName: demo.customerName ?? null,
          customerPhone: demo.customerPhone ?? null,
          notes: demo.sold ? "Demo sale record." : null,
          soldAt: soldAt ?? new Date(),
        },
      });
      soldCount += 1;
    } else {
      stockCount += 1;
    }
  }

  console.log(`Cleared previous inventory and seeded ${demoItems.length} demo items.`);
  console.log(`In stock: ${stockCount}, sold: ${soldCount}`);
  console.log(`Rates: gold ₹${CURRENT_RATES.GOLD}/g, silver ₹${CURRENT_RATES.SILVER}/g`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
