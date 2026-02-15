import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, User, CheckCircle, Shield, Zap, Star } from 'lucide-react';
import { Logo } from './Logo';
import axios from 'axios';

interface SignupPageProps {
  onSignupSuccess: (user: any) => void;
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

export const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess, onBackToLanding }) => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await API.post('/api/auth/signup', { 
        email: formData.email, 
        password: formData.password 
      });
      
      if (response.data.success) {
        const { token, user: backendUser } = response.data.data;
        
        const transformedUser = {
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

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { color: 'text-red-400', text: 'Weak' };
    if (password.length < 10) return { color: 'text-yellow-400', text: 'Medium' };
    return { color: 'text-emerald-400', text: 'Strong' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden relative">
      {/* Enhanced Background with multiple gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-900/20 via-indigo-900/20 to-purple-900/20"></div>
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-indigo-600/20 to-emerald-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
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
              <Logo className="w-10 h-10 shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-300" />
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg group-hover:bg-emerald-500/30 transition-all duration-300"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors duration-300">SkillVouch AI</span>
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

      {/* Enhanced Signup Form Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 min-h-screen flex items-center">
        <div className="max-w-md mx-auto w-full px-6 relative z-10">
          {/* Main form container */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-3xl blur-xl"></div>
            
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              {/* Enhanced Header */}
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-full blur-lg opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-full p-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                  Join SkillVouch
                </h1>
                <p className="text-slate-400 text-lg">Create your free account and start learning</p>
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

              {/* Enhanced Signup Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-emerald-400" />
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      className={`relative w-full pl-12 pr-4 py-4 bg-slate-800/60 border ${focusedField === 'email' ? 'border-emerald-500/50' : 'border-slate-600/50'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                      placeholder="Enter your email address"
                      required
                    />
                    <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'email' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300 flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-emerald-400" />
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      className={`relative w-full pl-12 pr-12 py-4 bg-slate-800/60 border ${focusedField === 'password' ? 'border-emerald-500/50' : 'border-slate-600/50'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                      placeholder="Create a strong password"
                      required
                    />
                    <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'password' ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-all duration-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="flex items-center space-x-2">
                      <div className={`text-xs font-medium ${passwordStrength.color}`}>
                        Password strength: {passwordStrength.text}
                      </div>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            passwordStrength.text === 'Weak' ? 'bg-red-500 w-1/3' :
                            passwordStrength.text === 'Medium' ? 'bg-yellow-500 w-2/3' :
                            'bg-emerald-500 w-full'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300 flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-emerald-400" />
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField('')}
                      className={`relative w-full pl-12 pr-12 py-4 bg-slate-800/60 border ${focusedField === 'confirmPassword' ? 'border-emerald-500/50' : 'border-slate-600/50'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                      placeholder="Confirm your password"
                      required
                    />
                    <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'confirmPassword' ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-all duration-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="flex items-center space-x-1 text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-xs">Passwords match</span>
                    </div>
                  )}
                </div>

                {/* Terms */}
                <div className="text-xs text-slate-400 text-center">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors underline">
                    Privacy Policy
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 disabled:from-emerald-800 disabled:to-cyan-800 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        <span>Create Account</span>
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
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-all duration-300 hover:underline"
                  >
                    Already have an account? Sign in
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
              <div className="text-indigo-400 text-2xl mb-2">🤖</div>
              <div className="text-xs text-slate-300 font-medium">AI-Powered</div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center hover:bg-slate-900/60 transition-all duration-300 hover:scale-105">
              <div className="text-purple-400 text-2xl mb-2">🚀</div>
              <div className="text-xs text-slate-300 font-medium">Fast Setup</div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
              <div className="flex -space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
              <span className="text-sm text-slate-300 flex items-center">
                <Star className="w-4 h-4 mr-2 text-emerald-400" />
                Join 10,000+ happy learners
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
