# Concert tickets

A three-page ticket shop: browse concerts, open one for details, add it to a cart.
Plain HTML, CSS and JavaScript — no React, no Angular, no build step, and **no npm
dependencies at all**. The event catalogue lives in SQLite; the cart lives in a cookie.

## Run it

```powershell
npm start           # or: node server.js
```

Then open <http://localhost:3000>. Set `PORT` to use a different port.

Requires **Node 22.5+** for the built-in `node:sqlite` module (developed on Node 24.15).
The database file `tickets.db` is created and seeded automatically on first run.

## Pages

| URL | What it does |
| --- | --- |
| `/` | Lists every concert — placeholder photo, artist, venue, city, date, time, price, availability badge. Search, filter by city, sort by date/price/artist. |
| `/event.html?id=…` | Details for one concert: large image, venue, date, doors, genre, price, quantity picker and **Add to cart**. Sold-out shows have the button disabled. |
| `/cart.html` | Cart contents read back from the cookie, quantity changes, per-line and grand totals, remove and clear. |

## How it fits together

```
server.js        node:http — serves public/ and two JSON endpoints
  db.js          node:sqlite — schema, first-run seeding, queries
    seed-data.js 12 invented artists and venues
  public/        the browser side: 3 HTML pages, styles.css, 5 ES modules
```

**Storage is split the way the brief asked for:**

- **SQLite (`tickets.db`)** holds the event catalogue, server-side. The browser only
  reads it through the API, so prices and stock can't be edited from the client.
- **A cookie (`cart`)** holds the cart, client-side. It stores nothing but ids and
  quantities — `[{"id":"ct-1001","qty":2}]`, URL-encoded, `path=/`, `SameSite=Lax`,
  seven-day expiry. The cart page joins those ids against `/api/events` to get prices,
  so a hand-edited cookie can't change what anything costs. A malformed cookie is
  treated as an empty cart rather than throwing.

### API

| Endpoint | Response |
| --- | --- |
| `GET /api/events` | Array of events, ordered by date |
| `GET /api/events/:id` | One event, or `404 {"error":"No such event"}` |

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

## Placeholder content

Every artist, tour and venue name is invented — any resemblance to a real act or room is
coincidental. Images come from [picsum.photos](https://picsum.photos) via
`https://picsum.photos/seed/<imageSeed>/<w>/<h>`; the seed is stored per event so each
concert keeps the same photo between reloads. **Images need an internet connection** —
without one you get empty grey boxes and the rest of the page still works.

Two events (`ct-1003` Marisol Vega, `ct-1009` Sable & The Tide) are seeded as sold out so
that state is visible on the listing and details pages.

## Editing the data

Change `seed-data.js`, delete `tickets.db`, restart — it reseeds. Or edit `tickets.db`
directly with any SQLite client; seeding is skipped whenever the table already has rows,
so your changes survive a restart.

## Not included

No checkout, no payment, no accounts, and stock isn't decremented when you add to the
cart — the demo stops at the cart page.
