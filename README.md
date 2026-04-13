# scam.me — CS2 Trading Platform

## Quick Start (sans Docker)

```bash
# 1. Cloner et installer
git clone git@github.com:xrousset78800/scam-me.git
cd scam-me
npm install

# 2. Configurer les env vars
cp .env.secrets.example .env.secrets   # secrets bot Steam (optionnel)
# Editer .env.local avec tes valeurs :
#   STEAM_API_KEY, PLATFORM_STEAM_IDS, SESSION_SECRET

# 3. Lancer
npm run dev          # http://localhost:3000 (hot reload)
```

## Quick Start (Docker)

```bash
# 1. Cloner
git clone git@github.com:xrousset78800/scam-me.git
cd scam-me

# 2. Configurer
cp .env.secrets.example .env.secrets
# Editer .env.local et .env.secrets

# 3. Lancer
docker compose up --build
# API       → http://localhost:3000
# Redis     → localhost:6379
```

## Env vars requises

| Variable | Description | Exemple |
|---|---|---|
| `STEAM_API_KEY` | Clé API Steam ([obtenir](https://steamcommunity.com/dev/apikey)) | `E40A3CBF...` |
| `PLATFORM_STEAM_IDS` | SteamID64 des comptes plateforme (virgules) | `7656119...` |
| `SESSION_SECRET` | Secret Express session (`openssl rand -base64 32`) | `Si/7RDb...` |

### Optionnelles

| Variable | Description |
|---|---|
| `APP_URL` | URL du backend (`http://localhost:3000`) |
| `FRONTEND_URL` | URL du frontend (redirect post-login) |
| `PRICEMPIRE_API_KEY` | Clé Pricempire (fallback prix) |

### Bot Steam (`.env.secrets`)

| Variable | Description |
|---|---|
| `BOT_ACCOUNT_NAME` | Nom de compte Steam du bot |
| `BOT_PASSWORD` | Mot de passe Steam |
| `BOT_SHARED_SECRET` | Pour la 2FA automatique |
| `BOT_IDENTITY_SECRET` | Pour confirmer les trade offers |
| `BOT_SECRETS_ENCRYPTED` | `true` si secrets chiffrés AES-256 |
| `ENCRYPTION_KEY` | Clé AES-256 (prod uniquement) |

## Extraction des secrets bot (SDA)

```
1. Télécharger Steam Desktop Authenticator (SDA)
   https://github.com/Jessecar96/SteamDesktopAuthenticator

2. Importer le compte Steam dans SDA
   → Le Steam Guard mobile est transféré de ton tel vers SDA

3. Trouver le fichier .maFile dans maFiles/
   → Ouvrir avec un éditeur de texte

4. Copier shared_secret et identity_secret dans .env.secrets

⚠️  Précautions pour tester avec un compte perso :
    - Déplacer les skins de valeur sur un autre compte
    - Ne garder que des skins < 1€ pour les tests
    - Ne JAMAIS commit .env.secrets ou les .maFile
```

## Architecture

```
public/                  Frontend statique (HTML/CSS/JS)
server/
  index.js               Point d'entrée Express
  routes/
    auth.js              Steam OpenID login
    inventory.js         Inventaire user (auth requise)
    platform-inventory.js Inventaire plateforme (public)
    float.js             Float on-demand (csgofloat proxy)
    items.js             Items DB (futur)
    trade.js             Création de trades
  lib/
    steam.js             Fetch inventaire (IEconService + community fallback)
    prices.js            Prix (dump mémoire → Pricempire → Steam Market)
    floatcheck.js        Float cache + csgofloat (→ futur Game Coordinator)
  bot/
    SteamBot.js          Login, 2FA auto, trade offers, confirmation
    BotManager.js        Round-robin N bots
    secrets.js           Chiffrement AES-256-GCM
  queue/
    tradeQueue.js        Rate limit, retry, DLQ (→ futur BullMQ + Redis)
  cron/
    jobs/
      refreshInventory.js  Refresh inventaires plateforme (15 min)
      syncPrices.js        Dump prix csgobackpack (6h)
      cleanExpiredTrades.js Nettoyage trades expirés (5 min)
```

## Scripts

```bash
npm run dev      # Serveur avec hot reload (--watch)
npm start        # Production
npm run db:push  # Push schema Prisma (quand DB configurée)
```

## Stack

- **Backend** : Express.js, Passport (Steam OpenID)
- **Frontend** : HTML/CSS/JS pur (SPA hash-based)
- **Bot Steam** : steam-user, steamcommunity, steam-totp, steam-tradeoffer-manager
- **Queue** : In-memory (→ BullMQ + Redis)
- **Cache/Sessions** : In-memory (→ Redis)
- **DB** : PostgreSQL + Prisma (à configurer)
- **Prix** : csgobackpack dump + Pricempire + Steam Market
- **Deploy** : Docker Compose / Render / Railway
