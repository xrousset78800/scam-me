import axios from "axios";

/**
 * Price sources priority: Pricempire > CS.Float > Steam median
 */

export interface PriceMap {
  [marketHashName: string]: number; // USD
}

/**
 * Fetch bulk prices from Pricempire (https://pricempire.com/api).
 * Falls back to Steam market median if unavailable.
 */
export async function fetchPrices(items: string[]): Promise<PriceMap> {
  const apiKey = process.env.PRICEMPIRE_API_KEY;
  if (!apiKey) return fetchSteamPrices(items);

  try {
    const { data } = await axios.post(
      "https://api.pricempire.com/v3/items/prices",
      { market_hash_names: items, source: "buff163" },
      { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 8_000 }
    );
    const result: PriceMap = {};
    for (const [name, info] of Object.entries(data as Record<string, { price: number }>)) {
      result[name] = info.price / 100; // cents → USD
    }
    return result;
  } catch {
    return fetchSteamPrices(items);
  }
}

/**
 * Fetch a single item price from the Steam Community Market.
 * Heavily rate-limited — use only as fallback for individual items.
 */
export async function fetchSteamPrice(marketHashName: string): Promise<number | null> {
  try {
    const encoded = encodeURIComponent(marketHashName);
    const url = `https://steamcommunity.com/market/priceoverview/?currency=1&appid=730&market_hash_name=${encoded}`;
    const { data } = await axios.get(url, { timeout: 5_000 });
    if (!data.success) return null;
    const raw: string = data.median_price ?? data.lowest_price ?? "";
    return parseFloat(raw.replace(/[^0-9.]/g, "")) || null;
  } catch {
    return null;
  }
}

async function fetchSteamPrices(items: string[]): Promise<PriceMap> {
  const result: PriceMap = {};
  // Sequential to avoid rate limiting — only suitable for small batches
  for (const name of items.slice(0, 20)) {
    const price = await fetchSteamPrice(name);
    if (price) result[name] = price;
    await new Promise((r) => setTimeout(r, 300));
  }
  return result;
}

/**
 * Calculate the trade price difference.
 * Positive = user receives money, negative = user pays.
 */
export function calcPriceDiff(
  offeredPrices: number[],
  requestedPrices: number[]
): number {
  const offeredTotal = offeredPrices.reduce((a, b) => a + b, 0);
  const requestedTotal = requestedPrices.reduce((a, b) => a + b, 0);
  return offeredTotal - requestedTotal;
}
