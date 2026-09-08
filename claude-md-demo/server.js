const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { getAllTickets, getTicketById } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const CART_COOKIE = 'cart';
const CART_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 1 week

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Pages
app.get('/', (req, res) => res.redirect('/tickets'));
app.get('/tickets', (req, res) => res.sendFile(path.join(__dirname, 'public', 'tickets.html')));
app.get('/tickets/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'details.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cart.html')));

// Cart helpers (cart contents live entirely in a cookie)
function readCart(req) {
  try {
    const parsed = JSON.parse(req.cookies[CART_COOKIE] || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(res, cart) {
  res.cookie(CART_COOKIE, JSON.stringify(cart), { maxAge: CART_MAX_AGE_MS, sameSite: 'lax' });
}

function cartCount(cart) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// API: tickets
app.get('/api/tickets', (req, res) => {
  res.json(getAllTickets());
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

// API: cart
app.get('/api/cart', (req, res) => {
  const cart = readCart(req);

  // Build up the list of real tickets, skipping any cart entries whose
  // ticket no longer exists in the database.
  const items = [];
  for (const cartItem of cart) {
    const ticket = getTicketById(cartItem.ticketId);
    if (ticket) {
      items.push({ ...ticket, quantity: cartItem.quantity });
    }
  }

  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  res.json({ items, total: Number(total.toFixed(2)), count: cartCount(cart) });
});

app.post('/api/cart', (req, res) => {
  const { ticketId } = req.body || {};
  const ticket = getTicketById(ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const cart = readCart(req);
  const existing = cart.find((item) => item.ticketId === ticketId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ticketId, quantity: 1 });
  }
  writeCart(res, cart);
  res.json({ success: true, count: cartCount(cart) });
});

app.delete('/api/cart/:ticketId', (req, res) => {
  const cart = readCart(req).filter((item) => item.ticketId !== req.params.ticketId);
  writeCart(res, cart);
  res.json({ success: true, count: cartCount(cart) });
});

app.listen(PORT, () => {
  console.log(`Concert tickets prototype running at http://localhost:${PORT}`);
});
