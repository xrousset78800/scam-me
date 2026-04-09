/* ============================================================
   API.JS — Wrapper fetch() vers les routes /api/*
   Utilise API_BASE défini dans config.js
   ============================================================ */

const API = {
  async getSession() {
    const res = await fetch(`${API_BASE}/api/session`, { credentials: 'include' });
    return res.json();
  },

  async getInventory(steamId = null) {
    const url = steamId
      ? `${API_BASE}/api/inventory?steamId=${steamId}`
      : `${API_BASE}/api/inventory`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur inventaire');
    return res.json();
  },

  async getPlatformInventory() {
    const res = await fetch(`${API_BASE}/api/platform-inventory`, { credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur inventaire plateforme');
    return res.json();
  },

  async getItems(params = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    const res = await fetch(`${API_BASE}/api/items${qs ? '?' + qs : ''}`, { credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur items');
    return res.json();
  },

  async getTrades() {
    const res = await fetch(`${API_BASE}/api/trade`, { credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur trades');
    return res.json();
  },

  async createTrade(offeredListingIds, requestedListingIds) {
    const res = await fetch(`${API_BASE}/api/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ offeredListingIds, requestedListingIds }),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur création trade');
    return res.json();
  },
};
