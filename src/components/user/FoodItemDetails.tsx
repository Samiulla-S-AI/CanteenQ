import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Plus, Minus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { FoodItem } from '../../types';
import Button from '../common/Button';
import ReviewSection from './ReviewSection';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../common/Header';
import { loadRazorpayScript, createRazorpayOrder, openRazorpayCheckout, verifyRazorpayPayment } from '../../utils/razorpayUtils';

const FoodItemDetails: React.FC = () => {
  const { foodItems, addToCart, canteens, updateFoodItem, placeOrder } = useApp();
  const { currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [canteenName, setCanteenName] = useState<string>('Unknown Canteen');

  useEffect(() => {
    if (id && foodItems.length > 0) {
      const foundItem = foodItems.find(item => item.id === id);
      if (foundItem) {
        // Find canteen
        const canteen = canteens.find(c => c.id === foundItem.canteenId);

        // ONLY show if canteen is active AND item is active
        if (canteen && canteen.isActive && foundItem.isActive !== false) {
          setItem(foundItem);
          if (canteen.name) {
            setCanteenName(canteen.name);
          }
        } else {
          setItem(null);
        }
      } else {
        setItem(null);
      }
      setLoading(false);
    }
  }, [id, foodItems, canteens]);

  const handleQuantityChange = (change: number) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  const handleAddToCart = () => {
    if (item) {
      addToCart(item, quantity);
      navigate('/'); // Navigate back to home after adding to cart
    }
  };

  const handleBuyNow = async () => {
    if (!item) return;
    if (!currentUser) {
      alert('Please login to place an order');
      return;
    }

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
        async (paymentResponse) => {
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
              // Use replace instead of push to prevent back navigation to payment page
              navigate('/', { replace: true });
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Error processing payment:', error);
            alert('Failed to process payment. Please try again.');
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
        }
      );
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Failed to initialize payment. Please try again.');
    }
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Item Not Found" showProfile={true} />
        <div className="p-4 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Food item not found</h3>
          <p className="text-gray-500 mb-4">The item you're looking for doesn't exist or has been removed.</p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-sm p-4 flex items-center space-x-3 z-10">
        <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{item.name || 'Food Item'}</h1>
      </div>

      {/* Item Detail */}
      <div className="bg-white">
        <div className="relative h-64">
          <img
            src={item.image || 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg'}
            alt={item.name || 'Food item'}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center space-x-1">
            <Star className="w-4 h-4 text-[#FFD500]" />
            <span className="text-sm font-semibold">{item.rating || 5}</span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 break-words">{item.name || 'Food Item'}</h2>

          <div className="text-sm text-gray-600 mb-3">
            From <span className="font-semibold">{canteenName}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
            <span className="text-xl sm:text-2xl font-bold text-[#FC8A14]">₹{item.price || 0}</span>
            <span className="px-3 py-1 bg-[#FFD500] text-gray-800 rounded-full text-sm font-semibold">
              {item.category || 'Food'}
            </span>
          </div>

          {/* Quantity Selector */}
          <div className="flex flex-wrap items-center justify-between py-4 sm:py-6 border-t border-gray-100 gap-2">
            <span className="text-base sm:text-lg font-semibold text-gray-800">Quantity</span>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-lg sm:text-xl font-semibold w-6 sm:w-8 text-center">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(1)}
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3">
        <Button
          onClick={handleAddToCart}
          className="w-1/2 bg-[#FC8A14] hover:bg-orange-600 text-white border-0"
        >
          Add to Cart - ₹{(item.price || 0) * quantity}
        </Button>
        <Button
          onClick={handleBuyNow}
          className="w-1/2 bg-green-600 hover:bg-green-700 text-white border-0"
        >
          Buy Now - ₹{(item.price || 0) * quantity}
        </Button>
      </div>
    </div>
  );
};

export default FoodItemDetails;