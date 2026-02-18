const BASE = '/api/tickets';

export async function fetchTickets(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/${qs ? '?' + qs : ''}`);
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

export async function createTicket(data) {
  const res = await fetch(`${BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw err;
  }
  return res.json();
}

export async function updateTicket(id, data) {
  const res = await fetch(`${BASE}/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update ticket');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${BASE}/stats/`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function classifyTicket(description) {
  const res = await fetch(`${BASE}/classify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) return null; // graceful degradation
  return res.json();
}
