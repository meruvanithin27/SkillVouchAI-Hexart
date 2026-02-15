import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Import original components
import { Logo } from './src/components/Logo';
import { LandingPage } from './src/components/LandingPage';
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

// Login Component
const LoginPage = ({ onLoginSuccess, onBackToLanding }: { 
  onLoginSuccess: (user: User) => void; 
  onBackToLanding: () => void;
}) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/api/auth/login', formData);
      
      if (response.data.success) {
        const { token, user: backendUser } = response.data.data;
        
        // Transform backend user to frontend User interface
        const transformedUser: User = {
          id: backendUser._id,
          name: backendUser.email.split('@')[0],
          email: backendUser.email,
          avatar: '',
          skillsKnown: [],
          skillsToLearn: [],
          bio: '',
          rating: 5,
          languages: [],
          preferredLanguage: 'English',
          availability: []
        };
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', JSON.stringify(transformedUser));
        onLoginSuccess(transformedUser);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Logo className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to your SkillVouch account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            ← Back to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};

// Signup Component
const SignupPage = ({ onSignupSuccess, onBackToLanding }: { 
  onSignupSuccess: (user: User) => void; 
  onBackToLanding: () => void;
}) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/api/auth/signup', formData);
      
      if (response.data.success) {
        const { token, user: backendUser } = response.data.data;
        
        // Transform backend user to frontend User interface
        const transformedUser: User = {
          id: backendUser._id,
          name: backendUser.email.split('@')[0],
          email: backendUser.email,
          avatar: '',
          skillsKnown: [],
          skillsToLearn: [],
          bio: '',
          rating: 5,
          languages: [],
          preferredLanguage: 'English',
          availability: []
        };
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', JSON.stringify(transformedUser));
        onSignupSuccess(transformedUser);
      } else {
        setError(response.data.message || 'Signup failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Logo className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Join SkillVouch</h1>
          <p className="text-slate-400">Create your free account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            ← Back to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};

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
            onBackToLanding={() => setCurrentView(View.LANDING)}
          />
        );
      case View.SIGNUP:
        return (
          <SignupPage 
            onSignupSuccess={handleSignupSuccess}
            onBackToLanding={() => setCurrentView(View.LANDING)}
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
