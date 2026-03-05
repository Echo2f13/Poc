let allProducts = [];

async function init() {
  const user = requireLogin();
  if (!user) return;
  renderNavbar('products');
  await loadProducts();
}

async function loadProducts() {
  allProducts = await apiGet('/products');
  const grid = document.getElementById('productGrid');

  // Update results count
  document.getElementById('resultsCount').innerHTML =
    `<strong>1-${allProducts.length}</strong> of <strong>${allProducts.length}</strong> results`;

  // Update hero stats
  const orders = await apiGet('/orders');
  const user = getCurrentUser();
  const myOrders = orders.filter(o => o.userId === user.id);
  document.getElementById('heroStats').innerHTML = `
    <div class="hero-stat">
      <div class="stat-number">${allProducts.length}</div>
      <div class="stat-label">Products</div>
    </div>
    <div class="hero-stat">
      <div class="stat-number">${myOrders.length}</div>
      <div class="stat-label">Your Orders</div>
    </div>
  `;

  if (allProducts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="icon">📦</div>
        <h3>No products yet</h3>
        <p>Be the first to list a product on MicroAmazon!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = allProducts.map((p, i) => {
    const wholePart = Math.floor(p.price);
    const centsPart = ((p.price % 1) * 100).toFixed(0).padStart(2, '0');
    const rating = getProductRating(p.id);
    const reviewCount = getReviewCount(p.id);
    const badge = i < 3 ? '<div class="product-badge">Best Seller</div>' : '';
    const deliveryDay = getDeliveryDay();

    return `
      <div class="product-card">
        <div class="product-image">
          ${badge}
          ${getProductIcon(p.name)}
        </div>
        <div class="product-body">
          <div class="product-name">${p.name}</div>
          <div class="product-rating">
            <span class="stars">${renderStars(rating)}</span>
            <span>${reviewCount.toLocaleString()}</span>
          </div>
          <div class="price-row">
            <span class="price"><span class="dollar">$</span>${wholePart}<span class="cents">${centsPart}</span></span>
          </div>
          <div class="delivery-info">
            FREE delivery <strong>${deliveryDay}</strong>
          </div>
          <div class="card-actions">
            <button class="btn btn-buy" onclick="buyProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function buyProduct(productId, productName) {
  const user = getCurrentUser();
  await apiPost('/orders', { userId: user.id, productId });
  showToast('Added to orders: ' + productName);
}

async function addProduct() {
  const name = document.getElementById('prodName').value.trim();
  const price = parseFloat(document.getElementById('prodPrice').value);
  if (!name || isNaN(price) || price <= 0) {
    alert('Please enter a valid product name and price');
    return;
  }
  await apiPost('/products', { name, price });
  document.getElementById('prodName').value = '';
  document.getElementById('prodPrice').value = '';
  showToast('Product listed on MicroAmazon!');
  await loadProducts();
}

function toggleAddForm() {
  document.getElementById('addSection').classList.toggle('open');
}

// Deterministic fake rating based on product id
function getProductRating(id) {
  const ratings = [4.5, 4.2, 4.8, 3.9, 4.6, 4.1, 4.7, 4.3, 4.0, 4.4];
  return ratings[id % ratings.length];
}

function getReviewCount(id) {
  const counts = [2847, 1523, 9421, 673, 4218, 891, 3156, 12043, 567, 2891];
  return counts[id % counts.length];
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '★' : '') + '☆'.repeat(empty);
}

function getDeliveryDay() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date();
  d.setDate(d.getDate() + 2 + Math.floor(Math.random() * 3));
  return `${days[d.getDay() % 5]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

init();
