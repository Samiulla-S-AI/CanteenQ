import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Clock, Package } from 'lucide-react';

export interface OrderItem {
    name: string;
    quantity: number;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    items?: OrderItem[];  // Ordered items with quantities
    orderNumber?: string;  // Order ID/number to display
    type: 'success' | 'info' | 'warning';
    timestamp: Date | string;
    read: boolean;
}

interface NotificationToastProps {
    notification: Notification;
    onDismiss: (id: string) => void;  // Changed from onClose
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(notification.id), 300);
        }, 5000);

        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    const getIcon = () => {
        switch (notification.type) {
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'warning':
                return <Clock className="w-6 h-6 text-orange-500" />;
            default:
                return <Package className="w-6 h-6 text-blue-500" />;
        }
    };

    const getBgColor = () => {
        switch (notification.type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'warning':
                return 'bg-orange-50 border-orange-200';
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <div
            className={`${isVisible ? 'animate-slideInRight' : 'animate-slideOutRight'} 
        ${getBgColor()} border-2 rounded-xl shadow-lg p-4 mb-3 max-w-sm transition-all`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{getIcon()}</div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm">{notification.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{notification.message}</p>

                    {/* Items List */}
                    {notification.items && notification.items.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {notification.items.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs text-gray-700">
                                    <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full font-semibold text-gray-600">
                                        {item.quantity}
                                    </span>
                                    <span className="font-medium">× {item.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-gray-400 text-xs mt-2">
                        {new Date(notification.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(() => onDismiss(notification.id), 300);
                    }}
                    className="flex-shrink-0 p-1 hover:bg-white rounded-lg transition-colors"
                    title="Dismiss"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>
        </div>
    );
};

interface OrderNotificationSystemProps {
    notifications: Notification[];
    onClearNotification?: (id: string) => void;
}

const OrderNotificationSystem: React.FC<OrderNotificationSystemProps> = ({
    notifications,
    onClearNotification
}) => {
    // Track which toasts have been dismissed (hidden from screen)
    const [dismissedToasts, setDismissedToasts] = useState<Set<string>>(new Set());

    const handleDismiss = (id: string) => {
        // Hide the toast locally
        setDismissedToasts(prev => new Set([...prev, id]));

        // Also clear from global state if handler provided
        if (onClearNotification) {
            onClearNotification(id);
        }
    };

    // Show only notifications that haven't been dismissed as toasts
    const visibleToasts = notifications.filter(n => !dismissedToasts.has(n.id));

    return (
        <div className="fixed top-20 right-4 z-50 max-w-sm">
            {visibleToasts.map(notification => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onDismiss={handleDismiss}
                />
            ))}
        </div>
    );
};

export default OrderNotificationSystem;
