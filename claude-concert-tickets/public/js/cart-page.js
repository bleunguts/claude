import { gbp, imageUrl, formatDate, escapeHtml, fetchJson } from "./util.js";
import { getCart, setQty, removeFromCart, clearCart, updateCartBadge } from "./cart.js";

const body = document.getElementById("cart-body");

// The cookie only holds ids and quantities — prices come from SQLite so a
// tampered-with cookie can't change what anything costs.
const events = await fetchJson("/api/events").catch(() => []);
const byId = new Map(events.map((event) => [event.id, event]));

function lineHtml(event, qty) {
  const options = Array.from(
    { length: 8 },
    (_, i) => `<option value="${i + 1}"${i + 1 === qty ? " selected" : ""}>${i + 1}</option>`
  ).join("");

  return `
    <li class="line">
      <img
        class="line-image"
        src="${imageUrl(event.imageSeed, 160, 160)}"
        alt=""
        width="80"
        height="80"
      />
      <div class="line-main">
        <a class="line-title" href="/event.html?id=${encodeURIComponent(event.id)}">
          ${escapeHtml(event.artist)}
        </a>
        <p class="meta">${escapeHtml(event.venue)}, ${escapeHtml(event.city)}</p>
        <p class="meta">${formatDate(event.date)}</p>
      </div>
      <label class="line-qty">
        <span class="visually-hidden">Quantity for ${escapeHtml(event.artist)}</span>
        <select data-qty="${event.id}">${options}</select>
      </label>
      <p class="line-total">${gbp.format(event.price * qty)}</p>
      <button class="link-button" type="button" data-remove="${event.id}">Remove</button>
    </li>
  `;
}

function render() {
  // Drop anything whose event has vanished from the catalogue.
  const items = getCart().filter((item) => byId.has(item.id));
  updateCartBadge();

  if (items.length === 0) {
    body.innerHTML = `<p class="empty">Your cart is empty. <a href="/">Find a concert</a>.</p>`;
    return;
  }

  const total = items.reduce((sum, item) => sum + byId.get(item.id).price * item.qty, 0);
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  body.innerHTML = `
    <ul class="lines">
      ${items.map((item) => lineHtml(byId.get(item.id), item.qty)).join("")}
    </ul>
    <div class="totals">
      <p class="grand">
        <span>Total (${count} ticket${count === 1 ? "" : "s"})</span>
        <strong>${gbp.format(total)}</strong>
      </p>
      <div class="totals-actions">
        <button class="link-button" type="button" id="clear">Clear cart</button>
        <button type="button" id="checkout">Checkout</button>
      </div>
      <p class="confirm" id="confirm" role="status"></p>
    </div>
  `;
}

body.addEventListener("click", (e) => {
  const id = e.target.dataset?.remove;
  if (id) {
    removeFromCart(id);
    render();
  } else if (e.target.id === "clear") {
    clearCart();
    render();
  } else if (e.target.id === "checkout") {
    document.getElementById("confirm").textContent =
      "Checkout isn't wired up — this demo stops at the cart.";
  }
});

body.addEventListener("change", (e) => {
  const id = e.target.dataset?.qty;
  if (id) {
    setQty(id, Number(e.target.value));
    render();
  }
});

render();
