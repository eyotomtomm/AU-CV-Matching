import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8f9fa',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="spinner"
            style={{ width: '48px', height: '48px', margin: '0 auto 16px' }}
          />
          <p style={{ color: '#6c757d', fontSize: '14px' }}>Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
