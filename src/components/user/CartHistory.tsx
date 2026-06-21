import React, { useState, useEffect } from 'react';
import { getUserCartHistory } from '../../utils/cartHistoryUtils';
import { Clock, ShoppingCart } from 'lucide-react';

interface CartHistoryProps {
  userId: string;
  userEmail: string;
}

const CartHistory: React.FC<CartHistoryProps> = ({ userId, userEmail }) => {
  const [cartHistory, setCartHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCartHistory = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const history = await getUserCartHistory(userId, userEmail);
        setCartHistory(history);
      } catch (error) {
        console.error('Error fetching cart history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartHistory();
  }, [userId]);



  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading previous orders...</p>
      </div>
    );
  }

  if (cartHistory.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-4xl mb-2">🛒</div>
        <p className="text-gray-600">No previous orders found</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        {cartHistory.map((cart) => (
          <div key={cart.id} className="border rounded-lg p-3 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">
                  {new Date(cart.created_at).toLocaleDateString()} at {' '}
                  {new Date(cart.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <span className="text-sm font-semibold">₹{cart.total_amount}</span>
            </div>
            
            <div className="text-sm text-gray-700 mb-2">
              <div className="flex items-center">
                <ShoppingCart className="w-4 h-4 text-gray-500 mr-1" />
                <span>{cart.items.length} items</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-600">
              {cart.items.slice(0, 3).map((item: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span>{item.name}</span>
                  <span>x{item.cartQuantity || item.quantity || 1}</span>
                </div>
              ))}
              {cart.items.length > 3 && (
                <div className="text-xs text-gray-500 italic">+{cart.items.length - 3} more items</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CartHistory;