import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Layout } from './src/components/Layout';
import { View, User } from './src/types';
import { INITIAL_USER } from './src/constants';
import { dbService } from './src/services/dbService';
import { Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from './src/components/Logo';
import { ChatBot } from './src/components/ChatBot';

const Dashboard = lazy(() => import('./src/components/Dashboard').then(module => ({ default: module.Dashboard })));
const SkillList = lazy(() => import('./src/components/SkillList').then(module => ({ default: module.SkillList })));
const MatchFinder = lazy(() => import('./src/components/MatchFinder').then(module => ({ default: module.MatchFinder })));
const RoadmapView = lazy(() => import('./src/components/RoadmapView').then(module => ({ default: module.RoadmapView })));
const ChatView = lazy(() => import('./src/components/ChatView').then(module => ({ default: module.ChatView })));
const LandingPage = lazy(() => import('./src/components/LandingPage').then(module => ({ default: module.LandingPage })));
const ProfileView = lazy(() => import('./src/components/ProfileView').then(module => ({ default: module.ProfileView })));
export function generateUUID(): string {
  // Use native if available
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    return (crypto as any).randomUUID();
  }

  // Use getRandomValues (RFC4122 v4) if available
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(16);
    (crypto as any).getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0,4).join('')}-${hex.slice(4,6).join('')}-${hex.slice(6,8).join('')}-${hex.slice(8,10).join('')}-${hex.slice(10,16).join('')}`;
  }

  // Fallback (not cryptographically secure)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function App() {
  // Default to LANDING view unless session exists
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  
  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success'} | null>(null);

  // Navigation State params
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | undefined>(undefined);

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Session Check Logic
  useEffect(() => {
    const checkSession = async () => {
        const sessionUser = dbService.getCurrentSession();
        if (sessionUser) {
            // Validate against DB to get fresh data
            const freshUser = await dbService.getUserById(sessionUser.id);
            if (freshUser) {
                setUser(freshUser);
                if (currentView === View.LANDING || currentView === View.LOGIN || currentView === View.SIGNUP) {
                    setCurrentView(View.DASHBOARD);
                }
            } else {
                // Session invalid (user deleted?)
                dbService.logout();
                setUser(INITIAL_USER);
            }
        }
        setLoadingSession(false);
    };
    checkSession();
  }, [currentView]);

  // Poll for unread messages count
  useEffect(() => {
    let interval: any;
    if (user.id !== 'temp') {
        const fetchUnread = async () => {
             try {
                 const count = await dbService.getUnreadCount(user.id);
                 setUnreadCount(count);
             } catch (error) {
                 console.error('Failed to fetch unread count:', error);
             }
        };
        fetchUnread();
        
        interval = setInterval(fetchUnread, 5000); // Reduced frequency from 3s to 5s
    }
    return () => clearInterval(interval);
  }, [user.id]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleLogout = async () => {
    await dbService.logout();
    setUser(INITIAL_USER);
    setEmail('');
    setPassword('');
    setCurrentView(View.LANDING);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    
    try {
      console.log('🔐 Starting login process for:', email);
      
      const loggedInUser = await dbService.login(email.trim(), password);
      setUser(loggedInUser);
      setCurrentView(View.DASHBOARD);
      setNotification({ message: `Welcome back, ${loggedInUser.name.split(' ')[0]}!`, type: 'success' });
      
      console.log('✅ Login successful for:', email);
      
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      setAuthError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    // JavaScript validation instead of HTML patterns
    if (!fullName || !email || !password || !confirmPassword) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    if (fullName.trim().length < 2) {
      setAuthError('Full name must be at least 2 characters long.');
      return;
    }

    if (!validateEmail(email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
    }

    setIsSubmitting(true);
    try {
      console.log('🚀 Starting signup process for:', email);
      
      // Create account but do NOT auto-login
      await dbService.signup(fullName.trim(), email.trim(), password);
      
      console.log('✅ Signup successful for:', email);
      
      // Redirect to Login view
      setCurrentView(View.LOGIN);
      setNotification({ message: 'Account created successfully! Please log in.', type: 'success' });
      
      // Clear form
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
    } catch (err: any) {
      console.error('❌ Signup failed:', err);
      const errorMessage = err.message || 'Signup failed. Please try again.';
      setAuthError(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  // Custom navigation handler to support passing params (like chat user id)
  const navigateToView = (view: View, params?: any) => {
      if (view !== View.MESSAGES) {
          setSelectedChatUserId(undefined);
      }
      setCurrentView(view);
  };

  const renderView = () => {
    if (loadingSession) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    switch (currentView) {
      case View.DASHBOARD:
        return (
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div></div>}>
                <Dashboard 
                    user={user} 
                    onNavigateToProfile={(userId) => {
                        setSelectedChatUserId(userId);
                        setCurrentView(View.MESSAGES);
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