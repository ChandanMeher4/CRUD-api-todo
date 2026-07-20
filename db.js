const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./tasks.db');

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const initDB = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done BOOLEAN DEFAULT 0
    )
  `);

  const row = await get('SELECT COUNT(*) as count FROM tasks');
  if (row.count === 0) {
    await run('INSERT INTO tasks (title, done) VALUES (?, ?)', ['Buy milk', 0]);
    await run('INSERT INTO tasks (title, done) VALUES (?, ?)', ['Finish assignment', 0]);
    await run('INSERT INTO tasks (title, done) VALUES (?, ?)', ['Walk the dog', 1]);
    console.log('Database seeded with initial tasks.');
  }
};

module.exports = { run, get, all, initDB };