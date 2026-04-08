/* ============================================================
   AUTH.JS — Gestion de la session côté client
   Injecte le bouton Steam ou le profil utilisateur dans le header.
   ============================================================ */

(async function initAuth() {
  const authContainer = document.getElementById('header-auth');
  if (!authContainer) return;

  let session;
  try {
    session = await API.getSession();
  } catch {
    renderLoginButton(authContainer);
    return;
  }

  if (session.authenticated && session.user) {
    renderUserMenu(authContainer, session.user);
    window.__user = session.user;
  } else {
    renderLoginButton(authContainer);
    window.__user = null;
  }

  // Notifie les autres modules que la session est prête
  window.dispatchEvent(new CustomEvent('auth:ready', { detail: window.__user }));

  // Marque le lien de nav actif
  const currentPath = window.location.pathname;
  document.querySelectorAll('.header__nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath === href || currentPath.startsWith(href) && href !== '/')) {
      link.classList.add('active');
    }
  });
})();

function renderLoginButton(container) {
  container.innerHTML = `
    <a href="${API_BASE}/auth/steam" class="btn-steam">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.38L12.1 12h-.1a3.5 3.5 0 0 1-3.5-3.5 3.5 3.5 0 0 1 3.5-3.5 3.5 3.5 0 0 1 3.5 3.5h0l-11.4 3.94C4.7 14.45 5.9 16 7.5 16a2.5 2.5 0 0 0 2.36-1.68l2.52.92A5 5 0 0 1 7.5 18.5a5 5 0 0 1-4.98-4.62L0 12.54V12C0 5.37 5.37 0 12 0zm0 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z"/>
      </svg>
      Connexion Steam
    </a>
  `;
}

function renderUserMenu(container, user) {
  container.innerHTML = `
    <div class="header__user">
      ${user.avatarUrl ? `<img src="${user.avatarUrl}" alt="" class="header__avatar">` : ''}
      <span>${escapeHtml(user.displayName ?? '')}</span>
    </div>
    <a href="${API_BASE}/auth/logout" class="btn-logout">Déconnexion</a>
  `;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
