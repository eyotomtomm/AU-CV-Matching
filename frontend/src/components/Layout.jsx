import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import auLogo from '../assets/31823-img-au_logo.jpg';

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
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
            <img
              src={auLogo}
              alt="African Union"
              style={{
                height: '40px',
                borderRadius: '6px',
                background: 'white',
                padding: '2px',
              }}
            />
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>CV Matching System</h1>
              <p style={{ fontSize: '12px', opacity: 0.9, margin: 0 }}>African Union Commission</p>
            </div>
          </Link>

          <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

            {user && (
              <>
                <div style={{
                  width: '1px',
                  height: '24px',
                  background: 'rgba(255,255,255,0.3)',
                  margin: '0 4px',
                }} />
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  opacity: 0.9,
                  padding: '0 8px',
                }}>
                  <User size={14} />
                  {user.full_name || user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            )}
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
