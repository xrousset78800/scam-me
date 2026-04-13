/**
 * CRON — Nettoyage des trades expirés
 * Fréquence : toutes les 5 minutes
 *
 * Les trades en status 'pending' ou 'sent' depuis plus de 15 minutes
 * sont marqués comme 'expired'. Le trade offer Steam est annulé si possible.
 */

async function run() {
  // TODO: quand la DB est en place :
  // 1. SELECT trades WHERE status IN ('pending','sent') AND created_at < NOW() - 15min
  // 2. Pour chaque : annuler le trade offer Steam via bot.cancelTradeOffer()
  // 3. UPDATE trades SET status = 'expired', updated_at = NOW()
  // 4. Log dans audit_log
  console.log('[cron:cleanTrades] Nettoyage des trades expirés (stub — en attente DB)');
}

module.exports = { run, schedule: '*/5 * * * *', name: 'cleanExpiredTrades' };
