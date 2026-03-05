async function init() {
  const user = requireLogin();
  if (!user) return;
  renderNavbar('orders');
  await loadOrders();
}

async function loadOrders() {
  const user = getCurrentUser();
  const [allOrders, allProducts] = await Promise.all([
    apiGet('/orders'),
    apiGet('/products'),
  ]);
  const myOrders = allOrders.filter(o => o.userId === user.id);

  // Build a price lookup from products
  const productMap = {};
  allProducts.forEach(p => { productMap[p.id] = p; });

  // Calculate summary stats
  const totalSpent = myOrders.reduce((sum, o) => {
    const prod = productMap[o.productId];
    return sum + (prod ? prod.price : 0);
  }, 0);

  // Render summary cards
  document.getElementById('ordersSummary').innerHTML = `
    <div class="summary-card">
      <div class="summary-icon">📦</div>
      <div class="summary-value">${myOrders.length}</div>
      <div class="summary-label">Total Orders</div>
    </div>
    <div class="summary-card">
      <div class="summary-icon">💰</div>
      <div class="summary-value">$${totalSpent.toFixed(2)}</div>
      <div class="summary-label">Total Spent</div>
    </div>
    <div class="summary-card">
      <div class="summary-icon">✅</div>
      <div class="summary-value">${myOrders.length}</div>
      <div class="summary-label">Delivered</div>
    </div>
    <div class="summary-card">
      <div class="summary-icon">⭐</div>
      <div class="summary-value">${allProducts.length}</div>
      <div class="summary-label">Products Available</div>
    </div>
  `;

  const container = document.getElementById('ordersContainer');

  if (myOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🛒</div>
        <h3>No orders yet</h3>
        <p>Looks like you haven't placed any orders. Start shopping to see them here!</p>
        <a href="/products.html" class="btn btn-buy">Start Shopping</a>
      </div>
    `;
    return;
  }

  // Render order cards (newest first)
  const reversedOrders = [...myOrders].reverse();
  container.innerHTML = `
    <div class="orders-list">
      ${reversedOrders.map(o => {
        const prod = productMap[o.productId];
        const price = prod ? prod.price : 0;
        const status = getOrderStatus(o.id);
        const orderDate = getOrderDate(o.id);

        return `
          <div class="order-card">
            <div class="order-card-header">
              <div class="header-group">
                <span class="header-label">Order placed</span>
                <span class="header-value">${orderDate}</span>
              </div>
              <div class="header-group">
                <span class="header-label">Total</span>
                <span class="header-value">$${price.toFixed(2)}</span>
              </div>
              <div class="header-group">
                <span class="header-label">Order #</span>
                <span class="header-value">MZN-${String(o.id).padStart(6, '0')}</span>
              </div>
              <span class="status-badge ${status.class}">${status.text}</span>
            </div>
            <div class="order-card-body">
              <div class="order-product-icon">${getProductIcon(o.productName || '')}</div>
              <div class="order-product-details">
                <div class="order-product-name">${o.productName || 'Unknown Product'}</div>
                <div class="order-product-meta">Sold by: MicroAmazon Marketplace</div>
              </div>
              <div class="order-actions">
                <button class="btn btn-primary btn-sm" onclick="buyAgain(${o.productId}, '${(o.productName || '').replace(/'/g, "\\'")}')">Buy it again</button>
                <button class="btn btn-secondary btn-sm" onclick="showToast('Order details coming soon')">View details</button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function buyAgain(productId, productName) {
  const user = getCurrentUser();
  await apiPost('/orders', { userId: user.id, productId });
  showToast('Reordered: ' + productName);
  await loadOrders();
}

function getOrderStatus(orderId) {
  const statuses = [
    { text: 'Delivered', class: 'status-delivered' },
    { text: 'Delivered', class: 'status-delivered' },
    { text: 'Shipped', class: 'status-shipped' },
    { text: 'Delivered', class: 'status-delivered' },
    { text: 'Processing', class: 'status-processing' },
  ];
  return statuses[orderId % statuses.length];
}

function getOrderDate(orderId) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date();
  d.setDate(d.getDate() - orderId * 3 - Math.floor(Math.random() * 5));
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

init();
