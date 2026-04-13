/**
 * CRON — Synchronisation des prix marché
 * Fréquence : toutes les 6 heures
 *
 * Télécharge un dump de prix global et met à jour le priceMap en mémoire.
 * Sources gratuites testées :
 *   - csgobackpack.net/api (dump JSON gratuit)
 *   - Pricempire free tier (limité)
 *   - Steam Market /priceoverview (rate limited, en fallback)
 */

const axios = require('axios');

// Cache global des prix en mémoire — Map<market_hash_name, price_usd>
// Importé par d'autres modules via require('./syncPrices').priceMap
const priceMap = new Map();

async function run() {
  console.log('[cron:prices] Mise à jour des prix...');

  try {
    // Source 1 : csgobackpack.net — dump gratuit, mis à jour toutes les ~6h
    const { data } = await axios.get(
      'https://csgobackpack.net/api/GetItemsList/v2/',
      { timeout: 30_000, params: { no_details: 0, no_prices: 0 } }
    );

    if (!data?.success || !data?.items_list) {
      throw new Error('csgobackpack: réponse invalide');
    }

    let count = 0;
    for (const [name, item] of Object.entries(data.items_list)) {
      // Prend le prix "24_hours" > "7_days" > "30_days" en priorité
      const prices = item.price;
      if (!prices) continue;

      const priceEntry =
        prices['24_hours']?.average ??
        prices['7_days']?.average ??
        prices['30_days']?.average;

      if (priceEntry) {
        priceMap.set(name, parseFloat(priceEntry));
        count++;
      }
    }

    console.log(`[cron:prices] ${count} prix mis à jour depuis csgobackpack`);
  } catch (err) {
    console.error('[cron:prices] Échec:', err.message);
    // TODO: fallback vers une autre source (pricempire, steam market)
  }
}

/**
 * Retourne le prix d'un item par son market_hash_name.
 * @param {string} marketHashName
 * @returns {number|null} Prix en USD
 */
function getPrice(marketHashName) {
  return priceMap.get(marketHashName) ?? null;
}

/**
 * Retourne les prix pour une liste de market_hash_names.
 * @param {string[]} names
 * @returns {Object<string, number>}
 */
function getPrices(names) {
  const result = {};
  for (const name of names) {
    const price = priceMap.get(name);
    if (price != null) result[name] = price;
  }
  return result;
}

module.exports = { run, schedule: '0 */6 * * *', name: 'syncPrices', priceMap, getPrice, getPrices };
