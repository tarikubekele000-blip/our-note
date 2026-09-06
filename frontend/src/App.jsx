import { useEffect, useMemo, useState } from 'react';

const emptyForm = { title: '', content: '' };

function App() {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalNotes = useMemo(() => notes.length, [notes]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notes');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load notes');
      }

      setNotes(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Something went wrong while loading notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and note content are required.');
      return;
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/notes/${editingId}` : '/api/notes';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save note');
      }

      setForm(emptyForm);
      setEditingId(null);
      setError('');
      fetchNotes();
    } catch (err) {
      setError(err.message || 'Unable to save note.');
    }
  };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setForm({ title: note.title, content: note.content });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete note');
      }

      setError('');
      fetchNotes();
    } catch (err) {
      setError(err.message || 'Unable to delete note.');
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Study companion</p>
          <h1>Our Note</h1>
        </div>
        <div className="badge">{totalNotes} notes</div>
      </header>

      <main className="layout">
        <section className="panel form-panel">
          <h2>{editingId ? 'Edit note' : 'Create a new note'}</h2>

          <form onSubmit={handleSubmit} className="note-form">
            <label>
              <span>Title</span>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Lesson topic or subject"
              />
            </label>

            <label>
              <span>Content</span>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Write your notes here..."
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-button">
                {editingId ? 'Update note' : 'Save note'}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                    setError('');
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {error && <p className="error-message">{error}</p>}
        </section>

        <section className="panel notes-panel">
          <div className="section-heading">
            <h2>My notes</h2>
          </div>

          {loading ? (
            <p className="empty-state">Loading your notes...</p>
          ) : notes.length === 0 ? (
            <p className="empty-state">No notes yet. Add your first one to start organizing your study.</p>
          ) : (
            <div className="notes-list">
              {notes.map((note) => (
                <article key={note.id} className="note-card">
                  <div className="note-meta">
                    <span>Note</span>
                  </div>
                  <h3>{note.title}</h3>
                  <p>{note.content}</p>

                  <div className="actions">
                    <button type="button" className="secondary-button" onClick={() => handleEdit(note)}>
                      Edit
                    </button>
                    <button type="button" className="danger-button" onClick={() => handleDelete(note.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
