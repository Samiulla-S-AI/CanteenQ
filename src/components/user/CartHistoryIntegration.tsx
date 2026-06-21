import React from 'react';
import CartHistory from './CartHistory';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartHistoryIntegrationProps {
  userId: string;
  userEmail: string;
}

const CartHistoryIntegration: React.FC<CartHistoryIntegrationProps> = ({ userId, userEmail }) => {

  // Cart history is now saved automatically when an order is placed
  // This follows the pattern of popular food delivery apps like Swiggy and Zomato



  // We use the app's clearCart function directly

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 gap-4">
        {/* Order History heading removed as requested */}
        
        {/* Cart History Section */}
        <div className="border rounded-lg shadow">
          <CartHistory 
            userId={userId}
            userEmail={userEmail}
          />
        </div>
      </div>
    </div>
  );
};

export default CartHistoryIntegration;