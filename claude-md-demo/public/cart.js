async function loadCart() {
  const container = document.getElementById('cart-container');
  try {
    const res = await fetch('/api/cart');
    const data = await res.json();

    if (!data.items.length) {
      container.innerHTML = '<p class="empty">Your cart is empty. <a href="/tickets">Browse events</a>.</p>';
      return;
    }

    const itemsHtml = data.items
      .map(
        (t) => `
      <div class="cart-item" data-id="${t.id}">
        <img src="${t.image_url}" alt="${t.artist}" />
        <div>
          <h3>${t.artist}</h3>
          <p class="venue">${t.venue} &middot; ${formatDate(t.event_date)}</p>
          <p class="qty">Qty: ${t.quantity}</p>
        </div>
        <span class="price">${formatPrice(t.price * t.quantity)}</span>
        <button class="remove" data-id="${t.id}">Remove</button>
      </div>
    `
      )
      .join('');

    container.innerHTML = `
      ${itemsHtml}
      <div class="cart-summary">
        <span>Total</span>
        <span class="total">${formatPrice(data.total)}</span>
      </div>
    `;

    container.querySelectorAll('.remove').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        await fetch(`/api/cart/${id}`, { method: 'DELETE' });
        await refreshCartBadge();
        loadCart();
      });
    });
  } catch (err) {
    container.innerHTML = '<p class="empty">Failed to load cart.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadCart);
