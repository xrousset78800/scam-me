/* ============================================================
   MOCK-DATA.JS — Données simulées pour le développement frontend
   Activé/désactivé via le toggle "Mode démo" dans l'UI
   ============================================================ */

/** Génère un placeholder SVG inline (aucune requête réseau) */
function mockImg(rarityKey, label) {
  const colors = {
    consumer:    { bg: '#1a2535', border: '#b0c3d9', text: '#b0c3d9' },
    industrial:  { bg: '#1a2535', border: '#5e98d9', text: '#5e98d9' },
    milspec:     { bg: '#1a2535', border: '#4b69ff', text: '#4b69ff' },
    restricted:  { bg: '#1a2535', border: '#8847ff', text: '#8847ff' },
    classified:  { bg: '#1a2535', border: '#d32ce6', text: '#d32ce6' },
    covert:      { bg: '#1a2535', border: '#eb4b4b', text: '#eb4b4b' },
    contraband:  { bg: '#1a2535', border: '#e4ae39', text: '#e4ae39' },
  };
  const c = colors[rarityKey] ?? colors.consumer;
  // Prend la première lettre de chaque mot (max 3)
  const initials = (label ?? '?')
    .split(/[\s|]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map(w => w[0].toUpperCase())
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="6" fill="${c.bg}"/>
    <rect x="2" y="2" width="116" height="116" rx="5" fill="none" stroke="${c.border}" stroke-width="2" opacity="0.6"/>
    <text x="60" y="68" text-anchor="middle" font-family="monospace" font-size="28" font-weight="bold" fill="${c.text}">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const MOCK = {
  enabled: false,

  /** Items du marché de la plateforme (format /api/items → listings[]) */
  get marketListings() {
    return _marketListings;
  },

  /** Inventaire Steam de l'utilisateur (format /api/inventory → items[]) */
  get userInventory() {
    return _userInventory;
  },
};

const _marketListings = [
  { id: 'l-1',  item: { id: 'i-1',  name: 'AK-47 | Redline',                rarity: 'Classified',    exterior: 'Field-Tested',   float: 0.287, imageUrl: mockImg('classified',  'AK-47 | Redline'),                prices: [{ price: 12.45  }] } },
  { id: 'l-2',  item: { id: 'i-2',  name: 'AWP | Asiimov',                  rarity: 'Covert',        exterior: 'Field-Tested',   float: 0.241, imageUrl: mockImg('covert',      'AWP | Asiimov'),                  prices: [{ price: 67.30  }] } },
  { id: 'l-3',  item: { id: 'i-3',  name: 'M4A4 | Howl',                    rarity: 'Contraband',    exterior: 'Minimal Wear',   float: 0.113, imageUrl: mockImg('contraband',  'M4A4 | Howl'),                    prices: [{ price: 1850.00}] } },
  { id: 'l-4',  item: { id: 'i-4',  name: 'Glock-18 | Fade',                rarity: 'Restricted',    exterior: 'Factory New',    float: 0.006, imageUrl: mockImg('restricted',  'Glock-18 | Fade'),                prices: [{ price: 220.00 }] } },
  { id: 'l-5',  item: { id: 'i-5',  name: 'Desert Eagle | Blaze',           rarity: 'Restricted',    exterior: 'Factory New',    float: 0.018, imageUrl: mockImg('restricted',  'Desert Eagle | Blaze'),           prices: [{ price: 78.50  }] } },
  { id: 'l-6',  item: { id: 'i-6',  name: 'USP-S | Kill Confirmed',         rarity: 'Covert',        exterior: 'Minimal Wear',   float: 0.142, imageUrl: mockImg('covert',      'USP-S | Kill Confirmed'),         prices: [{ price: 45.20  }] } },
  { id: 'l-7',  item: { id: 'i-7',  name: 'Karambit | Doppler',             rarity: 'Covert',        exterior: 'Factory New',    float: 0.002, imageUrl: mockImg('covert',      'Karambit | Doppler'),             prices: [{ price: 560.00 }] } },
  { id: 'l-8',  item: { id: 'i-8',  name: 'FAMAS | Afterimage',             rarity: 'Classified',    exterior: 'Factory New',    float: 0.034, imageUrl: mockImg('classified',  'FAMAS | Afterimage'),             prices: [{ price: 5.80   }] } },
  { id: 'l-9',  item: { id: 'i-9',  name: 'M4A1-S | Hyper Beast',          rarity: 'Covert',        exterior: 'Field-Tested',   float: 0.312, imageUrl: mockImg('covert',      'M4A1-S | Hyper Beast'),           prices: [{ price: 32.00  }] } },
  { id: 'l-10', item: { id: 'i-10', name: 'AK-47 | Case Hardened',          rarity: 'Classified',    exterior: 'Battle-Scarred', float: 0.671, imageUrl: mockImg('classified',  'AK-47 | Case Hardened'),          prices: [{ price: 18.90  }] } },
  { id: 'l-11', item: { id: 'i-11', name: 'P250 | Asiimov',                 rarity: 'Classified',    exterior: 'Factory New',    float: 0.012, imageUrl: mockImg('classified',  'P250 | Asiimov'),                 prices: [{ price: 11.40  }] } },
  { id: 'l-12', item: { id: 'i-12', name: 'Butterfly Knife | Tiger Tooth',  rarity: 'Covert',        exterior: 'Factory New',    float: 0.001, imageUrl: mockImg('covert',      'Butterfly Knife | Tiger Tooth'),  prices: [{ price: 430.00 }] } },
  { id: 'l-13', item: { id: 'i-13', name: 'SSG 08 | Blood in the Water',    rarity: 'Covert',        exterior: 'Factory New',    float: 0.008, imageUrl: mockImg('covert',      'SSG 08 | Blood in the Water'),    prices: [{ price: 148.00 }] } },
  { id: 'l-14', item: { id: 'i-14', name: 'Glock-18 | Water Elemental',     rarity: 'Restricted',    exterior: 'Field-Tested',   float: 0.196, imageUrl: mockImg('restricted',  'Glock-18 | Water Elemental'),     prices: [{ price: 6.20   }] } },
  { id: 'l-15', item: { id: 'i-15', name: 'M4A4 | Desolate Space',          rarity: 'Classified',    exterior: 'Minimal Wear',   float: 0.087, imageUrl: mockImg('classified',  'M4A4 | Desolate Space'),          prices: [{ price: 9.70   }] } },
  { id: 'l-16', item: { id: 'i-16', name: 'AUG | Chameleon',                rarity: 'Mil-Spec Grade', exterior: 'Factory New',   float: 0.055, imageUrl: mockImg('milspec',     'AUG | Chameleon'),                prices: [{ price: 1.20   }] } },
  { id: 'l-17', item: { id: 'i-17', name: 'AWP | Electric Hive',            rarity: 'Classified',    exterior: 'Factory New',    float: 0.021, imageUrl: mockImg('classified',  'AWP | Electric Hive'),            prices: [{ price: 19.50  }] } },
  { id: 'l-18', item: { id: 'i-18', name: 'MP9 | Hot Rod',                  rarity: 'Classified',    exterior: 'Factory New',    float: 0.007, imageUrl: mockImg('classified',  'MP9 | Hot Rod'),                  prices: [{ price: 52.00  }] } },
  { id: 'l-19', item: { id: 'i-19', name: 'P90 | Asiimov',                  rarity: 'Classified',    exterior: 'Field-Tested',   float: 0.358, imageUrl: mockImg('classified',  'P90 | Asiimov'),                  prices: [{ price: 14.80  }] } },
  { id: 'l-20', item: { id: 'i-20', name: 'Five-SeveN | Monkey Business',   rarity: 'Classified',    exterior: 'Factory New',    float: 0.044, imageUrl: mockImg('classified',  'Five-SeveN | Monkey Business'),   prices: [{ price: 7.30   }] } },
  { id: 'l-21', item: { id: 'i-21', name: 'USP-S | Orion',                  rarity: 'Classified',    exterior: 'Factory New',    float: 0.032, imageUrl: mockImg('classified',  'USP-S | Orion'),                  prices: [{ price: 28.00  }] } },
  { id: 'l-22', item: { id: 'i-22', name: 'AK-47 | Fire Serpent',           rarity: 'Covert',        exterior: 'Field-Tested',   float: 0.225, imageUrl: mockImg('covert',      'AK-47 | Fire Serpent'),           prices: [{ price: 390.00 }] } },
  { id: 'l-23', item: { id: 'i-23', name: 'Nova | Antique',                 rarity: 'Consumer Grade', exterior: 'Factory New',   float: 0.062, imageUrl: mockImg('consumer',    'Nova | Antique'),                 prices: [{ price: 0.45   }] } },
  { id: 'l-24', item: { id: 'i-24', name: 'SG 553 | Integrale',             rarity: 'Classified',    exterior: 'Factory New',    float: 0.029, imageUrl: mockImg('classified',  'SG 553 | Integrale'),             prices: [{ price: 23.10  }] } },
];

const _userInventory = [
  { assetId: 'inv-1',  name: 'AK-47 | Frontside Misty',          marketHashName: 'AK-47 | Frontside Misty (Field-Tested)',             rarity: 'Classified',    rarityKey: 'classified',  exterior: 'Field-Tested',   iconUrl: mockImg('classified',  'AK-47 | Frontside Misty'),          price: 18.40,   isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.23, stickers: [] },
  { assetId: 'inv-2',  name: 'StatTrak™ M4A1-S | Hyper Beast',   marketHashName: 'StatTrak™ M4A1-S | Hyper Beast (Minimal Wear)',      rarity: 'Covert',        rarityKey: 'covert',      exterior: 'Minimal Wear',   iconUrl: mockImg('covert',      'M4A1-S | Hyper Beast'),             price: 95.00,   isStatTrak: true,  isSouvenir: false, tradable: true,  float: 0.09, stickers: [] },
  { assetId: 'inv-3',  name: 'P250 | Sand Dune',                  marketHashName: 'P250 | Sand Dune (Field-Tested)',                    rarity: 'Consumer Grade',rarityKey: 'consumer',    exterior: 'Field-Tested',   iconUrl: mockImg('consumer',    'P250 | Sand Dune'),                 price: 0.12,    isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.51, stickers: [] },
  { assetId: 'inv-4',  name: 'AWP | Dragon Lore',                 marketHashName: 'AWP | Dragon Lore (Factory New)',                    rarity: 'Covert',        rarityKey: 'covert',      exterior: 'Factory New',    iconUrl: mockImg('covert',      'AWP | Dragon Lore'),                price: 4200.00, isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.01, stickers: [] },
  { assetId: 'inv-5',  name: 'Glock-18 | Water Elemental',        marketHashName: 'Glock-18 | Water Elemental (Factory New)',           rarity: 'Restricted',    rarityKey: 'restricted',  exterior: 'Factory New',    iconUrl: mockImg('restricted',  'Glock-18 | Water Elemental'),       price: 7.20,    isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.03, stickers: [] },
  { assetId: 'inv-6',  name: 'SSG 08 | Blood in the Water',       marketHashName: 'SSG 08 | Blood in the Water (Factory New)',          rarity: 'Covert',        rarityKey: 'covert',      exterior: 'Factory New',    iconUrl: mockImg('covert',      'SSG 08 | Blood in the Water'),      price: 148.00,  isStatTrak: false, isSouvenir: false, tradable: false, float: null, stickers: [] },
  { assetId: 'inv-7',  name: 'AK-47 | Redline',                   marketHashName: 'AK-47 | Redline (Field-Tested)',                     rarity: 'Classified',    rarityKey: 'classified',  exterior: 'Field-Tested',   iconUrl: mockImg('classified',  'AK-47 | Redline'),                  price: 12.45,   isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.31, stickers: [] },
  { assetId: 'inv-8',  name: 'Desert Eagle | Blaze',              marketHashName: 'Desert Eagle | Blaze (Factory New)',                 rarity: 'Restricted',    rarityKey: 'restricted',  exterior: 'Factory New',    iconUrl: mockImg('restricted',  'Desert Eagle | Blaze'),             price: 78.50,   isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.004,stickers: [] },
  { assetId: 'inv-9',  name: 'Karambit | Marble Fade',            marketHashName: 'Karambit | Marble Fade (Factory New)',               rarity: 'Covert',        rarityKey: 'covert',      exterior: 'Factory New',    iconUrl: mockImg('covert',      'Karambit | Marble Fade'),           price: 720.00,  isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.007,stickers: [] },
  { assetId: 'inv-10', name: 'USP-S | Kill Confirmed',            marketHashName: 'USP-S | Kill Confirmed (Minimal Wear)',              rarity: 'Covert',        rarityKey: 'covert',      exterior: 'Minimal Wear',   iconUrl: mockImg('covert',      'USP-S | Kill Confirmed'),           price: 45.20,   isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.14, stickers: [] },
  { assetId: 'inv-11', name: 'StatTrak™ AK-47 | Asiimov',         marketHashName: 'StatTrak™ AK-47 | Asiimov (Field-Tested)',           rarity: 'Covert',        rarityKey: 'covert',      exterior: 'Field-Tested',   iconUrl: mockImg('covert',      'AK-47 | Asiimov'),                  price: 180.00,  isStatTrak: true,  isSouvenir: false, tradable: true,  float: 0.27, stickers: [] },
  { assetId: 'inv-12', name: 'Five-SeveN | Fowl Play',            marketHashName: 'Five-SeveN | Fowl Play (Factory New)',               rarity: 'Mil-Spec Grade',rarityKey: 'milspec',     exterior: 'Factory New',    iconUrl: mockImg('milspec',     'Five-SeveN | Fowl Play'),           price: 1.80,    isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.02, stickers: [] },
  { assetId: 'inv-13', name: 'MP9 | Hot Rod',                     marketHashName: 'MP9 | Hot Rod (Factory New)',                        rarity: 'Classified',    rarityKey: 'classified',  exterior: 'Factory New',    iconUrl: mockImg('classified',  'MP9 | Hot Rod'),                    price: 52.00,   isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.01, stickers: [] },
  { assetId: 'inv-14', name: 'FAMAS | Afterimage',                marketHashName: 'FAMAS | Afterimage (Field-Tested)',                  rarity: 'Classified',    rarityKey: 'classified',  exterior: 'Field-Tested',   iconUrl: mockImg('classified',  'FAMAS | Afterimage'),               price: 4.90,    isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.35, stickers: [] },
  { assetId: 'inv-15', name: 'P90 | Asiimov',                     marketHashName: 'P90 | Asiimov (Field-Tested)',                       rarity: 'Classified',    rarityKey: 'classified',  exterior: 'Field-Tested',   iconUrl: mockImg('classified',  'P90 | Asiimov'),                    price: 14.80,   isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.24, stickers: [] },
  { assetId: 'inv-16', name: 'Souvenir AWP | Dragon Lore',        marketHashName: 'Souvenir AWP | Dragon Lore (Field-Tested)',          rarity: 'Covert',        rarityKey: 'covert',      exterior: 'Field-Tested',   iconUrl: mockImg('covert',      'AWP | Dragon Lore'),                price: 12000.00,isStatTrak: false, isSouvenir: true,  tradable: true,  float: 0.18, stickers: [] },
  { assetId: 'inv-17', name: 'AUG | Chameleon',                   marketHashName: 'AUG | Chameleon (Factory New)',                      rarity: 'Mil-Spec Grade',rarityKey: 'milspec',     exterior: 'Factory New',    iconUrl: mockImg('milspec',     'AUG | Chameleon'),                  price: 1.20,    isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.06, stickers: [] },
  { assetId: 'inv-18', name: 'Nova | Antique',                    marketHashName: 'Nova | Antique (Factory New)',                       rarity: 'Consumer Grade',rarityKey: 'consumer',    exterior: 'Factory New',    iconUrl: mockImg('consumer',    'Nova | Antique'),                   price: 0.45,    isStatTrak: false, isSouvenir: false, tradable: true,  float: 0.07, stickers: [] },
];
