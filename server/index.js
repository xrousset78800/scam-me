require('dotenv').config({ path: '.env.local' });

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

// Origines autorisées à faire des requêtes cross-origin vers l'API
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://xouindaplace.fr',
];

const authRouter = require('./routes/auth');
const inventoryRouter = require('./routes/inventory');
const itemsRouter = require('./routes/items');
const tradeRouter = require('./routes/trade');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware de protection HTTP Basic Auth (optionnel, dev uniquement) ---
if (process.env.HTPASSWD_USER && process.env.HTPASSWD_PASS) {
  app.use((req, res, next) => {
    if (req.path.startsWith('/public') || req.path === '/favicon.ico') return next();
    const auth = req.headers['authorization'];
    if (auth) {
      const [scheme, encoded] = auth.split(' ');
      if (scheme === 'Basic' && encoded) {
        const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
        if (user === process.env.HTPASSWD_USER && pass === process.env.HTPASSWD_PASS) {
          return next();
        }
      }
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="scam.me — dev"');
    return res.status(401).send('Accès non autorisé');
  });
}

// --- CORS ---
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// --- Body parsing ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Sessions ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  },
}));

// --- Passport (auth Steam) ---
app.use(passport.initialize());
app.use(passport.session());

// --- Route session (pour que le frontend sache si l'user est connecté) ---
app.get('/api/session', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false, user: null });
  }
});

// --- Routes API ---
app.use('/auth', authRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/items', itemsRouter);
app.use('/api/trade', tradeRouter);

// --- Fichiers statiques (HTML, CSS, JS frontend) ---
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Fallback : index.html pour les URLs inconnues ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`scam.me démarré sur http://localhost:${PORT}`);
});
