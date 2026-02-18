import { useState, useEffect, useCallback } from 'react';
import { fetchTickets, updateTicket } from '../api/tickets';

const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed'];
const CATEGORIES = ['', 'billing', 'technical', 'account', 'general'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];

const STATUS_NEXT = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
  closed: 'open',
};

const PRIORITY_COLOR = {
  low: '#38a169',
  medium: '#d69e2e',
  high: '#dd6b20',
  critical: '#e53e3e',
};

const STATUS_COLOR = {
  open: '#4299e1',
  in_progress: '#805ad5',
  resolved: '#38a169',
  closed: '#718096',
};

export default function TicketList({ tickets, onUpdate }) {
  const [filters, setFilters] = useState({ category: '', priority: '', status: '', search: '' });
  const [allTickets, setAllTickets] = useState(tickets);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const searchRef = useState(null);

  useEffect(() => {
    setAllTickets(tickets);
  }, [tickets]);

  const loadTickets = useCallback(async (params) => {
    setLoading(true);
    try {
      const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
      const data = await fetchTickets(clean);
      setAllTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    loadTickets(updated);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const updated = { ...filters, search: searchInput };
    setFilters(updated);
    loadTickets(updated);
  };

  const handleStatusAdvance = async (ticket) => {
    const next = STATUS_NEXT[ticket.status];
    const updated = await updateTicket(ticket.id, { status: next });
    setAllTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    onUpdate();
  };

  const truncate = (str, n) => str.length > n ? str.slice(0, n) + '...' : str;
  const formatDate = (iso) => new Date(iso).toLocaleString();

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Tickets</h2>

      {/* Search + Filters */}
      <div style={styles.filtersRow}>
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <input
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search title or description..."
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchBtn}>Search</button>
        </form>

        <select value={filters.category} onChange={e => handleFilterChange('category', e.target.value)} style={styles.filterSelect}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All Categories'}</option>)}
        </select>

        <select value={filters.priority} onChange={e => handleFilterChange('priority', e.target.value)} style={styles.filterSelect}>
          {PRIORITIES.map(p => <option key={p} value={p}>{p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All Priorities'}</option>)}
        </select>

        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} style={styles.filterSelect}>
          {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Statuses'}</option>)}
        </select>
      </div>

      {loading && <div style={styles.loadingMsg}>Loading...</div>}

      {!loading && allTickets.length === 0 && (
        <div style={styles.emptyMsg}>No tickets found.</div>
      )}

      <div style={styles.list}>
        {allTickets.map(ticket => (
          <div key={ticket.id} style={styles.ticketCard}>
            <div style={styles.ticketHeader}>
              <span style={styles.ticketTitle}>{ticket.title}</span>
              <div style={styles.badgeRow}>
                <span style={{ ...styles.badge, background: PRIORITY_COLOR[ticket.priority] }}>
                  {ticket.priority}
                </span>
                <span style={{ ...styles.badge, background: STATUS_COLOR[ticket.status] }}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span style={{ ...styles.badge, background: '#718096' }}>
                  {ticket.category}
                </span>
              </div>
            </div>
            <p style={styles.description}>{truncate(ticket.description, 140)}</p>
            <div style={styles.ticketFooter}>
              <span style={styles.timestamp}>{formatDate(ticket.created_at)}</span>
              {ticket.status !== 'closed' && (
                <button
                  onClick={() => handleStatusAdvance(ticket)}
                  style={styles.advanceBtn}
                >
                  → Mark as {STATUS_NEXT[ticket.status].replace('_', ' ')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  heading: { margin: '0 0 20px', color: '#1a1a2e', fontSize: 20 },
  filtersRow: { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  searchForm: { display: 'flex', gap: 6, flex: '1 1 220px' },
  searchInput: { flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 },
  searchBtn: { padding: '8px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  filterSelect: { padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, background: '#fff' },
  loadingMsg: { color: '#718096', padding: '16px 0', textAlign: 'center' },
  emptyMsg: { color: '#a0aec0', padding: '32px 0', textAlign: 'center' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  ticketCard: {
    border: '1px solid #e2e8f0', borderRadius: 8, padding: 16,
    transition: 'box-shadow 0.15s',
  },
  ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  ticketTitle: { fontWeight: 700, fontSize: 15, color: '#2d3748', flex: 1 },
  badgeRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  badge: {
    color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px',
    borderRadius: 12, textTransform: 'uppercase', letterSpacing: 0.4,
  },
  description: { margin: '10px 0 12px', color: '#555', fontSize: 13, lineHeight: 1.5 },
  ticketFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  timestamp: { fontSize: 12, color: '#a0aec0' },
  advanceBtn: {
    fontSize: 12, padding: '4px 12px', background: 'transparent',
    border: '1px solid #4f46e5', color: '#4f46e5', borderRadius: 4, cursor: 'pointer',
  },
};
