const express = require('express');
const { fetchSteamInventory } = require('../lib/steam');
const { fetchPrices } = require('../lib/prices');

const router = express.Router();

// GET /api/inventory?steamId=xxx  (steamId optionnel, utilise la session sinon)
router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const steamId = req.query.steamId ?? req.user?.steamId;
  if (!steamId) {
    return res.status(400).json({ error: 'steamId manquant' });
  }

  try {
    const items = await fetchSteamInventory(steamId);
    const names = [...new Set(items.map(i => i.marketHashName))];

    // Prices optionnelles — ne pas planter si Pricempire/Steam indispo
    let prices = {};
    try { prices = await fetchPrices(names); } catch (e) {
      console.warn('[inventory] fetchPrices failed (non-bloquant):', e.message);
    }

    const enriched = items.map(item => ({
      ...item,
      price: prices[item.marketHashName] ?? null,
    }));

    res.json({ items: enriched, total: enriched.length });
  } catch (err) {
    console.error('[inventory]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
