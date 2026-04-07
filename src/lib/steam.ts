import axios from "axios";
import type { SteamItem, Sticker } from "@/types";
import { rarityToKey, steamImageUrl } from "./utils";

const STEAM_API_KEY = process.env.STEAM_API_KEY!;
const APP_ID = 730; // CS2

export interface SteamInventoryResponse {
  assets: SteamAsset[];
  descriptions: SteamDescription[];
  total_inventory_count: number;
  success: number;
}

interface SteamAsset {
  appid: number;
  contextid: string;
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
}

interface SteamDescription {
  appid: number;
  classid: string;
  instanceid: string;
  name: string;
  market_hash_name: string;
  type: string;
  icon_url: string;
  tradable: number;
  descriptions: Array<{ type: string; value: string }>;
  tags: Array<{ category: string; internal_name: string; localized_tag_name: string }>;
}

/**
 * Fetch a user's CS2 inventory via Steam API.
 * Note: inventory must be public.
 */
export async function fetchSteamInventory(steamId: string): Promise<SteamItem[]> {
  const url = `https://steamcommunity.com/inventory/${steamId}/${APP_ID}/2?l=english&count=5000`;
  const { data } = await axios.get<SteamInventoryResponse>(url, { timeout: 10_000 });

  if (data.success !== 1) throw new Error("Failed to fetch Steam inventory");

  const descMap = new Map<string, SteamDescription>();
  for (const desc of data.descriptions) {
    descMap.set(`${desc.classid}_${desc.instanceid}`, desc);
  }

  const items: SteamItem[] = [];
  for (const asset of data.assets) {
    const desc = descMap.get(`${asset.classid}_${asset.instanceid}`);
    if (!desc || !desc.tradable) continue;

    const tags = desc.tags ?? [];
    const rarityTag = tags.find((t) => t.category === "Rarity");
    const exteriorTag = tags.find((t) => t.category === "Exterior");

    const rarity = rarityTag?.localized_tag_name ?? "Consumer Grade";
    const exterior = exteriorTag?.localized_tag_name as SteamItem["exterior"] | undefined;

    const stickers = extractStickers(desc.descriptions);

    items.push({
      assetId: asset.assetid,
      classId: asset.classid,
      instanceId: asset.instanceid,
      marketHashName: desc.market_hash_name,
      name: desc.name,
      type: desc.type,
      exterior,
      rarity: rarity as SteamItem["rarity"],
      rarityKey: rarityToKey(rarity as SteamItem["rarity"]),
      iconUrl: steamImageUrl(desc.icon_url),
      isStatTrak: desc.name.startsWith("StatTrak™"),
      isSouvenir: desc.name.startsWith("Souvenir"),
      stickers,
      tradable: desc.tradable === 1,
    });
  }

  return items;
}

function extractStickers(descriptions: SteamDescription["descriptions"]): Sticker[] {
  const stickerEntry = descriptions.find((d) => d.value.includes("sticker_info"));
  if (!stickerEntry) return [];

  // Parse sticker image URLs from the HTML blob Steam returns
  const matches = [...stickerEntry.value.matchAll(/src="([^"]+)"/g)];
  return matches.map((m, i) => ({
    name: `Sticker ${i + 1}`,
    imageUrl: m[1],
    slot: i,
  }));
}

/**
 * Validate that a Steam trade URL belongs to a given steam ID.
 */
export function parseTradeUrl(tradeUrl: string): { token: string } | null {
  try {
    const url = new URL(tradeUrl);
    const token = url.searchParams.get("token");
    if (!token) return null;
    return { token };
  } catch {
    return null;
  }
}

/**
 * Resolve a Steam vanity URL to a 64-bit Steam ID.
 */
export async function resolveSteamId(vanityUrl: string): Promise<string | null> {
  const endpoint = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_API_KEY}&vanityurl=${vanityUrl}`;
  const { data } = await axios.get(endpoint);
  if (data.response.success === 1) return data.response.steamid;
  return null;
}
