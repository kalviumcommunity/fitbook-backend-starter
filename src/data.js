// GIVEN — do not modify. In-memory "database" — no real DB needed.

const users = [
  { id: 'u1', username: 'maya', password: 'maya-pass', role: 'member'  },
  { id: 'u2', username: 'raj',  password: 'raj-pass',  role: 'member'  },
  { id: 'u3', username: 'coach', password: 'coach-pass', role: 'trainer' },
  { id: 'u4', username: 'boss', password: 'boss-pass', role: 'manager' },
];

const classes = [
  { id: 'c1', title: 'Morning Yoga', spots: 20 },
  { id: 'c2', title: 'HIIT Blast',   spots: 12 },
];

// Every booking belongs to one user (userId).
const bookings = [
  { id: 'b1', userId: 'u1', classId: 'c1', seats: 1, status: 'confirmed' }, // maya's booking
  { id: 'b2', userId: 'u2', classId: 'c2', seats: 2, status: 'confirmed' }, // raj's booking
];

// Used by Task 3: key -> { status, body }
const idempotency = new Map();

let bookingCounter = bookings.length;
const nextBookingId = () => `b${++bookingCounter}`;

let classCounter = classes.length;
const nextClassId = () => `c${++classCounter}`;

module.exports = { users, classes, bookings, idempotency, nextBookingId, nextClassId };
