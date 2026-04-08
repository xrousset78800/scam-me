/* ============================================================
   PAGE — Trade
   ============================================================ */

const offeredItems = new Map();    // assetId → item (inventaire utilisateur)
const requestedItems = new Map();  // listingId → item (marché)

(async function initTrade() {
  await loadMarket();
  await loadInventoryIfConnected();
  updateTradePanel();

  document.getElementById('market-search')?.addEventListener('input', loadMarket);
  document.getElementById('market-sort')?.addEventListener('change', loadMarket);
  document.getElementById('btn-trade')?.addEventListener('click', submitTrade);
})();

async function loadMarket() {
  const grid = document.getElementById('market-grid');
  if (!grid) return;

  const search = document.getElementById('market-search')?.value ?? '';
  const sort = document.getElementById('market-sort')?.value ?? 'price_desc';

  showSkeletons(grid, 12);

  try {
    const data = await API.getItems({ q: search, sort, limit: 60 });
    const listings = data.listings ?? [];

    grid.innerHTML = '';
    if (listings.length === 0) {
      grid.innerHTML = '<p class="state-empty">Aucun item disponible.</p>';
      return;
    }

    listings.forEach(listing => {
      const item = {
        ...listing.item,
        assetId: listing.id,
        price: listing.item.prices?.[0]?.price ?? null,
        rarityKey: rarityToKey(listing.item.rarity ?? 'Consumer Grade'),
        iconUrl: listing.item.imageUrl ?? '',
      };
      const card = createItemCard(item, onMarketItemClick);
      if (requestedItems.has(listing.id)) card.classList.add('selected');
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p class="state-empty">${err.message}</p>`;
  }
}

async function loadInventoryIfConnected() {
  const grid = document.getElementById('inventory-grid');
  if (!grid) return;

  let session;
  try { session = await API.getSession(); } catch { return; }

  if (!session.authenticated) {
    grid.innerHTML = `
      <p class="state-empty" style="grid-column:1/-1">
        <a href="/auth/steam" style="color:var(--accent)">Connecte-toi</a> pour voir ton inventaire
      </p>`;
    return;
  }

  showSkeletons(grid, 12);

  try {
    const data = await API.getInventory();
    const items = data.items ?? [];

    grid.innerHTML = '';
    if (items.length === 0) {
      grid.innerHTML = '<p class="state-empty">Inventaire vide.</p>';
      return;
    }

    items.forEach(item => {
      const card = createItemCard(item, onInventoryItemClick);
      if (offeredItems.has(item.assetId)) card.classList.add('selected');
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p class="state-empty">${err.message}</p>`;
  }
}

function onMarketItemClick(item, card) {
  const id = item.assetId;
  if (requestedItems.has(id)) {
    requestedItems.delete(id);
    card.classList.remove('selected');
  } else {
    requestedItems.set(id, item);
    card.classList.add('selected');
  }
  updateTradePanel();
}

function onInventoryItemClick(item, card) {
  const id = item.assetId;
  if (offeredItems.has(id)) {
    offeredItems.delete(id);
    card.classList.remove('selected');
  } else {
    offeredItems.set(id, item);
    card.classList.add('selected');
  }
  updateTradePanel();
}

function updateTradePanel() {
  updatePanelSection('panel-offered', offeredItems);
  updatePanelSection('panel-requested', requestedItems);
  updatePriceDiff();

  const btn = document.getElementById('btn-trade');
  if (btn) {
    btn.disabled = offeredItems.size === 0 && requestedItems.size === 0;
  }
}

function updatePanelSection(panelId, itemsMap) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  panel.innerHTML = '';

  if (itemsMap.size === 0) {
    panel.classList.add('empty');
    return;
  }

  panel.classList.remove('empty');
  itemsMap.forEach(item => {
    const img = document.createElement('img');
    img.className = 'trade-panel__thumb';
    img.src = item.iconUrl ?? '';
    img.alt = item.name ?? '';
    img.title = item.name ?? '';
    panel.appendChild(img);
  });
}

function updatePriceDiff() {
  const diffEl = document.getElementById('panel-diff');
  if (!diffEl) return;

  const sum = map => Array.from(map.values()).reduce((a, i) => a + (i.price ?? 0), 0);
  const diff = sum(offeredItems) - sum(requestedItems);

  diffEl.className = 'trade-panel__diff';
  if (diff > 0.01) {
    diffEl.classList.add('positive');
    diffEl.textContent = `+${formatPrice(diff)} en ta faveur`;
  } else if (diff < -0.01) {
    diffEl.classList.add('negative');
    diffEl.textContent = `${formatPrice(diff)} à ta charge`;
  } else {
    diffEl.classList.add('neutral');
    diffEl.textContent = offeredItems.size || requestedItems.size ? 'Échange équitable' : '—';
  }
}

async function submitTrade() {
  const btn = document.getElementById('btn-trade');
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi…'; }

  try {
    await API.createTrade(
      Array.from(offeredItems.keys()),
      Array.from(requestedItems.keys())
    );
    offeredItems.clear();
    requestedItems.clear();
    updateTradePanel();
    window.location.href = '/history.html';
  } catch (err) {
    alert(err.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Proposer le trade'; }
  }
}
