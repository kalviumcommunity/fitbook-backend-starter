// GIVEN — do not modify. Run with: npm test
const http = require('http');
const jwt = require('jsonwebtoken');
const { ACCESS_SECRET } = require('../src/config');
const app = require('../src/app');
const db = require('../src/db');
const cache = require('../src/cache');
const { bookings } = require('../src/data');

const tok = (sub, role) => jwt.sign({ sub, role }, ACCESS_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
const MAYA = tok('u1', 'member'), RAJ = tok('u2', 'member'), COACH = tok('u3', 'trainer'), BOSS = tok('u4', 'manager');
const auth = (t) => ({ Authorization: `Bearer ${t}` });

let server, port;
function call(method, path, { headers = {}, json } = {}) {
  return new Promise((resolve, reject) => {
    const h = { ...headers };
    let payload;
    if (json !== undefined) { payload = JSON.stringify(json); h['Content-Type'] = 'application/json'; }
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers: h }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { let body = d; try { body = JSON.parse(d); } catch {} resolve({ status: res.statusCode, headers: res.headers, body }); });
    });
    req.on('error', reject);
    if (payload !== undefined) req.write(payload);
    req.end();
  });
}

let passed = 0, failed = 0;
function check(ok, msg) { if (ok) { passed++; console.log(`  ✓ ${msg}`); } else { failed++; console.log(`  ✗ ${msg}`); } }
async function safe(fn) { try { await fn(); } catch (e) { failed++; console.log(`  ✗ crashed: ${e.message}`); } }

async function main() {
  server = app.listen(0); port = server.address().port;

  console.log('\nTask 1 — requireRole');
  await safe(async () => {
    check((await call('GET', '/admin/bookings', { headers: auth(BOSS) })).status === 200, 'manager can open /admin/bookings (200)');
    const r = await call('GET', '/admin/bookings', { headers: auth(MAYA) });
    check(r.status === 403 && r.body.error && r.body.error.code === 'FORBIDDEN', 'member gets 403 FORBIDDEN on /admin/bookings');
    check((await call('GET', '/admin/bookings')).status === 401, 'no token gets 401');
    const p = await call('POST', '/classes', { headers: auth(RAJ), json: { title: 'X', spots: 1 } });
    check(p.status === 403, 'member cannot create a class (403)');
    const t = await call('POST', '/classes', { headers: auth(COACH), json: { title: 'Spin', spots: 15 } });
    check(t.status === 201, 'trainer can create a class (two allowed roles work)');
  });

  console.log('\nTask 2 — ownership check (IDOR)');
  await safe(async () => {
    check((await call('GET', '/bookings/b1', { headers: auth(MAYA) })).status === 200, 'maya reads her own booking (200)');
    const r = await call('GET', '/bookings/b1', { headers: auth(RAJ) });
    check(r.status === 403 && r.body.error && r.body.error.code === 'FORBIDDEN', "raj reading maya's booking gets 403 FORBIDDEN");
    check((await call('GET', '/bookings/b1', { headers: auth(BOSS) })).status === 200, 'manager can read any booking (200)');
    const n = await call('GET', '/bookings/b999', { headers: auth(RAJ) });
    check(n.status === 404 && n.body.error && n.body.error.code === 'NOT_FOUND', 'missing booking gets 404 NOT_FOUND');
  });

  console.log('\nTask 3 — idempotent POST /bookings');
  await safe(async () => {
    const body = { classId: 'c1', seats: 2 };
    const miss = await call('POST', '/bookings', { headers: auth(MAYA), json: body });
    check(miss.status === 400 && miss.body.error && miss.body.error.code === 'IDEMPOTENCY_KEY_REQUIRED', 'no Idempotency-Key gets 400 IDEMPOTENCY_KEY_REQUIRED');
    const before = bookings.length;
    const a = await call('POST', '/bookings', { headers: { ...auth(MAYA), 'Idempotency-Key': 'k-1' }, json: body });
    check(a.status === 201 && a.body.id, 'new key creates a booking (201)');
    const b = await call('POST', '/bookings', { headers: { ...auth(MAYA), 'Idempotency-Key': 'k-1' }, json: body });
    check(bookings.length === before + 1, 'repeating the same key creates NO second booking');
    check(b.status === 201 && b.body.id === a.body.id, 'repeat returns the same status and the same booking id');
    const c = await call('POST', '/bookings', { headers: { ...auth(MAYA), 'Idempotency-Key': 'k-2' }, json: body });
    check(c.status === 201 && c.body.id !== a.body.id && bookings.length === before + 2, 'a different key creates a new booking');
  });

  console.log('\nTask 4 — cache the class list');
  await safe(async () => {
    cache.clear(); db.queryCount = 0;
    const a = await call('GET', '/classes');
    check(a.headers['x-cache'] === 'MISS' && Array.isArray(a.body), '1st GET /classes is X-Cache: MISS');
    const b = await call('GET', '/classes');
    check(b.headers['x-cache'] === 'HIT', '2nd GET /classes is X-Cache: HIT');
    check(db.queryCount === 1, 'the database was queried only once for two reads');
    await call('POST', '/classes', { headers: auth(BOSS), json: { title: 'Pilates', spots: 10 } });
    const c = await call('GET', '/classes');
    check(c.headers['x-cache'] === 'MISS' && c.body.some((x) => x.title === 'Pilates'), 'after POST /classes the cache is cleared and the new class shows');
  });

  server.close();
  console.log(`\n  RESULT: ${passed} passed, ${failed} failed`);
  console.log(failed === 0 ? '✓ All tests passed!' : '✗ Some tests failed — keep going.');
  process.exit(failed === 0 ? 0 : 1);
}
main();
