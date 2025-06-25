let total = 0;

function addItem() {
  const qty = parseFloat(document.getElementById('qty').value) || 0;
  const description = document.getElementById('description').value;
  const unitPrice = parseFloat(document.getElementById('unit-price').value) || 0;
  const amountInput = unitPrice * qty;

  if (!description || isNaN(amountInput)) return;

  const naira = Math.floor(amountInput);
  let kobo = Math.round((amountInput - naira) * 100);
  if (kobo > 99) kobo = 99;

  const amount = naira + kobo / 100;
  total += amount;

  const tbody = document.getElementById('invoice-items');
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td>${qty}</td>
    <td>${description}</td>
    <td>${unitPrice.toFixed(2)}</td>
    <td class="currencycell">${naira}</td>
    <td class="currencycell">${kobo.toString().padStart(2, '0')}</td>
    <td><button onclick="removeItem(this, ${amount.toFixed(2)})">Remove</button></td>
  `;

  tbody.appendChild(tr);
  updateTotal();

  document.getElementById('qty').value = '';
  document.getElementById('description').value = '';
  document.getElementById('unit-price').value = '';
  document.getElementById('amount').value = '';
}

function removeItem(button, amount) {
  const row = button.closest('tr');
  row.remove();
  total -= parseFloat(amount);
  updateTotal();
}

function updateTotal() {
  document.getElementById("total-amount").innerText = `₦${total.toFixed(2)}`;
}

async function sendEmail() {
  const email = document.getElementById("email").value;

  if (!email) {
    alert("Please enter a recipient email.");
    return;
  }

  // Get input values
  const title = document.getElementById("title").value;
  const clientName = document.getElementById("client-name").value;
  const date = document.getElementById("Date").value;

  // Inject values as attributes (so they appear in outerHTML)
  document.getElementById("title").setAttribute("value", title);
  document.getElementById("client-name").setAttribute("value", clientName);
  document.getElementById("Date").setAttribute("value", date);

  // Now outerHTML will contain actual values
  const html = document.documentElement.outerHTML;

  // 1. Send HTML to cache
  await fetch("http://localhost:3000/cache-html", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html }),
  });

  // 2. Generate PDF and send email
  const response = await fetch("http://localhost:3000/send-invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();
  alert(result.message);
}

