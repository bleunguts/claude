const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'tickets.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    artist TEXT NOT NULL,
    venue TEXT NOT NULL,
    event_date TEXT NOT NULL,
    price REAL NOT NULL,
    image_url TEXT NOT NULL
  )
`);

const seedTickets = [
  { id: '1', artist: 'Neon Skyline', venue: 'The Wobbly Kettle Arena', event_date: '2026-10-14', price: 59.99 },
  { id: '2', artist: 'Crimson Static', venue: 'Velvet Hangar', event_date: '2026-10-22', price: 45.50 },
  { id: '3', artist: 'The Paper Lanterns', venue: 'Ironwood Pavilion', event_date: '2026-11-02', price: 39.00 },
  { id: '4', artist: 'Glass Wolves', venue: 'The Salt Mine Hall', event_date: '2026-11-15', price: 72.25 },
  { id: '5', artist: 'Echo Valley', venue: 'Bright Harbor Stadium', event_date: '2026-12-01', price: 89.99 },
  { id: '6', artist: 'Midnight Ferris', venue: 'The Rust Belt Theater', event_date: '2026-12-10', price: 55.00 },
  { id: '7', artist: 'Solar Static', venue: 'Gravel Yard Amphitheater', event_date: '2027-01-08', price: 65.75 },
  { id: '8', artist: 'The Hollow Choir', venue: 'Copper Loft', event_date: '2027-01-20', price: 48.00 }
].map(t => ({ ...t, image_url: `https://picsum.photos/seed/concert-${t.id}/500/350` }));

const existingCount = db.prepare('SELECT COUNT(*) AS count FROM tickets').get().count;
if (existingCount === 0) {
  const insert = db.prepare(
    'INSERT INTO tickets (id, artist, venue, event_date, price, image_url) VALUES (@id, @artist, @venue, @event_date, @price, @image_url)'
  );
  const insertAll = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  insertAll(seedTickets);
}

function getAllTickets() {
  return db.prepare('SELECT * FROM tickets ORDER BY event_date ASC').all();
}

function getTicketById(id) {
  return db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
}

module.exports = { getAllTickets, getTicketById };
