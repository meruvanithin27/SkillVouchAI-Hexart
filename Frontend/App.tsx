import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Environment validation
const API_URL = import.meta.env.VITE_API_URL;
console.log("🔍 API URL:", API_URL);

if (!API_URL) {
  console.error("❌ Backend URL missing - VITE_API_URL is not defined!");
}

// Create axios instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

function App() {
  const [apiStatus, setApiStatus] = useState('loading');
  const [apiError, setApiError] = useState('');
  const [dbStatus, setDbStatus] = useState('loading');
  const [authStatus, setAuthStatus] = useState('loading');

  // Backend health check on load
  useEffect(() => {
    API.get("/api/health")
      .then(res => {
        console.log("Backend OK:", res.data);
        setApiStatus('ok');
        if (res.data.database === 'connected') {
          setDbStatus('ok');
        } else {
          setDbStatus('error');
        }
      })
      .catch(err => {
        console.error("Backend Failed:", err);
        setApiError(err.message);
        setApiStatus('error');
        setDbStatus('error');
      });
  }, []);

  // Check auth status
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthStatus('ok');
      console.log('🔐 JWT Token found - Auth system working');
    } else {
      setAuthStatus('pending');
      console.log('⚠️ No JWT Token - User not logged in');
    }
  }, []);

  if (!API_URL) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'red' }}>❌ Configuration Error</h1>
        <p>VITE_API_URL environment variable is not set!</p>
        <p>Please set it to: https://skillvouch-hexart-vv85.onrender.com</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>SkillVouch AI - Production Status</h1>
      
      {/* Status Panel */}
      <div style={{ 
        maxWidth: '600px', 
        margin: '20px auto', 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Production Status Panel</h2>
        
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', width: '150px' }}>Frontend:</span>
          <span style={{ color: '#28a745' }}>Connected ✅</span>
        </div>
        
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', width: '150px' }}>Backend:</span>
          <span style={{ color: apiStatus === 'ok' ? '#28a745' : '#dc3545' }}>
            {apiStatus === 'ok' ? 'Connected ✅' : apiStatus === 'loading' ? 'Loading...' : 'Failed ❌'}
          </span>
        </div>
        
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', width: '150px' }}>Database:</span>
          <span style={{ color: dbStatus === 'ok' ? '#28a745' : '#dc3545' }}>
            {dbStatus === 'ok' ? 'Connected ✅' : dbStatus === 'loading' ? 'Loading...' : 'Failed ❌'}
          </span>
        </div>
        
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', width: '150px' }}>Auth:</span>
          <span style={{ color: authStatus === 'ok' ? '#28a745' : '#ffc107' }}>
            {authStatus === 'ok' ? 'Ready ✅' : authStatus === 'loading' ? 'Loading...' : 'Not Logged In ⚠️'}
          </span>
        </div>
        
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', width: '150px' }}>Environment:</span>
          <span>Production</span>
        </div>
        
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', width: '150px' }}>API URL:</span>
          <span style={{ fontSize: '12px', wordBreak: 'break-all' }}>{API_URL}</span>
        </div>
      </div>

      {/* Error Display */}
      {apiError && (
        <div style={{ 
          maxWidth: '600px', 
          margin: '20px auto', 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px',
          color: '#721c24'
        }}>
          <strong>Error:</strong> {apiError}
        </div>
      )}

      {/* Auth Test Section */}
      <div style={{ 
        maxWidth: '600px', 
        margin: '20px auto', 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px'
      }}>
        <h3>Authentication Test</h3>
        <button 
          onClick={() => {
            API.post('/api/auth/signup', { email: 'test@example.com', password: 'password123' })
              .then(res => {
                console.log('Signup successful:', res.data);
                localStorage.setItem('authToken', res.data.token);
                setAuthStatus('ok');
                alert('Signup successful! Token saved.');
              })
              .catch(err => {
                console.error('Signup failed:', err);
                alert('Signup failed: ' + (err.response?.data?.error || err.message));
              });
          }}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Signup
        </button>
        
        <button 
          onClick={() => {
            localStorage.removeItem('authToken');
            setAuthStatus('pending');
            alert('Auth token cleared!');
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Auth
        </button>
      </div>
    </div>
  );
}

export default App;
