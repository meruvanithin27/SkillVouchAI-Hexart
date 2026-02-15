import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Check, X } from 'lucide-react';
import axios from 'axios';

interface PremiumSignupPageProps {
  onSignupSuccess: (user: any) => void;
  onBackToHome: () => void;
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

export const PremiumSignupPage: React.FC<PremiumSignupPageProps> = ({ onSignupSuccess, onBackToHome }) => {
  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { strength: 'weak', color: 'text-red-400' };
    if (password.length < 10) return { strength: 'medium', color: 'text-yellow-400' };
    return { strength: 'strong', color: 'text-green-400' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (formData.fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters');
      return;
    }
    if (!formData.email) {
      setError('Email is required');
      return;
    }
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

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
          name: formData.fullName.trim(),
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
      setError(err.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name Field */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
              focusedField === 'fullName' ? 'text-indigo-400' : 'text-white/40'
            }`} />
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField('')}
              className={`w-full pl-11 pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder-white/40 transition-all duration-200 ${
                focusedField === 'fullName' 
                  ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' 
                  : 'border-white/10 hover:border-white/20'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
              placeholder="Enter your full name"
              required
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
              focusedField === 'email' ? 'text-indigo-400' : 'text-white/40'
            }`} />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField('')}
              className={`w-full pl-11 pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder-white/40 transition-all duration-200 ${
                focusedField === 'email' 
                  ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' 
                  : 'border-white/10 hover:border-white/20'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
              focusedField === 'password' ? 'text-indigo-400' : 'text-white/40'
            }`} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField('')}
              className={`w-full pl-11 pr-12 py-3 bg-white/5 border rounded-lg text-white placeholder-white/40 transition-all duration-200 ${
                focusedField === 'password' 
                  ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' 
                  : 'border-white/10 hover:border-white/20'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
              placeholder="Create a password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors duration-200"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.password && (
            <div className="mt-2 flex items-center justify-between">
              <span className={`text-xs ${passwordStrength.color}`}>
                Password strength: {passwordStrength.strength}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
              focusedField === 'confirmPassword' ? 'text-indigo-400' : 'text-white/40'
            }`} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField('')}
              className={`w-full pl-11 pr-12 py-3 bg-white/5 border rounded-lg text-white placeholder-white/40 transition-all duration-200 ${
                focusedField === 'confirmPassword' 
                  ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' 
                  : 'border-white/10 hover:border-white/20'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors duration-200"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.confirmPassword && (
            <div className="mt-2 flex items-center space-x-1">
              {formData.password === formData.confirmPassword ? (
                <>
                  <Check className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">Passwords match</span>
                </>
              ) : (
                <>
                  <X className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400">Passwords do not match</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating account...</span>
            </div>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="text-center">
        <p className="text-white/60 text-sm">
          Already have an account?{' '}
          <button
            onClick={() => {/* Navigate to login */}}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors duration-200 hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};
