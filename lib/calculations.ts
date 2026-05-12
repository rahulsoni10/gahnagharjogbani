export const GOLD_22K_PURITY = 91.66;

export function normalizePurityPercent(purityPercent: number): number {
  if (Math.abs(purityPercent - GOLD_22K_PURITY) < 0.01) return GOLD_22K_PURITY;
  if (Math.abs(purityPercent - 91.6) < 0.01) return GOLD_22K_PURITY;
  return purityPercent;
}

/**
 * Converts the user-entered metal rate to a 24K-equivalent (pure) rate for calculations.
 * Gold: user enters 22K rate → multiply by (24/22) to get pure-gold equivalent.
 * Silver: user enters pure silver rate → no conversion needed.
 */
export function toEffectiveRate(pricePerGram: number, metal: "GOLD" | "SILVER"): number {
  return metal === "GOLD" ? pricePerGram * (24 / 22) : pricePerGram;
}

export function calcPureWeight(netWeightGrams: number, purityPercent: number): number {
  const purity = normalizePurityPercent(purityPercent);
  return (netWeightGrams * purity) / 100;
}

export function calcMarketPrice(
  netWeightGrams: number,
  purityPercent: number,
  pricePerGram: number
): number {
  const pureWeight = calcPureWeight(netWeightGrams, purityPercent);
  return pureWeight * pricePerGram;
}

export function formatWeight(grams: number): string {
  return `${grams.toFixed(3)} g`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const GOLD_PURITIES = [
  { label: "24K (100%)", value: 100 },
  { label: "22K (91.66%)", value: GOLD_22K_PURITY },
  { label: "18K (75%)", value: 75 },
  { label: "14.4K (60%)", value: 60 },
] as const;

/** Rupees from wastage (%) on market price plus optional making charge (₹). */
export function calcMakingCharge(
  marketPrice: number,
  makingChargePct?: number | null,
  makingChargeAmount?: number | null
): number {
  const pct = makingChargePct ?? 0;
  const amount = makingChargeAmount ?? 0;
  return marketPrice * (pct / 100) + amount;
}

export function calcTotalItemCost(
  netWeightGrams: number,
  purityPercent: number,
  ratePerGram: number,
  makingChargePct?: number | null,
  makingChargeAmount?: number | null
): number {
  const marketPrice = calcMarketPrice(netWeightGrams, purityPercent, ratePerGram);
  return marketPrice + calcMakingCharge(marketPrice, makingChargePct, makingChargeAmount);
}

export function calcStockMetalCost(
  netWeightGrams: number,
  purityPercent: number,
  stockRatePerGram: number
): number {
  return calcMarketPrice(netWeightGrams, purityPercent, stockRatePerGram);
}

export function calcSaleProfit(sellingPrice: number, stockMetalCost: number): number {
  return sellingPrice - stockMetalCost;
}

export interface StockCostItem {
  netWeightGrams: number;
  purityPercent: number;
  stockMetalCost?: number | null;
  stockRatePerGram?: number | null;
  makingChargePct?: number | null;
  makingChargeAmount?: number | null;
}

/** Metal-only acquisition value (stored or derived from rate). */
export function resolveStockMetalOnlyCost(item: StockCostItem): number | null {
  if (item.stockMetalCost != null) return item.stockMetalCost;
  if (item.stockRatePerGram != null) {
    return calcStockMetalCost(item.netWeightGrams, item.purityPercent, item.stockRatePerGram);
  }
  return null;
}

/** Full stock acquisition cost: metal + wastage (%) and making charge (₹), same basis as sale pricing. */
export function resolveStockMetalCost(item: StockCostItem): number | null {
  const metal = resolveStockMetalOnlyCost(item);
  if (metal == null) return null;
  return metal + calcMakingCharge(metal, item.makingChargePct, item.makingChargeAmount);
}

export const GOLD_TYPES = [
  "Ring",
  "Chain",
  "Necklace",
  "Bracelet",
  "Bangle",
  "Earring",
  "Jhumka",
  "Pendant",
  "Mangalsutra",
  "Nose Pin",
  "Tikka",
  "Haar",
  "Kangan",
  "Chudi",
  "Other",
] as const;

export const SILVER_TYPES = [
  "Bichiya",
  "Payal",
  "Anklet",
  "Ring",
  "Chain",
  "Bracelet",
  "Earring",
  "Jhumka",
  "Pendant",
  "Bangle",
  "Coin",
  "Idol",
  "Utensil",
  "Bichuwa",
  "Other",
] as const;

export type GoldType = (typeof GOLD_TYPES)[number];
export type SilverType = (typeof SILVER_TYPES)[number];

export function getTypesForMetal(metal: "GOLD" | "SILVER") {
  return metal === "GOLD" ? GOLD_TYPES : SILVER_TYPES;
}

export function goldPurityLabel(purity: number): string {
  const normalized = normalizePurityPercent(purity);
  if (normalized === 100) return "24K";
  if (Math.abs(normalized - GOLD_22K_PURITY) < 0.01) return "22K";
  if (normalized === 75) return "18K";
  if (normalized === 60) return "14.4K";
  return `${normalized}%`;
}
