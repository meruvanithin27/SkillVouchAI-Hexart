import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, User, Shield, Zap, Star } from 'lucide-react';
import { Logo } from './Logo';
import axios from 'axios';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onBackToLanding: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://skillvouch-hexart-vv85.onrender.com';
const API = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToLanding }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/api/auth/login', formData);
      
      if (response.data.success) {
        const { token, user: backendUser } = response.data.data;
        
        const transformedUser = {
          id: backendUser._id,
          name: (backendUser.email || '').split('@')[0],
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden relative">
      {/* Enhanced Background with multiple gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20"></div>
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Enhanced Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={onBackToLanding}>
            <div className="relative">
              <Logo className="w-10 h-10 shadow-lg group-hover:shadow-indigo-500/50 transition-all duration-300" />
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-lg group-hover:bg-indigo-500/30 transition-all duration-300"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors duration-300">SkillVouch AI</span>
          </div>
          <button 
            onClick={onBackToLanding}
            className="flex items-center space-x-2 text-slate-300 hover:text-white font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </nav>

      {/* Enhanced Login Form Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 min-h-screen flex items-center">
        <div className="max-w-md mx-auto w-full px-6 relative z-10">
          {/* Main form container */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl blur-xl"></div>
            
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              {/* Enhanced Header */}
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur-lg opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-4">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  Welcome Back
                </h1>
                <p className="text-slate-400 text-lg">Sign in to continue your learning journey</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                  <p className="text-red-400 text-sm flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    {error}
                  </p>
                </div>
              )}

              {/* Enhanced Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-indigo-400" />
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      className={`relative w-full pl-12 pr-4 py-4 bg-slate-800/60 border ${focusedField === 'email' ? 'border-indigo-500/50' : 'border-slate-600/50'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                      placeholder="Enter your email address"
                      required
                    />
                    <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'email' ? 'text-indigo-400' : 'text-slate-400'}`} />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300 flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-indigo-400" />
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      className={`relative w-full pl-12 pr-12 py-4 bg-slate-800/60 border ${focusedField === 'password' ? 'border-indigo-500/50' : 'border-slate-600/50'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                      placeholder="Enter your password"
                      required
                    />
                    <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'password' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-indigo-400 transition-all duration-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-800 disabled:to-purple-800 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        <span>Sign In</span>
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Enhanced Footer Links */}
              <div className="mt-8 space-y-4">
                <div className="text-center">
                  <button 
                    onClick={onBackToLanding}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-all duration-300 hover:underline"
                  >
                    Don't have an account? Sign up for free
                  </button>
                </div>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={onBackToLanding}
                    className="text-xs text-slate-500 hover:text-slate-400 transition-colors duration-300 flex items-center mx-auto"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back to landing page
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Features */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center hover:bg-slate-900/60 transition-all duration-300 hover:scale-105">
              <div className="text-emerald-400 text-2xl mb-2">🔒</div>
              <div className="text-xs text-slate-300 font-medium">Secure</div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center hover:bg-slate-900/60 transition-all duration-300 hover:scale-105">
              <div className="text-indigo-400 text-2xl mb-2">⚡</div>
              <div className="text-xs text-slate-300 font-medium">Fast</div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center hover:bg-slate-900/60 transition-all duration-300 hover:scale-105">
              <div className="text-purple-400 text-2xl mb-2">🤖</div>
              <div className="text-xs text-slate-300 font-medium">AI-Powered</div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
              <div className="flex -space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
              <span className="text-sm text-slate-300 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-indigo-400" />
                Trusted by 10,000+ learners
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
