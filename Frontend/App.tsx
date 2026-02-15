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

// Enhanced Landing Page with Authentication
const AuthenticatedLandingPage = () => {
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('authUser');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Transform backend user to frontend User interface
        const transformedUser: User = {
          id: parsedUser._id,
          name: parsedUser.email.split('@')[0], // Use email prefix as name
          email: parsedUser.email,
          avatar: '', // Default avatar
          skillsKnown: [],
          skillsToLearn: [],
          bio: '',
          rating: 5,
          languages: [],
          preferredLanguage: 'English',
          availability: []
        };
        setUser(transformedUser);
        setCurrentView(View.DASHBOARD);
      } catch (err) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await API.post(endpoint, formData);
      
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
        setUser(transformedUser);
        setCurrentView(View.DASHBOARD);
        setError('');
      } else {
        setError(response.data.message || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
    setCurrentView(View.LANDING);
    setFormData({ email: '', password: '' });
  };

  const renderCurrentView = () => {
    // If user is logged in, show the appropriate view
    if (user) {
      switch (currentView) {
        case View.DASHBOARD:
          return (
            <Layout user={user} onLogout={handleLogout}>
              <Dashboard user={user} />
            </Layout>
          );
        case View.PROFILE:
          return (
            <Layout user={user} onLogout={handleLogout}>
              <ProfileView user={user} />
            </Layout>
          );
        case View.MY_SKILLS:
          return (
            <Layout user={user} onLogout={handleLogout}>
              <SkillList user={user} />
            </Layout>
          );
        case View.ROADMAP:
          return (
            <Layout user={user} onLogout={handleLogout}>
              <RoadmapView user={user} />
            </Layout>
          );
        default:
          return (
            <Layout user={user} onLogout={handleLogout}>
              <Dashboard user={user} />
            </Layout>
          );
      }
    }

    // If not logged in, show landing page with auth
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView(View.LANDING)}>
              <Logo className="w-10 h-10 shadow-lg" />
              <span className="text-xl font-bold tracking-tight text-white">SkillVouch AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsLogin(true)}
                className="text-slate-300 hover:text-white font-medium transition-colors px-4 py-2"
              >
                Login
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25"
              >
                Sign Up
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section with Auth Form */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 md:w-96 md:h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-72 h-72 md:w-96 md:h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Column - Hero Content */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center space-x-2 bg-slate-900/50 border border-slate-700/50 rounded-full px-4 py-1.5 mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400 text-sm font-medium">Skill Exchange Platform</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                  Connect, Learn & 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> Grow Together</span>
                </h1>
                
                <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                  Join our AI-powered skill exchange community. Share your expertise, learn from others, and build meaningful connections.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <button 
                    onClick={() => setIsLogin(false)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2"
                  >
                    <span>Get Started</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Right Column - Auth Form */}
              <div className="max-w-md mx-auto md:mx-0">
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {isLogin ? 'Welcome Back' : 'Join SkillVouch'}
                    </h2>
                    <p className="text-slate-400">
                      {isLogin ? 'Sign in to your account' : 'Create your free account'}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] disabled:scale-100 shadow-lg"
                    >
                      {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                    >
                      {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      {renderCurrentView()}
    </ErrorBoundary>
  );
};

// Main App Component
function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingSpinner />;
  }

  return <AuthenticatedLandingPage />;
}

export default App;
