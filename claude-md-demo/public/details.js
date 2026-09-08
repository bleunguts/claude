function getTicketIdFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

async function loadDetails() {
  const container = document.getElementById('details-container');
  const ticketId = getTicketIdFromPath();

  try {
    const res = await fetch(`/api/tickets/${ticketId}`);
    if (!res.ok) {
      container.innerHTML = '<p class="empty">Event not found.</p>';
      return;
    }
    const t = await res.json();

    container.innerHTML = `
      <div class="details-layout">
        <img src="${t.image_url}" alt="${t.artist}" />
        <div class="details-info">
          <h1>${t.artist}</h1>
          <p class="venue">${t.venue}</p>
          <dl>
            <dt>Date</dt>
            <dd>${formatDate(t.event_date)}</dd>
            <dt>Price</dt>
            <dd>${formatPrice(t.price)}</dd>
          </dl>
          <button id="add-to-cart-btn">Add to Cart</button>
        </div>
      </div>
    `;

    document.getElementById('add-to-cart-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Adding...';
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: t.id })
        });
        await refreshCartBadge();
        showToast(`Added ${t.artist} to cart`);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Add to Cart';
      }
    });
  } catch (err) {
    container.innerHTML = '<p class="empty">Failed to load event details.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadDetails);
