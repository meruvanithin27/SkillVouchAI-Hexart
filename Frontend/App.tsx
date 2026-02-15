import React, { useState, useEffect, Suspense, lazy } from 'react';
import { View, User } from './src/types';
import { INITIAL_USER } from './src/constants';
import { dbService } from './src/services/dbService';
import { Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, WifiOff } from 'lucide-react';
import { Logo } from './src/components/Logo';
import { ChatBot } from './src/components/ChatBot';

// Loading fallback component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white text-lg">Loading SkillVouch AI...</p>
    </div>
  </div>
);

// Simple landing page component as fallback
const SimpleLanding = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert(`${isLogin ? 'Login' : 'Signup'} functionality will be connected to backend`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Logo className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">SkillVouch AI</h1>
          <p className="text-slate-400">Connect, Learn, and Grow</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-8 p-4 bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 text-center">
            Demo Mode: Full functionality will be available after backend connection
          </p>
        </div>
      </div>
    </div>
  );
};

// Lazy loaded components (with error boundaries)
const Dashboard = lazy(() => import('./src/components/Dashboard').catch(() => ({ default: SimpleLanding })));
const SkillList = lazy(() => import('./src/components/SkillList').catch(() => ({ default: SimpleLanding })));
const MatchFinder = lazy(() => import('./src/components/MatchFinder').catch(() => ({ default: SimpleLanding })));
const RoadmapView = lazy(() => import('./src/components/RoadmapView').catch(() => ({ default: SimpleLanding })));
const ChatView = lazy(() => import('./src/components/ChatView').catch(() => ({ default: SimpleLanding })));
const LandingPage = lazy(() => import('./src/components/LandingPage').catch(() => ({ default: SimpleLanding })));
const ProfileView = lazy(() => import('./src/components/ProfileView').catch(() => ({ default: SimpleLanding })));

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    return (crypto as any).randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Simplified session check
  useEffect(() => {
    try {
      const sessionUser = dbService.getCurrentSession();
      if (sessionUser && sessionUser.id !== 'temp') {
        setUser(sessionUser);
        setCurrentView(View.DASHBOARD);
      }
    } catch (error) {
      console.warn('Session check failed, using default state:', error);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  // Error boundary fallback
  if (hasError) {
                    }}
                    onNavigate={navigateToView}
                />
            </Suspense>
        );
      case View.MY_SKILLS:
        return (
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div></div>}>
                <SkillList user={user} onUpdateUser={handleUpdateUser} />
            </Suspense>
        );
      case View.FIND_PEERS:
        return (
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div></div>}>
                <MatchFinder 
                    currentUser={user} 
                    onMessageUser={(userId) => {
                        setSelectedChatUserId(userId);
                        setCurrentView(View.MESSAGES);
                    }}
                />
            </Suspense>
        );
      case View.ROADMAP:
        return (
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div></div>}>
                <RoadmapView />
            </Suspense>
        );
      case View.MESSAGES:
        return (
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div></div>}>
                <ChatView currentUser={user} initialChatUserId={selectedChatUserId} />
            </Suspense>
        );
      case View.PROFILE:
        return (
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div></div>}>
                <ProfileView user={user} onUpdateUser={handleUpdateUser} />
            </Suspense>
        );
      default:
        return (
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div></div>}>
                <Dashboard user={user} onNavigateToProfile={() => {}} onNavigate={navigateToView} />
            </Suspense>
        );
    }
  };

  const NotificationToast = () => (
    notification ? (
        <div className="fixed top-6 right-6 z-[100] animate-[slideIn_0.3s_ease-out]">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-500 backdrop-blur-md bg-opacity-95">
             <div className="bg-white/20 p-1.5 rounded-full">
               <CheckCircle2 className="w-5 h-5" /> 
             </div>
             <p className="font-semibold text-sm">{notification.message}</p>
          </div>
        </div>
    ) : null
  );

  // Unauthenticated Views (Landing, Login, Signup)
  if (currentView === View.LANDING && !loadingSession) {
      return (
          <>
            <NotificationToast />
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div></div>}>
                <LandingPage onNavigate={setCurrentView} />
            </Suspense>
          </>
      );
  }

  if (currentView === View.LOGIN && !loadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

        <NotificationToast />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10 animate-fade-in">
           {/* Back Button for Login */}
          <button onClick={() => setCurrentView(View.LANDING)} className="text-slate-500 hover:text-white mb-4 text-sm flex items-center">
            ← Back to Home
          </button>

          <div className="flex flex-col items-center justify-center mb-6 text-indigo-500">
            <Logo className="w-24 h-24 mb-2 shadow-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-center text-white mb-2">SkillVouch AI</h1>
          <p className="text-center text-slate-400 mb-8">Connect • Learn • Grow</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {authError && (
              <div className="flex items-center text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mr-2" />
                {authError}
              </div>
            )}

            <button disabled={isSubmitting} type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500">
              Don't have an account?{' '}
              <button onClick={() => { setAuthError(''); setCurrentView(View.SIGNUP); }} className="text-indigo-400 hover:text-indigo-300 font-medium">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === View.SIGNUP && !loadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <NotificationToast />
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10 animate-fade-in">
          {/* Back Button for Signup */}
          <button onClick={() => setCurrentView(View.LANDING)} className="text-slate-500 hover:text-white mb-4 text-sm flex items-center">
            ← Back to Home
          </button>

          <div className="flex flex-col items-center justify-center mb-6 text-indigo-500">
             <Logo className="w-20 h-20 mb-2 shadow-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-center text-white mb-2">Create Account</h1>
          <p className="text-center text-slate-400 mb-8">Join the community of learners.</p>
          
          <form onSubmit={handleSignup} className="space-y-4">
             <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Full Name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            
            {/* Removed Location Field */}

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            
            {/* Added Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {authError && (
              <div className="flex items-center text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mr-2" />
                {authError}
              </div>
            )}

            <button disabled={isSubmitting} type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
              {isSubmitting ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500">
              Already have an account?{' '}
              <button onClick={() => { setAuthError(''); setCurrentView(View.LOGIN); }} className="text-indigo-400 hover:text-indigo-300 font-medium">
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <NotificationToast />
    <Layout 
      currentView={currentView} 
      onNavigate={navigateToView} 
      user={user}
      onLogout={handleLogout}
      unreadCount={unreadCount}
    >
      {renderView()}
    </Layout>
    <ChatBot isOpen={isChatBotOpen} onToggle={() => setIsChatBotOpen(!isChatBotOpen)} />
    </>
  );
}