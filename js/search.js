// js/search.js - Client for /api/search with graceful offline fallback

export async function fetchLiveSearch(engine, params = {}) {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine,
        ...params
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data.results || [];
    }
  } catch {
    // Quiet fallback when offline
  }
  return [];
}
