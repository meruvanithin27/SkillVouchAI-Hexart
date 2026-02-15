import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Import original components
import { Logo } from './src/components/Logo';
import { LandingPage } from './src/components/LandingPage';
import { LoginPage } from './src/components/LoginPage';
import { SignupPage } from './src/components/SignupPage';
import { Dashboard } from './src/components/Dashboard';
import { ChatBot } from './src/components/ChatBot';
import { RoadmapView } from './src/components/RoadmapView';
import { SkillList } from './src/components/SkillList';
import { QuizModal } from './src/components/QuizModal';
import { ProfileView } from './src/components/ProfileView';
import { Layout } from './src/components/Layout';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Import types
import { User, View } from './src/types';

// API Configuration - Preserve production fixes
const API_URL = import.meta.env.VITE_API_URL || 'https://skillvouch-hexart-vv85.onrender.com';

// Create centralized axios instance - Preserve production fixes
const API = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor - Preserve production fixes
API.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Preserve production fixes
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

// Loading fallback
const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white text-lg">Loading SkillVouch AI...</p>
    </div>
  </div>
);

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('authUser');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setCurrentView(View.DASHBOARD);
      } catch (err) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
    setMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
    setCurrentView(View.LANDING);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView(View.DASHBOARD);
  };

  const handleSignupSuccess = (signedUpUser: User) => {
    setUser(signedUpUser);
    setCurrentView(View.DASHBOARD);
  };

  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };

  const handleBackToLanding = () => {
    setCurrentView(View.LANDING);
  };

  if (!mounted || loading) {
    return <LoadingSpinner />;
  }

  // Render based on current view and auth state
  const renderCurrentView = () => {
    // If user is logged in, show dashboard with layout
    if (user) {
      switch (currentView) {
        case View.DASHBOARD:
          return (
            <Layout 
              currentView={currentView} 
              onNavigate={handleNavigate} 
              user={user} 
              onLogout={handleLogout}
            >
              <Dashboard user={user} />
            </Layout>
          );
        case View.PROFILE:
          return (
            <Layout 
              currentView={currentView} 
              onNavigate={handleNavigate} 
              user={user} 
              onLogout={handleLogout}
            >
              <ProfileView user={user} />
            </Layout>
          );
        case View.MY_SKILLS:
          return (
            <Layout 
              currentView={currentView} 
              onNavigate={handleNavigate} 
              user={user} 
              onLogout={handleLogout}
            >
              <SkillList user={user} />
            </Layout>
          );
        case View.ROADMAP:
          return (
            <Layout 
              currentView={currentView} 
              onNavigate={handleNavigate} 
              user={user} 
              onLogout={handleLogout}
            >
              <RoadmapView user={user} />
            </Layout>
          );
        default:
          return (
            <Layout 
              currentView={currentView} 
              onNavigate={handleNavigate} 
              user={user} 
              onLogout={handleLogout}
            >
              <Dashboard user={user} />
            </Layout>
          );
      }
    }

    // If not logged in, show appropriate view
    switch (currentView) {
      case View.LANDING:
        return <LandingPage onNavigate={handleNavigate} />;
      case View.LOGIN:
        return (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess}
            onBackToLanding={handleBackToLanding}
          />
        );
      case View.SIGNUP:
        return (
          <SignupPage 
            onSignupSuccess={handleSignupSuccess}
            onBackToLanding={handleBackToLanding}
          />
        );
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <ErrorBoundary>
      {renderCurrentView()}
    </ErrorBoundary>
  );
}

export default App;
