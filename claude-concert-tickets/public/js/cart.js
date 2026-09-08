// The cart lives entirely in a cookie: [{ id, qty }, ...] JSON-encoded.
// Small enough to stay well inside the ~4KB cookie limit.
const COOKIE_NAME = "cart";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // one week

function readCookie(name) {
  return document.cookie
    .split("; ")
    .find((pair) => pair.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function getCart() {
  const raw = readCookie(COOKIE_NAME);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    // Guard against a hand-edited or stale cookie.
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && typeof item.id === "string" && item.qty > 0)
      : [];
  } catch {
    return [];
  }
}

export function saveCart(items) {
  const value = encodeURIComponent(JSON.stringify(items));
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  updateCartBadge();
  return items;
}

export function addToCart(id, qty = 1) {
  const items = getCart();
  const existing = items.find((item) => item.id === id);
  if (existing) existing.qty += qty;
  else items.push({ id, qty });
  return saveCart(items);
}

export function setQty(id, qty) {
  const items = getCart()
    .map((item) => (item.id === id ? { ...item, qty } : item))
    .filter((item) => item.qty > 0);
  return saveCart(items);
}

export function removeFromCart(id) {
  return saveCart(getCart().filter((item) => item.id !== id));
}

export function clearCart() {
  return saveCart([]);
}

export function cartCount() {
  return getCart().reduce((total, item) => total + item.qty, 0);
}

/** Keeps the "Cart (n)" link in the header honest on every page. */
export function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = cartCount();
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
