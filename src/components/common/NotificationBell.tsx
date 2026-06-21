import React, { useState, useEffect, useRef } from 'react';
import { Bell, Trash2, X } from 'lucide-react';
import { Notification } from './OrderNotificationSystem';
import { useApp } from '../../context/AppContext';
import { messaging } from '../../lib/firebase';
import { onMessage } from 'firebase/messaging';
import { supabaseAdmin } from '../../lib/supabase';

const NotificationBell: React.FC = () => {
    const { notifications, clearNotification } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Capture FCM Foreground messages when the site is actually open
    useEffect(() => {
        try {
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground Push Notification received: ', payload);
                if (window.Notification.permission === 'granted') {
                    new window.Notification(payload.notification?.title || 'System Alert', {
                        body: payload.notification?.body,
                        icon: '/pwa-192x192.png'
                    });
                }
            });
            return () => unsubscribe();
        } catch (e) {
            console.error('Failed to bind foreground notification listener', e);
        }
    }, []);

    useEffect(() => {
        const unread = notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
    }, [notifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const clearAll = () => {
        notifications.forEach(n => clearNotification(n.id));
        setIsOpen(false);
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read visually & in DB
        if (!notification.read) {
            notification.read = true;
            // Force re-render
            setUnreadCount(notifications.filter(n => !n.read).length);

            try {
                await supabaseAdmin
                    .from('notifications')
                    .update({ read: true, read_at: new Date().toISOString() })
                    .eq('id', notification.id);
            } catch (error) {
                console.error("Failed to mark notification as read", error);
            }
        }
    };

    const formatTime = (timestamp: Date | string) => {
        const now = new Date();
        const diff = now.getTime() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 bg-white text-gray-800 hover:bg-gray-50 rounded-full transition-colors shadow-lg"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6" />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                            <p className="text-xs text-gray-500">
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Clear all"
                                >
                                    <Trash2 className="w-4 h-4 text-gray-600" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No notifications yet</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    We'll notify you when there's something new
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-gray-800 text-sm">
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.read && (
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 text-sm mb-2">
                                                    {notification.message}
                                                </p>

                                                {/* Items List */}
                                                {notification.items && notification.items.length > 0 && (
                                                    <div className="space-y-1 mb-2">
                                                        {notification.items.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-2 text-xs text-gray-700"
                                                            >
                                                                <span className="w-5 h-5 flex items-center justify-center bg-gray-200 rounded-full font-semibold text-gray-600">
                                                                    {item.quantity}
                                                                </span>
                                                                <span>× {item.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <p className="text-xs text-gray-400">
                                                    {formatTime(notification.timestamp)}
                                                </p>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => clearNotification(notification.id)}
                                                className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                                                title="Dismiss"
                                            >
                                                <X className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 text-center">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    // Navigate to notifications page if you have one
                                }}
                                className="text-sm text-[#FC8A14] hover:text-[#e07a0c] font-medium"
                            >
                                View All Notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
