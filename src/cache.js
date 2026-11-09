// GIVEN — do not modify.
// A tiny in-memory cache with expiry (a stand-in for Redis, so nothing to install).
// Same idea as Redis: get / set with a TTL / del.

const store = new Map(); // key -> { value, expiresAt }

module.exports = {
  get(key) {
    const hit = store.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) { store.delete(key); return null; }
    return hit.value;
  },
  set(key, value, ttlSeconds) {
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },
  del(key) {
    store.delete(key);
  },
  clear() {
    store.clear();
  },
};
