import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Star, Plus, Minus, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Category, FoodItem } from '../../types';
import Button from '../common/Button';
import ReviewSection from './ReviewSection';
import { supabase } from '../../lib/supabase';
import { loadRazorpayScript, createRazorpayOrder, openRazorpayCheckout, verifyRazorpayPayment } from '../../utils/razorpayUtils';
import { useDebounce } from '../../utils/performanceUtils';

interface MenuPageProps {
  onBack: () => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ onBack }) => {
  const {
    foodItems,
    selectedCanteen,
    selectedBreakTime,
    selectedCategory,
    setSelectedCategory,
    addToCart,
    placeOrder,
    canteens,
    updateFoodItem
  } = useApp();
  const { currentUser } = useAuth();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showItemDetail, setShowItemDetail] = useState<FoodItem | null>(null);
  const [realtimeFoodItems, setRealtimeFoodItems] = useState<Record<string, FoodItem>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const canteen = canteens.find(c => c.id === selectedCanteen);
  const categories: Category[] = ['Food', 'Drink', 'Snack'];

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized filtered items - prevents recalculation on every render
  const filteredItems = useMemo(() => {
    // If canteen is inactive, show nothing
    if (canteen && !canteen.isActive) return [];

    let filtered = foodItems.filter(item =>
      item.canteenId === selectedCanteen &&
      (item.breakTime === selectedBreakTime || item.allTimeAvailable) &&
      (!selectedCategory || item.category === selectedCategory) &&
      item.isActive !== false // Only show active items to users
    );

    // Apply search filter if there's a query
    if (debouncedSearchQuery.trim() !== '') {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [foodItems, selectedCanteen, selectedBreakTime, selectedCategory, debouncedSearchQuery, canteen]);

  // Set up real-time subscription to food_items table
  useEffect(() => {
    // Initialize realtimeFoodItems with current foodItems
    const initialFoodItems: Record<string, FoodItem> = {};
    foodItems.forEach(item => {
      initialFoodItems[item.id] = item;
    });
    setRealtimeFoodItems(initialFoodItems);

    // Subscribe to changes in the food_items table
    const subscription = supabase
      .channel('food_items_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'food_items' },
        (payload) => {
          // Handle different types of changes
          if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as FoodItem;
            setRealtimeFoodItems(prev => ({
              ...prev,
              [updatedItem.id]: updatedItem
            }));

            // If the updated item is currently being viewed in detail, update it
            if (showItemDetail && showItemDetail.id === updatedItem.id) {
              setShowItemDetail(updatedItem);
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [foodItems]);

  // Helper function to get the most up-to-date item data
  const getLatestItem = (item: FoodItem): FoodItem => {
    return realtimeFoodItems[item.id] || item;
  };

  const handleQuantityChange = (itemId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 1) + change)
    }));
  };

  const handleAddToCart = (item: FoodItem) => {
    // Use the latest item data when adding to cart
    const latestItem = getLatestItem(item);
    const quantity = quantities[latestItem.id] || 1;
    if (quantity <= 0) {
      alert('Please select a valid quantity');
      return;
    }

    addToCart(latestItem, quantity);
    setShowItemDetail(null);
  };

  const handleBuyNow = async (item: FoodItem) => {
    if (!currentUser) {
      alert('Please login to place an order');
      return;
    }

    const quantity = quantities[item.id] || 1;

    try {
      // Generate a temporary order number
      const tempOrderNumber = `ORD${Date.now()}`;

      // Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Create cart item for order placement
      const cartItems = [{ ...item, cartQuantity: quantity }];

      // Create Razorpay order
      const orderData = await createRazorpayOrder(
        cartItems,
        currentUser.email,
        currentUser.id,
        tempOrderNumber
      );

      // Open Razorpay checkout
      openRazorpayCheckout(
        orderData,
        currentUser.email,
        async (paymentResponse: any) => {
          // On successful payment
          try {
            // Verify payment
            const isVerified = await verifyRazorpayPayment(paymentResponse);

            if (isVerified) {
              // Create a copy of the item with reduced quantity for the database update
              const updatedItem = {
                ...item,
                quantity: Math.max(0, item.quantity - quantity)
              };

              // Place order in the system
              const orderNumber = await placeOrder(cartItems, currentUser.email, currentUser.id);

              // Update the food item quantity in the database
              updateFoodItem(updatedItem);

              alert(`🎉 Order placed successfully!\n\nOrder Number: ${orderNumber}\n\nYou will receive a notification when your order is ready for pickup.`);
              setQuantities(prev => ({ ...prev, [item.id]: 1 }));
              // Close the item detail view to prevent navigation issues
              setShowItemDetail(null);
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Error processing payment:', error);
            alert('Failed to process payment. Please try again.');
          }
        },
        (error: any) => {
          // On payment failure
          console.error('Razorpay payment failed:', error);
          if (error instanceof Error && error.message === 'Payment cancelled or abandoned by user') {
            // User just closed the modal, no need to alert
          } else {
            alert('Payment failed. Please try again.');
          }
        }
      );
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Failed to initialize payment. Please try again.');
    }
  };

  // These functions are no longer needed as the review system is now self-contained
  // in the ReviewSection component with the AddReviewForm integration

  if (showItemDetail) {
    const item = showItemDetail;
    const quantity = quantities[item.id] || 1;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 bg-white shadow-sm p-4 flex items-center space-x-3">
          <button onClick={() => setShowItemDetail(null)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">{item.name}</h1>
        </div>

        {/* Item Detail */}
        <div className="bg-white">
          <div className="relative h-64">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center space-x-1">
              <Star className="w-4 h-4 text-[#FFD500]" />
              <span className="text-sm font-semibold">{getLatestItem(item).rating || 5}</span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 break-words">{item.name}</h2>
            <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
              <span className="text-xl sm:text-2xl font-bold text-[#FC8A14]">₹{item.price}</span>
              <span className="px-3 py-1 bg-[#FFD500] text-gray-800 rounded-full text-sm font-semibold">
                {item.category}
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="flex flex-wrap items-center justify-between py-4 sm:py-6 border-t border-gray-100 gap-2">
              <span className="text-base sm:text-lg font-semibold text-gray-800">Quantity</span>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                  onClick={() => handleQuantityChange(item.id, -1)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-lg sm:text-xl font-semibold w-6 sm:w-8 text-center">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.id, 1)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FC8A14] hover:bg-orange-600 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-gray-100 pt-4">
              <ReviewSection
                foodItemId={item.id}
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <Button
              onClick={() => handleAddToCart(item)}
              className="flex-1 bg-[#FC8A14] hover:bg-orange-600 text-white border-0"
            >
              Add to Cart
            </Button>
            <Button
              onClick={() => handleBuyNow(item)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-sm p-4">
        <div className="flex items-center space-x-3 mb-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{canteen?.name}</h1>
            <p className="text-sm text-gray-600">{selectedBreakTime} Menu</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${!selectedCategory
              ? 'bg-[#FC8A14] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${selectedCategory === category
                ? 'bg-[#FC8A14] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => setShowItemDetail(item)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="w-full h-32 sm:w-24 sm:h-24 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-800 truncate mr-2 max-w-[70%]">{item.name}</h3>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Star className="w-4 h-4 text-[#FFD500]" />
                      <span className="text-sm font-medium text-gray-600">{getLatestItem(item).rating || 5}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {item.category}
                  </div>
                  <div className="flex flex-wrap justify-between items-end gap-2">
                    <span className="text-lg font-bold text-[#FC8A14]">₹{item.price}</span>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">Stock: {item.quantity}</span>
                      <div className="flex items-center mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                          className="px-3 py-1 bg-[#FC8A14] text-white text-xs rounded-full hover:bg-orange-600 transition-colors"
                          disabled={item.quantity <= 0}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No items available</h3>
            <p className="text-gray-500">Try selecting a different category or break time</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;