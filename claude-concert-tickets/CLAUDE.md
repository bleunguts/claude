# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A three-page ticket shop: browse concerts, open one for details, add it to a cart. Plain
HTML, CSS and JavaScript — **no frameworks, no build step, and no npm dependencies at
all**. The event catalogue lives in SQLite; the cart lives in a cookie.

## Commands

```powershell
npm start           # or: node server.js
```

Then open <http://localhost:3000>. Set `PORT` env var to use a different port.

Requires **Node 22.5+** for the built-in `node:sqlite` module (developed on Node 24.15).
There is no test suite, linter, or build step — this repo has none of those configured.

`tickets.db` is created and seeded automatically on first run of the server. To reset the
data: change `seed-data.js`, delete `tickets.db`, and restart (seeding is skipped whenever
the table already has rows, so hand-edited data survives a restart).

## Architecture

```
server.js        node:http — serves public/ and two JSON endpoints
  db.js          node:sqlite — schema, first-run seeding, queries
    seed-data.js 12 invented artists and venues
  public/        the browser side: 3 HTML pages, styles.css, 5 ES modules
```

No router/framework: `server.js` is a single `http.createServer` callback that
special-cases the two `/api/events*` routes and falls through to `sendFile`, which serves
anything else out of `public/` (defaulting `/` to `index.html`). Static file paths are
normalized before joining to `PUBLIC_DIR` and checked with `startsWith` to prevent path
traversal outside `public/`.

**Storage is deliberately split:**

- **SQLite (`tickets.db`)**, via `db.js`, holds the event catalogue server-side. The
  browser only reads it through `/api/events`, so prices and stock can't be edited from
  the client.
- **A cookie (`cart`)**, via `public/js/cart.js`, holds the cart client-side. It stores
  only `[{"id":"ct-1001","qty":2}]` (ids + quantities), URL-encoded, `path=/`,
  `SameSite=Lax`, seven-day expiry. `cart.html` joins those ids against `/api/events` to
  get prices, so a hand-edited cookie can't change what anything costs. A malformed
  cookie is treated as an empty cart rather than throwing.

### API

| Endpoint | Response |
| --- | --- |
| `GET /api/events` | Array of events, ordered by date |
| `GET /api/events/:id` | One event, or `404 {"error":"No such event"}` |

Event shape (camelCase over the wire; `db.js`'s `toEvent()` maps from the snake_case
columns):

```json
{
  "id": "ct-1001",
  "artist": "Neon Harbour",
  "tour": "Tidal Lights Tour",
  "venue": "The Glasshouse Arena",
  "city": "London",
  "genre": "Indie",
  "date": "2026-09-04T19:30",
  "price": 38.5,
  "ticketsLeft": 412,
  "imageSeed": "harbour"
}
```

### Frontend

Plain ES modules loaded directly by the browser (`type="module"`, no bundler):

- `public/js/util.js` — shared helpers: currency/date formatting, `escapeHtml` (event
  data is placeholder text but still lands in `innerHTML`, so it's escaped anyway),
  `fetchJson`, and `imageUrl()` which builds a picsum.photos placeholder URL from an
  event's `imageSeed` (stable per event across reloads).
- `public/js/cart.js` — the cart cookie API (`getCart`, `saveCart`, `addToCart`,
  `setQty`, `removeFromCart`, `clearCart`, `cartCount`) plus `updateCartBadge()`, which
  keeps the "Cart (n)" header link in sync on every page.
- `public/js/list.js`, `details.js`, `cart-page.js` — one per HTML page
  (`index.html`, `event.html`, `cart.html` respectively), wiring the above into the DOM.

### Placeholder content

Every artist, tour and venue name in `seed-data.js` is invented. Images come from
picsum.photos via `imageUrl()` and need an internet connection — without one you get
empty grey boxes but the rest of the page still works. Two events (`ct-1003`, `ct-1009`)
are seeded with `ticketsLeft: 0` to exercise the sold-out state on the listing and details
pages.

### Not included

No checkout, no payment, no accounts, and stock isn't decremented when items are added to
the cart — the demo stops at the cart page.
