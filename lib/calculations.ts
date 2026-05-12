export function calcPureWeight(netWeightGrams: number, purityPercent: number): number {
  return (netWeightGrams * purityPercent) / 100;
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
  { label: "22K (91.6%)", value: 91.6 },
  { label: "18K (75%)", value: 75 },
  { label: "14.4K (60%)", value: 60 },
] as const;

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
  if (purity === 100) return "24K";
  if (purity === 91.6) return "22K";
  if (purity === 75) return "18K";
  if (purity === 60) return "14.4K";
  return `${purity}%`;
}
