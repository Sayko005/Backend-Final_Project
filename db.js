// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');  // for hashing the admin password if needed

// Path to the SQLite database file
const dbPath = path.join(__dirname, 'db.sqlite');

// Create/open the SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err);
  } else {
    console.log(`SQLite database connected: ${dbPath}`);
  }
});

// Create tables if they do not exist
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user'
    )
  `);

  // Books table
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      author TEXT,
      difficulty_level INTEGER,
      added_by INTEGER,
      approved BOOLEAN DEFAULT 0,
      pdf_path TEXT,
      total_pages INTEGER
    )
  `);

  // Reading progress table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_book_progress (
      user_id INTEGER,
      book_id INTEGER,
      current_page INTEGER DEFAULT 1,
      completed BOOLEAN DEFAULT 0,
      UNIQUE(user_id, book_id)
    )
  `);

  // -- Create an admin account if it doesn't exist --
  const adminUsername = 'admin';
  const adminPassword = 'admin123'; 
  const adminRole = 'admin';

  db.get('SELECT * FROM users WHERE username = ?', [adminUsername], async (err, row) => {
    if (err) {
      console.error('Error checking admin user:', err);
    } else if (!row) {
      // Admin not found, create it
      try {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        db.run(
          'INSERT INTO users (username, password, xp, level, role) VALUES (?, ?, 0, 0, ?)',
          [adminUsername, hashedPassword, adminRole],
          function (insertErr) {
            if (insertErr) {
              console.error('Failed to create admin user:', insertErr);
            } else {
              console.log('Admin account created successfully:');
              console.log(`   Username: ${adminUsername}`);
              console.log(`   Password: ${adminPassword}`);
            }
          }
        );
      } catch (hashErr) {
        console.error('Error hashing admin password:', hashErr);
      }
    } else {
      console.log("Admin account already exists (username='admin').");
    }
  });
});

module.exports = db;
