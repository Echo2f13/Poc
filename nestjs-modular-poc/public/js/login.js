let usersCache = [];

async function init() {
  if (getCurrentUser()) {
    window.location.href = '/products.html';
    return;
  }
  usersCache = await apiGet('/users');
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;

  if (!email) {
    showLoginError('Please enter your email or username.');
    return false;
  }
  if (!password) {
    showLoginError('Please enter your password.');
    return false;
  }

  // Fake authentication: match by email or name (case-insensitive)
  const user = usersCache.find(
    u => u.email.toLowerCase() === email || u.name.toLowerCase() === email
  );

  if (!user) {
    showLoginError('We cannot find an account with that email. Try creating a new account.');
    return false;
  }

  // Password is dummy — any password works
  setCurrentUser(user);
  window.location.href = '/products.html';
  return false;
}

async function handleCreate(e) {
  e.preventDefault();

  const name = document.getElementById('newName').value.trim();
  const email = document.getElementById('newEmail').value.trim();
  const password = document.getElementById('newPassword').value;

  if (!name) {
    showLoginError('Please enter your name.');
    return false;
  }
  if (!email) {
    showLoginError('Please enter your email.');
    return false;
  }
  if (!password) {
    showLoginError('Please enter a password.');
    return false;
  }

  const user = await apiPost('/users', { name, email });
  setCurrentUser(user);
  window.location.href = '/products.html';
  return false;
}

function toggleCreateForm() {
  const card = document.getElementById('createCard');
  card.style.display = card.style.display === 'none' ? 'block' : 'none';
  if (card.style.display === 'block') {
    card.scrollIntoView({ behavior: 'smooth' });
  }
}

function showLoginError(msg) {
  let errBox = document.getElementById('loginError');
  if (!errBox) {
    errBox = document.createElement('div');
    errBox.id = 'loginError';
    errBox.className = 'login-error';
    const firstCard = document.querySelector('.login-card');
    firstCard.insertBefore(errBox, firstCard.firstChild.nextSibling);
  }
  errBox.innerHTML = '<span class="error-icon">!</span> ' + msg;
  errBox.style.display = 'block';
}

init();
