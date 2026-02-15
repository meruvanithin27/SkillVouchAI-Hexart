import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Import original components
import { Logo } from './src/components/Logo';
import { LandingPage } from './src/components/LandingPage';
import { AuthLayout } from './src/components/AuthLayout';
import { PremiumLoginPage } from './src/components/PremiumLoginPage';
import { PremiumSignupPage } from './src/components/PremiumSignupPage';
import { Dashboard } from './src/components/Dashboard';
import { ChatBot } from './src/components/ChatBot';
import { RoadmapView } from './src/components/RoadmapView';
import { SkillList } from './src/components/SkillList';
import { QuizModal } from './src/components/QuizModal';
import { ProfileView } from './src/components/ProfileView';
import { Layout } from './src/components/Layout';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { apiService } from './src/services/apiService';

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

  // Check for existing auth on mount and sync with backend
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('authUser');
      
      if (token && userData) {
        try {
          // First load from localStorage for immediate UI
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setCurrentView(View.DASHBOARD);
          
          // Then fetch fresh data from backend to sync skills
          try {
            console.log('🔄 Syncing user data with backend...');
            const freshUserData = await apiService.getProfile();
            
            // Transform backend user data to frontend format
            const transformedUser = {
              id: freshUserData._id,
              name: freshUserData.name || freshUserData.email.split('@')[0],
              email: freshUserData.email,
              avatar: freshUserData.avatar || '',
              skillsKnown: freshUserData.skillsKnown || [],
              skillsToLearn: freshUserData.skillsToLearn || [],
              bio: freshUserData.bio || '',
              rating: freshUserData.rating || 5,
              languages: freshUserData.languages || [],
              preferredLanguage: freshUserData.preferredLanguage || 'English',
              availability: freshUserData.availability || []
            };
            
            // Update local state and storage with fresh data
            setUser(transformedUser);
            localStorage.setItem('authUser', JSON.stringify(transformedUser));
            console.log('✅ User data synced with backend');
            
          } catch (syncError) {
            console.warn('⚠️ Failed to sync with backend, using cached data:', syncError);
            // Continue with cached data - better than logging out user
          }
          
        } catch (err) {
          console.error('❌ Failed to parse cached user data:', err);
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        }
      }
      setLoading(false);
      setMounted(true);
    };

    initializeAuth();
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
              <Dashboard 
                user={user} 
                onNavigateToProfile={() => handleNavigate(View.PROFILE)} 
                onNavigate={handleNavigate} 
              />
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
              <SkillList user={user} onUpdateUser={setUser} />
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
          <AuthLayout 
            title="SkillVouch AI"
            subtitle="Connect • Learn • Grow"
            onBackToHome={handleBackToLanding}
          >
            <PremiumLoginPage 
              onLoginSuccess={handleLoginSuccess}
              onBackToHome={handleBackToLanding}
            />
          </AuthLayout>
        );
      case View.SIGNUP:
        return (
          <AuthLayout 
            title="SkillVouch AI"
            subtitle="Connect • Learn • Grow"
            onBackToHome={handleBackToLanding}
          >
            <PremiumSignupPage 
              onSignupSuccess={handleSignupSuccess}
              onBackToHome={handleBackToLanding}
            />
          </AuthLayout>
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
