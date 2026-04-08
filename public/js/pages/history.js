/* ============================================================
   PAGE — Historique des trades
   ============================================================ */

(async function initHistory() {
  const list = document.getElementById('trades-list');
  const loginPrompt = document.getElementById('login-prompt');

  await waitForUser();

  if (!window.__user) {
    if (loginPrompt) loginPrompt.hidden = false;
    if (list) list.hidden = true;
    return;
  }

  if (!list) return;

  list.innerHTML = '<p class="state-empty">Chargement…</p>';

  try {
    const data = await API.getTrades();
    const trades = data.trades ?? [];

    if (trades.length === 0) {
      list.innerHTML = '<p class="state-empty">Aucun trade pour le moment.</p>';
      return;
    }

    list.innerHTML = '';
    trades.forEach(trade => list.appendChild(createTradeRow(trade)));
  } catch (err) {
    list.innerHTML = `<p class="state-empty">${err.message}</p>`;
  }
})();

function createTradeRow(trade) {
  const row = document.createElement('div');
  row.className = 'trade-row';

  const statusClass = {
    PENDING: 'status--pending',
    SENT: 'status--sent',
    ACCEPTED: 'status--accepted',
    DECLINED: 'status--declined',
    CANCELLED: 'status--cancelled',
    EXPIRED: 'status--expired',
  }[trade.status] ?? '';

  const statusLabel = {
    PENDING: 'En attente',
    SENT: 'Envoyé',
    ACCEPTED: 'Accepté',
    DECLINED: 'Refusé',
    CANCELLED: 'Annulé',
    EXPIRED: 'Expiré',
  }[trade.status] ?? trade.status;

  const date = new Date(trade.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  row.innerHTML = `
    <div class="trade-row__date">${date}</div>
    <div class="trade-row__items">
      <span class="trade-row__count">${(trade.offeredItems ?? []).length} offerts</span>
      <span class="trade-row__arrow">→</span>
      <span class="trade-row__count">${(trade.requestedItems ?? []).length} demandés</span>
    </div>
    <div class="trade-row__diff ${trade.priceDiff >= 0 ? 'positive' : 'negative'}">
      ${trade.priceDiff >= 0 ? '+' : ''}${formatPrice(trade.priceDiff ?? 0)}
    </div>
    <div class="trade-row__status ${statusClass}">${statusLabel}</div>
  `;

  return row;
}

function waitForUser(timeout = 2000) {
  return new Promise(resolve => {
    if (window.__user !== undefined) return resolve();
    const t = setTimeout(resolve, timeout);
    window.addEventListener('auth:ready', () => { clearTimeout(t); resolve(); }, { once: true });
  });
}
