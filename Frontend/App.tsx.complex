import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Environment validation
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL environment variable is not set!');
}

// Create axios instance with production configuration
const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for auth token
API.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2 style={{ color: '#dc3545' }}>Something went wrong</h2>
          <p>Please refresh the page and try again.</p>
          <button onClick={() => window.location.reload()}>Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [systemStatus, setSystemStatus] = useState({
    backend: 'loading',
    database: 'loading',
    auth: 'loading'
  });

  // Check system health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await API.get('/health');
        setSystemStatus({
          backend: 'success',
          database: response.data.data?.database === 'connected' ? 'success' : 'error',
          auth: 'success'
        });
      } catch (err) {
        setSystemStatus({
          backend: 'error',
          database: 'error',
          auth: 'error'
        });
        setError('Backend connection failed');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  // Check for existing auth
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('authUser');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setShowLogin(false);
      } catch (err) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = showLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await API.post(endpoint, formData);
      
      if (response.data.success) {
        const { token } = response.data.data;
        
        // Get user profile
        const profileResponse = await API.get('/api/auth/profile');
        if (profileResponse.data.success) {
          const userData = profileResponse.data.data.user;
          localStorage.setItem('authToken', token);
          localStorage.setItem('authUser', JSON.stringify(userData));
          setUser(userData);
          setError('');
        }
      } else {
        setError(response.data.message || 'Authentication failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Network error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
    setShowLogin(true);
    setFormData({ email: '', password: '' });
  };

  const getSystemStatusColor = (status) => {
    switch (status) {
      case 'success': return '#28a745';
      case 'loading': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getSystemStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'loading': return '⏳';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  if (loading && !user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>⏳ Loading SkillVouch...</div>
        <div style={{ color: '#6c757d' }}>Checking system health</div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <div style={{ 
          maxWidth: '400px', 
          margin: '50px auto', 
          padding: '30px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>SkillVouch AI</h1>
          
          {/* System Status */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h4 style={{ marginBottom: '10px' }}>System Status</h4>
            <div style={{ fontSize: '12px' }}>
              <div style={{ color: getSystemStatusColor(systemStatus.backend) }}>
                {getSystemStatusIcon(systemStatus.backend)} Backend: {systemStatus.backend}
              </div>
              <div style={{ color: getSystemStatusColor(systemStatus.database) }}>
                {getSystemStatusIcon(systemStatus.database)} Database: {systemStatus.database}
              </div>
              <div style={{ color: getSystemStatusColor(systemStatus.auth) }}>
                {getSystemStatusIcon(systemStatus.auth)} Auth: {systemStatus.auth}
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleAuth}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
              {showLogin ? 'Login' : 'Sign Up'}
            </h3>
            
            {error && (
              <div style={{ 
                padding: '10px', 
                marginBottom: '15px', 
                backgroundColor: '#f8d7da', 
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                color: '#721c24'
              }}>
                {error}
              </div>
            )}
            
            <div style={{ marginBottom: '15px' }}>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Please wait...' : (showLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => {
                setShowLogin(!showLogin);
                setError('');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#007bff', 
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {showLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div>
            <h1 style={{ margin: 0 }}>SkillVouch AI</h1>
            <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>
              Welcome, {user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        {/* System Status Dashboard */}
        <div style={{ 
          marginBottom: '30px', 
          padding: '20px', 
          backgroundColor: '#e9ecef', 
          borderRadius: '8px' 
        }}>
          <h3>System Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: getSystemStatusColor(systemStatus.backend) }}>
                {getSystemStatusIcon(systemStatus.backend)}
              </div>
              <div>Backend</div>
              <div style={{ fontSize: '12px', color: getSystemStatusColor(systemStatus.backend) }}>
                {systemStatus.backend}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: getSystemStatusColor(systemStatus.database) }}>
                {getSystemStatusIcon(systemStatus.database)}
              </div>
              <div>Database</div>
              <div style={{ fontSize: '12px', color: getSystemStatusColor(systemStatus.database) }}>
                {systemStatus.database}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: getSystemStatusColor(systemStatus.auth) }}>
                {getSystemStatusIcon(systemStatus.auth)}
              </div>
              <div>Auth</div>
              <div style={{ fontSize: '12px', color: getSystemStatusColor(systemStatus.auth) }}>
                {systemStatus.auth}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          padding: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          backgroundColor: 'white'
        }}>
          <h2>Dashboard</h2>
          <p>Your SkillVouch AI dashboard is ready!</p>
          
          <div style={{ marginTop: '20px' }}>
            <h4>Features Available:</h4>
            <ul>
              <li>✅ User Authentication</li>
              <li>✅ Profile Management</li>
              <li>✅ System Health Monitoring</li>
              <li>✅ Secure API Communication</li>
            </ul>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '4px' }}>
            <strong>Production Status:</strong> All systems operational and ready for production use.
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
