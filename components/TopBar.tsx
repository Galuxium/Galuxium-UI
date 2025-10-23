import React from 'react';

export default function TopBar() {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h1 style={{ margin: 0 }}>Galuxium</h1>
        <div style={{ fontSize: 12, color: '#666' }}>Aaditya Salgaonkar • Founder</div>
      </div>
      <div>
        <button style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #eee', background: '#fff' }}>New Chat</button>
      </div>
    </header>
  );
}
