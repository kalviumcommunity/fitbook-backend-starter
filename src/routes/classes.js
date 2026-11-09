// TASK 4 — Cache the class list (5 marks)
//
// GET /classes runs db.getClasses() on EVERY request. The list rarely changes,
// so cache it (cache-aside), using the helper in ../cache (get / set / del):
//
//   GET /classes
//     1. look in the cache under the key 'classes:all'
//     2. HIT  -> set header  X-Cache: HIT   and return the cached list
//     3. MISS -> call db.getClasses(), cache it for 60 seconds,
//                set header  X-Cache: MISS  and return the list
//
//   POST /classes (trainer or manager)
//     after creating the class, delete 'classes:all' from the cache so the next
//     GET shows the new class instead of a stale list.

const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const db = require('../db');
const cache = require('../cache');

router.get('/', (req, res) => {
  // TODO: add cache-aside here
  const classes = db.getClasses();
  res.set('X-Cache', 'MISS');
  return res.json(classes);
});

router.post('/', requireAuth, requireRole('trainer', 'manager'), (req, res) => {
  const cls = db.createClass({ title: req.body.title, spots: req.body.spots });
  // TODO: remove the stale cached list here
  return res.status(201).json(cls);
});

module.exports = router;
