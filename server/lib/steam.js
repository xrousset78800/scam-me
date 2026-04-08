const axios = require('axios');
const { rarityToKey, steamImageUrl } = require('./utils');

const APP_ID = 730; // CS2

/**
 * Récupère l'inventaire CS2 d'un utilisateur via l'API Steam officielle.
 * @param {string} steamId
 * @returns {Promise<SteamItem[]>}
 */
async function fetchSteamInventory(steamId) {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) throw new Error('STEAM_API_KEY manquante');

  // Utilise l'API Steam officielle (IEconItems) — accessible depuis un serveur
  const url = `https://api.steampowered.com/IEconItems_730/GetPlayerItems/v1/?key=${apiKey}&steamid=${steamId}&language=english`;

  let data;
  try {
    const res = await axios.get(url, { timeout: 15_000 });
    data = res.data;
  } catch (err) {
    throw new Error(`Steam API inaccessible : ${err.message}`);
  }

  const result = data?.result;
  if (!result || result.status !== 1) {
    // Fallback sur l'endpoint communautaire (fonctionne en dev/local)
    return fetchSteamInventoryCommunity(steamId);
  }

  const items = [];
  for (const item of result.items ?? []) {
    const tags = item.tags ?? [];
    const rarityTag = tags.find(t => t.category === 'Rarity');
    const exteriorTag = tags.find(t => t.category === 'Exterior');
    const typeTag = tags.find(t => t.category === 'Type');

    const rarity = rarityTag?.localized_tag_name ?? 'Consumer Grade';
    const exterior = exteriorTag?.localized_tag_name;

    const name = item.market_name ?? item.name ?? '';
    const marketHashName = item.market_hash_name ?? name;

    items.push({
      assetId: String(item.id),
      classId: String(item.defindex ?? ''),
      instanceId: '0',
      marketHashName,
      name,
      type: typeTag?.localized_tag_name ?? '',
      exterior,
      rarity,
      rarityKey: rarityToKey(rarity),
      iconUrl: item.icon_url_large
        ? steamImageUrl(item.icon_url_large)
        : item.icon_url
        ? steamImageUrl(item.icon_url)
        : '',
      isStatTrak: name.startsWith('StatTrak™'),
      isSouvenir: name.startsWith('Souvenir'),
      stickers: [],
      tradable: item.tradable === 1,
      float: null,
    });
  }

  return items;
}

/**
 * Fallback : endpoint communautaire Steam (marche en local/browser, bloqué par certains serveurs cloud).
 */
async function fetchSteamInventoryCommunity(steamId) {
  const url = `https://steamcommunity.com/inventory/${steamId}/${APP_ID}/2?l=english&count=5000`;
  const { data } = await axios.get(url, {
    timeout: 15_000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; scam-me/1.0)',
    },
  });

  if (!data || data.success !== 1) {
    throw new Error('Inventaire Steam inaccessible (privé ou bloqué)');
  }

  const descMap = new Map();
  for (const desc of data.descriptions ?? []) {
    descMap.set(`${desc.classid}_${desc.instanceid}`, desc);
  }

  const items = [];
  for (const asset of data.assets ?? []) {
    const desc = descMap.get(`${asset.classid}_${asset.instanceid}`);
    if (!desc) continue;

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
      float: null,
    });
  }

  return items;
}

function extractStickers(descriptions) {
  const entry = descriptions.find(d => d.value.includes('sticker_info'));
  if (!entry) return [];
  const matches = Array.from(entry.value.matchAll(/src="([^"]+)"/g));
  return matches.map((m, i) => ({ name: `Sticker ${i + 1}`, imageUrl: m[1], slot: i }));
}

function parseTradeUrl(tradeUrl) {
  try {
    const url = new URL(tradeUrl);
    const token = url.searchParams.get('token');
    return token ? { token } : null;
  } catch { return null; }
}

async function resolveSteamId(vanityUrl) {
  const endpoint = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_API_KEY}&vanityurl=${vanityUrl}`;
  const { data } = await axios.get(endpoint);
  if (data.response.success === 1) return data.response.steamid;
  return null;
}

module.exports = { fetchSteamInventory, fetchSteamInventoryCommunity, parseTradeUrl, resolveSteamId };
