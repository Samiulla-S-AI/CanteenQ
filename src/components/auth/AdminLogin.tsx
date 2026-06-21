import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { AlertCircle, User, Lock, ArrowLeft } from 'lucide-react';
import whiteLogo from '../../logo/IN_ORANGE.png';

interface AdminLoginProps {
  onBack?: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onBack }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password, true);
      if (success) {
        // Don't use onLoginSuccess which calls window.location.reload()
        // Instead, let the AuthContext state update naturally
        // The App component will detect isAdmin=true and render the AdminDashboard
      } else {
        setError('Invalid admin credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-[#FC8A14] p-4 transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 p-2 text-white hover:bg-orange-600 rounded-full transition duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}

        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={whiteLogo} alt="CanteenQ Logo" onLoad={() => setImageLoaded(true)} className="w-32 h-32 rounded-full shadow-lg object-contain p-2" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-wide">CanteenQ</h1>
          <p className="mt-2 text-lg text-gray-600 font-medium">Admin Portal</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-[#FC8A14] outline-none transition-all"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-[#FC8A14] outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full py-3 text-lg font-medium mt-6"
          >
            Login to Admin Portal
          </Button>

          <div className="text-center mt-6">
            <a href="#" onClick={onBack || (() => window.history.back())} className="text-sm text-[#FC8A14] hover:underline font-medium">
              Return to Portal Selection
            </a>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} CanteenQ. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AdminLogin;