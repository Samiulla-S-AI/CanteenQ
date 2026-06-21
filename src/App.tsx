import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import whiteLogo from './logo/IN_ORANGE.png';

// Auth Components
import UserOnboarding from './components/auth/UserOnboarding';
import AdminLogin from './components/auth/AdminLogin';
import PortalSelection from './components/auth/PortalSelection';

// User Components
import Header from './components/common/Header';
import BottomNavigation from './components/common/BottomNavigation';
import LoadingAnimation from './components/common/LoadingAnimation';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import NotificationPermission from './components/common/NotificationPermission';
import HomePage from './components/user/HomePage';
import MenuPage from './components/user/MenuPage';
import CartPage from './components/user/CartPage';
import OrdersPage from './components/user/OrdersPage';
import FoodItemDetails from './components/user/FoodItemDetails';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';

// Utils
import { checkUserExists } from './utils/userUtils';

const AppContent: React.FC = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { selectedCanteen, cart, setSelectedCanteen, setSelectedBreakTime, setSelectedCategory } = useApp();
  const { isAdmin } = useAuth();

  const [activeUserTab, setActiveUserTab] = useState('home');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showPortalSelection, setShowPortalSelection] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Service worker cache management – clear stale caches on version mismatch
  // and handle navigation back from external apps (Paytm, etc.)
  useEffect(() => {
    // Use sessionStorage so this runs once per browser session, not once forever
    const hasRefreshed = sessionStorage.getItem('appSessionRefreshed');
    if (!hasRefreshed) {
      sessionStorage.setItem('appSessionRefreshed', 'true');

      // Clear old service worker caches that may contain stale Clerk JS
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            // Only clear caches that are likely stale (static assets, Clerk SDK)
            if (name.includes('static-assets') || name.includes('clerk')) {
              caches.delete(name);
            }
          });
        });
      }

      // Force SW to check for updates
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  }, []);

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (isSignedIn && user) {
        setCheckingUser(true);
        // Pass both user ID and email to improve reliability
        const userEmail = user.primaryEmailAddress?.emailAddress || '';
        const exists = await checkUserExists(user.id, userEmail);
        setNeedsOnboarding(!exists);
        setCheckingUser(false);
      }
    };

    if (isSignedIn && user) {
      checkOnboardingStatus();
    }
  }, [isSignedIn, user]);

  const handleTabChange = (tab: string) => {
    setActiveUserTab(tab);
    // Reset canteen selection when changing tabs
    if (tab !== 'home' && selectedCanteen) {
      setSelectedCanteen(null);
      setSelectedBreakTime(null);
      setSelectedCategory(null);
    }
  };

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
  };

  // Check if the app is still loading
  if (!isLoaded || (isSignedIn && checkingUser)) {
    return <LoadingAnimation />;
  }

  // If not signed in, show Portal Selection, User Login, or Admin Login
  if (!isSignedIn && !isAdmin) {
    if (showPortalSelection) {
      return (
        <PortalSelection
          onUserPortalClick={() => setShowPortalSelection(false)}
          onAdminPortalClick={() => {
            setShowPortalSelection(false);
            setShowAdminLogin(true);
          }}
        />
      );
    }

    if (showAdminLogin) {
      return (
        <AdminLogin
          onBack={() => {
            setShowAdminLogin(false);
            setShowPortalSelection(true);
          }}
        />
      );
    }

    return (
      <div className={`flex flex-col items-center justify-center min-h-screen bg-[#FC8A14] p-4 transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img src={whiteLogo} alt="CanteenQ Logo" onLoad={() => setImageLoaded(true)} className="w-32 h-32 rounded-full shadow-lg object-contain p-2" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-800 tracking-wide">CanteenQ</h1>
            <p className="mt-2 text-lg text-gray-600 font-medium">"Skip the wait. Savor the break."</p>
          </div>

          <div className="flex flex-col space-y-5 mt-8">
            <SignInButton mode="modal">
              <button className="w-full py-3 px-4 bg-[#FC8A14] text-white rounded-lg hover:bg-orange-600 transition duration-200 font-medium text-lg shadow-md">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full py-3 px-4 bg-white border-2 border-[#FC8A14] text-[#FC8A14] rounded-lg hover:bg-orange-50 transition duration-200 font-medium text-lg">
                Sign Up
              </button>
            </SignUpButton>
            <button
              onClick={() => setShowPortalSelection(true)}
              className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 font-medium text-lg flex items-center justify-center"
            >
              <span className="mr-2">Back to Portal Selection</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white text-sm">
          <p>© {new Date().getFullYear()} CanteenQ. All rights reserved.</p>
          <p className="mt-1">Powered by VerticalSync</p>
        </div>
      </div>
    );
  }

  // If user needs to complete onboarding
  if (needsOnboarding) {
    return <UserOnboarding onComplete={handleOnboardingComplete} />;
  }

  // Admin Dashboard
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // Show menu page if canteen is selected
  if (selectedCanteen && activeUserTab === 'home') {
    return (
      <MenuPage
        onBack={() => {
          setSelectedCanteen(null);
          setSelectedBreakTime(null);
          setSelectedCategory(null);
        }}
      />
    );
  }

  // User Interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        title={
          activeUserTab === 'home' ? 'CanteenQ' :
            activeUserTab === 'orders' ? 'My Orders' :
              activeUserTab === 'cart' ? 'Shopping Cart' :
                'CanteenQ'
        }
        showProfile={true}
      />

      {/* Profile Dropdown is now handled by the Header component */}


      {/* Main Content */}
      <main className="min-h-screen">
        {activeUserTab === 'home' && <HomePage />}
        {activeUserTab === 'orders' && <OrdersPage />}
        {activeUserTab === 'cart' && <CartPage />}
      </main>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Notification Permission Prompt */}
      <NotificationPermission />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeUserTab}
        onTabChange={handleTabChange}
        cartItemsCount={cart.reduce((sum, item) => sum + item.cartQuantity, 0)}
      />

      {/* No longer needed with Clerk's UserButton */}
    </div>
  );
};

// Wrapper component to handle navigation context
const AppWrapper: React.FC = () => {
  const handleTabChange = () => {
    // Handle tab change logic
  };

  return (
    <NavigationProvider handleTabChange={handleTabChange}>
      <AppContent />
    </NavigationProvider>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Wrap AppContent with AppProvider and NavigationProvider */}
        <AppProvider>
          <Routes>
            <Route path="/food/:id" element={<FoodItemDetails />} />
            <Route path="/*" element={<AppWrapper />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;