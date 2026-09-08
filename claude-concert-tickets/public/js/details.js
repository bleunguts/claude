import { gbp, imageUrl, formatDate, formatTime, escapeHtml, fetchJson } from "./util.js";
import { addToCart, updateCartBadge } from "./cart.js";

const detail = document.getElementById("detail");
const id = new URLSearchParams(location.search).get("id");

function detailHtml(event) {
  const soldOut = event.ticketsLeft === 0;
  const maxQty = Math.min(event.ticketsLeft, 8);
  const options = Array.from(
    { length: Math.max(maxQty, 1) },
    (_, i) => `<option value="${i + 1}">${i + 1}</option>`
  ).join("");

  return `
    <img
      class="detail-image"
      src="${imageUrl(event.imageSeed, 1120, 480)}"
      alt="${escapeHtml(event.artist)} performing live"
      width="1120"
      height="480"
    />

    <div class="detail-grid">
      <div>
        <h1>${escapeHtml(event.artist)}</h1>
        <p class="tour tour--lg">${escapeHtml(event.tour)}</p>

        <dl class="facts">
          <dt>Venue</dt>
          <dd>${escapeHtml(event.venue)}, ${escapeHtml(event.city)}</dd>
          <dt>Date</dt>
          <dd>${formatDate(event.date)}</dd>
          <dt>Doors</dt>
          <dd>${formatTime(event.date)}</dd>
          <dt>Genre</dt>
          <dd>${escapeHtml(event.genre)}</dd>
        </dl>
      </div>

      <aside class="buy-box">
        <p class="price price--lg">${gbp.format(event.price)}<small>per ticket</small></p>
        <p class="stock">
          ${
            soldOut
              ? "This show is sold out."
              : `${event.ticketsLeft.toLocaleString("en-GB")} tickets remaining`
          }
        </p>

        <label class="qty" for="qty">Quantity</label>
        <select id="qty" ${soldOut ? "disabled" : ""}>${options}</select>

        <button id="add" type="button" ${soldOut ? "disabled" : ""}>
          ${soldOut ? "Sold out" : "Add to cart"}
        </button>
        <p class="confirm" id="confirm" role="status"></p>
      </aside>
    </div>
  `;
}

if (!id) {
  detail.innerHTML = `<p class="empty">No event selected. <a href="/">Browse concerts</a>.</p>`;
} else {
  try {
    const event = await fetchJson(`/api/events/${encodeURIComponent(id)}`);
    detail.innerHTML = detailHtml(event);
    document.title = `${event.artist} — ${event.venue}`;

    document.getElementById("add")?.addEventListener("click", () => {
      const qty = Number(document.getElementById("qty").value);
      addToCart(event.id, qty);
      updateCartBadge();
      document.getElementById("confirm").textContent =
        `Added ${qty} ticket${qty === 1 ? "" : "s"} to your cart.`;
    });
  } catch (error) {
    detail.innerHTML = `<p class="empty">Couldn't load that event (${escapeHtml(
      error.message
    )}). <a href="/">Browse concerts</a>.</p>`;
  }
}
