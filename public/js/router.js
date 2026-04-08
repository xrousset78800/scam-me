/* ============================================================
   ROUTER.JS — Navigation SPA par hash (#home, #trade)
   ============================================================ */

const PAGES = ['home', 'trade'];
const DEFAULT_PAGE = 'home';

function showPage(pageId) {
  if (!PAGES.includes(pageId)) pageId = DEFAULT_PAGE;

  // Masque toutes les pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('is-active'));

  // Affiche la page cible
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.add('is-active');

  // Met à jour le lien actif dans la nav
  document.querySelectorAll('.header__nav a[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });

  // Déclenche un event pour que les modules de page puissent s'initialiser
  window.dispatchEvent(new CustomEvent('page:change', { detail: pageId }));
}

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '').trim();
  return PAGES.includes(hash) ? hash : DEFAULT_PAGE;
}

// Gestion des clics sur les liens data-page
document.addEventListener('click', e => {
  const link = e.target.closest('[data-page]');
  if (!link) return;
  e.preventDefault();
  const page = link.dataset.page;
  window.location.hash = page === DEFAULT_PAGE ? '' : page;
  showPage(page);
});

// Gestion du bouton retour/avant navigateur
window.addEventListener('hashchange', () => showPage(getPageFromHash()));

// Init au chargement
showPage(getPageFromHash());
