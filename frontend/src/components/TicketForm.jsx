import { useState, useRef } from 'react';
import { createTicket, classifyTicket } from '../api/tickets';

const CATEGORIES = ['billing', 'technical', 'account', 'general'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function TicketForm({ onTicketCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });
  const [classifying, setClassifying] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const descTimeoutRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'description') {
      setSuggestion(null);
      if (descTimeoutRef.current) clearTimeout(descTimeoutRef.current);
    }
  };

  const handleDescriptionBlur = async () => {
    if (form.description.trim().length < 20) return;
    setClassifying(true);
    setSuggestion(null);
    const result = await classifyTicket(form.description.trim());
    setClassifying(false);
    if (result) {
      setSuggestion(result);
      setForm(f => ({
        ...f,
        category: result.suggested_category,
        priority: result.suggested_priority,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const ticket = await createTicket(form);
      setForm({ title: '', description: '', category: 'general', priority: 'medium' });
      setSuggestion(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onTicketCreated(ticket);
    } catch (err) {
      if (typeof err === 'object') setErrors(err);
      else setErrors({ non_field: 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Submit a Ticket</h2>
      {success && <div style={styles.successBanner}>✅ Ticket submitted successfully!</div>}
      <form onSubmit={handleSubmit}>
        <div style={styles.field}>
          <label style={styles.label}>Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            maxLength={200}
            required
            placeholder="Brief summary of the issue"
            style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
          />
          {errors.title && <span style={styles.error}>{errors.title}</span>}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            onBlur={handleDescriptionBlur}
            required
            rows={4}
            placeholder="Describe your issue in detail..."
            style={{ ...styles.input, resize: 'vertical', ...(errors.description ? styles.inputError : {}) }}
          />
          {errors.description && <span style={styles.error}>{errors.description}</span>}
          {classifying && (
            <div style={styles.classifyingBadge}>
              <span style={styles.spinner}>⏳</span> AI is analyzing your description...
            </div>
          )}
          {suggestion && (
            <div style={styles.suggestionBadge}>
              🤖 AI suggested: <strong>{suggestion.suggested_category}</strong> / <strong>{suggestion.suggested_priority}</strong> — feel free to override below
            </div>
          )}
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Category</label>
            <select name="category" value={form.category} onChange={handleChange} style={styles.select}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange} style={styles.select}>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={submitting} style={styles.submitBtn}>
          {submitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 8,
    padding: '24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    marginBottom: 24,
  },
  heading: { margin: '0 0 20px', color: '#1a1a2e', fontSize: 20 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#333' },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit',
  },
  inputError: { borderColor: '#e53e3e' },
  error: { color: '#e53e3e', fontSize: 12, marginTop: 4, display: 'block' },
  select: {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 6, fontSize: 14, background: '#fff',
  },
  row: { display: 'flex', gap: 16 },
  submitBtn: {
    background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6,
    padding: '12px 28px', fontSize: 15, cursor: 'pointer', fontWeight: 600,
    transition: 'background 0.2s',
  },
  successBanner: {
    background: '#f0fff4', border: '1px solid #68d391', color: '#276749',
    padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 14,
  },
  classifyingBadge: {
    marginTop: 8, fontSize: 13, color: '#6b46c1', padding: '6px 12px',
    background: '#faf5ff', borderRadius: 4, border: '1px solid #d6bcfa',
  },
  suggestionBadge: {
    marginTop: 8, fontSize: 13, color: '#2d6a4f', padding: '6px 12px',
    background: '#f0fff4', borderRadius: 4, border: '1px solid #68d391',
  },
  spinner: { display: 'inline-block' },
};
