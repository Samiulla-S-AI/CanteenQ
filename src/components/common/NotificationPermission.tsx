
import React, { useState, useEffect } from 'react';
import { messaging } from '../../lib/firebase';
import { getToken } from 'firebase/messaging';
import { useUser } from '@clerk/clerk-react';
import { Bell, X } from 'lucide-react';
import { fetchWithRetry } from '../../utils/networkUtils';

const NotificationPermission: React.FC = () => {
    const { user } = useUser();
    const [showPrompt, setShowPrompt] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if browser supports notifications
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return;
        }

        // Check if user is logged in
        if (!user) return;

        // Check current permission status
        if (Notification.permission === 'default') {
            // Add a small delay so it doesn't pop up instantly on load
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
            return () => clearTimeout(timer);
        } else if (Notification.permission === 'granted') {
            // If already granted, ensure token is fresh/saved for this user
            // This handles cases where user logs in on a new device where permission was already granted
            // or if they cleared storage but permission persists
            refreshToken();
        }
    }, [user]);

    const refreshToken = async () => {
        try {
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            const registration = await navigator.serviceWorker.ready;
            const token = await getToken(messaging, {
                vapidKey: vapidKey,
                serviceWorkerRegistration: registration
            });
            if (token) {
                await saveTokenToBackend(token);
            }
        } catch (error) {
            console.error('Error refreshing token', error);
        }
    }

    const handleAllow = async () => {
        setLoading(true);
        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                console.log('Notification permission granted.');

                // Get FCM Token
                // Note: VAPID key should be in environment variables, but falling back to strict check or simple call
                // If VITE_FIREBASE_VAPID_KEY is not set, this might fail or use default if configured in project settings
                const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                const registration = await navigator.serviceWorker.ready;

                const token = await getToken(messaging, {
                    vapidKey: vapidKey,
                    serviceWorkerRegistration: registration
                });

                if (token) {
                    console.log('FCM Token:', token);
                    // Send token to backend to save it
                    await saveTokenToBackend(token);
                } else {
                    console.log('No registration token available. Request permission to generate one.');
                }
            } else {
                console.log('Unable to get permission to notify.');
            }
        } catch (err) {
            console.error('An error occurred while retrieving token.', err);
        } finally {
            setLoading(false);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Optional: Store in localStorage to not ask again for X days
        localStorage.setItem('notification_prompt_dismissed', Date.now().toString());
    };

    const saveTokenToBackend = async (token: string) => {
        try {
            // Call our Netlify function to save the token
            await fetchWithRetry('/.netlify/functions/save-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    userEmail: user?.primaryEmailAddress?.emailAddress,
                    userId: user?.id
                }),
            }, { timeout: 10000, retries: 2, retryDelay: 1000 });
        } catch (error) {
            console.error('Error saving token:', error);
        }
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center pointer-events-none p-4 pb-6 sm:p-0">
            <div
                className="pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform transition-all duration-300 ease-in-out animate-fade-in sm:translate-y-0 translate-y-0"
                style={{ animation: 'slideUp 0.5s ease-out' }}
            >
                <div className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex-shrink-0 bg-orange-100 rounded-full p-2">
                            <Bell className="w-6 h-6 text-[#FC8A14]" />
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="ml-4 text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-4">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">
                            Enable Notifications?
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Get real-time updates on your order status, special offers, and menu changes. No spam, we promise!
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
                        <button
                            onClick={handleAllow}
                            disabled={loading}
                            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 bg-[#FC8A14] hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-200 transition-all duration-200 transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : null}
                            {loading ? 'Enabling...' : 'Allow Notifications'}
                        </button>
                        <button
                            onClick={handleDismiss}
                            disabled={loading}
                            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 transition-colors duration-200"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>

                {/* Progress bar or decorative element */}
                <div className="h-1 w-full bg-gradient-to-r from-orange-400 to-[#FC8A14] opacity-20"></div>
            </div>

            <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default NotificationPermission;
