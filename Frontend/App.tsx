import React, { useState, useEffect } from 'react';
import { Logo } from './src/components/Logo';

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

  useEffect(() => {
    setMounted(true);
    console.log('✅ App component mounted successfully!');
    
    // Test backend health
    testBackendHealth();
  }, []);

  const testBackendHealth = async () => {
    if (!API_URL) {
      setApiError('Backend URL missing');
      setApiStatus('error');
      return;
    }

    try {
      console.log("🔍 Testing backend health...");
      const response = await fetch(`${API_URL}/api/health`);
      const data = await response.json();
      console.log("✅ Backend Health:", data);
      setApiStatus('ok');
    } catch (error) {
      console.error("❌ Backend health check failed:", error);
      setApiError(error instanceof Error ? error.message : 'Unknown error');
      setApiStatus('error');
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
                <span className="text-xs capitalize">{apiStatus}</span>
              </div>
            </div>
            {apiError && (
              <p className="text-xs text-red-400 mt-2">{apiError}</p>
            )}
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
