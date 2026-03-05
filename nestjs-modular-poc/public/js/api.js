// ── API Helpers ──

async function apiGet(path) {
  const res = await fetch(path);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── Auth (localStorage) ──

function getCurrentUser() {
  const raw = localStorage.getItem('currentUser');
  return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = '/login.html';
}

function requireLogin() {
  if (!getCurrentUser()) {
    window.location.href = '/login.html';
    return null;
  }
  return getCurrentUser();
}

// ── Navbar ──

function renderNavbar(activePage) {
  const user = getCurrentUser();
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const firstName = user ? user.name.split(' ')[0] : 'Guest';

  nav.innerHTML = `
    <a href="/products.html" class="logo">Micro<span>Amazon</span></a>
    <nav>
      <a href="/products.html" class="nav-link user-greeting" onclick="logout(); return false;">
        <span class="greet-label">Hello, ${firstName}</span>
        <span class="greet-name">Sign Out</span>
      </a>
      <a href="/orders.html" class="nav-link ${activePage === 'orders' ? 'active' : ''}">
        <span class="nav-label">Returns</span>
        <span class="nav-text">& Orders</span>
      </a>
      <a href="/products.html" class="nav-link cart-link ${activePage === 'products' ? 'active' : ''}">
        🛒 <span class="cart-count">Cart</span>
      </a>
    </nav>
  `;
}

// ── Toast Notifications ──

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = '<span class="toast-icon">✓</span> ' + message;
  toast.classList.remove('show');
  // Force reflow for re-triggering animation
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Product Icons ──

function getProductIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('laptop') || n.includes('computer')) return '💻';
  if (n.includes('phone') || n.includes('mobile')) return '📱';
  if (n.includes('mouse')) return '🖱️';
  if (n.includes('keyboard')) return '⌨️';
  if (n.includes('headphone') || n.includes('earphone') || n.includes('earbud')) return '🎧';
  if (n.includes('camera')) return '📷';
  if (n.includes('watch')) return '⌚';
  if (n.includes('tablet') || n.includes('ipad')) return '📲';
  if (n.includes('monitor') || n.includes('display')) return '🖥️';
  if (n.includes('speaker')) return '🔊';
  if (n.includes('ssd') || n.includes('drive') || n.includes('storage')) return '💾';
  if (n.includes('controller') || n.includes('gaming')) return '🎮';
  if (n.includes('hub') || n.includes('usb') || n.includes('cable') || n.includes('hdmi')) return '🔌';
  if (n.includes('webcam')) return '📹';
  if (n.includes('charger') || n.includes('battery')) return '🔋';
  if (n.includes('lamp') || n.includes('light')) return '💡';
  if (n.includes('stand') || n.includes('desk')) return '🗄️';
  if (n.includes('pad')) return '🖱️';
  if (n.includes('book')) return '📚';
  if (n.includes('shirt') || n.includes('cloth')) return '👕';
  if (n.includes('shoe')) return '👟';
  return '📦';
}
