const express = require('express');
const { getFloat } = require('../lib/floatcheck');

const router = express.Router();

// GET /api/float?link=steam://...&assetId=123456
// Proxy float — la clé API reste serveur, le cache aussi.
// Pas d'auth requise (les inspect links sont publics).
router.get('/', async (req, res) => {
  const { link, assetId } = req.query;
  if (!link || !assetId) {
    return res.status(400).json({ error: 'Paramètres link et assetId requis' });
  }

  try {
    const float = await getFloat(decodeURIComponent(link), assetId);
    res.json({ assetId, float });
  } catch (err) {
    const status = err.message.includes('429') ? 429 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
