const router = require('express').Router();
const { bookings, idempotency, nextBookingId } = require('../data');

// All routes in this file are already behind requireAuth (see src/app.js),
// so req.user = { id, role } is always available.

// TASK 2 — Stop users reading other people's bookings (5 marks)
//
// Right now any logged-in user can open ANY booking by guessing its id (an IDOR bug).
// Fix GET /bookings/:id:
//   - booking does not exist                            -> 404 { error: { code: 'NOT_FOUND', message: '...' } }
//   - booking.userId !== req.user.id AND role != manager -> 403 { error: { code: 'FORBIDDEN', message: '...' } }
//   - otherwise return the booking (200)
// Check 404 first, then ownership. Managers may read any booking.
router.get('/:id', (req, res) => {
  const booking = bookings.find((b) => b.id === req.params.id);
  // TODO: add the 404 check and the ownership check
  return res.json(booking);
});

// TASK 3 — Never book the same class twice (5 marks)
//
// If the phone loses signal and the app retries "Book class", we must not create
// two bookings. Make POST /bookings idempotent using the Idempotency-Key header:
//   1. no header                -> 400 { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: '...' } }
//   2. key already used         -> return the SAME status and body saved before; create NO new booking
//   3. new key                  -> create exactly one booking, save { status, body } in the
//                                  `idempotency` Map under the key, and return it with 201
//
// Create a booking like this:
//   { id: nextBookingId(), userId: req.user.id, classId: req.body.classId, seats: req.body.seats, status: 'confirmed' }
// Push it into `bookings`. Read the key from req.headers['idempotency-key'].
router.post('/', (req, res) => {
  // TODO: implement the three rules above. This stub creates a new booking every time.
  const booking = { id: nextBookingId(), userId: req.user.id, classId: req.body.classId, seats: req.body.seats, status: 'confirmed' };
  bookings.push(booking);
  return res.status(201).json(booking);
});

module.exports = router;
