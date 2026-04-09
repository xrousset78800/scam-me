const express = require('express');
const { fetchSteamInventory } = require('../lib/steam');
const { fetchPrices } = require('../lib/prices');

const router = express.Router();

// Cache en mémoire — TTL plus long que l'inventaire user (l'inventaire du bot change moins souvent)
const cache = new Map(); // steamId → { items, cachedAt }
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// GET /api/platform-inventory
// Retourne l'ensemble des inventaires des comptes Steam liés à la plateforme.
// Pas d'authentification requise — c'est du contenu public du marché.
router.get('/', async (req, res) => {
  const rawIds = process.env.PLATFORM_STEAM_IDS ?? process.env.PLATFORM_STEAM_ID ?? '';
  const steamIds = rawIds.split(',').map(s => s.trim()).filter(Boolean);

  if (steamIds.length === 0) {
    return res.status(503).json({ error: 'Aucun compte Steam plateforme configuré (PLATFORM_STEAM_IDS)' });
  }

  const allItems = [];
  const errors = [];

  await Promise.all(steamIds.map(async (steamId) => {
    const cached = cache.get(steamId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      console.log(`[platform-inventory] cache hit for ${steamId}`);
      allItems.push(...cached.items);
      return;
    }

    try {
      const items = await fetchSteamInventory(steamId);

      // Enrichissement des prix (non-bloquant)
      let prices = {};
      try {
        const names = [...new Set(items.map(i => i.marketHashName))];
        prices = await fetchPrices(names);
      } catch (err) {
        console.warn(`[platform-inventory] fetchPrices failed for ${steamId}:`, err.message);
      }

      const enriched = items.map(item => ({
        ...item,
        price: prices[item.marketHashName] ?? null,
        platformSteamId: steamId,
      }));

      cache.set(steamId, { items: enriched, cachedAt: Date.now() });
      allItems.push(...enriched);
    } catch (err) {
      console.error(`[platform-inventory] fetch failed for ${steamId}:`, err.message);

      // Retourne le cache périmé plutôt que rien (rate-limit Steam)
      const stale = cache.get(steamId);
      if (stale) {
        console.warn(`[platform-inventory] returning stale cache for ${steamId}`);
        allItems.push(...stale.items);
      } else {
        errors.push({ steamId, error: err.message });
      }
    }
  }));

  res.json({
    items: allItems,
    total: allItems.length,
    accounts: steamIds.length,
    errors: errors.length ? errors : undefined,
  });
});

module.exports = router;
