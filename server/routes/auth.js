const express = require('express');
const passport = require('passport');
const { prisma } = require('../lib/db');

const router = express.Router();

// Initialise la stratégie Steam au premier appel (lazy)
// Permet de démarrer le serveur même si les variables ne sont pas encore définies
let strategyInitialized = false;

function initSteamStrategy() {
  if (strategyInitialized) return;
  strategyInitialized = true;

  const SteamStrategy = require('passport-steam').Strategy;
  const appUrl = process.env.APP_URL;
  const apiKey = process.env.STEAM_API_KEY;

  if (!appUrl || !apiKey) {
    console.error('[auth] APP_URL ou STEAM_API_KEY manquant — auth Steam désactivée');
    return;
  }

  passport.use(new SteamStrategy(
    {
      returnURL: `${appUrl}/auth/steam/callback`,
      realm: appUrl,
      apiKey,
    },
    async (identifier, profile, done) => {
      const steamId = profile.id;
      const displayName = profile.displayName;
      const avatarUrl = profile.photos?.[2]?.value ?? profile.photos?.[0]?.value ?? '';

      const dbUrl = process.env.DATABASE_URL ?? '';
      if (dbUrl && !dbUrl.includes('user:password@localhost')) {
        try {
          await prisma.user.upsert({
            where: { steamId },
            update: { displayName, avatarUrl },
            create: { steamId, displayName, avatarUrl },
          });
        } catch (err) {
          console.error('[auth] DB upsert failed (non-bloquant):', err.message);
        }
      }

      return done(null, { steamId, displayName, avatarUrl });
    }
  ));

  console.log('[auth] Steam strategy initialized');
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Redirige vers Steam
router.get('/steam', (req, res, next) => {
  initSteamStrategy();
  passport.authenticate('steam')(req, res, next);
});

// Callback après connexion Steam
router.get('/steam/callback', (req, res, next) => {
  initSteamStrategy();
  passport.authenticate('steam', {
    failureRedirect: process.env.FRONTEND_URL ?? '/',
  })(req, res, next);
}, (req, res) => {
  res.redirect(process.env.FRONTEND_URL ?? '/');
});

// Déconnexion
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect(process.env.FRONTEND_URL ?? '/');
  });
});

module.exports = router;
