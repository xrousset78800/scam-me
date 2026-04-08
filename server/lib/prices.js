const axios = require('axios');

let lastSteamCall = 0;
const STEAM_RATE_LIMIT_MS = 300;

/**
 * Récupère les prix en batch depuis Pricempire, avec fallback Steam.
 * @param {string[]} marketHashNames
 * @returns {Promise<Record<string, number>>}
 */
async function fetchPrices(marketHashNames) {
  if (!marketHashNames.length) return {};

  const apiKey = process.env.PRICEMPIRE_API_KEY;
  if (apiKey) {
    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        source: 'buff163',
        currency: 'USD',
      });
      marketHashNames.forEach(name => params.append('items[]', name));

      const { data } = await axios.get(
        `https://api.pricempire.com/v3/items/prices?${params.toString()}`,
        { timeout: 8_000 }
      );

      const result = {};
      for (const [name, info] of Object.entries(data)) {
        if (info?.buff163?.price) {
          result[name] = info.buff163.price / 100;
        }
      }
      if (Object.keys(result).length > 0) return result;
    } catch (err) {
      console.warn('[prices] Pricempire unavailable, falling back to Steam:', err.message);
    }
  }

  return fetchSteamPrices(marketHashNames.slice(0, 20));
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
