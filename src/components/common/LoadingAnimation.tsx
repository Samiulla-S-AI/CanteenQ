import React, { useState } from 'react';
import whiteLogo from '../../logo/IN_ORANGE.png';

const LoadingAnimation: React.FC = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-[#FC8A14] via-orange-500 to-[#D7263D] flex items-center justify-center z-50 transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 w-40 h-40 mx-auto">
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse"></div>
          </div>

          {/* Logo container with bounce animation */}
          <div className="relative w-40 h-40 mx-auto bg-white rounded-full shadow-2xl flex items-center justify-center animate-bounce-slow">
            <img
              src={whiteLogo}
              alt="CanteenQ Logo"
              onLoad={() => setImageLoaded(true)}
              className="w-32 h-32 object-contain p-2 animate-spin-slow"
            />
          </div>
        </div>

        {/* App Name with gradient text */}
        <h1 className="text-5xl font-extrabold text-white tracking-wide mb-4 animate-fade-in">
          CanteenQ
        </h1>

        {/* Tagline */}
        <p className="text-xl text-white/90 font-medium mb-8 animate-fade-in-delayed">
          "Skip the wait. Savor the break."
        </p>

        {/* Loading spinner with dots */}
        <div className="flex justify-center space-x-2 mb-4">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce-1"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce-2"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce-3"></div>
        </div>

        {/* Loading text */}
        <p className="text-white/80 font-medium text-lg animate-pulse">
          Loading your experience...
        </p>

        {/* Progress bar */}
        <div className="mt-8 w-64 mx-auto h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-progress"></div>
        </div>
      </div>

      {/* Powered by footer */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white/70 text-sm">Powered by VerticalSync</p>
      </div>

      {/* Add custom keyframe animations */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-delayed {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          50% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        
        @keyframes bounce-1 {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes bounce-2 {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes bounce-3 {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-fade-in-delayed {
          animation: fade-in-delayed 1.5s ease-out;
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
        
        .animate-bounce-1 {
          animation: bounce-1 1.4s ease-in-out 0s infinite;
        }
        
        .animate-bounce-2 {
          animation: bounce-2 1.4s ease-in-out 0.2s infinite;
        }
        
        .animate-bounce-3 {
          animation: bounce-3 1.4s ease-in-out 0.4s infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingAnimation;
