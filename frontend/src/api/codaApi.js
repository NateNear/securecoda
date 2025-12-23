const API_BASE = '/api';

export async function fetchAlerts() {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function remediate(docId) {
  const res = await fetch(`${API_BASE}/remediate/${docId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to remediate');
  return res.json();
}
