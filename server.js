// server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const db = require('./db'); // SQLite connection

const app = express();
const PORT = process.env.PORT || 5000;

// Secret key for JWT (in real projects put it in .env)
const JWT_SECRET = 'SUPER_SECRET_KEY_CHANGE_ME';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- Promisify SQLite queries ----------
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // this.lastID, this.changes
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// ---------- Multer (for PDF) ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now();
    cb(null, baseName + '-' + uniqueSuffix + ext);
  },
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};
const upload = multer({ storage, fileFilter });

// ---------- JWT Middleware ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']; // "Bearer token"
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization token is missing.' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid authorization format.' });
  }
  jwt.verify(token, JWT_SECRET, (err, userData) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    // userData = { userId, role, iat, exp }
    req.user = userData;
    next();
  });
}

// ---------- Test route ----------
app.get('/', (req, res) => {
  res.send('Server (SQLite) is up and running! 🚀');
});

// ---------- Registration (Sign Up) ----------
app.post('/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required!' });
  }
  try {
    // Check if user exists
    const existing = await getAsync('SELECT * FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user (role=user by default)
    const result = await runAsync(
      'INSERT INTO users (username, password, xp, level, role) VALUES (?, ?, 0, 0, ?)',
      [username, hashedPassword, 'user']
    );
    const newUserId = result.lastID;

    const newUser = await getAsync('SELECT * FROM users WHERE id=?', [newUserId]);
    res.status(201).json({
      message: 'User registered successfully!',
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Login ----------
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required!' });
  }
  try {
    // Find user
    const user = await getAsync('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    // Compare password hash
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    const { id, role, xp, level } = user;
    res.json({
      message: 'Login successful!',
      user: { id, username, role, xp, level },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- XP -> Level calculation ----------
function calculateLevel(xp) {
  let level = 0;
  let needed = 100;
  let increment = 100; // after each level, needed += (increment += 50)
  while (xp >= needed) {
    level++;
    increment += 50;
    needed += increment;
  }
  return level;
}

// ---------- Upload a book (+20 XP) ----------
app.post('/books/upload', authenticateToken, upload.single('pdfFile'), async (req, res) => {
  const { title, author, difficulty_level, added_by, total_pages } = req.body;
  if (!title || !author || !difficulty_level || !added_by || !req.file) {
    return res.status(400).json({ error: 'All fields and the file are required!' });
  }
  try {
    const pdfPath = `uploads/${req.file.filename}`;
    // Insert the book
    const insertBook = await runAsync(
      `INSERT INTO books (
        title, author, difficulty_level, added_by,
        approved, pdf_path, total_pages
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, author, difficulty_level, added_by, 0, pdfPath, total_pages]
    );

    // +20 XP to the user who added the book
    await runAsync('UPDATE users SET xp = xp + 20 WHERE id = ?', [added_by]);

    // Check updated XP and maybe level up
    const userRow = await getAsync('SELECT xp, level FROM users WHERE id=?', [added_by]);
    if (userRow) {
      const newXP = userRow.xp;
      const oldLevel = userRow.level;
      const newLevel = calculateLevel(newXP);
      if (newLevel > oldLevel) {
        await runAsync('UPDATE users SET level=? WHERE id=?', [newLevel, added_by]);
      }
    }

    const newBookId = insertBook.lastID;
    const newBook = await getAsync('SELECT * FROM books WHERE id=?', [newBookId]);
    res.status(201).json({
      message: 'Book uploaded successfully! (+20 XP)',
      book: newBook
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- List all books (admin only) ----------
app.get('/books/all', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied (admin only).' });
  }
  try {
    const books = await allAsync('SELECT * FROM books');
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Approve a book (admin only) ----------
app.post('/books/:book_id/approve', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied (admin only).' });
  }
  const { book_id } = req.params;
  try {
    await runAsync('UPDATE books SET approved=1 WHERE id=?', [book_id]);
    res.json({ message: 'Book approved!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- List approved books (public) ----------
app.get('/books', async (req, res) => {
  try {
    const approvedBooks = await allAsync('SELECT * FROM books WHERE approved=1');
    res.json(approvedBooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Get PDF (check difficulty vs user level) ----------
app.get('/books/:book_id/pdf', authenticateToken, async (req, res) => {
  const { book_id } = req.params;
  const user_id = req.user.userId;
  try {
    const book = await getAsync('SELECT * FROM books WHERE id=? AND approved=1', [book_id]);
    if (!book) {
      return res.status(404).json({ error: 'Book not found or not approved.' });
    }

    const userRow = await getAsync('SELECT * FROM users WHERE id=?', [user_id]);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (userRow.level < book.difficulty_level) {
      return res.status(403).json({ error: 'Your level is too low to read this book.' });
    }

    res.json({
      pdfPath: book.pdf_path,
      totalPages: book.total_pages || 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Save reading progress ----------
app.post('/books/:book_id/progress', authenticateToken, async (req, res) => {
  const { book_id } = req.params;
  const user_id = req.user.userId;
  const { current_page } = req.body;

  try {
    // Check if record exists
    const progress = await getAsync(
      'SELECT * FROM user_book_progress WHERE user_id=? AND book_id=?',
      [user_id, book_id]
    );
    if (progress) {
      await runAsync(
        'UPDATE user_book_progress SET current_page=? WHERE user_id=? AND book_id=?',
        [current_page, user_id, book_id]
      );
    } else {
      await runAsync(
        'INSERT INTO user_book_progress (user_id, book_id, current_page) VALUES (?, ?, ?)',
        [user_id, book_id, current_page]
      );
    }
    res.json({ message: 'Progress saved!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Get current reading progress ----------
app.get('/books/:book_id/progress', authenticateToken, async (req, res) => {
  const { book_id } = req.params;
  const user_id = req.user.userId;
  try {
    const progress = await getAsync(
      'SELECT current_page, completed FROM user_book_progress WHERE user_id=? AND book_id=?',
      [user_id, book_id]
    );
    if (!progress) {
      return res.json({ current_page: 1, completed: false });
    }
    res.json({
      current_page: progress.current_page,
      completed: !!progress.completed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Finish reading a book => +50 XP ----------
app.post('/books/:book_id/finish', authenticateToken, async (req, res) => {
  const { book_id } = req.params;
  const user_id = req.user.userId;
  try {
    const userCheck = await getAsync('SELECT * FROM users WHERE id=?', [user_id]);
    if (!userCheck) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const progressCheck = await getAsync(
      'SELECT * FROM user_book_progress WHERE user_id=? AND book_id=?',
      [user_id, book_id]
    );
    if (!progressCheck) {
      return res.status(400).json({ error: 'No progress for this book. Start reading first.' });
    }
    if (progressCheck.completed) {
      return res.status(400).json({ error: 'Book is already marked as finished.' });
    }

    // Mark as completed
    await runAsync(
      'UPDATE user_book_progress SET completed=1 WHERE user_id=? AND book_id=?',
      [user_id, book_id]
    );

    // +50 XP
    const xpToAdd = 50;
    await runAsync('UPDATE users SET xp = xp + ? WHERE id=?', [xpToAdd, user_id]);

    // Check if level up
    const afterXP = await getAsync('SELECT xp, level FROM users WHERE id=?', [user_id]);
    if (afterXP) {
      const newXP = afterXP.xp;
      const oldLevel = afterXP.level;
      const newLevel = calculateLevel(newXP);
      if (newLevel > oldLevel) {
        await runAsync('UPDATE users SET level=? WHERE id=?', [newLevel, user_id]);
      }
    }

    res.json({ message: `Congratulations! Book finished. You gained +${xpToAdd} XP.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Delete a book (admin only) ----------
app.delete('/books/:book_id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied (admin only).' });
  }
  const { book_id } = req.params;
  try {
    await runAsync('DELETE FROM user_book_progress WHERE book_id=?', [book_id]);
    await runAsync('DELETE FROM books WHERE id=?', [book_id]);
    res.json({ message: 'Book deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- User profile ----------
app.get('/users/:user_id', authenticateToken, async (req, res) => {
  const { user_id } = req.params;

  // If not admin, only can view your own profile
  if (req.user.role !== 'admin' && parseInt(user_id) !== req.user.userId) {
    return res.status(403).json({ error: 'You can only view your own profile.' });
  }

  try {
    const user = await getAsync(
      'SELECT id, username, role, xp, level FROM users WHERE id=?',
      [user_id]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Books fully read
    const readBooks = await allAsync(`
      SELECT b.id, b.title, b.author, b.difficulty_level
      FROM user_book_progress up
      JOIN books b ON b.id = up.book_id
      WHERE up.user_id = ?
        AND up.completed = 1
    `, [user.id]);

    // Books added by this user
    const addedBooks = await allAsync(`
      SELECT id, title, author, difficulty_level, approved
      FROM books
      WHERE added_by = ?
    `, [user.id]);

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      xp: user.xp,
      level: user.level,
      readBooks,
      addedBooks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server (SQLite) started on http://localhost:${PORT}`);
});
