// GIVEN — do not modify.
const express = require('express');
const jwt = require('jsonwebtoken');
const { ACCESS_SECRET } = require('./config');
const { users, bookings } = require('./data');
const requireAuth = require('./middleware/requireAuth');
const requireRole = require('./middleware/requireRole');
const classesRouter = require('./routes/classes');
const bookingsRouter = require('./routes/bookings');

const app = express();
app.use(express.json());

// Login
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Wrong username or password' } });
  }
  const token = jwt.sign({ sub: user.id, role: user.role }, ACCESS_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
  return res.json({ token });
});

app.use('/classes', classesRouter);
app.use('/bookings', requireAuth, bookingsRouter);

// Manager only: list every booking (uses your Task 1 requireRole)
app.get('/admin/bookings', requireAuth, requireRole('manager'), (req, res) => res.json(bookings));

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`FitBook on http://localhost:${PORT}`));
}

module.exports = app;
