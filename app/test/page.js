'use client';

export default function TestPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: 'white', 
      padding: '2rem' 
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Test Page - Checking if Basic React Works
      </h1>
      
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '1.5rem', 
        borderRadius: '0.5rem',
        marginBottom: '1rem' 
      }}>
        <h2 style={{ fontSize: '1.5rem', color: '#60a5fa', marginBottom: '1rem' }}>
          ✅ If you can see this, React is working!
        </h2>
        <p>This is a minimal test page with inline styles.</p>
      </div>

      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '1.5rem', 
        borderRadius: '0.5rem' 
      }}>
        <h3 style={{ color: '#a78bfa', marginBottom: '0.5rem' }}>Debug Info:</h3>
        <ul>
          <li>Page renders: ✅</li>
          <li>Inline styles work: ✅</li>
          <li>Client component works: ✅</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <a 
          href="/" 
          style={{ 
            color: '#60a5fa', 
            textDecoration: 'underline' 
          }}
        >
          ← Back to main app
        </a>
      </div>
    </div>
  );
}