import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SEED_EVENTS } from "./seed-data.js";

const here = dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(join(here, "tickets.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id           TEXT PRIMARY KEY,
    artist       TEXT    NOT NULL,
    tour         TEXT    NOT NULL,
    venue        TEXT    NOT NULL,
    city         TEXT    NOT NULL,
    genre        TEXT    NOT NULL,
    event_date   TEXT    NOT NULL,
    price        REAL    NOT NULL,
    tickets_left INTEGER NOT NULL,
    image_seed   TEXT    NOT NULL
  );
`);

// Seed on first run only, so edits made to the database survive a restart.
const { count } = db.prepare("SELECT COUNT(*) AS count FROM events").get();
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO events
      (id, artist, tour, venue, city, genre, event_date, price, tickets_left, image_seed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const row of SEED_EVENTS) insert.run(...row);
  console.log(`Seeded ${SEED_EVENTS.length} events.`);
}

const toEvent = (row) => ({
  id: row.id,
  artist: row.artist,
  tour: row.tour,
  venue: row.venue,
  city: row.city,
  genre: row.genre,
  date: row.event_date,
  price: row.price,
  ticketsLeft: row.tickets_left,
  imageSeed: row.image_seed,
});

const selectAll = db.prepare("SELECT * FROM events ORDER BY event_date");
const selectOne = db.prepare("SELECT * FROM events WHERE id = ?");

export function listEvents() {
  return selectAll.all().map(toEvent);
}

export function getEvent(id) {
  const row = selectOne.get(id);
  return row ? toEvent(row) : null;
}
