/**
 * STEAMBOT.JS — Connexion et session Steam pour un compte bot
 *
 * Utilise node-steam-user pour la session persistante,
 * node-steamcommunity pour les trade offers,
 * node-steam-totp pour la génération 2FA automatique.
 *
 * Usage :
 *   const bot = new SteamBot({ accountName, password, sharedSecret, identitySecret });
 *   await bot.login();
 *   const offerId = await bot.sendTradeOffer({ partnerSteamId, partnerToken, itemsToGive, itemsToReceive });
 *   await bot.confirmTradeOffer(offerId);
 */

const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const TradeOfferManager = require('steam-tradeoffer-manager');
const EventEmitter = require('events');

class SteamBot extends EventEmitter {
  /**
   * @param {object} config
   * @param {string} config.id             — Identifiant interne du bot (UUID ou label)
   * @param {string} config.accountName    — Nom de compte Steam
   * @param {string} config.password       — Mot de passe Steam
   * @param {string} config.sharedSecret   — Pour générer les codes 2FA
   * @param {string} config.identitySecret — Pour confirmer les trade offers
   * @param {string} [config.apiKey]       — Clé API Steam (optionnel, le manager peut la chercher)
   */
  constructor(config) {
    super();
    this.id = config.id ?? 'bot-default';
    this.accountName = config.accountName;
    this.password = config.password;
    this.sharedSecret = config.sharedSecret;
    this.identitySecret = config.identitySecret;

    this.status = 'offline'; // offline | connecting | online | busy | error
    this.steamId = null;

    // Instances Steam
    this.client = new SteamUser();
    this.community = new SteamCommunity();
    this.tradeManager = new TradeOfferManager({
      steam: this.client,
      community: this.community,
      language: 'en',
      pollInterval: 15_000, // Vérifie les trade offers toutes les 15s
    });

    this._setupEventHandlers();
  }

  // ──────────── LOGIN ────────────

  login() {
    return new Promise((resolve, reject) => {
      this.status = 'connecting';
      console.log(`[bot:${this.id}] Connexion en cours (${this.accountName})...`);

      const timeout = setTimeout(() => {
        reject(new Error(`[bot:${this.id}] Timeout de connexion (30s)`));
      }, 30_000);

      this.client.logOn({
        accountName: this.accountName,
        password: this.password,
        twoFactorCode: SteamTotp.generateAuthCode(this.sharedSecret),
      });

      this.client.once('loggedOn', () => {
        clearTimeout(timeout);
        this.steamId = this.client.steamID?.getSteamID64();
        this.status = 'online';
        console.log(`[bot:${this.id}] Connecté (${this.steamId})`);
        this.client.setPersona(SteamUser.EPersonaState.Online);
        resolve();
      });

      this.client.once('error', (err) => {
        clearTimeout(timeout);
        this.status = 'error';
        console.error(`[bot:${this.id}] Erreur login:`, err.message);
        reject(err);
      });
    });
  }

  logout() {
    this.client.logOff();
    this.status = 'offline';
    console.log(`[bot:${this.id}] Déconnecté`);
  }

  // ──────────── TRADE OFFERS ────────────

  /**
   * Envoie une trade offer.
   * @param {object} params
   * @param {string} params.partnerSteamId  — SteamID64 du partenaire
   * @param {string} params.partnerToken    — Token de l'URL de trade du partenaire
   * @param {Array}  params.itemsToGive     — Items que le bot donne [{ assetid, appid: 730, contextid: '2' }]
   * @param {Array}  params.itemsToReceive  — Items que le bot reçoit
   * @param {string} [params.message]       — Message optionnel dans l'offre
   * @returns {Promise<string>} Steam offer ID
   */
  sendTradeOffer({ partnerSteamId, partnerToken, itemsToGive = [], itemsToReceive = [], message = '' }) {
    return new Promise((resolve, reject) => {
      this.status = 'busy';

      const offer = this.tradeManager.createOffer(partnerSteamId);
      offer.setToken(partnerToken);
      if (message) offer.setMessage(message);

      for (const item of itemsToGive) {
        offer.addMyItem({ assetid: item.assetid ?? item.assetId, appid: 730, contextid: '2' });
      }
      for (const item of itemsToReceive) {
        offer.addTheirItem({ assetid: item.assetid ?? item.assetId, appid: 730, contextid: '2' });
      }

      console.log(`[bot:${this.id}] Envoi trade offer → ${partnerSteamId} (give=${itemsToGive.length} recv=${itemsToReceive.length})`);

      offer.send((err, status) => {
        this.status = 'online';
        if (err) {
          console.error(`[bot:${this.id}] Erreur envoi offer:`, err.message);
          return reject(err);
        }
        console.log(`[bot:${this.id}] Offer envoyée: ${offer.id} (status=${status})`);

        // Confirmer automatiquement via identity_secret
        if (status === 'pending') {
          this._confirmOffer(offer.id)
            .then(() => resolve(offer.id))
            .catch(reject);
        } else {
          resolve(offer.id);
        }
      });
    });
  }

