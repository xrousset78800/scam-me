const express = require('express');
const { prisma } = require('../lib/db');

const router = express.Router();

// GET /api/items?q=&rarity=&exterior=&minPrice=&maxPrice=&sort=&page=&limit=
router.get('/', async (req, res) => {
  const {
    q,
    rarity,
    exterior,
    minPrice,
    maxPrice,
    sort = 'price_desc',
    page = '1',
    limit = '60',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(120, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const where = {
    status: 'AVAILABLE',
    item: {},
  };

  if (q) {
    where.item.name = { contains: q, mode: 'insensitive' };
  }
  if (rarity) {
    where.item.rarity = rarity.toUpperCase().replace(/-/g, '_');
  }
  if (exterior) {
    where.item.exterior = exterior.toUpperCase().replace(/-/g, '_');
  }

  const priceFilter = {};
  if (minPrice) priceFilter.gte = parseFloat(minPrice);
  if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
  if (Object.keys(priceFilter).length) {
    where.item.prices = {
      some: { price: priceFilter },
    };
  }

  const orderBy = sort === 'price_asc'
    ? { item: { prices: { _min: { price: 'asc' } } } }
    : sort === 'name_asc'
    ? { item: { name: 'asc' } }
    : { item: { prices: { _min: { price: 'desc' } } } };

  // Si pas de DB configurée, retourne vide sans planter
  const dbUrl = process.env.DATABASE_URL ?? '';
  if (!dbUrl || dbUrl.includes('user:password@localhost')) {
    return res.json({ listings: [], total: 0, page: pageNum, limit: limitNum });
  }

  try {
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: { item: { include: { prices: true } } },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({ listings, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('[items]', err.message);
    res.json({ listings: [], total: 0, page: pageNum, limit: limitNum });
  }
});

module.exports = router;
