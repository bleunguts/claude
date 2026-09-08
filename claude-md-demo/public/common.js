async function refreshCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  try {
    const res = await fetch('/api/cart');
    const data = await res.json();
    badge.textContent = data.count;
  } catch {
    badge.textContent = '0';
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function formatDate(isoDate) {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatPrice(price) {
  return `$${Number(price).toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', refreshCartBadge);
