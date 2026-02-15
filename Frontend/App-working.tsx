import React, { useState, useEffect } from 'react';
import { Logo } from './src/components/Logo';

// Simple working app that will definitely render
export default function App() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    console.log('✅ App component mounted successfully!');
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Initializing...</div>
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

        <div className="max-w-md mx-auto bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">Welcome!</h2>
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

          <div className="text-center text-sm text-slate-400">
            <p>Environment: {import.meta.env.MODE}</p>
            <p>API URL: {import.meta.env.VITE_API_URL || 'Not configured'}</p>
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
