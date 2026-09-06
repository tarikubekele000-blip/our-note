const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const db = new sqlite3.Database(path.join(__dirname, 'notes.db'));

const ensureDatabase = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
};

const normalizeNote = (note) => ({
  id: note.id,
  title: note.title,
  content: note.content,
  created_at: note.created_at
});

ensureDatabase();

app.get('/api/notes', (req, res) => {
  db.all('SELECT * FROM notes ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    res.json(rows.map(normalizeNote));
  });
});

app.post('/api/notes', (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required' });
    return;
  }

  db.run('INSERT INTO notes (title, content) VALUES (?, ?)', [title, content], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    res.status(201).json({
      id: this.lastID,
      title,
      content
    });
  });
});

app.put('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required' });
    return;
  }

  db.run('UPDATE notes SET title = ?, content = ? WHERE id = ?', [title, content, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json({ id: Number(id), title, content });
  });
});

app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM notes WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json({ success: true });
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
