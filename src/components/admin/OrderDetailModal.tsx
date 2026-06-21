import React from 'react';
import { X, Calendar, Mail, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface OrderItem {
    id: string;
    name: string;
    quantity: number; // Stock quantity
    cartQuantity: number; // Customer ordered quantity
    price: number;
}

interface Order {
    id: string;
    orderNumber: string;
    userEmail: string;
    timestamp: string;
    status: 'Pending' | 'Ready' | 'Completed';
    totalAmount: number;
    items: OrderItem[];
}

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onUpdateStatus: (orderId: string, status: 'Pending' | 'Ready' | 'Completed') => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ isOpen, onClose, order, onUpdateStatus }) => {
    if (!isOpen || !order) return null;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'Ready':
                return <AlertCircle className="w-5 h-5 text-green-500" />;
            case 'Completed':
                return <CheckCircle className="w-5 h-5 text-gray-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Ready':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'Completed':
                return 'bg-gray-100 text-gray-700 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-[#FC8A14] to-[#D7263D] text-white p-6 rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Order Details</h2>
                        <p className="text-white/90 text-sm mt-1">#{order.orderNumber}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Order Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customer Email */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-2">
                                <Mail className="w-5 h-5 text-gray-600" />
                                <h3 className="font-semibold text-gray-700">Customer Email</h3>
                            </div>
                            <p className="text-gray-900 font-medium">{order.userEmail}</p>
                        </div>

                        {/* Order Date & Time */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-2">
                                <Calendar className="w-5 h-5 text-gray-600" />
                                <h3 className="font-semibold text-gray-700">Order Date & Time</h3>
                            </div>
                            <p className="text-gray-900 font-medium">
                                {new Date(order.timestamp).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                            <p className="text-gray-600 text-sm">
                                {new Date(order.timestamp).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Current Status & Quick Update */}
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border-2 border-blue-100">
                        <h3 className="font-semibold text-gray-700 mb-3">Order Status</h3>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            {/* Current Status Badge */}
                            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border-2 ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                <span className="font-semibold">{order.status}</span>
                            </div>

                            {/* Quick Status Update Buttons - Only show valid transitions */}
                            <div className="flex flex-wrap gap-2">
                                {/* Pending can only go to Ready */}
                                {order.status === 'Pending' && (
                                    <button
                                        onClick={() => onUpdateStatus(order.id, 'Ready')}
                                        className="px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-1.5 transition-all shadow-sm hover:shadow-md bg-green-500 text-white hover:bg-green-600"
                                    >
                                        {getStatusIcon('Ready')}
                                        <span>Mark as Ready</span>
                                    </button>
                                )}

                                {/* Ready and Completed cannot be changed manually */}
                                {order.status === 'Ready' && (
                                    <div className="px-4 py-2 rounded-lg bg-blue-50 border-2 border-blue-200 text-blue-700 text-sm flex items-center space-x-2">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Order ready for pickup. Scan QR to complete.</span>
                                    </div>
                                )}

                                {order.status === 'Completed' && (
                                    <div className="px-4 py-2 rounded-lg bg-gray-100 border-2 border-gray-300 text-gray-700 text-sm flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Order completed and delivered.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info message about status flow */}
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-800">
                                <strong>Status Flow:</strong> Pending → Ready → Completed (via QR scan only).
                                Status cannot be reversed once updated.
                            </p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <Package className="w-5 h-5 text-gray-600" />
                                <h3 className="font-semibold text-gray-700">Order Items</h3>
                            </div>
                            <span className="text-sm font-medium text-gray-500">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-3">
                            {order.items.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-lg p-4 border border-gray-200"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start space-x-3 flex-1">
                                            <div className="w-12 h-12 bg-[#FC8A14] rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                                                {item.cartQuantity}x
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800 text-base">{item.name}</p>
                                                <p className="text-sm text-gray-500 mt-1">₹{item.price.toFixed(2)} each</p>
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="font-bold text-[#FC8A14] text-lg">₹{(item.price * item.cartQuantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Amount */}
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-5 border-2 border-green-100">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">Total Amount</p>
                            <p className="font-bold text-green-600 text-3xl">₹{order.totalAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;
