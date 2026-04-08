const axios = require('axios');
const { rarityToKey, steamImageUrl } = require('./utils');

const APP_ID = 730; // CS2

/**
 * Récupère l'inventaire CS2 — essaie l'API officielle d'abord, fallback community.
 */
async function fetchSteamInventory(steamId) {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) throw new Error('STEAM_API_KEY manquante sur le serveur');

  // Tentative 1 : API officielle Steam (fonctionne depuis les serveurs cloud)
  try {
    const items = await fetchViaOfficialAPI(steamId, apiKey);
    if (items.length > 0) return items;
    console.warn('[steam] Official API returned 0 items, trying community endpoint...');
  } catch (err) {
    console.warn('[steam] Official API failed:', err.message, '— trying community endpoint...');
  }

  // Tentative 2 : endpoint communautaire (fonctionne en local)
  return fetchViaCommunity(steamId);
}

/**
 * API officielle : IEconItems_730/GetPlayerItems
 */
async function fetchViaOfficialAPI(steamId, apiKey) {
  const url = `https://api.steampowered.com/IEconItems_730/GetPlayerItems/v1/`;
  const { data } = await axios.get(url, {
    params: { key: apiKey, steamid: steamId, language: 'english' },
    timeout: 15_000,
  });

  const result = data?.result;
  if (!result || result.status !== 1) {
    throw new Error(`IEconItems status=${result?.status ?? 'unknown'} (inventaire privé ou introuvable)`);
  }

  return (result.items ?? []).map(item => {
    const tags = item.tags ?? [];
    const rarityTag = tags.find(t => t.category === 'Rarity');
    const exteriorTag = tags.find(t => t.category === 'Exterior');
    const typeTag = tags.find(t => t.category === 'Type');
    const rarity = rarityTag?.localized_tag_name ?? 'Consumer Grade';

    return {
      assetId: String(item.id),
      classId: String(item.defindex ?? ''),
      instanceId: '0',
      marketHashName: item.market_hash_name ?? item.market_name ?? item.name ?? '',
      name: item.market_name ?? item.name ?? '',
      type: typeTag?.localized_tag_name ?? '',
      exterior: exteriorTag?.localized_tag_name,
      rarity,
      rarityKey: rarityToKey(rarity),
      iconUrl: item.icon_url_large ? steamImageUrl(item.icon_url_large) : steamImageUrl(item.icon_url ?? ''),
      isStatTrak: (item.market_name ?? item.name ?? '').startsWith('StatTrak™'),
      isSouvenir: (item.market_name ?? item.name ?? '').startsWith('Souvenir'),
      stickers: [],
      tradable: item.tradable === 1,
      float: null,
    };
  });
}

/**
 * Endpoint communautaire Steam (peut être bloqué sur certains cloud providers).
 */
async function fetchViaCommunity(steamId) {
  const url = `https://steamcommunity.com/inventory/${steamId}/${APP_ID}/2?l=english&count=5000`;
  const { data } = await axios.get(url, {
    timeout: 15_000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; scam-me-bot/1.0)' },
  });

  if (!data || data.success !== 1) {
    throw new Error('Inventaire Steam inaccessible (privé ou bloqué par Steam)');
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

    items.push({
      assetId: asset.assetid,
      classId: asset.classid,
      instanceId: asset.instanceid,
      marketHashName: desc.market_hash_name,
      name: desc.name,
      type: desc.type,
      exterior: exteriorTag?.localized_tag_name,
      rarity,
      rarityKey: rarityToKey(rarity),
      iconUrl: steamImageUrl(desc.icon_url),
      isStatTrak: desc.name.startsWith('StatTrak™'),
      isSouvenir: desc.name.startsWith('Souvenir'),
      stickers: extractStickers(desc.descriptions ?? []),
      tradable: desc.tradable === 1,
      float: null,
    });
  }

  return items;
}

function extractStickers(descriptions) {
  const entry = descriptions.find(d => d.value.includes('sticker_info'));
  if (!entry) return [];
  return Array.from(entry.value.matchAll(/src="([^"]+)"/g))
    .map((m, i) => ({ name: `Sticker ${i + 1}`, imageUrl: m[1], slot: i }));
}

function parseTradeUrl(tradeUrl) {
  try {
    const url = new URL(tradeUrl);
    const token = url.searchParams.get('token');
    return token ? { token } : null;
  } catch { return null; }
}

async function resolveSteamId(vanityUrl) {
  const { data } = await axios.get(
    `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/`,
    { params: { key: process.env.STEAM_API_KEY, vanityurl: vanityUrl } }
  );
  return data.response.success === 1 ? data.response.steamid : null;
}

module.exports = { fetchSteamInventory, parseTradeUrl, resolveSteamId };
