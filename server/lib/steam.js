const axios = require('axios');
const { rarityToKey, steamImageUrl } = require('./utils');

const APP_ID = 730; // CS2

/**
 * Récupère l'inventaire CS2 d'un utilisateur Steam (inventaire public requis).
 * @param {string} steamId
 * @returns {Promise<SteamItem[]>}
 */
async function fetchSteamInventory(steamId) {
  const url = `https://steamcommunity.com/inventory/${steamId}/${APP_ID}/2?l=english&count=5000`;
  const { data } = await axios.get(url, { timeout: 10_000 });

  if (data.success !== 1) throw new Error('Failed to fetch Steam inventory');

  const descMap = new Map();
  for (const desc of data.descriptions) {
    descMap.set(`${desc.classid}_${desc.instanceid}`, desc);
  }

  const items = [];
  for (const asset of data.assets) {
    const desc = descMap.get(`${asset.classid}_${asset.instanceid}`);
    if (!desc || !desc.tradable) continue;

    const tags = desc.tags ?? [];
    const rarityTag = tags.find(t => t.category === 'Rarity');
    const exteriorTag = tags.find(t => t.category === 'Exterior');

    const rarity = rarityTag?.localized_tag_name ?? 'Consumer Grade';
    const exterior = exteriorTag?.localized_tag_name;
    const stickers = extractStickers(desc.descriptions ?? []);

    items.push({
      assetId: asset.assetid,
      classId: asset.classid,
      instanceId: asset.instanceid,
      marketHashName: desc.market_hash_name,
      name: desc.name,
      type: desc.type,
      exterior,
      rarity,
      rarityKey: rarityToKey(rarity),
      iconUrl: steamImageUrl(desc.icon_url),
      isStatTrak: desc.name.startsWith('StatTrak™'),
      isSouvenir: desc.name.startsWith('Souvenir'),
      stickers,
      tradable: desc.tradable === 1,
    });
  }

  return items;
}

/**
 * Extrait les stickers d'un item depuis le HTML Steam.
 */
function extractStickers(descriptions) {
  const entry = descriptions.find(d => d.value.includes('sticker_info'));
  if (!entry) return [];

  const matches = Array.from(entry.value.matchAll(/src="([^"]+)"/g));
  return matches.map((m, i) => ({
    name: `Sticker ${i + 1}`,
    imageUrl: m[1],
    slot: i,
  }));
}

/**
 * Extrait le token d'une Steam trade URL.
 * @param {string} tradeUrl
 */
function parseTradeUrl(tradeUrl) {
  try {
    const url = new URL(tradeUrl);
    const token = url.searchParams.get('token');
    return token ? { token } : null;
  } catch {
    return null;
  }
}

/**
 * Résout un vanity URL Steam en Steam ID 64 bits.
 * @param {string} vanityUrl
 */
async function resolveSteamId(vanityUrl) {
  const endpoint = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_API_KEY}&vanityurl=${vanityUrl}`;
  const { data } = await axios.get(endpoint);
  if (data.response.success === 1) return data.response.steamid;
  return null;
}

module.exports = { fetchSteamInventory, parseTradeUrl, resolveSteamId };
