import { useState, useEffect } from 'react';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';
import StatsDashboard from './components/StatsDashboard';
import { fetchTickets } from './api/tickets';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [statsRefresh, setStatsRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    fetchTickets().then(setTickets).catch(console.error);
  }, []);

  const handleTicketCreated = (newTicket) => {
    setTickets(prev => [newTicket, ...prev]);
    setStatsRefresh(n => n + 1);
    setActiveTab('list');
  };

  const handleUpdate = () => {
    setStatsRefresh(n => n + 1);
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>🎫 SupportDesk</span>
          <nav style={styles.nav}>
            <button
              onClick={() => setActiveTab('submit')}
              style={{ ...styles.navBtn, ...(activeTab === 'submit' ? styles.navBtnActive : {}) }}
            >
              Submit Ticket
            </button>
            <button
              onClick={() => setActiveTab('list')}
              style={{ ...styles.navBtn, ...(activeTab === 'list' ? styles.navBtnActive : {}) }}
            >
              Tickets
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              style={{ ...styles.navBtn, ...(activeTab === 'stats' ? styles.navBtnActive : {}) }}
            >
              Dashboard
            </button>
          </nav>
        </div>
      </header>

      <main style={styles.main}>
        {activeTab === 'submit' && (
          <TicketForm onTicketCreated={handleTicketCreated} />
        )}
        {activeTab === 'list' && (
          <TicketList tickets={tickets} onUpdate={handleUpdate} />
        )}
        {activeTab === 'stats' && (
          <StatsDashboard refreshTrigger={statsRefresh} />
        )}
      </main>
    </div>
  );
}

const styles = {
  app: { minHeight: '100vh', background: '#f0f2f5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  header: { background: '#1a1a2e', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 56 },
  logo: { color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: -0.3 },
  nav: { display: 'flex', gap: 4 },
  navBtn: {
    background: 'transparent', color: '#cbd5e0', border: 'none', cursor: 'pointer',
    padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
  },
  navBtnActive: { background: '#4f46e5', color: '#fff' },
  main: { maxWidth: 960, margin: '32px auto', padding: '0 24px' },
};
