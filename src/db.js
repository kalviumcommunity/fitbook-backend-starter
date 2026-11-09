// GIVEN — do not modify.
// Pretend database for classes. Every call to getClasses() is one "database query".
// Tests read queryCount to see how many times your code hit the database.

const { classes, nextClassId } = require('./data');

const db = {
  queryCount: 0,
  getClasses() {
    db.queryCount++;
    return classes.map((c) => ({ ...c }));
  },
  createClass({ title, spots }) {
    const cls = { id: nextClassId(), title, spots };
    classes.push(cls);
    return { ...cls };
  },
};

module.exports = db;
