export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#111827', 
      color: 'white', 
      padding: '32px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '48px', 
        fontWeight: 'bold', 
        marginBottom: '32px',
        background: 'linear-gradient(to right, #60A5FA, #A78BFA)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: 'transparent'
      }}>
        Scanner Pro 🚀
      </h1>

      <div style={{ 
        backgroundColor: '#1F2937', 
        padding: '24px', 
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '24px', color: '#60A5FA', marginBottom: '16px' }}>
          ✅ Deployment Test
        </h2>
        <p style={{ marginBottom: '8px' }}>If you can see this with:</p>
        <ul style={{ marginLeft: '24px', lineHeight: '1.8' }}>
          <li>• Dark background ✓</li>
          <li>• Gradient title ✓</li>
          <li>• Styled boxes ✓</li>
        </ul>
        <p style={{ marginTop: '16px', color: '#10B981' }}>
          Then React is working, but Tailwind CSS is not loading!
        </p>
      </div>

      <div style={{ 
        backgroundColor: '#1F2937', 
        padding: '24px', 
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '20px', color: '#F59E0B', marginBottom: '12px' }}>
          🔍 Debugging Info
        </h3>
        <p>This page uses ONLY inline styles (no Tailwind).</p>
        <p>The production build should process CSS but seems to be failing.</p>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginTop: '32px' 
      }}>
        <button style={{ 
          backgroundColor: '#3B82F6', 
          color: 'white', 
          padding: '12px 24px', 
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px'
        }}>
          Mass Scanner
        </button>
        <button style={{ 
          backgroundColor: '#8B5CF6', 
          color: 'white', 
          padding: '12px 24px', 
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px'
        }}>
          AI Picks
        </button>
        <button style={{ 
          backgroundColor: '#10B981', 
          color: 'white', 
          padding: '12px 24px', 
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px'
        }}>
          ML Trading
        </button>
      </div>

      <div style={{ 
        marginTop: '48px',
        padding: '16px',
        backgroundColor: '#DC2626',
        borderRadius: '8px'
      }}>
        <p style={{ fontWeight: 'bold' }}>
          ⚠️ Tailwind CSS is NOT loading in production!
        </p>
        <p style={{ marginTop: '8px' }}>
          We need to fix the CSS build process.
        </p>
      </div>
    </div>
  );
}