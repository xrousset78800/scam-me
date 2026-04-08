/* ============================================================
   API.JS — Wrapper fetch() vers les routes /api/*
   ============================================================ */

const API = {
  /** Récupère la session courante */
  async getSession() {
    const res = await fetch('/api/session');
    return res.json();
  },

  /** Récupère l'inventaire Steam de l'utilisateur connecté */
  async getInventory(steamId = null) {
    const url = steamId ? `/api/inventory?steamId=${steamId}` : '/api/inventory';
    const res = await fetch(url);
    if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur inventaire');
    return res.json();
  },

  /**
   * Récupère les listings du marché.
   * @param {object} params - { q, rarity, exterior, minPrice, maxPrice, sort, page, limit }
   */
  async getItems(params = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    const res = await fetch(`/api/items${qs ? '?' + qs : ''}`);
    if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur items');
    return res.json();
  },

  /** Récupère l'historique des trades */
  async getTrades() {
    const res = await fetch('/api/trade');
    if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur trades');
    return res.json();
  },

  /**
   * Crée une proposition de trade.
   * @param {string[]} offeredListingIds
   * @param {string[]} requestedListingIds
   */
  async createTrade(offeredListingIds, requestedListingIds) {
    const res = await fetch('/api/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offeredListingIds, requestedListingIds }),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur création trade');
    return res.json();
  },
};
