import { useEffect, useState } from 'react';

export default function App() {
  const [status, setStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

  useEffect(() => {
    // In dev, Vite proxies /api to backend. In prod Docker, call backend directly
    const apiUrl = import.meta.env.DEV ? '/api/health' : 'http://localhost:3000/health';

    fetch(apiUrl)
      .then((r) => r.json())
      .then((d) => setStatus(d.ok ? 'ok' : 'fail'))
      .catch(() => setStatus('fail'));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Nirby</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}
