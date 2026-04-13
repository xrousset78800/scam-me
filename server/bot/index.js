/**
 * BOT/INDEX.JS — Point d'entrée du module bot
 *
 * Initialise le BotManager et connecte les bots définis dans les env vars.
 * En dev : un seul bot défini par BOT_* env vars.
 * En prod : les bots seront chargés depuis la DB (quand disponible).
 *
 * Env vars pour le bot de test :
 *   BOT_ACCOUNT_NAME    — Nom de compte Steam
 *   BOT_PASSWORD         — Mot de passe Steam
 *   BOT_SHARED_SECRET    — shared_secret (clair en dev, chiffré en prod)
 *   BOT_IDENTITY_SECRET  — identity_secret (clair en dev, chiffré en prod)
 */

const BotManager = require('./BotManager');

const manager = new BotManager();

async function initBots() {
  const accountName = process.env.BOT_ACCOUNT_NAME;
  const password = process.env.BOT_PASSWORD;
  const sharedSecret = process.env.BOT_SHARED_SECRET;
  const identitySecret = process.env.BOT_IDENTITY_SECRET;

  if (!accountName || !password || !sharedSecret || !identitySecret) {
    console.warn('[bot] Variables BOT_* incomplètes — aucun bot démarré');
    console.warn('[bot] Requis : BOT_ACCOUNT_NAME, BOT_PASSWORD, BOT_SHARED_SECRET, BOT_IDENTITY_SECRET');
    return;
  }

  const encrypted = process.env.BOT_SECRETS_ENCRYPTED === 'true';

  await manager.addBot({
    id: 'bot-dev',
    accountName,
    password,
    sharedSecret,
    identitySecret,
    encrypted,
  });
}

// Arrêt propre
process.on('SIGINT', () => { manager.shutdown(); process.exit(0); });
process.on('SIGTERM', () => { manager.shutdown(); process.exit(0); });

module.exports = { manager, initBots };
