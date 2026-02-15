import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  onBackToHome?: () => void;
  showBackButton?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  onBackToHome,
  showBackButton = true 
}) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dark navy gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950">
        {/* Radial glow circles */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with back button */}
        {showBackButton && (
          <div className="p-6 md:p-8">
            <button
              onClick={onBackToHome}
              className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">
            {/* Fade-in animation wrapper */}
            <div className="animate-fade-in">
              {/* Logo and title */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <Logo className="w-16 h-16" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                  {title}
                </h1>
                <p className="text-lg text-white/70">
                  {subtitle}
                </p>
              </div>

              {/* Auth card */}
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl p-8">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom styles for fade-in animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};
