import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './src/components/ErrorBoundary';
import './src/index.css';

// Environment validation
console.log('🔍 Environment Check:');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('NODE_ENV:', import.meta.env.NODE_ENV || 'development');

if (!import.meta.env.VITE_API_URL) {
  console.error('❌ VITE_API_URL is not defined!');
  console.error('Please set VITE_API_URL in your environment variables');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Add loaded class to root element after app mounts
setTimeout(() => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.classList.add('loaded');
  }
}, 100);

console.log('✅ Application mounted successfully!');