/**
 * TRADEQUEUE.JS — File d'attente pour les trade offers Steam
 *
 * Architecture : quand Redis est disponible → BullMQ.
 * En attendant : file en mémoire simple avec rate limiting et retry.
 * L'interface publique (addTradeJob, onTradeJob) reste identique —
 * seule l'implémentation interne changera.
 *
 * Rate limit : 1 trade offer / bot / 12 secondes (5/min, en dessous du seuil Steam)
 * Retry : 3 tentatives avec backoff exponentiel
 * DLQ : les jobs échoués 3 fois sont émis via l'event 'failed'
 */

const EventEmitter = require('events');

const MAX_RETRIES = 3;
const RATE_LIMIT_MS = 12_000; // 5 offers/min max par bot

class TradeQueue extends EventEmitter {
  constructor() {
    super();
    /** @type {Array<{job: object, retries: number, addedAt: number}>} */
    this._queue = [];
    this._processing = false;
    this._lastProcessedAt = 0;
    /** @type {function|null} */
    this._handler = null;
  }

  /**
   * Ajoute un job de trade à la queue.
   * @param {object} jobData
   * @param {string} jobData.tradeId         — ID interne du trade (UUID)
   * @param {string} jobData.partnerSteamId  — SteamID64 du partenaire
   * @param {string} jobData.partnerToken    — Token trade URL
   * @param {Array}  jobData.itemsToGive     — Items du bot → utilisateur
   * @param {Array}  jobData.itemsToReceive  — Items utilisateur → bot
   * @param {string} [jobData.botId]         — Bot spécifique (ou auto)
   */
  addTradeJob(jobData) {
    console.log(`[queue] Trade job ajouté: ${jobData.tradeId}`);
    this._queue.push({ job: jobData, retries: 0, addedAt: Date.now() });
    this.emit('added', jobData);
    this._tick();
  }

  /**
   * Enregistre le handler qui traite un job.
   * @param {function(object): Promise<string>} handler — Reçoit jobData, retourne l'offerId Steam
   */
  onTradeJob(handler) {
    this._handler = handler;
  }

  /**
   * @returns {{ pending: number, processing: boolean }}
   */
  getStatus() {
    return {
      pending: this._queue.length,
      processing: this._processing,
    };
  }

  // ──────────── INTERNAL ────────────

  async _tick() {
    if (this._processing || this._queue.length === 0 || !this._handler) return;

    // Rate limiting
    const elapsed = Date.now() - this._lastProcessedAt;
    if (elapsed < RATE_LIMIT_MS) {
      setTimeout(() => this._tick(), RATE_LIMIT_MS - elapsed);
      return;
    }

    this._processing = true;
    const entry = this._queue.shift();

    try {
      console.log(`[queue] Traitement trade ${entry.job.tradeId} (tentative ${entry.retries + 1}/${MAX_RETRIES})`);
      const offerId = await this._handler(entry.job);
      this.emit('completed', { ...entry.job, offerId });
      console.log(`[queue] Trade ${entry.job.tradeId} → offer ${offerId}`);
    } catch (err) {
      entry.retries++;
      console.error(`[queue] Échec trade ${entry.job.tradeId}:`, err.message);

      if (entry.retries < MAX_RETRIES) {
        // Backoff exponentiel : 5s, 15s, 45s
        const delay = 5_000 * Math.pow(3, entry.retries - 1);
        console.log(`[queue] Retry ${entry.retries}/${MAX_RETRIES} dans ${delay / 1000}s`);
        setTimeout(() => {
          this._queue.unshift(entry); // Remet en tête de file
          this._tick();
        }, delay);
      } else {
        // Dead Letter Queue
        console.error(`[queue] DLQ — Trade ${entry.job.tradeId} abandonné après ${MAX_RETRIES} tentatives`);
        this.emit('failed', { ...entry.job, error: err.message });
      }
    } finally {
      this._processing = false;
      this._lastProcessedAt = Date.now();
      this._tick(); // Job suivant
    }
  }
}

// Singleton — une seule queue pour l'application
module.exports = new TradeQueue();
