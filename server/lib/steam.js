const axios = require('axios');
const { rarityToKey, steamImageUrl } = require('./utils');

const APP_ID = 730;    // CS2
const CONTEXT_ID = 2;
const PAGE_SIZE = 75;  // Limite Steam par page

/**
 * Récupère l'inventaire CS2 via IEconService (API officielle avec clé),
 * fallback sur le endpoint communautaire si l'API échoue.
 */
async function fetchSteamInventory(steamId) {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) throw new Error('STEAM_API_KEY manquante sur le serveur');

  try {
    return await fetchViaEconService(steamId, apiKey);
  } catch (err) {
    console.warn('[steam] IEconService failed:', err.message, '— fallback community endpoint');
    return fetchViaCommunity(steamId);
  }
}

/**
 * IEconService/GetInventoryItemsWithDescriptions — API officielle Steam
 * Avantages vs community endpoint :
 *  - Clé API identifiée → rate limit plus tolérant
 *  - Inclut les items reçus récemment (< 7 jours) sans délai
 *  - Endpoint versionné et stable
 */
async function fetchViaEconService(steamId, apiKey) {
  const allAssets = [];
  const descMap = new Map();
  let lastAssetId = null;
  let page = 0;

  while (true) {
    page++;
    const params = {
      key: apiKey,
      steamid: steamId,
      appid: APP_ID,
      contextid: CONTEXT_ID,
      get_descriptions: 1,
      language: 'english',
      count: PAGE_SIZE,
    };
    if (lastAssetId) params.start_assetid = lastAssetId;

    const { data } = await axios.get(
      'https://api.steampowered.com/IEconService/GetInventoryItemsWithDescriptions/v1/',
      { params, timeout: 15_000 }
    );

    const r = data?.response;
    if (!r) throw new Error('IEconService: réponse vide');

    console.log(`[steam] IEconService page=${page} assets=${r.assets?.length ?? 0} more=${r.more_items ?? 0} for ${steamId}`);

    for (const desc of r.descriptions ?? []) {
      descMap.set(`${desc.classid}_${desc.instanceid}`, desc);
    }
    allAssets.push(...(r.assets ?? []));

    if (!r.more_items || !r.last_assetid) break;
    lastAssetId = r.last_assetid;

    await new Promise(res => setTimeout(res, 200));
  }

  console.log(`[steam] IEconService total=${allAssets.length} assets (${page} page(s)) for ${steamId}`);
  return buildItems(allAssets, descMap, steamId);
}

/**
 * Fallback : endpoint communautaire (scraping public, plus fragile)
 */
async function fetchViaCommunity(steamId) {
  const allAssets = [];
  const descMap = new Map();
  let lastAssetId = null;
  let page = 0;

  while (true) {
    page++;
    const params = new URLSearchParams({ l: 'english', count: PAGE_SIZE });
    if (lastAssetId) params.set('start_assetid', lastAssetId);
    const url = `https://steamcommunity.com/inventory/${steamId}/${APP_ID}/${CONTEXT_ID}?${params}`;

    const response = await axios.get(url, {
      timeout: 15_000,
      validateStatus: () => true,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
      },
    });

    const { status } = response;
    const rawText = String(response.data ?? '').trim();
    console.log(`[steam] community page=${page} status=${status} for ${steamId}`);

    if (status === 429) throw new Error('429 rate limited by Steam');
    if (status === 403) throw new Error('403 inventaire privé');
    if (status !== 200) throw new Error(`Steam HTTP ${status} — ${rawText.slice(0, 200) || '(vide)'}`);

    let data;
    try { data = JSON.parse(rawText); }
    catch { throw new Error(`Steam non-JSON: ${rawText.slice(0, 200)}`); }

    if (data === null) {
      console.warn(`[steam] community null for ${steamId} — inventaire vide`);
      break;
    }
    if (!data || data.success !== 1) {
      throw new Error(`Inventaire inaccessible (success=${data?.success}, error="${data?.Error ?? 'inconnu'}")`);
    }

    for (const desc of data.descriptions ?? []) {
      descMap.set(`${desc.classid}_${desc.instanceid}`, desc);
    }
    allAssets.push(...(data.assets ?? []));

    if (!data.more_items || !data.last_assetid) break;
    lastAssetId = data.last_assetid;

    await new Promise(res => setTimeout(res, 300));
  }

  console.log(`[steam] community total=${allAssets.length} assets (${page} page(s)) for ${steamId}`);
  return buildItems(allAssets, descMap, steamId);
}

/**
 * Transforme assets + descriptions en objets item normalisés.
 * Commun aux deux méthodes de fetch.
 */
function buildItems(allAssets, descMap, steamId) {
  const items = [];

  for (const asset of allAssets) {
    const desc = descMap.get(`${asset.classid}_${asset.instanceid}`);
    if (!desc) continue;

    const tags = desc.tags ?? [];
    const rarityTag     = tags.find(t => t.category === 'Rarity');
    const exteriorTag   = tags.find(t => t.category === 'Exterior');
    const collectionTag = tags.find(t => t.category === 'ItemSet');
    const weaponTag     = tags.find(t => t.category === 'Weapon');
    const rarity = rarityTag?.localized_tag_name ?? 'Consumer Grade';

    const inspectAction = (desc.actions ?? []).find(a =>
      a.link?.includes('csgo_econ_action_preview')
    );
    const inspectLink = inspectAction
      ? inspectAction.link
          .replace('%owner_steamid%', steamId)
          .replace('%assetid%', asset.assetid)
      : null;

    items.push({
      assetId:         asset.assetid,
      classId:         asset.classid,
      instanceId:      asset.instanceid,
      marketHashName:  desc.market_hash_name,
      name:            desc.name,
      weaponName:      weaponTag?.localized_tag_name ?? null,
      type:            desc.type,
      exterior:        exteriorTag?.localized_tag_name ?? null,
      collection:      collectionTag?.localized_tag_name ?? null,
      rarity,
      rarityKey:       rarityToKey(rarity),
      iconUrl:         steamImageUrl(desc.icon_url),
      isStatTrak:      desc.name.startsWith('StatTrak™'),
      isSouvenir:      desc.name.startsWith('Souvenir'),
      stickers:        extractStickers(desc.descriptions ?? []),
      tradable:        desc.tradable === 1,
      inspectLink,
      float:           null,
    });
  }

  return items;
}

function extractStickers(descriptions) {
  const entry = descriptions.find(d => d.value?.includes('sticker_info'));
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
