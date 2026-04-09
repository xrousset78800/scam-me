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
  card.dataset.rarity = item.rarityKey ?? rarityToKey(item.rarity ?? 'Consumer Grade');
  card.dataset.assetId = item.assetId ?? item.id ?? '';

  // Badge StatTrak / Souvenir
  if (item.isStatTrak) {
    const badge = document.createElement('span');
    badge.className = 'item-card__stattrak';
    badge.textContent = 'ST';
    card.appendChild(badge);
  } else if (item.isSouvenir) {
    const badge = document.createElement('span');
    badge.className = 'item-card__souvenir';
    badge.textContent = 'SV';
    card.appendChild(badge);
  }

  // Image
  const imgWrap = document.createElement('div');
  imgWrap.className = 'item-card__img-wrap';
  const img = document.createElement('img');
  img.className = 'item-card__img';
  img.src = item.iconUrl ?? '';
  img.alt = item.name ?? '';
  img.loading = 'lazy';
  imgWrap.appendChild(img);
  card.appendChild(imgWrap);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'item-card__footer';

  // Nom complet
  const name = document.createElement('div');
  name.className = 'item-card__name';
  name.textContent = item.name ?? '';
  name.title = item.name ?? '';
  footer.appendChild(name);

  // Ligne : exterior + float value
  const hasFloat = item.float !== null && item.float !== undefined;
  const hasExterior = item.exterior;
  if (hasExterior || hasFloat) {
    const meta = document.createElement('div');
    meta.className = 'item-card__meta';

    if (hasExterior) {
      const ext = document.createElement('span');
      ext.className = 'item-card__exterior';
      ext.textContent = exteriorAbbr(item.exterior);
      meta.appendChild(ext);
    }

    if (hasFloat) {
      const floatVal = document.createElement('span');
      floatVal.className = 'item-card__float-val';
      floatVal.textContent = item.float.toFixed(4);
      meta.appendChild(floatVal);
    }

    footer.appendChild(meta);
  }

  // Barre de float
  if (hasFloat) {
    const bar = document.createElement('div');
    bar.className = 'item-card__float-bar';
    const marker = document.createElement('div');
    marker.className = 'item-card__float-marker';
    marker.style.left = `${Math.min(100, Math.max(0, item.float * 100))}%`;
    bar.appendChild(marker);
    footer.appendChild(bar);
  }

  // Ligne : prix + cadenas si non-tradable
  const priceRow = document.createElement('div');
  priceRow.className = 'item-card__price-row';

  const price = document.createElement('div');
  price.className = 'item-card__price';
  price.textContent = item.price != null ? formatPrice(item.price) : '—';
  priceRow.appendChild(price);

  if (item.tradable === false) {
    const lock = document.createElement('span');
    lock.className = 'item-card__lock';
    lock.textContent = '🔒';
    lock.title = 'Non-échangeable';
    priceRow.appendChild(lock);
  }

  footer.appendChild(priceRow);
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
