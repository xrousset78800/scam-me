/* ============================================================
   PAGE — Inventaire utilisateur
   ============================================================ */

(async function initInventory() {
  const grid = document.getElementById('inventory-grid');
  const counter = document.getElementById('inventory-counter');
  const totalValue = document.getElementById('inventory-total');
  const refreshBtn = document.getElementById('btn-refresh');
  const searchInput = document.getElementById('filter-search');
  const rarityPills = document.querySelectorAll('.filter-pill[data-rarity]');
  const exteriorSelect = document.getElementById('filter-exterior');
  const sortSelect = document.getElementById('filter-sort');
  const loginPrompt = document.getElementById('login-prompt');

  let allItems = [];
  let activeRarity = null;

  // Attend que auth.js ait initialisé la session
  await waitForUser();

  if (!window.__user) {
    if (loginPrompt) loginPrompt.hidden = false;
    if (grid) grid.hidden = true;
    return;
  }

  await loadInventory();

  // Bouton actualiser
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadInventory);
  }

  // Filtres
  if (searchInput) {
    searchInput.addEventListener('input', renderFiltered);
  }
  rarityPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const r = pill.dataset.rarity;
      activeRarity = activeRarity === r ? null : r;
      rarityPills.forEach(p => p.classList.toggle('active', p.dataset.rarity === activeRarity));
      renderFiltered();
    });
  });
  if (exteriorSelect) exteriorSelect.addEventListener('change', renderFiltered);
  if (sortSelect) sortSelect.addEventListener('change', renderFiltered);

  async function loadInventory() {
    if (!grid) return;
    showSkeletons(grid, 18);
    if (refreshBtn) refreshBtn.disabled = true;

    try {
      const data = await API.getInventory();
      allItems = data.items ?? [];
      renderFiltered();
    } catch (err) {
      grid.innerHTML = `<p class="state-empty">${err.message}</p>`;
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  function renderFiltered() {
    if (!grid) return;

    const search = searchInput?.value.toLowerCase() ?? '';
    const exterior = exteriorSelect?.value ?? '';
    const sort = sortSelect?.value ?? 'price_desc';

    let items = allItems.filter(item => {
      if (search && !item.name.toLowerCase().includes(search)) return false;
      if (activeRarity && item.rarityKey !== activeRarity) return false;
      if (exterior && item.exterior !== exterior) return false;
      return true;
    });

    items.sort((a, b) => {
      if (sort === 'price_asc') return (a.price ?? 0) - (b.price ?? 0);
      if (sort === 'price_desc') return (b.price ?? 0) - (a.price ?? 0);
      if (sort === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });

    grid.innerHTML = '';

    if (items.length === 0) {
      grid.innerHTML = '<p class="state-empty">Aucun item trouvé.</p>';
    } else {
      items.forEach(item => grid.appendChild(createItemCard(item)));
    }

    const total = items.reduce((sum, i) => sum + (i.price ?? 0), 0);
    if (counter) counter.textContent = `${items.length} items`;
    if (totalValue) totalValue.textContent = formatPrice(total);
  }
})();

function waitForUser(timeout = 2000) {
  return new Promise(resolve => {
    if (window.__user !== undefined) return resolve();
    const t = setTimeout(resolve, timeout);
    window.addEventListener('auth:ready', () => { clearTimeout(t); resolve(); }, { once: true });
  });
}
