async function fetchJSON(path) {
  const res = await fetch(path);
  return res.json();
}

async function refreshAll() {
  const [users, products, orders] = await Promise.all([
    fetchJSON('/users'),
    fetchJSON('/products'),
    fetchJSON('/orders'),
  ]);

  // Stats
  const totalRevenue = orders.reduce((sum, o) => {
    const prod = products.find(p => p.id === o.productId);
    return sum + (prod ? prod.price : 0);
  }, 0);

  document.getElementById('statUsers').textContent = users.length;
  document.getElementById('statProducts').textContent = products.length;
  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statRevenue').textContent = '$' + totalRevenue.toFixed(2);

  // Users table
  document.getElementById('usersCount').textContent = users.length + ' records';
  document.querySelector('#usersTable tbody').innerHTML = users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
    </tr>
  `).join('');

  // Products table
  document.getElementById('productsCount').textContent = products.length + ' records';
  document.querySelector('#productsTable tbody').innerHTML = products.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>$${p.price.toFixed(2)}</td>
    </tr>
  `).join('');

  // Orders table
  document.getElementById('ordersCount').textContent = orders.length + ' records';
  document.querySelector('#ordersTable tbody').innerHTML = orders.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.userId}</td>
      <td>${o.userName || '-'}</td>
      <td>${o.productId}</td>
      <td>${o.productName || '-'}</td>
    </tr>
  `).join('');
}

refreshAll();
