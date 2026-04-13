/**
 * BOTMANAGER.JS — Gère N bots Steam, sélection round-robin, état global
 *
 * Usage :
 *   const manager = new BotManager();
 *   await manager.addBot({ id: 'bot-1', accountName: '...', ... });
 *   const bot = manager.getAvailableBot();   // round-robin parmi les bots online
 *   const offerId = await bot.sendTradeOffer({ ... });
 */

const SteamBot = require('./SteamBot');
const { decrypt } = require('./secrets');

class BotManager {
  constructor() {
    /** @type {Map<string, SteamBot>} */
    this.bots = new Map();
    this._roundRobinIndex = 0;
  }

  /**
   * Ajoute et connecte un bot.
   * Les secrets peuvent être en clair (dev) ou chiffrés (prod).
   *
   * @param {object} config
   * @param {string} config.id
   * @param {string} config.accountName
   * @param {string} config.password
   * @param {string} config.sharedSecret     — En clair ou chiffré (format iv:tag:data)
   * @param {string} config.identitySecret   — En clair ou chiffré
   * @param {boolean} [config.encrypted=false] — true si les secrets sont chiffrés
   */
  async addBot(config) {
    const sharedSecret = config.encrypted
      ? decrypt(config.sharedSecret)
      : config.sharedSecret;
    const identitySecret = config.encrypted
      ? decrypt(config.identitySecret)
      : config.identitySecret;

    const bot = new SteamBot({
      ...config,
      sharedSecret,
      identitySecret,
    });

    this.bots.set(config.id, bot);

    try {
      await bot.login();
    } catch (err) {
      console.error(`[BotManager] Échec login bot ${config.id}:`, err.message);
      // Le bot reste dans la map avec status 'error' — reconnexion auto gérée dans SteamBot
    }

    return bot;
  }

  /**
   * Retourne un bot disponible (status === 'online') via round-robin.
   * @returns {SteamBot|null}
   */
  getAvailableBot() {
    const online = [...this.bots.values()].filter(b => b.status === 'online');
    if (online.length === 0) return null;

    const bot = online[this._roundRobinIndex % online.length];
    this._roundRobinIndex = (this._roundRobinIndex + 1) % online.length;
    return bot;
  }

  /**
   * Retourne un bot spécifique par ID.
   * @param {string} id
   * @returns {SteamBot|null}
   */
  getBot(id) {
    return this.bots.get(id) ?? null;
  }

  /**
   * Retourne l'état de tous les bots.
   * @returns {Array<{id, steamId, status, accountName}>}
   */
  getStatus() {
    return [...this.bots.values()].map(b => ({
      id: b.id,
      steamId: b.steamId,
      accountName: b.accountName,
      status: b.status,
    }));
  }

  /**
   * Déconnecte tous les bots proprement.
   */
  async shutdown() {
    console.log('[BotManager] Arrêt de tous les bots...');
    for (const bot of this.bots.values()) {
      bot.logout();
    }
  }
}

module.exports = BotManager;
