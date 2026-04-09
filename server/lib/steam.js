const axios = require('axios');
const { rarityToKey, steamImageUrl } = require('./utils');

const APP_ID = 730; // CS2

/**
 * Récupère l'inventaire CS2 — essaie l'API officielle d'abord, fallback community.
 */
async function fetchSteamInventory(steamId) {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) throw new Error('STEAM_API_KEY manquante sur le serveur');

  try {
    const items = await fetchViaOfficialAPI(steamId, apiKey);
    if (items.length > 0) return items;
    console.warn('[steam] Official API returned 0 items, trying community endpoint...');
  } catch (err) {
    console.warn('[steam] Official API failed:', err.message, '— trying community endpoint...');
  }

  return fetchViaCommunity(steamId);
}

async function fetchViaOfficialAPI(steamId, apiKey) {
  const { data } = await axios.get(
    'https://api.steampowered.com/IEconItems_730/GetPlayerItems/v1/',
    { params: { key: apiKey, steamid: steamId, language: 'english' }, timeout: 15_000 }
  );

  const result = data?.result;
  if (!result || result.status !== 1) {
    throw new Error(`IEconItems status=${result?.status ?? 'unknown'}`);
  }

  return (result.items ?? []).map(item => {
    const tags = item.tags ?? [];
    const rarityTag = tags.find(t => t.category === 'Rarity');
    const exteriorTag = tags.find(t => t.category === 'Exterior');
    const typeTag = tags.find(t => t.category === 'Type');
    const rarity = rarityTag?.localized_tag_name ?? 'Consumer Grade';
    const name = item.market_name ?? item.name ?? '';

    return {
      assetId: String(item.id),
      classId: String(item.defindex ?? ''),
      instanceId: '0',
      marketHashName: item.market_hash_name ?? name,
      name,
      type: typeTag?.localized_tag_name ?? '',
      exterior: exteriorTag?.localized_tag_name,
      rarity,
      rarityKey: rarityToKey(rarity),
      iconUrl: item.icon_url_large ? steamImageUrl(item.icon_url_large) : steamImageUrl(item.icon_url ?? ''),
      isStatTrak: name.startsWith('StatTrak™'),
      isSouvenir: name.startsWith('Souvenir'),
      stickers: [],
      tradable: item.tradable === 1,
      float: null,
    };
  });
}

async function fetchViaCommunity(steamId) {
  const url = `https://steamcommunity.com/inventory/${steamId}/${APP_ID}/2?l=english&count=5000`;
  const response = await axios.get(url, {
    timeout: 15_000,
    validateStatus: () => true, // On gère nous-mêmes les codes d'erreur pour diagnostic
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://steamcommunity.com/',
    },
  });

  const { status, data } = response;
  console.log(`[steam] community endpoint status=${status} for ${steamId}`);

  if (status === 429) throw new Error('429 rate limited by Steam');
  if (status === 403) throw new Error('403 inventaire privé ou profil privé');
  if (status === 400) {
    const reason = typeof data === 'object' ? JSON.stringify(data) : String(data).slice(0, 200);
    throw new Error(`400 Steam refusé — vérifier que l'inventaire CS2 est Public. Réponse: ${reason}`);
  }
  if (status !== 200) throw new Error(`Steam community HTTP ${status}`);

  if (!data || data.success !== 1) {
    throw new Error(`Inventaire inaccessible (success=${data?.success}, error="${data?.Error ?? 'inconnu'}")`);
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
    'https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/',
    { params: { key: process.env.STEAM_API_KEY, vanityurl: vanityUrl } }
  );
  return data.response.success === 1 ? data.response.steamid : null;
}

module.exports = { fetchSteamInventory, parseTradeUrl, resolveSteamId };
