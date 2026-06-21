import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, Users, TrendingUp, Clock, CheckCircle, AlertCircle, Calendar, QrCode, LogOut, ShoppingBag, PieChart, Coffee, Settings, UserPlus, RefreshCw, Eye, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';
import FoodItemModal from './FoodItemModal';
import CanteenModal from './CanteenModal';
import QRScanner from './QRScanner';
import AdminSettingsModal, { AdminBankDetails } from './AdminSettingsModal';
import CanteenAdminModal from './CanteenAdminModal';
import EnhancedAnalytics from './EnhancedAnalytics';
import OrderDetailModal from './OrderDetailModal';
import AdminFeedbackBell from '../common/AdminFeedbackBell';
import { FoodItem, Canteen } from '../../types';

const AdminDashboard: React.FC = () => {
  const { currentAdmin, logout, updateAdminBankDetails } = useAuth();
  const { foodItems, canteens, orders, deleteFoodItem, updateOrder, updateCanteen, deleteCanteen, refreshOrders, updateFoodItem } = useApp();
  const [activeTab, setActiveTab] = useState('items');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | 'Pending' | 'Ready' | 'Completed'>('All');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCanteenModalOpen, setIsCanteenModalOpen] = useState(false);
  const [editingCanteen, setEditingCanteen] = useState<Canteen | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Food' | 'Drink' | 'Snack'>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCanteenAdminModalOpen, setIsCanteenAdminModalOpen] = useState(false);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [foodItemSearchQuery, setFoodItemSearchQuery] = useState('');
  const [breakTimeSort, setBreakTimeSort] = useState<'All' | 'Morning' | 'Afternoon' | 'Evening'>('All');
  const [canteenFilter, setCanteenFilter] = useState<string>('All');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [stockInputs, setStockInputs] = useState<{ have: string; left: string }>({ have: '', left: '' });
  const [stockUpdating, setStockUpdating] = useState(false);

  // Handle manual refresh for orders
  const handleRefreshOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      await refreshOrders(); // Actually fetch from database
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
    setIsRefreshingOrders(false);
  };

  // Auto-refresh orders every 30 seconds when on orders tab
  React.useEffect(() => {
    if (activeTab === 'orders') {
      const interval = setInterval(() => {
        refreshOrders();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab, refreshOrders]);

  // Auto-refresh analytics every 60 seconds when on analytics tab
  React.useEffect(() => {
    if (activeTab === 'analytics') {
      const interval = setInterval(() => {
        refreshOrders(); // Refresh data for analytics calculations
      }, 60000); // 60 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab, refreshOrders]);

  // Keep selectedOrder in sync with latest order data
  React.useEffect(() => {
    if (selectedOrder && isOrderDetailModalOpen) {
      const updatedOrder = orders.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders, isOrderDetailModalOpen]);

  const accessibleItems = currentAdmin?.isMasterAdmin
    ? foodItems
    : foodItems.filter(item => item.canteenId === currentAdmin?.canteenId);

  // Apply canteen filter (for master admin)
  const canteenFilteredItems = canteenFilter === 'All'
    ? accessibleItems
    : accessibleItems.filter(item => item.canteenId === canteenFilter);

  const filteredItems = categoryFilter === 'All'
    ? canteenFilteredItems
    : canteenFilteredItems.filter(item => item.category === categoryFilter);

  // Apply break time sort
  const breakTimeSortedItems = breakTimeSort === 'All'
    ? filteredItems
    : filteredItems.filter(item => item.breakTime === breakTimeSort);

  // Apply search filter
  const searchFilteredItems = foodItemSearchQuery.trim() === ''
    ? breakTimeSortedItems
    : breakTimeSortedItems.filter(item =>
      item.name.toLowerCase().includes(foodItemSearchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(foodItemSearchQuery.toLowerCase())
    );

  // Apply availability filter
  const displayedItems = availabilityFilter === 'All'
    ? searchFilteredItems
    : availabilityFilter === 'Active'
      ? searchFilteredItems.filter(item => item.isActive !== false)
      : searchFilteredItems.filter(item => item.isActive === false);

  // OPTIMISTIC STATE: Instant UI updates without waiting for database
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());

  // Get current state (optimistic first, then actual)
  const getToggleState = (item: FoodItem): boolean => {
    // Use local optimistic state if it exists
    if (item.id in toggleStates) {
      return toggleStates[item.id];
    }
    // Fallback to actual database state
    return item.isActive !== false;
  };

  // Fast toggle handler with instant UI update
  const handleToggleActive = async (item: FoodItem) => {
    // Prevent multiple rapid clicks on same item
    if (pendingToggles.has(item.id)) {
      return;
    }

    const currentState = getToggleState(item);
    const newState = !currentState;

    // 1. UPDATE UI INSTANTLY (0ms)
    setToggleStates(prev => ({ ...prev, [item.id]: newState }));
    setPendingToggles(prev => new Set([...prev, item.id]));

    // 2. UPDATE DATABASE IN BACKGROUND (non-blocking)
    try {
      const updatedItem = { ...item, isActive: newState };
      await updateFoodItem(updatedItem);

      // 3. Clean up after successful update
      setTimeout(() => {
        setToggleStates(prev => {
          const newStates = { ...prev };
          delete newStates[item.id]; // Remove from cache, use DB value now
          return newStates;
        });
        setPendingToggles(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }, 1000); // Keep optimistic state for 1 second
    } catch (error) {
      console.error('Toggle failed:', error);
      // Revert on error
      setToggleStates(prev => {
        const newStates = { ...prev };
        delete newStates[item.id];
        return newStates;
      });
      setPendingToggles(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const accessibleOrders = currentAdmin?.isMasterAdmin
    ? orders
    : orders.filter(order => order.canteenId === currentAdmin?.canteenId);

  const handleEditItem = (item: FoodItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteFoodItem(itemId);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: 'Pending' | 'Ready' | 'Completed') => {
    updateOrder(orderId, status);
  };

  // Handle stock quick update
  const handleStockUpdate = async (item: FoodItem, mode: 'have' | 'left') => {
    const value = mode === 'have' ? stockInputs.have : stockInputs.left;
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      alert('Please enter a valid number (0 or more)');
      return;
    }

    setStockUpdating(true);
    try {
      let newQuantity: number;
      if (mode === 'have') {
        // Set total stock directly
        newQuantity = numValue;
      } else {
        // Subtract items left (sold offline)
        newQuantity = Math.max(0, item.quantity - numValue);
      }

      const updatedItem = { ...item, quantity: newQuantity };
      await updateFoodItem(updatedItem);
      setStockInputs({ have: '', left: '' });
      setExpandedItemId(null);
    } catch (error) {
      console.error('Stock update failed:', error);
    }
    setStockUpdating(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Ready':
        return <AlertCircle className="w-4 h-4 text-green-500" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Define a mapping for Tailwind class names to ensure they are fully present
  // for Tailwind's JIT compiler.
  const statusColorsMap = {
    'Pending': {
      bg100: 'bg-yellow-100',
      bg400: 'bg-yellow-400',
    },
    'Preparing': {
      bg100: 'bg-blue-100',
      bg400: 'bg-blue-400',
    },
    'Ready': {
      bg100: 'bg-green-100',
      bg400: 'bg-green-400',
    },
    'Completed': {
      bg100: 'bg-gray-100',
      bg400: 'bg-gray-400',
    },
    'default': { // Fallback for any unknown status
      bg100: 'bg-gray-100',
      bg400: 'bg-gray-400',
    }
  };

  // Helper function to get the correct Tailwind class
  const getStatusClass = (status: string, type: 'bg100' | 'bg400') => {
    return (statusColorsMap[status as keyof typeof statusColorsMap] || statusColorsMap['default'])[type];
  };

  const stats = {
    totalItems: accessibleItems.length,
    totalOrders: accessibleOrders.length,
    totalRevenue: accessibleOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    pendingOrders: accessibleOrders.filter(order => order.status === 'Pending').length
  };


  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center justify-between p-3 md:p-4">
          {/* Logo and Admin Info */}
          <div className="flex items-center min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#FC8A14] to-[#D7263D] rounded-lg flex items-center justify-center text-white font-bold text-base md:text-xl shadow-md mr-2 md:mr-3 shrink-0">
              CQ
            </div>
            <div className="min-w-0">
              <h1 className="text-sm md:text-lg font-bold text-gray-800 truncate">
                {currentAdmin?.isMasterAdmin ? 'Master Admin' : 'Canteen Admin'}
              </h1>
              <p className="text-[10px] md:text-xs text-gray-600 truncate max-w-[120px] md:max-w-none">{currentAdmin?.email}</p>
            </div>
          </div>

          {/* Right side: Feedback + Logout (Mobile & Desktop) */}
          <div className="flex items-center gap-2">
            {/* Feedback Bell */}
            <AdminFeedbackBell />

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Profile and Settings (Desktop only) */}
          <div className="hidden md:flex items-center space-x-4">
            {!currentAdmin?.isMasterAdmin && (
              <div className="bg-blue-50 rounded-lg px-3 py-1">
                <p className="text-sm font-medium text-blue-700">
                  {canteens.find(c => c.id === currentAdmin?.canteenId)?.name || 'Your Canteen'}
                </p>
              </div>
            )}

            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                {currentAdmin?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="text-sm font-medium mr-2">
                {currentAdmin?.email?.split('@')[0] || 'Admin'}
              </span>
            </div>
            {currentAdmin?.isMasterAdmin && (
              <Button
                onClick={() => setIsSettingsModalOpen(true)}
                variant="secondary"
                className="flex items-center justify-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 py-1 px-3"
              >
                <Settings className="w-4 h-4" />
                <span>Payment Settings</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-friendly Top Navigation Menu */}
      <div className="flex overflow-x-auto scrollbar-hide border-t border-gray-100 bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-2 md:py-3 px-2 md:px-4 transition-colors ${activeTab === 'items' ? 'text-[#FC8A14] border-b-2 border-[#FC8A14]' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <ShoppingBag className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === 'items' ? 'text-[#FC8A14]' : 'text-gray-500'}`} />
          <span className="text-[10px] md:text-xs mt-0.5 md:mt-1 whitespace-nowrap">Food Items</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-2 md:py-3 px-2 md:px-4 transition-colors relative ${activeTab === 'orders' ? 'text-[#FC8A14] border-b-2 border-[#FC8A14]' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Package className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === 'orders' ? 'text-[#FC8A14]' : 'text-gray-500'}`} />
          <span className="text-[10px] md:text-xs mt-0.5 md:mt-1">Orders</span>
          {stats.pendingOrders > 0 && (
            <span className="absolute top-1 right-1 bg-red-100 text-red-600 text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {stats.pendingOrders}
            </span>
          )}
        </button>

        {currentAdmin?.isMasterAdmin && (
          <button
            onClick={() => setActiveTab('canteens')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center py-2 md:py-3 px-2 md:px-4 transition-colors ${activeTab === 'canteens' ? 'text-[#FC8A14] border-b-2 border-[#FC8A14]' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Coffee className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === 'canteens' ? 'text-[#FC8A14]' : 'text-gray-500'}`} />
            <span className="text-[10px] md:text-xs mt-0.5 md:mt-1">Canteens</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-2 md:py-3 px-2 md:px-4 transition-colors ${activeTab === 'analytics' ? 'text-[#FC8A14] border-b-2 border-[#FC8A14]' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <PieChart className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === 'analytics' ? 'text-[#FC8A14]' : 'text-gray-500'}`} />
          <span className="text-[10px] md:text-xs mt-0.5 md:mt-1">Analytics</span>
        </button>

        <button
          onClick={() => setIsQRScannerOpen(true)}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-2 md:py-3 px-2 md:px-4 transition-colors ${isQRScannerOpen ? 'text-[#FC8A14]' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <QrCode className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          <span className="text-[10px] md:text-xs mt-0.5 md:mt-1 whitespace-nowrap">QR Scan</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 py-3 px-3 md:py-4 md:px-6">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">
            {activeTab === 'items' ? 'Food Items' :
              activeTab === 'orders' ? 'Orders' :
                activeTab === 'canteens' ? 'Canteens' : 'Analytics'}
          </h2>
        </div>

        <div className="p-2 md:p-6">
          {activeTab === 'canteens' && currentAdmin?.isMasterAdmin && (
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Coffee className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Canteens</p>
                      <p className="text-2xl font-bold text-gray-800">{canteens.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Canteens</p>
                      <p className="text-2xl font-bold text-gray-800">{canteens.filter(c => c.isActive).length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Inactive Canteens</p>
                      <p className="text-2xl font-bold text-gray-800">{canteens.filter(c => !c.isActive).length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-8">
                <Button
                  onClick={() => setIsCanteenModalOpen(true)}
                  className="flex items-center space-x-2 bg-[#FC8A14] hover:bg-[#e07a0c] text-white px-5 py-2.5 rounded-lg shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Canteen</span>
                </Button>

                {currentAdmin?.isMasterAdmin && (
                  <Button
                    onClick={() => setIsCanteenAdminModalOpen(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Create Canteen Admin</span>
                  </Button>
                )}
              </div>

              {/* Canteens List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">All Canteens</h3>
                  <div className="text-sm text-gray-500">{canteens.length} canteens</div>
                </div>
                <div className="divide-y divide-gray-200">
                  {canteens.length > 0 ? canteens.map((canteen) => (
                    <div key={canteen.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition-colors sm:flex-wrap">
                      <div className="flex flex-row items-start space-x-4 flex-1">
                        <img
                          src={canteen.image}
                          alt={canteen.name}
                          className="w-20 h-20 sm:w-20 sm:h-20 rounded-xl object-cover shadow-sm flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-lg whitespace-normal">{canteen.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1 mb-2" style={{ wordBreak: 'break-word' }}>
                            <span className={`px-2 py-1 ${canteen.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-full text-xs font-medium`}>
                              {canteen.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                              {foodItems.filter(item => item.canteenId === canteen.id).length} Food Items
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row items-center space-x-3">
                        <button
                          onClick={() => {
                            setEditingCanteen(canteen);
                            setIsCanteenModalOpen(true);
                          }}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Edit Canteen"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to toggle the active status of this canteen?')) {
                              updateCanteen(canteen.id, {
                                isActive: !canteen.isActive
                              });
                            }
                          }}
                          className={`p-2.5 ${canteen.isActive ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} rounded-lg hover:${canteen.isActive ? 'bg-red-100' : 'bg-green-100'} transition-colors`}
                          title={canteen.isActive ? 'Deactivate Canteen' : 'Activate Canteen'}
                        >
                          {canteen.isActive ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to PERMANENTLY delete this canteen? This will also remove all its food items.')) {
                              deleteCanteen(canteen.id);
                            }
                          }}
                          className="p-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="Delete Canteen Permanently"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-gray-500">
                      <Coffee className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No canteens found</p>
                      <Button
                        onClick={() => setIsCanteenModalOpen(true)}
                        className="mt-4 bg-[#FC8A14] hover:bg-[#e07a0c] text-white px-4 py-2 rounded-lg shadow-sm inline-flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Your First Canteen</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                <div className="bg-white rounded-xl p-3 md:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                      <Package className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Total Items</p>
                      <p className="text-lg md:text-2xl font-bold text-gray-800">{stats.totalItems}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 md:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="p-2 md:p-3 bg-green-100 rounded-lg">
                      <Users className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-lg md:text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 md:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="p-2 md:p-3 bg-yellow-100 rounded-lg">
                      <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Revenue</p>
                      <p className="text-lg md:text-2xl font-bold text-gray-800 truncate">₹{stats.totalRevenue}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 md:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="p-2 md:p-3 bg-red-100 rounded-lg">
                      <Clock className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-lg md:text-2xl font-bold text-gray-800">{stats.pendingOrders}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 md:gap-4 mb-6 md:mb-8">
                <Button
                  onClick={() => setIsItemModalOpen(true)}
                  className="flex items-center space-x-2 bg-[#FC8A14] hover:bg-[#e07a0c] text-white px-5 py-2.5 rounded-lg shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Food Item</span>
                </Button>
                {currentAdmin?.isMasterAdmin && (
                  <Button
                    onClick={() => setIsCanteenModalOpen(true)}
                    variant="outline"
                    className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm border border-gray-200"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Canteen</span>
                  </Button>
                )}
              </div>

              {/* Filters: Break Time, Category, Availability */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                {/* Break Time Filter - AT THE TOP */}
                <div className="border-b border-gray-200">
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Break Time</p>
                  </div>
                  <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
                    {['All', 'Morning', 'Afternoon', 'Evening'].map((time) => (
                      <button
                        key={time}
                        onClick={() => setBreakTimeSort(time as 'All' | 'Morning' | 'Afternoon' | 'Evening')}
                        className={`flex-1 py-2 md:py-3 px-2 md:px-4 text-center text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${breakTimeSort === time ? 'text-[#FC8A14] border-b-2 border-[#FC8A14] bg-orange-50' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Tabs */}
                <div className="border-b border-gray-200">
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</p>
                  </div>
                  <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
                    {['All', 'Food', 'Drink', 'Snack'].map((category) => (
                      <button
                        key={category}
                        onClick={() => setCategoryFilter(category as 'All' | 'Food' | 'Drink' | 'Snack')}
                        className={`flex-1 py-2 md:py-3 px-2 md:px-4 text-center text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${categoryFilter === category ? 'text-[#FC8A14] border-b-2 border-[#FC8A14] bg-orange-50' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability Filter */}
                <div>
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Availability Status</p>
                  </div>
                  <div className="flex overflow-x-auto scrollbar-hide">
                    {['All', 'Active', 'Inactive'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setAvailabilityFilter(status as 'All' | 'Active' | 'Inactive')}
                        className={`flex-1 py-2 md:py-3 px-2 md:px-4 text-center text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${availabilityFilter === status ? 'text-[#FC8A14] border-b-2 border-[#FC8A14] bg-orange-50' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {status}
                        {status === 'Active' && ' 🟢'}
                        {status === 'Inactive' && ' 🔴'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search food items by name or category..."
                    value={foodItemSearchQuery}
                    onChange={(e) => setFoodItemSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent transition-all"
                  />
                  {foodItemSearchQuery && (
                    <button
                      onClick={() => setFoodItemSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Master Admin: Canteen Filter Dropdown */}
              {currentAdmin?.isMasterAdmin && canteens.length > 1 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📍 Filter by Canteen
                  </label>
                  <select
                    value={canteenFilter}
                    onChange={(e) => setCanteenFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent transition-all bg-white"
                  >
                    <option value="All">All Canteens ({accessibleItems.length} items)</option>
                    {canteens.map((canteen) => {
                      const itemCount = accessibleItems.filter(item => item.canteenId === canteen.id).length;
                      return (
                        <option key={canteen.id} value={canteen.id}>
                          {canteen.name} ({itemCount} items)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Food Items List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Food Items</h3>
                  <div className="text-sm text-gray-500">{displayedItems.length} items</div>
                </div>
                <div className="divide-y divide-gray-200">
                  {displayedItems.length > 0 ? displayedItems.map((item) => (
                    <div key={item.id} className="border-b border-gray-200 last:border-b-0">
                      {/* Main Item Row */}
                      <div
                        className={`p-3 md:p-5 flex flex-row items-start justify-between hover:bg-gray-50 transition-colors gap-2 cursor-pointer ${expandedItemId === item.id ? 'bg-orange-50 border-l-4 border-l-[#FC8A14]' : ''}`}
                        onClick={() => {
                          if (expandedItemId === item.id) {
                            setExpandedItemId(null);
                            setStockInputs({ have: '', left: '' });
                          } else {
                            setExpandedItemId(item.id);
                            setStockInputs({ have: String(item.quantity), left: '' });
                          }
                        }}
                      >
                        <div className="flex flex-row items-start space-x-2 md:space-x-4 flex-1 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 md:w-20 md:h-20 rounded-xl object-cover shadow-sm flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 text-sm md:text-lg whitespace-normal truncate">{item.name}</h4>
                            <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1 mb-1 md:mb-2" style={{ wordBreak: 'break-word' }}>
                              <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-100 rounded-full text-[10px] md:text-xs font-medium text-gray-600">{item.category}</span>
                              {item.allTimeAvailable ? (
                                <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-green-100 text-green-700 rounded-full text-[10px] md:text-xs font-medium">
                                  ⏰ All Time
                                </span>
                              ) : (
                                <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-100 rounded-full text-[10px] md:text-xs font-medium text-gray-600">{item.breakTime}</span>
                              )}
                              <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-100 rounded-full text-[10px] md:text-xs font-medium text-gray-600">Stock: {item.quantity}</span>
                            </div>
                            <p className="text-base md:text-xl font-bold text-[#FC8A14]">₹{item.price}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2 md:space-y-3 shrink-0">
                          {/* Edit and Delete Buttons */}
                          <div className="flex flex-row items-center space-x-1.5 md:space-x-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditItem(item); }}
                              className="p-1.5 md:p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Edit Item"
                            >
                              <Edit className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                              className="p-1.5 md:p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                          </div>

                          {/* Smooth Toggle Switch - Below Buttons */}
                          <label
                            className={`relative inline-flex items-center cursor-pointer group transition-opacity ${pendingToggles.has(item.id) ? 'opacity-60' : 'opacity-100'
                              }`}
                            title={getToggleState(item) ? 'Click to mark as out of stock' : 'Click to activate item'}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={getToggleState(item)}
                              onChange={() => handleToggleActive(item)}
                              disabled={pendingToggles.has(item.id)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 md:w-14 md:h-7 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 md:after:h-6 md:after:w-6 after:transition-transform after:duration-200 peer-checked:bg-green-500 transition-colors duration-200">
                            </div>
                            <span className={`ml-1 md:ml-2 text-[10px] md:text-xs font-medium ${getToggleState(item) ? 'text-green-600' : 'text-red-600'
                              }`}>
                              {getToggleState(item) ? 'Active' : 'Inactive'}
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Expanded Stock Management Panel */}
                      {expandedItemId === item.id && (
                        <div
                          className="px-3 md:px-5 pb-4 pt-2 bg-gradient-to-b from-orange-50 to-white border-l-4 border-l-[#FC8A14]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Current Stock Display */}
                          <div className="flex items-center justify-center mb-3">
                            <div className="bg-white border-2 border-[#FC8A14] rounded-full px-4 py-1.5 shadow-sm">
                              <span className="text-xs md:text-sm text-gray-500">Current Stock: </span>
                              <span className="text-lg md:text-xl font-bold text-[#FC8A14]">{item.quantity}</span>
                            </div>
                          </div>

                          {/* Stock Input Boxes */}
                          <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {/* LEFT: Items Left (Red - Subtract) */}
                            <div className="relative">
                              <label className="block text-xs md:text-sm font-bold text-red-700 mb-1.5 text-center">
                                🔴 Items Sold / Left
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  inputMode="numeric"
                                  placeholder="0"
                                  value={stockInputs.left}
                                  onChange={(e) => setStockInputs(prev => ({ ...prev, left: e.target.value }))}
                                  className="w-full text-center text-2xl md:text-3xl font-bold py-4 md:py-5 px-3 border-4 border-red-400 bg-red-50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-300 focus:border-red-600 text-red-700 placeholder-red-300 transition-all"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {stockInputs.left && parseInt(stockInputs.left) > 0 && (
                                  <div className="mt-1.5 text-center">
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                      Stock: {item.quantity} → {Math.max(0, item.quantity - parseInt(stockInputs.left))}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStockUpdate(item, 'left');
                                }}
                                disabled={!stockInputs.left || stockUpdating}
                                className="w-full mt-2 py-2.5 md:py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold text-sm md:text-base rounded-xl transition-all shadow-md disabled:shadow-none"
                              >
                                {stockUpdating ? '⏳ Updating...' : '➖ Subtract'}
                              </button>
                            </div>

                            {/* RIGHT: Items Have (Green - Set Total) */}
                            <div className="relative">
                              <label className="block text-xs md:text-sm font-bold text-green-700 mb-1.5 text-center">
                                🟢 Items Have
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  inputMode="numeric"
                                  placeholder={String(item.quantity)}
                                  value={stockInputs.have}
                                  onChange={(e) => setStockInputs(prev => ({ ...prev, have: e.target.value }))}
                                  className="w-full text-center text-2xl md:text-3xl font-bold py-4 md:py-5 px-3 border-4 border-green-400 bg-green-50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-600 text-green-700 placeholder-green-300 transition-all"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {stockInputs.have && parseInt(stockInputs.have) !== item.quantity && (
                                  <div className="mt-1.5 text-center">
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                      Stock: {item.quantity} → {parseInt(stockInputs.have)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStockUpdate(item, 'have');
                                }}
                                disabled={!stockInputs.have || stockUpdating}
                                className="w-full mt-2 py-2.5 md:py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold text-sm md:text-base rounded-xl transition-all shadow-md disabled:shadow-none"
                              >
                                {stockUpdating ? '⏳ Updating...' : '✅ Set Stock'}
                              </button>
                            </div>
                          </div>

                          {/* Quick Tip */}
                          <p className="text-[10px] md:text-xs text-gray-400 text-center mt-2">
                            Use <span className="text-red-500 font-semibold">Red</span> to subtract items sold offline · Use <span className="text-green-500 font-semibold">Green</span> to set total stock
                          </p>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="p-8 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>{categoryFilter === 'All' ? 'No food items found' : `No ${categoryFilter} items found`}</p>
                      <Button
                        onClick={() => setIsItemModalOpen(true)}
                        className="mt-4 bg-[#FC8A14] hover:bg-[#e07a0c] text-white px-4 py-2 rounded-lg shadow-sm inline-flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{categoryFilter === 'All' ? 'Add Your First Item' : `Add ${categoryFilter} Item`}</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              {/* Order Status Summary */}
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-6 mb-6 md:mb-8">
                {['Pending', 'Ready', 'Completed'].map(status => {
                  const count = accessibleOrders.filter(order => order.status === status).length;

                  return (
                    <div
                      key={status}
                      className={`bg-white rounded-xl p-3 md:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer ${orderStatusFilter === status ? 'ring-2 ring-[#FC8A14]' : ''}`}
                      onClick={() => setOrderStatusFilter(status as any)}
                    >
                      <div className="flex flex-col md:flex-row items-center md:space-x-4 text-center md:text-left">
                        <div className={`p-2 md:p-3 ${getStatusClass(status, 'bg100')} rounded-lg mb-1 md:mb-0`}>
                          {getStatusIcon(status)}
                        </div>
                        <div>
                          <p className="text-xs md:text-sm font-medium text-gray-600">{status}</p>
                          <p className="text-xl md:text-2xl font-bold text-gray-800">{count}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Status Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
                  {['All', 'Pending', 'Ready', 'Completed'].map((tab) => {
                    const count = tab === 'All'
                      ? accessibleOrders.length
                      : accessibleOrders.filter(order => order.status === tab).length;

                    return (
                      <button
                        key={tab}
                        onClick={() => setOrderStatusFilter(tab as any)}
                        className={`flex items-center justify-center px-6 py-3 whitespace-nowrap text-sm font-medium transition-colors relative ${orderStatusFilter === tab
                          ? 'text-[#FC8A14] border-b-2 border-[#FC8A14]'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}
                      >
                        {tab}
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${orderStatusFilter === tab
                          ? 'bg-[#FC8A14] text-white'
                          : tab === 'Pending' ? 'bg-yellow-100 text-yellow-700'
                            : tab === 'Preparing' ? 'bg-blue-100 text-blue-700'
                              : tab === 'Ready' ? 'bg-green-100 text-green-700'
                                : tab === 'Completed' ? 'bg-gray-100 text-gray-700'
                                  : 'bg-gray-100 text-gray-700'}`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Orders List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                      {/* Search Input */}
                      <div className="relative flex-1 sm:flex-initial">
                        <input
                          type="text"
                          placeholder="Search by Order ID..."
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          className="w-full sm:w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
                        />
                        <Package className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                      <div className="text-sm text-gray-500">
                        {accessibleOrders.filter(order => {
                          const matchesStatus = orderStatusFilter === 'All' || order.status === orderStatusFilter;
                          const matchesSearch = orderSearchQuery === '' ||
                            order.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                            order.userEmail.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                            order.id.toLowerCase().includes(orderSearchQuery.toLowerCase());
                          return matchesStatus && matchesSearch;
                        }).length} orders
                      </div>
                      <button
                        onClick={handleRefreshOrders}
                        disabled={isRefreshingOrders}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#FC8A14] text-white rounded-lg hover:bg-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        title="Refresh orders"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                        <span className="text-sm">{isRefreshingOrders ? 'Refreshing...' : 'Refresh'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {(() => {
                  const filteredOrders = accessibleOrders
                    .filter(order => {
                      const matchesStatus = orderStatusFilter === 'All' || order.status === orderStatusFilter;
                      const matchesSearch = orderSearchQuery === '' ||
                        order.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                        order.userEmail.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                        order.id.toLowerCase().includes(orderSearchQuery.toLowerCase());
                      return matchesStatus && matchesSearch;
                    })
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                  if (filteredOrders.length === 0) {
                    return (
                      <div className="p-8 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No {orderStatusFilter !== 'All' ? orderStatusFilter.toLowerCase() : ''} orders found</p>
                        {orderStatusFilter !== 'All' && (
                          <button
                            onClick={() => setOrderStatusFilter('All')}
                            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                          >
                            View all orders
                          </button>
                        )}
                      </div>
                    );
                  }

                  // Group orders by date
                  const groupedOrders: { [date: string]: typeof filteredOrders } = {};
                  filteredOrders.forEach(order => {
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
                    <div>
                      {Object.entries(groupedOrders).map(([dateLabel, dateOrders]) => (
                        <div key={dateLabel}>
                          {/* Central Date Label */}
                          <div className="sticky top-0 z-[5] py-2.5 md:py-3 px-3 md:px-4 border-b border-orange-200">
                            <div className="flex items-center justify-center gap-2 md:gap-3">
                              <div className="h-px bg-orange-200 flex-1" />
                              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 bg-gradient-to-r from-[#FC8A14] to-[#e07a0c] rounded-full shadow-md">
                                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                                <span className="text-xs md:text-sm font-bold text-white">{dateLabel}</span>
                              </div>
                              <div className="h-px bg-orange-200 flex-1" />
                            </div>
                          </div>

                          {/* Orders for this date */}
                          <div className="divide-y divide-gray-200">
                            {dateOrders.map((order) => (
                              <div
                                key={order.id}
                                className="p-3 md:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsOrderDetailModalOpen(true);
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                      <h4 className="font-bold text-gray-800 text-base md:text-lg">#{order.orderNumber}</h4>
                                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                        order.status === 'Ready' ? 'bg-green-100 text-green-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                        <div className="flex items-center space-x-1">
                                          {getStatusIcon(order.status)}
                                          <span>{order.status}</span>
                                        </div>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500">
                                      <div className="flex items-center space-x-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>
                                          {new Date(order.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                          })}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Package className="w-3.5 h-3.5" />
                                        <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 md:gap-4 shrink-0">
                                    <div className="text-right">
                                      <p className="text-[10px] md:text-xs text-gray-400 uppercase">Total</p>
                                      <p className="text-lg md:text-xl font-bold text-[#FC8A14]">₹{order.totalAmount}</p>
                                    </div>
                                    <button
                                      className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <EnhancedAnalytics
              orders={accessibleOrders as any}
              canteens={canteens}
              isMasterAdmin={currentAdmin?.isMasterAdmin}
              commissionRate={1}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <FoodItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
      />

      {
        currentAdmin?.isMasterAdmin && (
          <CanteenModal
            isOpen={isCanteenModalOpen}
            onClose={() => {
              setIsCanteenModalOpen(false);
              setEditingCanteen(null);
            }}
            editingCanteen={editingCanteen}
          />
        )
      }

      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />

      {/* Admin Settings Modal */}
      <AdminSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={updateAdminBankDetails}
        currentBankDetails={currentAdmin?.bankDetails as AdminBankDetails | undefined}
      />

      <CanteenAdminModal
        isOpen={isCanteenAdminModalOpen}
        onClose={() => setIsCanteenAdminModalOpen(false)}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={isOrderDetailModalOpen}
        onClose={() => {
          setIsOrderDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onUpdateStatus={handleUpdateOrderStatus}
      />
    </div>
  );
};

export default AdminDashboard;