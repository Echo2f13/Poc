let currentProduct = null;
let currentOrder = null;

async function init() {
  const user = requireLogin();
  if (!user) return;
  renderNavbar('products');

  // Read product from URL params
  const params = new URLSearchParams(window.location.search);
  const productId = Number(params.get('productId'));
  if (!productId) {
    window.location.href = '/products.html';
    return;
  }

  const products = await apiGet('/products');
  currentProduct = products.find(p => p.id === productId);
  if (!currentProduct) {
    window.location.href = '/products.html';
    return;
  }

  // Fill shipping name
  document.getElementById('shippingName').textContent = user.name;
  document.getElementById('cardName').value = user.name;

  // Fill order summary
  const tax = currentProduct.price * 0.08;
  const total = currentProduct.price + tax;

  document.getElementById('summaryProduct').innerHTML = `
    <div class="summary-product-icon">${getProductIcon(currentProduct.name)}</div>
    <div>
      <div class="summary-product-name">${currentProduct.name}</div>
      <div class="summary-product-qty">Qty: 1</div>
    </div>
  `;
  document.getElementById('summaryItemPrice').textContent = '$' + currentProduct.price.toFixed(2);
  document.getElementById('summaryTax').textContent = '$' + tax.toFixed(2);
  document.getElementById('summaryTotal').textContent = '$' + total.toFixed(2);
}

function selectPayment(radio) {
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  radio.closest('.payment-option').classList.add('selected');
  document.getElementById('cardForm').style.display = radio.value === 'card' ? 'block' : 'none';
}

async function placeOrder() {
  const overlay = document.getElementById('processingOverlay');
  const steps = document.getElementById('processingSteps');
  overlay.style.display = 'flex';

  const stepTexts = [
    'Verifying payment details...',
    'Contacting payment gateway...',
    'Authorizing transaction...',
    'Payment successful!',
    'Creating order...',
    'Order confirmed!'
  ];

  // Animate steps
  for (let i = 0; i < stepTexts.length; i++) {
    await delay(600 + Math.random() * 400);
    steps.innerHTML += `<div class="step-item done">✓ ${stepTexts[i]}</div>`;
    steps.scrollTop = steps.scrollHeight;

    if (i === 4) {
      // Actually create the order
      const user = getCurrentUser();
      currentOrder = await apiPost('/orders', { userId: user.id, productId: currentProduct.id });
    }
  }

  await delay(400);
  document.getElementById('spinner').style.display = 'none';
  document.getElementById('processingTitle').textContent = 'Payment Complete!';
  document.getElementById('processingTitle').style.color = '#067d62';
  document.getElementById('processingMsg').textContent = 'Your order has been placed successfully.';
  document.getElementById('successActions').style.display = 'flex';
}

function downloadInvoice() {
  const user = getCurrentUser();
  const tax = currentProduct.price * 0.08;
  const total = currentProduct.price + tax;
  const invoiceNo = 'INV-' + String(currentOrder.id).padStart(6, '0');
  const orderNo = 'MZN-' + String(currentOrder.id).padStart(6, '0');
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Build PDF using raw PDF spec (no library needed)
  const pdf = buildInvoicePDF({
    invoiceNo,
    orderNo,
    date: dateStr,
    customerName: user.name,
    customerEmail: user.email,
    productName: currentProduct.name,
    productPrice: currentProduct.price,
    tax,
    total,
  });

  // Trigger download
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoiceNo}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildInvoicePDF(data) {
  // Minimal valid PDF built from scratch — no external library
  const lines = [
    `INVOICE`,
    ``,
    `Invoice No: ${data.invoiceNo}`,
    `Order No: ${data.orderNo}`,
    `Date: ${data.date}`,
    ``,
    `Bill To:`,
    `  ${data.customerName}`,
    `  ${data.customerEmail}`,
    `  123 MicroAmazon Lane, Tech City, TC 10001`,
    ``,
    `------------------------------------------------------`,
    `  Item                              Qty    Amount`,
    `------------------------------------------------------`,
    `  ${padRight(data.productName, 34)} 1      $${data.productPrice.toFixed(2)}`,
    `------------------------------------------------------`,
    ``,
    `  Subtotal:                                $${data.productPrice.toFixed(2)}`,
    `  Shipping:                                $0.00`,
    `  Tax (8%):                                $${data.tax.toFixed(2)}`,
    `                                           --------`,
    `  TOTAL:                                   $${data.total.toFixed(2)}`,
    ``,
    `------------------------------------------------------`,
    `Payment Status: PAID`,
    `Payment Method: Credit Card ending in 3456`,
    ``,
    `Thank you for shopping with MicroAmazon!`,
    `This is a computer-generated invoice (NestJS POC).`,
  ];

  const text = lines.join('\n');

  // Build a minimal valid PDF with the text content
  const streamContent = buildPDFTextStream(text);
  const objects = [];
  let objNum = 1;

  // Object 1: Catalog
  objects.push(`${objNum} 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
  objNum++;

  // Object 2: Pages
  objects.push(`${objNum} 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`);
  objNum++;

  // Object 3: Page
  objects.push(`${objNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`);
  objNum++;

  // Object 4: Content stream
  objects.push(`${objNum} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`);
  objNum++;

  // Object 5: Font
  objects.push(`${objNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj`);

  // Build the full PDF
  let pdf = '%PDF-1.4\n';
  const offsets = [];

  objects.forEach(obj => {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  });

  const xrefOffset = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.forEach(offset => {
    pdf += String(offset).padStart(10, '0') + ' 00000 n \n';
  });

  pdf += 'trailer\n';
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += xrefOffset + '\n';
  pdf += '%%EOF';

  return pdf;
}

function buildPDFTextStream(text) {
  const lines = text.split('\n');
  let stream = 'BT\n';
  stream += '/F1 10 Tf\n';
  stream += '50 790 Td\n';
  stream += '14 TL\n';

  lines.forEach(line => {
    // Escape special PDF characters
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    stream += `(${escaped}) Tj T*\n`;
  });

  stream += 'ET';
  return stream;
}

function padRight(str, len) {
  if (str.length >= len) return str.substring(0, len);
  return str + ' '.repeat(len - str.length);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

init();
