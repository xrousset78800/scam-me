import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Exterior, Rarity, RarityKey } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(usd: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(usd * 0.92); // rough USD→EUR
}

export function formatFloat(float: number): string {
  return float.toFixed(8);
}

export function rarityToKey(rarity: Rarity): RarityKey {
  const map: Record<Rarity, RarityKey> = {
    "Consumer Grade": "consumer",
    "Industrial Grade": "industrial",
    "Mil-Spec Grade": "milspec",
    Restricted: "restricted",
    Classified: "classified",
    Covert: "covert",
    Contraband: "contraband",
  };
  return map[rarity];
}

export function rarityColor(key: RarityKey): string {
  const colors: Record<RarityKey, string> = {
    consumer: "#b0c3d9",
    industrial: "#5e98d9",
    milspec: "#4b69ff",
    restricted: "#8847ff",
    classified: "#d32ce6",
    covert: "#eb4b4b",
    contraband: "#e4ae39",
  };
  return colors[key];
}

export function exteriorAbbr(exterior: Exterior | undefined): string {
  if (!exterior) return "";
  const map: Record<Exterior, string> = {
    "Factory New": "FN",
    "Minimal Wear": "MW",
    "Field-Tested": "FT",
    "Well-Worn": "WW",
    "Battle-Scarred": "BS",
  };
  return map[exterior];
}

export function steamImageUrl(iconPath: string): string {
  return `https://steamcommunity-a.akamaihd.net/economy/image/${iconPath}/360fx360f`;
}

export function priceDiffLabel(diff: number): string {
  if (Math.abs(diff) < 0.01) return "Échange équitable";
  if (diff > 0) return `Tu reçois +${formatPrice(diff)}`;
  return `Tu paies ${formatPrice(Math.abs(diff))}`;
}
