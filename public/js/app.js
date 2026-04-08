/* ============================================================
   APP.JS — Utilitaires globaux (chargé sur toutes les pages)
   ============================================================ */

/** Formate un prix USD en EUR */
function formatPrice(usd) {
  if (usd === null || usd === undefined) return '—';
  const eur = usd * 0.92;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(eur);
}

/** Retourne la clé courte d'une rareté */
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

/** Abréviation d'un exterior */
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

/** URL d'image Steam CDN */
function steamImageUrl(iconPath) {
  return `https://community.akamai.steamstatic.com/economy/image/${iconPath}/360fx360f`;
}

/**
 * Crée un élément item-card DOM à partir d'un objet SteamItem.
 * @param {object} item
 * @param {function} onClick
 * @returns {HTMLElement}
 */
function createItemCard(item, onClick) {
  const card = document.createElement('div');
  card.className = 'item-card';
  card.dataset.rarity = item.rarityKey ?? rarityToKey(item.rarity);
  card.dataset.assetId = item.assetId ?? item.id ?? '';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'item-card__img-wrap';

  const img = document.createElement('img');
  img.className = 'item-card__img';
  img.src = item.iconUrl ?? '';
  img.alt = item.name ?? '';
  img.loading = 'lazy';
  imgWrap.appendChild(img);

  if (item.isStatTrak) {
    const badge = document.createElement('span');
    badge.className = 'item-card__stattrak';
    badge.textContent = 'ST';
    card.appendChild(badge);
  }

  if (item.float !== null && item.float !== undefined) {
    const bar = document.createElement('div');
    bar.className = 'item-card__float-bar';
    const marker = document.createElement('div');
    marker.className = 'item-card__float-marker';
    marker.style.left = `${item.float * 100}%`;
    bar.appendChild(marker);
    card.appendChild(bar);
  }

  const footer = document.createElement('div');
  footer.className = 'item-card__footer';

  const name = document.createElement('div');
  name.className = 'item-card__name';
  name.textContent = item.name ?? '';
  name.title = item.name ?? '';

  const price = document.createElement('div');
  price.className = 'item-card__price';
  price.textContent = item.price ? formatPrice(item.price) : '—';

  footer.appendChild(name);
  footer.appendChild(price);

  card.appendChild(imgWrap);
  card.appendChild(footer);

  if (typeof onClick === 'function') {
    card.addEventListener('click', () => onClick(item, card));
  }

  return card;
}

/**
 * Affiche des skeletons de chargement dans un conteneur grid.
 * @param {HTMLElement} container
 * @param {number} count
 */
function showSkeletons(container, count = 18) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'skeleton';
    el.style.aspectRatio = '1';
    container.appendChild(el);
  }
}
