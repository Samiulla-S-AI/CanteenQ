import React from 'react';
import { Home, ShoppingBag, ShoppingCart } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartItemsCount?: number;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  cartItemsCount = 0 
}) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'cart', label: 'Cart', icon: ShoppingCart }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 relative
                ${isActive 
                  ? 'text-[#FC8A14] bg-orange-50' 
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <div className="relative">
                <Icon size={20} />
                {tab.id === 'cart' && cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#D7263D] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;