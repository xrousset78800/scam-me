const express = require('express');
const { fetchSteamInventory } = require('../lib/steam');
const { fetchPrices } = require('../lib/prices');

const router = express.Router();

router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const steamId = req.query.steamId ?? req.user?.steamId;
  if (!steamId) {
    return res.status(400).json({ error: 'steamId manquant' });
  }

  let items = [];
  try {
    items = await fetchSteamInventory(steamId);
  } catch (err) {
    console.error('[inventory] fetchSteamInventory failed:', err.message);
    // Retourne l'erreur exacte pour debugger
    return res.status(500).json({ error: err.message });
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

  res.json({ items: enriched, total: enriched.length });
});

module.exports = router;
