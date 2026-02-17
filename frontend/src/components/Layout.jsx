import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, FileText, Settings } from 'lucide-react';

function Layout({ children }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #009639 0%, #007a2e 100%)',
        color: 'white',
        padding: '16px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div className="container flex-between">
          <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#FCDD09',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#009639',
              fontSize: '18px'
            }}>
              AU
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>CV Matching System</h1>
              <p style={{ fontSize: '12px', opacity: 0.9, margin: 0 }}>African Union Commission</p>
            </div>
          </Link>

          <nav style={{ display: 'flex', gap: '8px' }}>
            <Link
              to="/"
              className={`btn ${isActive('/') && location.pathname === '/' ? 'btn-secondary' : ''}`}
              style={{
                background: isActive('/') && location.pathname === '/' ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white'
              }}
            >
              <Home size={18} />
              Dashboard
            </Link>
            <Link
              to="/jobs/new"
              className="btn"
              style={{
                background: isActive('/jobs/new') ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white'
              }}
            >
              <Briefcase size={18} />
              New Job
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px 0' }}>
        <div className="container">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: '#1a1a2e',
        color: 'white',
        padding: '20px 0',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        <div className="container">
          <p style={{ opacity: 0.8 }}>
            African Union Commission - Human Resources Management Directorate
          </p>
          <p style={{ opacity: 0.6, fontSize: '12px', marginTop: '8px' }}>
            AI-Supported CV Matching Tool - Talent Acquisition Unit
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
