const axios = require('axios');

let lastSteamCall = 0;
const STEAM_RATE_LIMIT_MS = 300;

// Référence vers le priceMap du cron syncPrices (chargé au démarrage)
let _cronPriceMap = null;
function _getPriceMap() {
  if (!_cronPriceMap) {
    try { _cronPriceMap = require('../cron/jobs/syncPrices').priceMap; } catch { _cronPriceMap = new Map(); }
  }
  return _cronPriceMap;
}

/**
 * Récupère les prix pour une liste de market_hash_names.
 * Priorité : 1) dump cron (gratuit, 0 requête) → 2) Pricempire → 3) Steam Market
 * @param {string[]} marketHashNames
 * @returns {Promise<Record<string, number>>}
 */
async function fetchPrices(marketHashNames) {
  if (!marketHashNames.length) return {};

  const result = {};
  const missing = [];

  // 1. D'abord le dump en mémoire (gratuit, instantané)
  const priceMap = _getPriceMap();
  for (const name of marketHashNames) {
    const cached = priceMap.get(name);
    if (cached != null) {
      result[name] = cached;
    } else {
      missing.push(name);
    }
  }

  if (missing.length === 0) return result;

  // 2. Fallback Pricempire pour les items manquants
  const apiKey = process.env.PRICEMPIRE_API_KEY;
  if (apiKey && missing.length > 0) {
    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        source: 'buff163',
        currency: 'USD',
      });
      missing.forEach(name => params.append('items[]', name));

      const { data } = await axios.get(
        `https://api.pricempire.com/v3/items/prices?${params.toString()}`,
        { timeout: 8_000 }
      );

      const found = [];
      for (const [name, info] of Object.entries(data)) {
        if (info?.buff163?.price) {
          result[name] = info.buff163.price / 100;
          priceMap.set(name, result[name]); // Alimente le cache pour les prochains
          found.push(name);
        }
      }
      // Retire les items trouvés de la liste des manquants
      const stillMissing = missing.filter(n => !found.includes(n));
      if (stillMissing.length === 0) return result;
      return { ...result, ...(await fetchSteamPrices(stillMissing.slice(0, 10))) };
    } catch (err) {
      console.warn('[prices] Pricempire unavailable:', err.message);
    }
  }

  // 3. Dernier recours : Steam Market (rate limited, max 10)
  return { ...result, ...(await fetchSteamPrices(missing.slice(0, 10))) };
}

/**
 * Récupère les prix depuis le Steam Community Market (rate-limited).
 * @param {string[]} names
 * @returns {Promise<Record<string, number>>}
 */
async function fetchSteamPrices(names) {
  const result = {};
  for (const name of names) {
    const price = await fetchSteamPrice(name);
    if (price !== null) result[name] = price;
  }
  return result;
}

/**
 * Récupère le prix d'un item depuis Steam Market.
 * @param {string} marketHashName
 */
async function fetchSteamPrice(marketHashName) {
  const now = Date.now();
  const wait = STEAM_RATE_LIMIT_MS - (now - lastSteamCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastSteamCall = Date.now();

  try {
    const { data } = await axios.get(
      'https://steamcommunity.com/market/priceoverview/',
      {
        params: { currency: 1, appid: 730, market_hash_name: marketHashName },
        timeout: 5_000,
      }
    );
    if (!data.success) return null;
    const raw = data.median_price ?? data.lowest_price ?? null;
    if (!raw) return null;
    return parseFloat(raw.replace(/[^0-9.]/g, ''));
  } catch {
    return null;
  }
}

/**
 * Calcule la différence de prix entre items offerts et demandés.
 * Positif = en faveur de l'utilisateur, négatif = à sa charge.
 */
function calcPriceDiff(offeredPrices, requestedPrices) {
  const sum = arr => arr.reduce((a, b) => a + b, 0);
  return sum(offeredPrices) - sum(requestedPrices);
}

module.exports = { fetchPrices, fetchSteamPrice, calcPriceDiff };
