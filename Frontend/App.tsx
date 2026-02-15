import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'https://skillvouch-hexart-vv85.onrender.com';

// Create axios instance
const API = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
API.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [systemStatus, setSystemStatus] = useState({
    backend: 'loading',
    database: 'loading'
  });

  // Check system health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await API.get('/health');
        if (response.data.success) {
          setSystemStatus({
            backend: 'success',
            database: response.data.data.databaseConnected ? 'success' : 'error'
          });
        }
      } catch (err) {
        setSystemStatus({ backend: 'error', database: 'error' });
        setError('Backend connection failed');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    
    // Periodically check database status
    const interval = setInterval(async () => {
      try {
        const response = await API.get('/api/test-db');
        if (response.data.success) {
          setSystemStatus(prev => ({
            ...prev,
            database: 'success'
          }));
        }
      } catch (err) {
        setSystemStatus(prev => ({
          ...prev,
          database: 'error'
        }));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Check for existing auth
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('authUser');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setIsLogin(false);
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
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
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
    setIsLogin(true);
    setFormData({ email: '', password: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#28a745';
      case 'loading': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
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
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>⏳ Loading SkillVouch...</div>
        <div style={{ color: '#6c757d' }}>Checking system health</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        maxWidth: '400px', 
        margin: '50px auto', 
        padding: '30px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>SkillVouch AI</h1>
        
        {/* System Status */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <h4 style={{ marginBottom: '10px' }}>System Status</h4>
          <div style={{ fontSize: '12px' }}>
            <div style={{ color: getStatusColor(systemStatus.backend), marginBottom: '5px' }}>
              {getStatusIcon(systemStatus.backend)} Backend: {systemStatus.backend}
            </div>
            <div style={{ color: getStatusColor(systemStatus.database) }}>
              {getStatusIcon(systemStatus.database)} Database: {systemStatus.database}
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuth}>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
            {isLogin ? 'Login' : 'Sign Up'}
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
                fontSize: '16px',
                boxSizing: 'border-box'
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
                fontSize: '16px',
                boxSizing: 'border-box'
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
              cursor: loading ? 'not-allowed' : 'pointer',
              boxSizing: 'border-box'
            }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#007bff', 
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px'
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: getStatusColor(systemStatus.backend) }}>
              {getStatusIcon(systemStatus.backend)}
            </div>
            <div>Backend</div>
            <div style={{ fontSize: '12px', color: getStatusColor(systemStatus.backend) }}>
              {systemStatus.backend}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: getStatusColor(systemStatus.database) }}>
              {getStatusIcon(systemStatus.database)}
            </div>
            <div>Database</div>
            <div style={{ fontSize: '12px', color: getStatusColor(systemStatus.database) }}>
              {systemStatus.database}
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
  );
}

export default App;
