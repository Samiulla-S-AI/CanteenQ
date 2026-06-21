import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { saveUserData } from '../../utils/userUtils';
import whiteLogo from '../../logo/IN_ORANGE.png';

interface UserOnboardingProps {
  onComplete: () => void;
}

const UserOnboarding: React.FC<UserOnboardingProps> = ({ onComplete }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    phoneNumber: '',
    department: '',
    year: '1'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare user data
      const userData = {
        id: user?.id || '',
        name: formData.name,
        register_number: formData.registerNumber,
        mobile: formData.phoneNumber,
        email: user?.primaryEmailAddress?.emailAddress || '',
        department: formData.department,
        year: formData.year
      };

      // Save user data using the utility function
      const { success, error } = await saveUserData(userData);

      if (!success) throw new Error(error);

      // Call onComplete to proceed to the app
      onComplete();
    } catch (err: any) {
      console.error('Error saving user data:', err);
      setError(err.message || 'Failed to save user data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-[#FC8A14] p-4 transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={whiteLogo} alt="CanteenQ Logo" onLoad={() => setImageLoaded(true)} className="w-32 h-32 rounded-full shadow-lg object-contain p-2" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-wide">Complete Your Profile</h1>
          <p className="mt-2 text-sm text-gray-600">We need a few more details to set up your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FC8A14] focus:border-[#FC8A14]"
            />
          </div>

          <div>
            <label htmlFor="registerNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Register Number
            </label>
            <input
              id="registerNumber"
              name="registerNumber"
              type="text"
              required
              value={formData.registerNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FC8A14] focus:border-[#FC8A14]"
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FC8A14] focus:border-[#FC8A14]"
            />
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              id="department"
              name="department"
              type="text"
              required
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FC8A14] focus:border-[#FC8A14]"
            />
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              id="year"
              name="year"
              required
              value={formData.year}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FC8A14] focus:border-[#FC8A14]"
            >
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#FC8A14] text-white rounded-lg hover:bg-orange-600 transition duration-200 disabled:bg-orange-400 font-medium text-lg shadow-md"
          >
            {loading ? 'Saving...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserOnboarding;