import { gbp, imageUrl, formatDate, formatTime, escapeHtml, fetchJson } from "./util.js";
import "./cart.js";

const LOW_STOCK = 50;

const els = {
  form: document.getElementById("filters"),
  search: document.getElementById("search"),
  city: document.getElementById("city"),
  sort: document.getElementById("sort"),
  listings: document.getElementById("listings"),
  count: document.getElementById("result-count"),
  empty: document.getElementById("empty"),
};

let events = [];

function stockLabel(event) {
  if (event.ticketsLeft === 0) return { text: "Sold out", modifier: "gone" };
  if (event.ticketsLeft <= LOW_STOCK)
    return { text: `Only ${event.ticketsLeft} left`, modifier: "low" };
  return { text: "Available", modifier: "ok" };
}

function cardHtml(event) {
  const stock = stockLabel(event);
  const soldOut = event.ticketsLeft === 0;

  return `
    <li class="card${soldOut ? " card--sold-out" : ""}">
      <a class="card-link" href="/event.html?id=${encodeURIComponent(event.id)}">
        <img
          class="card-image"
          src="${imageUrl(event.imageSeed, 480, 320)}"
          alt=""
          loading="lazy"
          width="480"
          height="320"
        />
        <div class="card-body">
          <h2>${escapeHtml(event.artist)}</h2>
          <p class="tour">${escapeHtml(event.tour)}</p>
          <p class="meta">
            ${escapeHtml(event.venue)}<span class="sep">·</span>${escapeHtml(event.city)}
          </p>
          <p class="meta">
            ${formatDate(event.date)}<span class="sep">·</span>${formatTime(event.date)}
          </p>
          <p class="card-foot">
            <span class="price">${gbp.format(event.price)}</span>
            <span class="badge badge--${stock.modifier}">${stock.text}</span>
          </p>
        </div>
      </a>
    </li>
  `;
}

function render() {
  const term = els.search.value.trim().toLowerCase();
  const city = els.city.value;

  const sorters = {
    date: (a, b) => a.date.localeCompare(b.date),
    price: (a, b) => a.price - b.price,
    artist: (a, b) => a.artist.localeCompare(b.artist),
  };

  const results = events
    .filter(
      (event) =>
        (!city || event.city === city) &&
        (!term ||
          `${event.artist} ${event.tour} ${event.venue} ${event.city}`
            .toLowerCase()
            .includes(term))
    )
    .sort(sorters[els.sort.value]);

  els.listings.innerHTML = results.map(cardHtml).join("");
  els.empty.hidden = results.length > 0;
  els.count.textContent = results.length
    ? `${results.length} concert${results.length === 1 ? "" : "s"}`
    : "";
}

try {
  events = await fetchJson("/api/events");

  const cities = [...new Set(events.map((event) => event.city))].sort();
  els.city.innerHTML = ['<option value="">All cities</option>']
    .concat(cities.map((city) => `<option value="${city}">${city}</option>`))
    .join("");

  els.form.addEventListener("input", render);
  render();
} catch (error) {
  els.count.textContent = `Couldn't load events: ${error.message}`;
}
