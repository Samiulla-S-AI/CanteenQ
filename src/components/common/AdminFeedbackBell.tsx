import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface FeedbackNotification {
    id: string;
    title: string;
    message: string;
    feedback_data: {
        rating: number;
        comment: string;
        userName: string;
        userEmail: string;
        canteenName: string;
        orderNumber: string;
        canteenId: string;
    };
    read: boolean;
    created_at: string;
}

const AdminFeedbackBell: React.FC = () => {
    const { currentAdmin } = useAuth();
    const [feedbackNotifications, setFeedbackNotifications] = useState<FeedbackNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch feedback notifications from database
    useEffect(() => {
        fetchFeedbackNotifications();

        // Set up real-time subscription for new feedback
        const channel = supabase
            .channel('feedback_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `is_admin_notification=eq.true`
                },
                (payload) => {
                    console.log('New feedback notification:', payload);
                    fetchFeedbackNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentAdmin]);

    const fetchFeedbackNotifications = async () => {
        try {
            let query = supabase
                .from('notifications')
                .select('*')
                .eq('is_admin_notification', true)
                .not('feedback_data', 'is', null)
                .order('created_at', { ascending: false })
                .limit(50);

            // Filter by canteen for canteen admin
            if (!currentAdmin?.isMasterAdmin && currentAdmin?.canteenId) {
                query = query.eq('feedback_data->>canteenId', currentAdmin.canteenId);
            }

            const { data, error } = await query;

            if (error) throw error;

            setFeedbackNotifications(data || []);
            setUnreadCount((data || []).filter(n => !n.read).length);
        } catch (error) {
            console.error('Error fetching feedback notifications:', error);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (error) throw error;

            // Update local state
            setFeedbackNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;

            setFeedbackNotifications(prev => prev.filter(n => n.id !== notificationId));
            fetchFeedbackNotifications(); // Refresh count
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Clear all notifications
    const clearAll = async () => {
        try {
            const ids = feedbackNotifications.map(n => n.id);
            const { error } = await supabase
                .from('notifications')
                .delete()
                .in('id', ids);

            if (error) throw error;

            setFeedbackNotifications([]);
            setUnreadCount(0);
            setIsOpen(false);
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

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

    const formatTime = (timestamp: string) => {
        const now = new Date();
        const notifTime = new Date(timestamp);
        const diffMs = now.getTime() - notifTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays}d ago`;
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-3 h-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Feedback Notifications"
            >
                <MessageSquare className="w-6 h-6 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Feedback ({unreadCount} new)</h3>
                            <div className="flex gap-2">
                                {feedbackNotifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        Clear All
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {feedbackNotifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No feedback yet</p>
                                <p className="text-sm text-gray-400 mt-1">Customer feedback will appear here</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {feedbackNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''
                                            }`}
                                        onClick={() => !notification.read && markAsRead(notification.id)}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                {/* Title and Rating */}
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-semibold text-gray-800 truncate">
                                                        {notification.feedback_data.userName}
                                                    </h4>
                                                    {renderStars(notification.feedback_data.rating)}
                                                </div>

                                                {/* Comment */}
                                                {notification.feedback_data.comment && (
                                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                        "{notification.feedback_data.comment}"
                                                    </p>
                                                )}

                                                {/* Order Info */}
                                                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                                                        Order #{notification.feedback_data.orderNumber}
                                                    </span>
                                                    {!currentAdmin?.isMasterAdmin && (
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                            {notification.feedback_data.canteenName}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Timestamp */}
                                                <p className="text-xs text-gray-400">
                                                    {formatTime(notification.created_at)}
                                                </p>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                title="Delete"
                                            >
                                                <X className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>

                                        {/* Unread Indicator */}
                                        {!notification.read && (
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFeedbackBell;
