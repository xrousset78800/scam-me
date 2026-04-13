/**
 * QUEUE/INDEX.JS — Initialisation de la trade queue
 *
 * Branche le worker qui traite les trade jobs via le BotManager.
 * Migration future vers BullMQ + Redis : remplacer tradeQueue.js
 * par un wrapper BullMQ — l'interface addTradeJob/onTradeJob reste identique.
 */

const tradeQueue = require('./tradeQueue');
const { manager } = require('../bot');

function initQueue() {
  tradeQueue.onTradeJob(async (jobData) => {
    // Sélectionne un bot disponible (round-robin ou spécifique)
    const bot = jobData.botId
      ? manager.getBot(jobData.botId)
      : manager.getAvailableBot();

    if (!bot) throw new Error('Aucun bot disponible');
    if (bot.status !== 'online') throw new Error(`Bot ${bot.id} non disponible (status=${bot.status})`);

    const offerId = await bot.sendTradeOffer({
      partnerSteamId: jobData.partnerSteamId,
      partnerToken: jobData.partnerToken,
      itemsToGive: jobData.itemsToGive,
      itemsToReceive: jobData.itemsToReceive,
      message: `scam.me trade #${jobData.tradeId}`,
    });

    return offerId;
  });

  // Events pour logging / future DB update
  tradeQueue.on('completed', (data) => {
    console.log(`[queue] ✓ Trade ${data.tradeId} complété (offer ${data.offerId})`);
    // TODO: mettre à jour en DB → status 'sent', steam_offer_id
  });

  tradeQueue.on('failed', (data) => {
    console.error(`[queue] ✗ Trade ${data.tradeId} échoué: ${data.error}`);
    // TODO: mettre à jour en DB → status 'error', error_message
  });

  console.log('[queue] Trade queue initialisée');
}

module.exports = { initQueue, tradeQueue };
