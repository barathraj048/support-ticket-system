import { useEffect, useState } from 'react';
import { fetchStats } from '../api/tickets';

const PRIORITY_COLOR = {
  low: '#38a169', medium: '#d69e2e', high: '#dd6b20', critical: '#e53e3e',
};
const CATEGORY_COLOR = {
  billing: '#4299e1', technical: '#805ad5', account: '#dd6b20', general: '#718096',
};

export default function StatsDashboard({ refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setError('Could not load stats'));
  }, [refreshTrigger]);

  if (error) return <div style={styles.error}>{error}</div>;
  if (!stats) return <div style={styles.loading}>Loading stats...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📊 Dashboard</h2>

      <div style={styles.topCards}>
        <StatCard label="Total Tickets" value={stats.total_tickets} color="#4f46e5" />
        <StatCard label="Open Tickets" value={stats.open_tickets} color="#4299e1" />
        <StatCard label="Avg / Day" value={stats.avg_tickets_per_day} color="#805ad5" />
      </div>

      <div style={styles.breakdowns}>
        <BreakdownSection
          title="By Priority"
          data={stats.priority_breakdown}
          colorMap={PRIORITY_COLOR}
          total={stats.total_tickets}
        />
        <BreakdownSection
          title="By Category"
          data={stats.category_breakdown}
          colorMap={CATEGORY_COLOR}
          total={stats.total_tickets}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function BreakdownSection({ title, data, colorMap, total }) {
  return (
    <div style={styles.breakdownCard}>
      <h3 style={styles.breakdownTitle}>{title}</h3>
      {Object.entries(data).map(([key, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key} style={styles.barRow}>
            <span style={styles.barLabel}>{key}</span>
            <div style={styles.barTrack}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${pct}%`,
                  background: colorMap[key] || '#718096',
                }}
              />
            </div>
            <span style={styles.barCount}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: { background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', marginBottom: 24 },
  heading: { margin: '0 0 20px', color: '#1a1a2e', fontSize: 20 },
  topCards: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  statCard: {
    flex: '1 1 120px', background: '#f8f9fa', borderRadius: 8,
    padding: '16px 20px', textAlign: 'center',
  },
  statValue: { fontSize: 32, fontWeight: 800 },
  statLabel: { fontSize: 13, color: '#718096', marginTop: 4 },
  breakdowns: { display: 'flex', gap: 20, flexWrap: 'wrap' },
  breakdownCard: { flex: '1 1 240px', background: '#f8f9fa', borderRadius: 8, padding: '16px 20px' },
  breakdownTitle: { margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#2d3748', textTransform: 'uppercase', letterSpacing: 0.5 },
  barRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  barLabel: { width: 70, fontSize: 12, color: '#555', textTransform: 'capitalize' },
  barTrack: { flex: 1, height: 10, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99, transition: 'width 0.4s ease', minWidth: 4 },
  barCount: { width: 24, textAlign: 'right', fontSize: 12, color: '#718096', fontWeight: 700 },
  loading: { padding: 24, color: '#a0aec0', textAlign: 'center' },
  error: { padding: 24, color: '#e53e3e', textAlign: 'center' },
};
