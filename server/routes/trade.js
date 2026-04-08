const express = require('express');
const { prisma } = require('../lib/db');
const { calcPriceDiff } = require('../lib/prices');

const router = express.Router();

// GET /api/trade — historique des trades de l'utilisateur connecté
router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const steamId = req.user.steamId;

  try {
    const trades = await prisma.trade.findMany({
      where: {
        OR: [{ initiatorId: steamId }, { receiverId: steamId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ trades });
  } catch (err) {
    console.error('[trade GET]', err.message);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

// POST /api/trade — créer une proposition de trade
router.post('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { offeredListingIds, requestedListingIds } = req.body;

  if (!Array.isArray(offeredListingIds) || !Array.isArray(requestedListingIds)) {
    return res.status(400).json({ error: 'Payload invalide' });
  }

  try {
    const [offeredListings, requestedListings] = await Promise.all([
      prisma.listing.findMany({
        where: { id: { in: offeredListingIds }, status: 'AVAILABLE' },
        include: { item: { include: { prices: true } } },
      }),
      prisma.listing.findMany({
        where: { id: { in: requestedListingIds }, status: 'AVAILABLE' },
        include: { item: { include: { prices: true } } },
      }),
    ]);

    const getPrice = listing =>
      listing.item.prices.find(p => p.source === 'pricempire')?.price
      ?? listing.item.prices[0]?.price
      ?? 0;

    const priceDiff = calcPriceDiff(
      offeredListings.map(getPrice),
      requestedListings.map(getPrice)
    );

    const trade = await prisma.trade.create({
      data: {
        initiatorId: req.user.steamId,
        offeredItems: offeredListings.map(l => l.id),
        requestedItems: requestedListings.map(l => l.id),
        priceDiff,
        status: 'PENDING',
      },
    });

    // TODO: envoyer l'offre Steam via bot (steamcommunity npm)

    res.json({ trade, priceDiff });
  } catch (err) {
    console.error('[trade POST]', err.message);
    res.status(500).json({ error: 'Impossible de créer le trade' });
  }
});

module.exports = router;
