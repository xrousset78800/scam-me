/**
 * CRON — Refresh des inventaires plateforme
 * Fréquence : toutes les 15 minutes
 *
 * Rafraîchit le cache des inventaires de chaque bot/compte plateforme.
 * Les items sont stockés en cache mémoire (ou Redis quand disponible).
 */

const { fetchSteamInventory } = require('../../lib/steam');

async function run() {
  const rawIds = process.env.PLATFORM_STEAM_IDS ?? process.env.PLATFORM_STEAM_ID ?? '';
  const steamIds = rawIds.split(',').map(s => s.trim()).filter(Boolean);

  if (steamIds.length === 0) {
    console.log('[cron:inventory] Aucun PLATFORM_STEAM_IDS configuré — skip');
    return;
  }

  for (const steamId of steamIds) {
    try {
      const items = await fetchSteamInventory(steamId);
      console.log(`[cron:inventory] ${steamId}: ${items.length} items rafraîchis`);
      // TODO: stocker en cache partagé (Redis) ou mettre à jour en DB
    } catch (err) {
      console.error(`[cron:inventory] ${steamId} échec:`, err.message);
    }
  }
}

module.exports = { run, schedule: '*/15 * * * *', name: 'refreshInventory' };
