/** Formate un prix USD en EUR affichable */
function formatPrice(usd) {
  const eur = usd * 0.92;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(eur);
}

/** Formate un float sur 8 décimales */
function formatFloat(float) {
  return float.toFixed(8);
}

/** Abréviation d'un exterior CS2 */
function exteriorAbbr(exterior) {
  const map = {
    'Factory New': 'FN',
    'Minimal Wear': 'MW',
    'Field-Tested': 'FT',
    'Well-Worn': 'WW',
    'Battle-Scarred': 'BS',
  };
  return exterior ? (map[exterior] ?? '') : '';
}

/** Convertit un nom de rareté complet en clé courte */
function rarityToKey(rarity) {
  const map = {
    'Consumer Grade': 'consumer',
    'Industrial Grade': 'industrial',
    'Mil-Spec Grade': 'milspec',
    'Restricted': 'restricted',
    'Classified': 'classified',
    'Covert': 'covert',
    'Contraband': 'contraband',
  };
  return map[rarity] ?? 'consumer';
}

/** Couleur hex d'une rareté */
function rarityColor(key) {
  const map = {
    consumer: '#b0c3d9',
    industrial: '#5e98d9',
    milspec: '#4b69ff',
    restricted: '#8847ff',
    classified: '#d32ce6',
    covert: '#eb4b4b',
    contraband: '#e4ae39',
  };
  return map[key] ?? '#b0c3d9';
}

/** Construit l'URL d'image Steam CDN */
function steamImageUrl(iconPath) {
  return `https://community.akamai.steamstatic.com/economy/image/${iconPath}/360fx360f`;
}

/** Label français pour la différence de prix */
function priceDiffLabel(diff) {
  if (diff > 0) return `+${formatPrice(diff)} en ta faveur`;
  if (diff < 0) return `${formatPrice(diff)} à ta charge`;
  return 'Échange équitable';
}

module.exports = {
  formatPrice,
  formatFloat,
  exteriorAbbr,
  rarityToKey,
  rarityColor,
  steamImageUrl,
  priceDiffLabel,
};
