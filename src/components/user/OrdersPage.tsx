import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import BillModal from './BillModal';
import FeedbackModal from './FeedbackModal';
import { supabase } from '../../lib/supabase';

const OrdersPage: React.FC = () => {
  const { orders, refreshOrders } = useApp();
  const { currentUser } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Ready' | 'Completed'>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackOrder, setFeedbackOrder] = useState<any>(null);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrders(); // Actually fetch from database
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
    setIsRefreshing(false);
  };

  // Auto-refresh orders every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders();
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [refreshOrders]);

  // Handle feedback submission (following review system pattern)
  const handleFeedbackSubmit = async (rating: number, comment: string) => {
    if (!feedbackOrder || !currentUser) return;

    try {
      // Get canteen ID for database
      const canteenTextId = feedbackOrder.canteenId || feedbackOrder.canteen_id;

      // 1. Insert feedback to database (now canteen_id is TEXT, matching schema)
      const { error: feedbackError } = await supabase
        .from('feedback')
        .insert({
          order_id: feedbackOrder.id,
          user_email: currentUser.email,
          user_id: currentUser.id,
          canteen_id: canteenTextId,  // Direct insert - schema is now consistent!
          rating,
          comment: comment.trim() || null
        })
        .select()
        .single();

      if (feedbackError) throw feedbackError;

      // Success! Database trigger will automatically create admin notification
      // No need to manually create notification here - prevents duplicates!

      alert('✅ Thank you for your feedback! Your review helps us improve.');
      setFeedbackOrder(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  // Filter orders for current user - using useMemo to prevent infinite loops
  const userOrders = useMemo(() =>
    orders.filter(order => order.userEmail === currentUser?.email),
    [orders, currentUser?.email]
  );

  // Filter orders based on active tab
  const filteredOrders = useMemo(() =>
    activeTab === 'All'
      ? userOrders
      : userOrders.filter(order => order.status === activeTab),
    [activeTab, userOrders]
  );

  // Calculate counts for each tab - using useMemo instead of useEffect
  const tabCounts = useMemo(() => ({
    All: userOrders.length,
    Pending: userOrders.filter(order => order.status === 'Pending').length,
    Ready: userOrders.filter(order => order.status === 'Ready').length,
    Completed: userOrders.filter(order => order.status === 'Completed').length
  }), [userOrders]);

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
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Ready':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Completed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (userOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-600 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">Your order history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Order History</h1>
            <p className="text-sm text-gray-600">{userOrders.length} orders</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-[#FC8A14] text-white rounded-lg hover:bg-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            title="Refresh orders"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide mt-4 border-b border-gray-200">
          {['All', 'Pending', 'Ready', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex items-center justify-center px-4 py-2 whitespace-nowrap text-sm font-medium transition-colors relative ${activeTab === tab
                ? 'text-[#FC8A14] border-b-2 border-[#FC8A14]'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}
            >
              {tab}
              {tabCounts[tab as keyof typeof tabCounts] > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab
                  ? 'bg-[#FC8A14] text-white'
                  : tab === 'Pending' ? 'bg-yellow-100 text-yellow-700'
                    : tab === 'Ready' ? 'bg-green-100 text-green-700'
                      : tab === 'Completed' ? 'bg-gray-100 text-gray-700'
                        : 'bg-gray-100 text-gray-700'}`}
                >
                  {tabCounts[tab as keyof typeof tabCounts]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 md:p-4">
        {filteredOrders.length > 0 ? (() => {
          // Group orders by date
          const groupedOrders: { [date: string]: typeof filteredOrders } = {};
          filteredOrders
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .forEach(order => {
              const dateKey = new Date(order.timestamp).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
              if (!groupedOrders[dateKey]) {
                groupedOrders[dateKey] = [];
              }
              groupedOrders[dateKey].push(order);
            });

          return (
            <div className="space-y-0">
              {Object.entries(groupedOrders).map(([dateLabel, dateOrders]) => (
                <div key={dateLabel}>
                  {/* Central Date Label */}
                  <div className="py-2.5 md:py-3 px-2">
                    <div className="flex items-center justify-center gap-2 md:gap-3">
                      <div className="h-px bg-orange-200 flex-1" />
                      <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 bg-gradient-to-r from-[#FC8A14] to-[#e07a0c] rounded-full shadow-md">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                        <span className="text-xs md:text-sm font-bold text-white">{dateLabel}</span>
                      </div>
                      <div className="h-px bg-orange-200 flex-1" />
                    </div>
                  </div>

                  {/* Orders for this date */}
                  <div className="space-y-3 mb-2">
                    {dateOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {/* Compact Header - One Line on Mobile */}
                        <div className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {getStatusIcon(order.status)}
                            <h3 className="font-bold text-gray-800 text-sm md:text-base truncate">
                              #{order.orderNumber}
                            </h3>
                          </div>
                          <span className={`px-2.5 md:px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>

                        {/* Order Details - Better Mobile Layout */}
                        <div className="px-3 md:px-4 py-3">
                          {/* Top Row: Items + Price (Prominent) */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1 text-gray-600">
                              <span className="font-semibold text-gray-700 text-sm">{order.items.length}</span>
                              <span className="text-sm">item{order.items.length !== 1 ? 's' : ''}</span>
                            </div>
                            {/* Larger, more prominent price */}
                            <div className="text-right">
                              <span className="font-bold text-[#FC8A14] text-xl md:text-2xl">₹{order.totalAmount}</span>
                            </div>
                          </div>

                          {/* Time Only (no date since it's in the group header) */}
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </div>

                          {/* Feedback Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFeedbackOrder(order);
                            }}
                            className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[#FC8A14] text-[#FC8A14] rounded-lg hover:bg-[#FC8A14] hover:text-white transition-all duration-200 text-xs font-medium"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Leave Feedback</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })() : (
          <div className="text-center py-12">
            <div className="text-6xl mb-3">📦</div>
            <p className="text-gray-500 font-medium">No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} orders</p>
            <p className="text-sm text-gray-400 mt-1">Your orders will appear here</p>
          </div>
        )}
      </div>

      {/* Bill Modal */}
      <BillModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={!!feedbackOrder}
        onClose={() => setFeedbackOrder(null)}
        orderNumber={feedbackOrder?.orderNumber || ''}
        orderId={feedbackOrder?.id || ''}
        canteenId={feedbackOrder?.canteenId || feedbackOrder?.canteen_id || ''}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
};

export default OrdersPage;