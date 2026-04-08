const express = require('express');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const { prisma } = require('../lib/db');

const router = express.Router();

// --- Stratégie Steam OpenID ---
passport.use(new SteamStrategy(
  {
    returnURL: `${process.env.APP_URL}/auth/steam/callback`,
    realm: process.env.APP_URL,
    apiKey: process.env.STEAM_API_KEY,
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

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// --- Routes ---

// Redirige vers Steam pour la connexion
router.get('/steam', passport.authenticate('steam'));

// Callback après connexion Steam — redirige vers le frontend OVH (ou localhost en dev)
router.get(
  '/steam/callback',
  passport.authenticate('steam', { failureRedirect: process.env.FRONTEND_URL ?? '/' }),
  (req, res) => res.redirect(process.env.FRONTEND_URL ?? '/')
);

// Déconnexion
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;
