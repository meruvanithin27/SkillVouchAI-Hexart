import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';

// Simple test component to verify React works
const TestApp = () => {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-indigo-400">SkillVouch AI</h1>
        <p className="text-xl mb-6">Application is working!</p>
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="mb-4">Test Counter: {count}</p>
          <button 
            onClick={() => setCount(count + 1)}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded transition-colors"
          >
            Increment
          </button>
        </div>
        <div className="mt-6 text-sm text-slate-400">
          <p>Environment: {import.meta.env.MODE}</p>
          <p>API URL: {import.meta.env.VITE_API_URL || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
};

// Environment validation
console.log('🔍 Simple App Environment Check:');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('NODE_ENV:', import.meta.env.NODE_ENV || 'development');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);

console.log('✅ Simple app mounted successfully!');
