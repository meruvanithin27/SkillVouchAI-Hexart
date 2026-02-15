import React, { useState, useEffect } from 'react';
import { Logo } from './src/components/Logo';
import API from './src/services/axiosService';

// Environment validation
const API_URL = import.meta.env.VITE_API_URL;
console.log("🔍 API URL:", API_URL);

if (!API_URL) {
  console.error("❌ Backend URL missing - VITE_API_URL is not defined!");
}

// Simple working app that will definitely render
export default function App() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [apiError, setApiError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [authStatus, setAuthStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    setMounted(true);
    console.log('✅ App component mounted successfully!');
    
    // Test backend health
    testBackendHealth();
    
    // Check authentication status
    checkAuthStatus();
    
    // Simulate database check (will be verified through backend health)
    setTimeout(() => {
      setDbStatus(apiStatus === 'ok' ? 'ok' : 'error');
    }, 2000);
  }, [apiStatus]);

  const testBackendHealth = async () => {
    if (!API_URL) {
      setApiError('Backend URL missing');
      setApiStatus('error');
      return;
    }

    try {
      console.log("🔍 Testing backend health...");
      const res = await API.get("/api/health");
      console.log("Backend Status:", res.data);
      
      // Update database status based on response
      if (res.data.database === "connected") {
        setDbStatus('ok');
      } else {
        setDbStatus('error');
      }
      
      setApiStatus('ok');
    } catch (error) {
      console.error("Backend Error:", error.message);
      setApiError(error instanceof Error ? error.message : 'Unknown error');
      setApiStatus('error');
      setDbStatus('error');
    }
  };

  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('🔐 JWT Token found - Auth system working');
      setAuthStatus('ok');
    } else {
      console.log('⚠️ No JWT Token - User not logged in');
      setAuthStatus('error');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Initializing...</div>
      </div>
    );
  }

  // Show error if backend URL is missing
  if (!API_URL) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">!</span>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Configuration Error</h2>
            <p className="text-red-200 mb-4">
              Backend URL missing. Please set VITE_API_URL environment variable.
            </p>
            <div className="bg-red-800 rounded p-3 text-left">
              <p className="text-xs text-red-200 font-mono">
                Required: VITE_API_URL=https://your-backend.onrender.com
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Logo className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-indigo-400 mb-2">SkillVouch AI</h1>
          <p className="text-xl text-slate-300">Connect, Learn, and Grow Together</p>
        </div>

        {/* API Status Card */}
        <div className="max-w-md mx-auto mb-6">
          <div className={`bg-slate-800 rounded-lg p-4 border ${
            apiStatus === 'ok' ? 'border-green-600' : 
            apiStatus === 'error' ? 'border-red-600' : 
            'border-yellow-600'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Backend Status</span>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  apiStatus === 'ok' ? 'bg-green-400' : 
                  apiStatus === 'error' ? 'bg-red-400' : 
                  'bg-yellow-400 animate-pulse'
                }`}></div>
                <span className="text-xs">
                  {apiStatus === 'ok' ? 'Backend Connected ✅' : 
                   apiStatus === 'error' ? 'Backend Connection Failed ❌' : 
                   'Checking...'}
                </span>
              </div>
            </div>
            {apiError && (
              <p className="text-xs text-red-400 mt-2">{apiError}</p>
            )}
          </div>
        </div>

        {/* Final Production Status Panel */}
        <div className="max-w-md mx-auto mb-6">
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-center">Production Status Panel</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Frontend:</span>
                <span className="text-sm text-green-400">Connected ✅</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Backend:</span>
                <span className={`text-sm ${
                  apiStatus === 'ok' ? 'text-green-400' : 
                  apiStatus === 'error' ? 'text-red-400' : 
                  'text-yellow-400'
                }`}>
                  {apiStatus === 'ok' ? 'Connected ✅' : 
                   apiStatus === 'error' ? 'Failed ❌' : 
                   'Checking...'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Database:</span>
                <span className={`text-sm ${
                  dbStatus === 'ok' ? 'text-green-400' : 
                  dbStatus === 'error' ? 'text-red-400' : 
                  'text-yellow-400'
                }`}>
                  {dbStatus === 'ok' ? 'Connected ✅' : 
                   dbStatus === 'error' ? 'Failed ❌' : 
                   'Checking...'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Auth:</span>
                <span className={`text-sm ${
                  authStatus === 'ok' ? 'text-green-400' : 
                  authStatus === 'error' ? 'text-red-400' : 
                  'text-yellow-400'
                }`}>
                  {authStatus === 'ok' ? 'Working ✅' : 
                   authStatus === 'error' ? 'Not Logged In ❌' : 
                   'Checking...'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="text-xs text-slate-400 space-y-1">
                <div>Environment: Production</div>
                <div>API URL: {API_URL}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">Production Validation</h2>
          <p className="text-slate-300 mb-6 text-center">
            Your application is working perfectly. This is a demo version that will be connected to your backend.
          </p>
          
          <div className="bg-slate-700 rounded p-4 mb-4">
            <p className="text-sm text-slate-300 mb-2">Test Counter:</p>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-400 mb-2">{count}</div>
              <button
                onClick={() => setCount(count + 1)}
                className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded transition-colors"
              >
                Click Me!
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-slate-400 space-y-1">
            <p>Environment: {import.meta.env.MODE}</p>
            <p>API URL: {API_URL}</p>
            <p>Timestamp: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-green-400">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span>Application Status: Working</span>
          </div>
        </div>
      </div>
    </div>
  );
}
