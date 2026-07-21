const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN DEFAULT FALSE
      );
    `);

    const res = await pool.query('SELECT COUNT(*) FROM tasks');
    if (parseInt(res.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO tasks (title, done) VALUES 
        ('Buy groceries', false),
        ('Finish assignment', false),
        ('Go to gym', true);
      `);
      console.log("Database seeded with initial tasks.");
    }
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
};

initDB();

module.exports = {
  query: (text, params) => pool.query(text, params),
};