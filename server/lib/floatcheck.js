const axios = require('axios');

// Cache permanent par assetId — la float ne change jamais
const floatCache = new Map();

/**
 * Retourne la float d'un item CS2 à partir de son inspect link.
 * Implémentation actuelle : API csgofloat.com (gratuit, ~10 req/min)
 * Migration future vers Game Coordinator : remplacer fetchFromCsgofloat()
 * par fetchFromGameCoordinator() — même interface, même cache.
 *
 * @param {string} inspectLink  steam://rungame/730/.../+csgo_econ_action_preview...
 * @param {string} assetId
 * @returns {Promise<number|null>}
 */
async function getFloat(inspectLink, assetId) {
  if (!inspectLink) return null;
  if (floatCache.has(assetId)) {
    return floatCache.get(assetId);
  }

  const value = await fetchFromCsgofloat(inspectLink);
  if (value !== null) floatCache.set(assetId, value);
  return value;
}

async function fetchFromCsgofloat(inspectLink) {
  try {
    const { data } = await axios.get('https://api.csgofloat.com/', {
      params: { url: inspectLink },
      timeout: 8_000,
      headers: { 'User-Agent': 'scam-me/1.0' },
    });
    return data?.iteminfo?.floatvalue ?? null;
  } catch (err) {
    const status = err.response?.status;
    if (status === 429) throw new Error('429 csgofloat rate limited');
    console.warn('[floatcheck] csgofloat error:', err.message);
    return null;
  }
}

/**
 * Stub pour la future implémentation Game Coordinator.
 * Quand prête, remplacer fetchFromCsgofloat par fetchFromGameCoordinator
 * dans getFloat() ci-dessus.
 */
// async function fetchFromGameCoordinator(inspectLink) { ... }

module.exports = { getFloat };
