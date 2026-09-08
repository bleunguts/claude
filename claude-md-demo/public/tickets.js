async function loadTickets() {
  const grid = document.getElementById('tickets-grid');
  try {
    const res = await fetch('/api/tickets');
    const tickets = await res.json();

    if (!tickets.length) {
      grid.innerHTML = '<p class="empty">No events available right now.</p>';
      return;
    }

    grid.innerHTML = tickets
      .map(
        (t) => `
      <a class="card" href="/tickets/${t.id}">
        <img src="${t.image_url}" alt="${t.artist}" loading="lazy" />
        <div class="card-body">
          <h3>${t.artist}</h3>
          <p class="venue">${t.venue}</p>
          <div class="card-footer">
            <span class="date">${formatDate(t.event_date)}</span>
            <span class="price">${formatPrice(t.price)}</span>
          </div>
        </div>
      </a>
    `
      )
      .join('');
  } catch (err) {
    grid.innerHTML = '<p class="empty">Failed to load events. Is the server running?</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadTickets);
