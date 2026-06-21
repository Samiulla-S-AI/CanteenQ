import React from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  title: string;
  showProfile?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showProfile = true }) => {
  const { isSignedIn, user } = useUser();

  return (
    <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          {isSignedIn && user && (
            <p className="text-sm text-gray-500">
              Hello, {user.firstName || user.username}
            </p>
          )}
        </div>

        {showProfile && (
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Clerk User Profile */}
            <UserButton afterSignOutUrl="/" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;