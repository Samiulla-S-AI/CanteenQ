import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';

interface CanteenAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CanteenAdminModal: React.FC<CanteenAdminModalProps> = ({ isOpen, onClose }) => {
  const { createCanteenAdmin } = useAuth();
  const { canteens } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [canteenId, setCanteenId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate inputs
    if (!email || !password || !canteenId) {
      setError('All fields are required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password validation (at least 6 characters)
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Create or update canteen admin
    const result = await createCanteenAdmin(email, password, canteenId);
    if (result) {
      setSuccess(`Admin account for ${email} created/updated successfully`);
      // Reset form
      setEmail('');
      setPassword('');
      setCanteenId('');
    } else {
      setError('Failed to create/update admin account. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Create/Update Canteen Admin</h3>
            <p className="text-xs text-gray-500 mt-1">If email exists, password and canteen will be updated</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
              placeholder="admin@canteen.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label htmlFor="canteen" className="block text-sm font-medium text-gray-700 mb-1">
              Canteen
            </label>
            <select
              id="canteen"
              value={canteenId}
              onChange={(e) => setCanteenId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
            >
              <option value="">Select a canteen</option>
              {canteens.map((canteen) => (
                <option key={canteen.id} value={canteen.id}>
                  {canteen.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#FC8A14] hover:bg-[#e07a0c] text-white"
            >
              Create Admin
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CanteenAdminModal;