  /**
   * Confirme une trade offer via le mobile authenticator (identity_secret).
   */
  _confirmOffer(offerId) {
    return new Promise((resolve, reject) => {
      const time = SteamTotp.time();
      const confKey = SteamTotp.getConfirmationKey(this.identitySecret, time, 'allow');

      this.community.acceptConfirmationForObject(this.identitySecret, offerId, (err) => {
        if (err) {
          console.error(`[bot:${this.id}] Erreur confirmation offer ${offerId}:`, err.message);
          return reject(err);
        }
        console.log(`[bot:${this.id}] Offer ${offerId} confirmée`);
        resolve();
      });
    });
  }

  // ──────────── FLOAT VIA GAME COORDINATOR ────────────

  /**
   * Récupère la float d'un item via le Game Coordinator CS2.
   * Nécessite que le bot soit connecté.
   * @param {string} inspectLink — steam://rungame/730/.../+csgo_econ_action_preview ...
   * @returns {Promise<number|null>}
   */
  getFloat(inspectLink) {
    // TODO: Implémenter via le package 'globaloffensive' (CS2 GC)
    // Le bot Steam doit être connecté, puis :
    //   const csgo = new GlobalOffensive(this.client);
    //   csgo.inspectItem(inspectLink, (item) => { item.paintwear });
    // Pour l'instant, retourne null — sera branché quand le GC sera stable
    console.warn(`[bot:${this.id}] getFloat() pas encore implémenté (GC)`);
    return Promise.resolve(null);
  }

  // ──────────── EVENTS INTERNES ────────────

  _setupEventHandlers() {
    // Session web nécessaire pour steamcommunity et trade offers
    this.client.on('webSession', (sessionId, cookies) => {
      this.community.setCookies(cookies);
      this.tradeManager.setCookies(cookies);
      console.log(`[bot:${this.id}] Session web établie`);
      this.emit('ready');
    });

    // Reconnexion automatique
    this.client.on('disconnected', (eresult, msg) => {
      this.status = 'offline';
      console.warn(`[bot:${this.id}] Déconnecté (${eresult}: ${msg}) — reconnexion auto dans 30s`);
      setTimeout(() => {
        if (this.status === 'offline') {
          this.login().catch(err =>
            console.error(`[bot:${this.id}] Échec reconnexion:`, err.message)
          );
        }
      }, 30_000);
    });

    // Trade offers reçues
    this.tradeManager.on('newOffer', (offer) => {
      console.log(`[bot:${this.id}] Trade offer reçue: ${offer.id} de ${offer.partner.getSteamID64()}`);
      this.emit('newOffer', offer);
    });

    // Changement de statut d'une trade offer
    this.tradeManager.on('sentOfferChanged', (offer, oldState) => {
      console.log(`[bot:${this.id}] Offer ${offer.id}: ${oldState} → ${offer.state}`);
      this.emit('offerChanged', offer, oldState);
    });

    // Rate limit Steam
    this.client.on('error', (err) => {
      console.error(`[bot:${this.id}] Steam error:`, err.message);
      this.status = 'error';
      this.emit('error', err);
    });
  }
}

module.exports = SteamBot;
