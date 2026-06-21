import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, Star, ChevronDown, ChevronUp, Store, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import ReviewList from '../common/ReviewList';
import { useNavigation } from '../../context/NavigationContext';
import { supabase } from '../../lib/supabase';
import { CartItem } from '../../types';

import { loadRazorpayScript, createRazorpayOrder, openRazorpayCheckout, verifyRazorpayPayment } from '../../utils/razorpayUtils';

const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateCartQuantity, clearCart, placeOrder, addReview, setSelectedCanteen, canteens } = useApp();
  const { currentUser, isAuthenticated } = useAuth();
  const { handleTabChange } = useNavigation();

  // Function to get canteen name by ID
  const getCanteenById = (canteenId: string) => {
    return canteens.find(c => c.id === canteenId);
  };

  const getCanteenName = (canteenId: string) => {
    const canteen = getCanteenById(canteenId);
    return canteen ? canteen.name : 'Unknown Canteen';
  };
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [expandedReviews, setExpandedReviews] = useState<{ [key: string]: boolean }>({});
  const [realTimeStock, setRealTimeStock] = useState<{ [key: string]: number }>({});
  const [isRefreshingStock, setIsRefreshingStock] = useState(false);

  // Generate a unique key for each item based on id and canteenId
  const getItemKey = (item: CartItem) => `${item.id}_${item.canteenId}`;

  // Function to fetch real-time stock information from the database
  const fetchRealTimeStock = async () => {
    if (cart.length === 0) return;

    setIsRefreshingStock(true);
    try {
      // Get all unique food item IDs from the cart
      const foodItemIds = [...new Set(cart.map(item => item.id))];

      // Fetch the latest stock information from the database
      const { data, error } = await supabase
        .from('food_items')
        .select('id, quantity')
        .in('id', foodItemIds);

      if (error) throw error;

      // Update the real-time stock state
      const stockMap = data.reduce((acc, item) => {
        acc[item.id] = item.quantity;
        return acc;
      }, {} as { [key: string]: number });

      setRealTimeStock(stockMap);
    } catch (error) {
      console.error('Error fetching real-time stock:', error);
    } finally {
      setIsRefreshingStock(false);
    }
  };

  // Initialize selected items - only select the LAST added item (newest)
  useEffect(() => {
    if (cart.length === 0) {
      setSelectedItems({});
      return;
    }

    // Only select the last item (most recently added)
    const initialSelectedState: { [key: string]: boolean } = {};

    // The last item in the cart array is the most recently added
    const lastItem = cart[cart.length - 1];
    initialSelectedState[getItemKey(lastItem)] = true;

    // All other items are deselected
    cart.slice(0, -1).forEach(item => {
      initialSelectedState[getItemKey(item)] = false;
    });

    setSelectedItems(initialSelectedState);

    // Fetch real-time stock information when cart changes
    fetchRealTimeStock();

    // Set up periodic refresh of stock information (every 30 seconds)
    const intervalId = setInterval(() => {
      if (cart.length > 0) {
        fetchRealTimeStock();
      }
    }, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [cart]);

  // Function to get the latest stock for an item
  const getLatestStock = (item: CartItem) => {
    return realTimeStock[item.id] !== undefined ? realTimeStock[item.id] : item.quantity;
  };

  // Calculate total amount based on selected items only
  const totalAmount = cart.reduce((sum, item) => {
    if (selectedItems[getItemKey(item)]) {
      return sum + (item.price * item.cartQuantity);
    }
    return sum;
  }, 0);

  const totalItems = cart.reduce((sum, item) => {
    if (selectedItems[getItemKey(item)]) {
      return sum + item.cartQuantity;
    }
    return sum;
  }, 0);

  // Toggle item selection
  const toggleItemSelection = (item: CartItem) => {
    const key = getItemKey(item);
    setSelectedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Get only selected items from cart
  const getSelectedItems = () => {
    return cart.filter(item => selectedItems[getItemKey(item)]);
  };

  const handleCheckout = async () => {
    console.log('handleCheckout called. currentUser:', currentUser);
    console.log('isAuthenticated:', isAuthenticated);

    // Refresh stock information before checkout
    await fetchRealTimeStock();

    const selectedCartItems = getSelectedItems();

    if (selectedCartItems.length === 0) {
      alert('Please select at least one item to checkout!');
      return;
    }

    // Verify canteen status for all selected items
    const closedCanteenItems = selectedCartItems.filter(item => {
      const canteen = getCanteenById(item.canteenId);
      return !canteen || !canteen.isActive;
    });

    if (closedCanteenItems.length > 0) {
      const itemNames = closedCanteenItems.map(item => item.name).join(', ');
      alert(`The following items are from canteens that are currently closed: ${itemNames}. Please deselect or remove them.`);
      return;
    }

    // Verify stock availability for all selected items
    const stockIssues = selectedCartItems.filter(item => item.cartQuantity > getLatestStock(item));
    if (stockIssues.length > 0) {
      const itemNames = stockIssues.map(item => item.name).join(', ');
      alert(`Some items have insufficient stock: ${itemNames}. Please update your cart.`);
      return;
    }

    if (!currentUser) {
      alert('Please login to place an order');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Generate a temporary order number
      const tempOrderNumber = `ORD${Date.now()}`;

      // Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Create Razorpay order with only selected items
      const orderData = await createRazorpayOrder(
        selectedCartItems,
        currentUser.email,
        currentUser.id,
        tempOrderNumber
      );

      // Open Razorpay checkout
      openRazorpayCheckout(
        orderData,
        currentUser.email,
        async (paymentResponse) => {
          // On successful payment
          try {
            // Verify payment
            const isVerified = await verifyRazorpayPayment(paymentResponse);

            if (isVerified) {
              // Place order in the system with only selected items
              const orderNumber = await placeOrder(selectedCartItems, currentUser.email, currentUser.id);
              alert(`🎉 Order placed successfully!\n\nOrder Number: ${orderNumber}\n\nYou will receive a notification when your order is ready for pickup.`);

              // Remove selected items from cart
              selectedCartItems.forEach(item => removeFromCart(item.id));
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Error processing payment:', error);
            alert('Failed to process payment. Please try again.');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        (error) => {
          // On payment failure
          console.error('Razorpay payment failed:', error);
          if (error instanceof Error && error.message === 'Payment cancelled or abandoned by user') {
            // User just closed the modal, no need to alert
          } else {
            alert('Payment failed. Please try again.');
          }
          setIsProcessingPayment(false);
        }
      );
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Failed to initialize payment. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  // Handle opening the review modal
  const handleOpenReview = (itemId: string) => {
    setReviewItem(itemId);
    setReviewRating(5); // Reset rating
    setReviewComment(''); // Reset comment
    setShowReviewModal(true);
  };

  // Toggle expanded reviews for an item
  const toggleReviews = (itemId: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Handle submitting a review
  const handleSubmitReview = async () => {
    if (reviewItem) {
      const result = await addReview(reviewItem, reviewRating, reviewComment);

      if (result) {
        alert('Thank you for your review!');
      } else {
        alert('Failed to submit review. Please try again.');
      }
      setShowReviewModal(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some delicious items to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800">Your Cart</h1>
            <button
              onClick={fetchRealTimeStock}
              className="ml-2 p-1 text-gray-400 hover:text-blue-500 transition-colors flex items-center"
              disabled={isRefreshingStock || cart.length === 0}
              title="Refresh all stock information"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshingStock ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh Stock</span>
            </button>
          </div>
          <button
            onClick={clearCart}
            className="text-[#D7263D] hover:text-red-700 text-sm font-semibold"
          >
            Clear All
          </button>
        </div>
        <p className="text-sm text-gray-600">{totalItems} items</p>
      </div>

      {/* Previous Orders Section removed as requested */}

      {/* Cart Items */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Group cart items by name to identify duplicates from different canteens */}
        {cart.map((item) => (
          <div key={getItemKey(item)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
            <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:space-x-4">
              {/* Checkbox for item selection */}
              <div className="flex items-center mr-2">
                <input
                  type="checkbox"
                  id={`select-${getItemKey(item)}`}
                  checked={selectedItems[getItemKey(item)] || false}
                  onChange={() => toggleItemSelection(item)}
                  className="w-4 h-4 text-[#FC8A14] rounded focus:ring-[#FC8A14]"
                />
              </div>

              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                onClick={() => {
                  // Set the selected item in the app context
                  setSelectedCanteen(item.canteenId);
                  // Switch to home tab which will show the menu
                  handleTabChange('home');
                }}
              />

              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3
                      className="font-semibold text-gray-800 truncate cursor-pointer"
                      onClick={() => {
                        // Set the selected item in the app context
                        setSelectedCanteen(item.canteenId);
                        // Switch to home tab which will show the menu
                        handleTabChange('home');
                      }}
                    >
                      {item.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <div className="flex items-center text-xs sm:text-sm">
                        <Store className="w-3 h-3 mr-1 text-gray-500" />
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium whitespace-nowrap">
                          {getCanteenName(item.canteenId)}
                        </span>
                      </div>
                      {!getCanteenById(item.canteenId)?.isActive && (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold uppercase animate-pulse">
                          Canteen Closed
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">{item.category}</p>
                    <div className="flex items-center">
                      <p className="text-xs text-gray-500">Stock Available:
                        <span className={getLatestStock(item) > 5 ? "text-green-500" : "text-orange-500"}>
                          {getLatestStock(item)}
                        </span>
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchRealTimeStock();
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        disabled={isRefreshingStock}
                        title="Refresh stock information"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshingStock ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex">
                    <button
                      onClick={() => handleOpenReview(item.id)}
                      className="p-1 mr-2 text-gray-400 hover:text-yellow-500 transition-colors"
                      title="Add Review"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-gray-400 hover:text-[#D7263D] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                  <span className="text-lg font-bold text-[#FC8A14]">₹{item.price}</span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      disabled={item.cartQuantity <= 1}
                    >
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                    </button>

                    <span className="font-semibold w-5 sm:w-8 text-center text-sm sm:text-base">{item.cartQuantity}</span>

                    <button
                      onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${item.cartQuantity >= getLatestStock(item) ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#FC8A14] hover:bg-orange-600'}`}
                      disabled={item.cartQuantity >= getLatestStock(item)}
                      title={item.cartQuantity >= getLatestStock(item) ? 'Maximum stock reached' : 'Add one more'}
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <button
                    onClick={() => toggleReviews(item.id)}
                    className="flex items-center text-xs text-blue-500 hover:text-blue-700"
                  >
                    {expandedReviews[item.id] ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        Hide Reviews
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Show Reviews
                      </>
                    )}
                  </button>
                  <span className="text-sm text-gray-600">
                    Subtotal: ₹{item.price * item.cartQuantity}
                  </span>
                </div>
              </div>
            </div>

            {/* Reviews section */}
            {expandedReviews[item.id] && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <h4 className="text-sm font-medium mb-2">Reviews</h4>
                <ReviewList foodItemId={item.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bill Summary */}
      {(() => {
        // Calculate in paise (integer math) to match Razorpay's actual billing
        const amountPaise = Math.round(totalAmount * 100);
        const platformFeePaise = Math.round(amountPaise * 0.01);
        const razorpayAmountPaise = amountPaise + platformFeePaise;
        
        // Razorpay charges 2% rounded, and 18% GST on the fee.
        // Tax systems usually enforce a minimum 1 paisa GST if fee is non-zero.
        const convenienceFeePaise = Math.round(razorpayAmountPaise * 0.02);
        const gstOnConveniencePaise = convenienceFeePaise > 0 
          ? Math.max(1, Math.round(convenienceFeePaise * 0.18)) 
          : 0;
          
        const totalRazorpayFeePaise = convenienceFeePaise + gstOnConveniencePaise;
        const grandTotalPaise = razorpayAmountPaise + totalRazorpayFeePaise;

        return (
          <div className="mx-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Bill Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (1%)</span>
                <span>₹{(platformFeePaise / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Convenience Charges (2%)</span>
                <span>₹{(convenienceFeePaise / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST on Convenience Charges</span>
                <span>₹{(gstOnConveniencePaise / 100).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Grand Total</span>
                  <span className="text-[#FC8A14]">
                    ₹{(grandTotalPaise / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Checkout Button */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button
          onClick={handleCheckout}
          className="w-full"
          size="lg"
          disabled={isProcessingPayment || totalItems === 0}
        >
          <ShoppingBag className="w-5 h-5" />
          {isProcessingPayment ? 'Processing...' : `Proceed to Payment via UPI`}
        </Button>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Your Review</h3>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`p-1 ${reviewRating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                    type="button"
                  >
                    <Star className={`w-6 h-6 ${reviewRating >= star ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Comment</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Share your experience..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="px-4 py-2 bg-[#FC8A14] text-white rounded-md"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;