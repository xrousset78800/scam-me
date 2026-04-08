/* ============================================================
   CONFIG.JS — URL de l'API selon l'environnement
   En local     → http://localhost:3000
   Sur OVH      → https://scam-me-g5hs.onrender.com
   ============================================================ */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://scam-me-g5hs.onrender.com';
