const express = require('express');
const { fetchSteamInventory } = require('../lib/steam');
const { fetchPrices } = require('../lib/prices');

const router = express.Router();

// Cache en mémoire : steamId → { items, cachedAt }
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const steamId = req.query.steamId ?? req.user?.steamId;
  if (!steamId) {
    return res.status(400).json({ error: 'steamId manquant' });
  }

  // Retourne le cache si encore frais
  const cached = cache.get(steamId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    console.log(`[inventory] cache hit for ${steamId}`);
    return res.json({ items: cached.items, total: cached.items.length, cached: true });
  }

  let items = [];
  try {
    items = await fetchSteamInventory(steamId);
  } catch (err) {
    console.error('[inventory] fetchSteamInventory failed:', err.message);

    // Si rate-limité par Steam, retourne le cache périmé plutôt que rien
    if (err.message.includes('429') && cached) {
      console.warn('[inventory] Rate limited, returning stale cache');
      return res.json({ items: cached.items, total: cached.items.length, cached: true, stale: true });
    }

    const status = err.message.includes('429') ? 429 : 500;
    return res.status(status).json({ error: err.message });
  }

  // Prices non-bloquantes
  let prices = {};
  try {
    const names = [...new Set(items.map(i => i.marketHashName))];
    prices = await fetchPrices(names);
  } catch (err) {
    console.warn('[inventory] fetchPrices failed (non-bloquant):', err.message);
  }

  const enriched = items.map(item => ({
    ...item,
    price: prices[item.marketHashName] ?? null,
  }));

  // Mise en cache
  cache.set(steamId, { items: enriched, cachedAt: Date.now() });

  res.json({ items: enriched, total: enriched.length });
});

module.exports = router;
