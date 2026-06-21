import React, { useState } from 'react';
import whiteLogo from '../../logo/inwhite.png';

interface PortalSelectionProps {
  onUserPortalClick: () => void;
  onAdminPortalClick: () => void;
}

const PortalSelection: React.FC<PortalSelectionProps> = ({
  onUserPortalClick,
  onAdminPortalClick
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#FC8A14] to-[#FF6B00] p-4 transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-full max-w-md p-8 space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={whiteLogo} alt="CanteenQ Logo" onLoad={() => setImageLoaded(true)} className="w-32 h-32 rounded-full shadow-lg object-cover" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-wide">CanteenQ</h1>
          <p className="mt-2 text-lg text-white font-medium">"Skip the wait. Savor the break."</p>
        </div>

        {/* Portal Selection */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-center mb-6 text-white">Select Your Portal</h2>

          <div className="space-y-4">
            <button
              onClick={onUserPortalClick}
              className="w-full py-4 px-6 bg-white rounded-xl hover:bg-orange-50 transition duration-200 flex items-center shadow-md"
            >
              <div className="w-10 h-10 bg-[#FC8A14] rounded-full flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg text-gray-800">User Portal</p>
                <p className="text-sm text-gray-600">Students & Faculty</p>
              </div>
            </button>

            <button
              onClick={onAdminPortalClick}
              className="w-full py-4 px-6 bg-white rounded-xl hover:bg-orange-50 transition duration-200 flex items-center shadow-md"
            >
              <div className="w-10 h-10 bg-[#FC8A14] rounded-full flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg text-gray-800">Admin Portal</p>
                <p className="text-sm text-gray-600">Canteen Management</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-white text-sm">
        <p>© {new Date().getFullYear()} CanteenQ. All rights reserved.</p>
        <p className="mt-1">Powered by VerticalSync</p>
      </div>
    </div>
  );
};

export default PortalSelection;