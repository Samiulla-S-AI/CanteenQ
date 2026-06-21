import React, { useEffect, useState } from 'react';

// Define the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    // Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if the user already dismissed this session
    const wasDismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    const updatePrompt = () => {
      const g = window as any;
      if (g.deferredPWAInstallPrompt) {
        setDeferredPrompt(g.deferredPWAInstallPrompt);
      }
    };

    // Check immediately in case it already fired
    updatePrompt();

    // Listen for the custom event from index.html
    window.addEventListener('pwa-prompt-ready', updatePrompt);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('pwa-prompt-ready', updatePrompt);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("To install the app, please use your browser's 'Add to Home Screen' or 'Install' option located in the menu or address bar.");
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowIOSGuide(false);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isStandalone || dismissed) {
    return null; // Don't show install button if already installed or dismissed
  }

  // iOS step-by-step guided install overlay
  if (isIOS && showIOSGuide) {
    const steps = [
      {
        title: 'Step 1: Tap the Share Button',
        description: 'Look at the bottom of your Safari browser and tap the Share button',
        icon: (
          // Safari Share icon (box with arrow pointing up)
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L12 15" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8 6L12 2L16 6" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 14V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V14" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        hint: '👆 It looks like a square with an arrow pointing up',
        animation: 'animate-bounce',
      },
      {
        title: 'Step 2: Scroll Down the Menu',
        description: 'In the share sheet that appears, scroll down to find more options',
        icon: (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#007AFF" strokeWidth="1.5"/>
            <path d="M8 10L12 14L16 10" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="8" x2="12" y2="14" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        hint: '👆 Swipe up on the share sheet to see all options',
        animation: 'animate-pulse',
      },
      {
        title: 'Step 3: Tap "Add to Home Screen"',
        description: 'Find and tap the "Add to Home Screen" option with the ➕ icon',
        icon: (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="4" stroke="#007AFF" strokeWidth="1.5"/>
            <path d="M12 8V16M8 12H16" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        hint: '👆 It says "Add to Home Screen" with a + icon',
        animation: 'animate-pulse',
      },
      {
        title: 'Step 4: Tap "Add" to Confirm',
        description: 'Tap the "Add" button in the top right corner to install CanteenQ on your home screen!',
        icon: (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13L9 17L19 7" stroke="#34C759" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        hint: '🎉 That\'s it! CanteenQ will appear on your home screen',
        animation: 'animate-bounce',
      },
    ];

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          onClick={handleDismiss}
        />

        {/* Guide Modal */}
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm pointer-events-auto overflow-hidden"
            style={{
              animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[#F56028] to-[#FC8A14] p-5 text-white relative">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <img src="/pwa-192x192.png" alt="CanteenQ" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Install CanteenQ</h2>
                  <p className="text-sm text-white/80">Add to your home screen</p>
                </div>
              </div>

              {/* Step indicator dots */}
              <div className="flex gap-2 mt-4 justify-center">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? 'w-6 bg-white'
                        : i < currentStep
                        ? 'w-1.5 bg-white/70'
                        : 'w-1.5 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6">
              <div
                key={currentStep}
                style={{ animation: 'fadeSlideIn 0.3s ease-out' }}
              >
                {/* Step Icon */}
                <div className="flex justify-center mb-5">
                  <div className={`w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center ${steps[currentStep].animation}`}>
                    {steps[currentStep].icon}
                  </div>
                </div>

                {/* Step Info */}
                <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
                  {steps[currentStep].title}
                </h3>
                <p className="text-sm text-gray-600 text-center mb-3">
                  {steps[currentStep].description}
                </p>

                {/* Hint Badge */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-xs text-amber-800 font-medium">
                    {steps[currentStep].hint}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="px-6 pb-6 flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex-1 py-3 px-4 bg-[#007AFF] text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-3 px-4 bg-[#34C759] text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors shadow-lg shadow-green-200"
                >
                  Got it! ✓
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Safari bottom bar pointer arrow */}
        {currentStep === 0 && (
          <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[10000] animate-bounce pointer-events-none">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M12 5L12 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M6 13L12 19L18 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeSlideIn {
            from { transform: translateX(20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </>
    );
  }

  // iOS compact install banner (shows before full guide)
  if (isIOS) {
    return (
      <div className="fixed bottom-24 right-4 z-50 flex items-center justify-center pointer-events-none transition-opacity">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(245,96,40,0.2)] p-4 max-w-xs w-full relative pointer-events-auto border border-orange-100 flex flex-col gap-2 animate-[fadeIn_0.3s_ease-out]">
          <button onClick={handleDismiss} className="absolute top-2 right-2 text-gray-400 p-1 hover:text-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="flex items-center gap-3 pr-6">
            <div className="w-10 h-10 bg-[#F56028] shadow-[0_4px_15px_rgba(245,96,40,0.3)] rounded-xl flex items-center justify-center flex-shrink-0">
              <img src="/pwa-192x192.png" alt="App Icon" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 leading-tight">Install CanteenQ</p>
              <p className="text-xs text-gray-500 leading-tight mt-0.5">For best performance & payments</p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowIOSGuide(true);
              setCurrentStep(0);
            }}
            className="w-full mt-1 py-2.5 px-4 bg-gradient-to-r from-[#F56028] to-[#FC8A14] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Show Me How to Install
          </button>
        </div>
      </div>
    );
  }

  // Android/Desktop install button
  return (
    <div className="fixed bottom-24 right-4 z-50 pointer-events-none transition-opacity animate-[fadeIn_0.3s_ease-out]">
      <button
        onClick={handleInstallClick}
        className="pointer-events-auto flex items-center gap-3 bg-white text-gray-800 p-2.5 rounded-full shadow-[0_8px_30px_rgba(245,96,40,0.25)] border-2 border-[#F56028] hover:bg-orange-50 transition-all transform hover:scale-105"
      >
        <div className="w-9 h-9 bg-[#F56028] rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </div>
        <div className="flex flex-col items-start pr-3">
          <span className="font-extrabold text-[#F56028] text-sm leading-tight">Install App</span>
          <span className="text-[10px] text-gray-500 font-medium leading-tight whitespace-nowrap">Faster & better offline</span>
        </div>
      </button>
    </div>
  );
};

export default PWAInstallPrompt;
