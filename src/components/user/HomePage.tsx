import React, { useState, useEffect } from 'react';
import { Clock, Star, MapPin, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import BreakTimeModal from './BreakTimeModal';
import { useNavigate } from 'react-router-dom';
import OrderNotificationSystem from '../common/OrderNotificationSystem';

const HomePage: React.FC = () => {
  const { canteens, foodItems, setSelectedCanteen, notifications, clearNotification } = useApp();
  const navigate = useNavigate();
  const activeCanteens = canteens.filter(c => c && c.isActive);
  const activeFoodItems = foodItems.filter(item => {
    if (!item || item.isActive === false) return false;
    const canteen = canteens.find(c => c.id === item.canteenId);
    return canteen && canteen.isActive;
  });

  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCanteens, setFilteredCanteens] = useState(activeCanteens);
  const [filteredFoodItems, setFilteredFoodItems] = useState(activeFoodItems);
  const [isSearchingItems, setIsSearchingItems] = useState(false);

  const handleCanteenSelect = (canteenId: string) => {
    setSelectedCanteenId(canteenId);
    setIsBreakModalOpen(true);
  };

  const handleBreakTimeSelect = () => {
    if (selectedCanteenId) {
      setSelectedCanteen(selectedCanteenId);
    }
    setIsBreakModalOpen(false);
  };

  // Filter canteens and food items based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCanteens(activeCanteens);
      setFilteredFoodItems(activeFoodItems);
      setIsSearchingItems(false);
    } else {
      const query = searchQuery.toLowerCase();

      // Filter canteens
      const filteredCanteenResults = activeCanteens.filter(canteen =>
        canteen && canteen.name && canteen.name.toLowerCase().includes(query)
      );
      setFilteredCanteens(filteredCanteenResults);

      // Filter food items
      const filteredFoodItemResults = activeFoodItems.filter(item =>
        item && (
          (item.name && item.name.toLowerCase().includes(query)) ||
          (item.category && item.category.toLowerCase().includes(query))
        )
      );
      setFilteredFoodItems(filteredFoodItemResults);

      // If we have food items matching the query or no canteens matching, show food items
      setIsSearchingItems(filteredFoodItemResults.length > 0 || filteredCanteenResults.length === 0);
    }
  }, [searchQuery, activeCanteens, activeFoodItems]);

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#FC8A14] to-[#D7263D] p-6 rounded-b-2xl mb-6">
        <div className="text-center text-white">
          <h2 className="text-3xl font-extrabold mb-2 tracking-wide">Welcome to CanteenQ</h2>
          <p className="text-orange-100">Skip the wait. Savor the break.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder={isSearchingItems ? "Search food items..." : "Search canteens or food items..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={() => setIsSearchingItems(!isSearchingItems)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-medium text-[#FC8A14] hover:text-[#D7263D] transition-colors"
          >
            {isSearchingItems ? "View Canteens" : "View Items"}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-[#FC8A14] font-bold text-xl">{activeCanteens.length}</div>
            <div className="text-gray-600 text-sm">Canteens</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-[#D7263D] font-bold text-xl">{activeFoodItems.length}+</div>
            <div className="text-gray-600 text-sm">Food Items</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-[#FFD500] font-bold text-xl">4.5</div>
            <div className="text-gray-600 text-sm">Avg Rating</div>
          </div>
        </div>
      </div>

      {/* Food Items or Canteens Grid */}
      <div className="px-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {isSearchingItems ? "Food Items" : "Available Canteens"}
        </h3>

        {isSearchingItems ? (
          filteredFoodItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No food items found</h3>
              <p className="text-gray-500">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredFoodItems.map((item) => item && (
                <div
                  key={item.id || 'unknown'}
                  onClick={() => {
                    // Navigate to food item details regardless of canteen status
                    if (item && item.id) {
                      // Use React Router navigation instead of window.location
                      navigate(`/food/${item.id}`);
                    }
                  }}
                  className={`
                    bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
                    hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-200
                  `}
                >
                  <div className="relative h-32">
                    <img
                      src={item.image || ''}
                      alt={item.name || 'Food item'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-semibold text-[#FC8A14]">
                      ₹{item.price || '0'}
                    </div>

                    <div className="absolute top-2 left-2 bg-[#FC8A14]/80 px-2 py-1 rounded-full text-xs font-semibold text-white">
                      {item.category || 'Uncategorized'}
                    </div>
                  </div>

                  <div className="p-3">
                    <h4 className="font-semibold text-gray-800 mb-1 truncate">{item.name || 'Unnamed item'}</h4>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-[#FFD500]" />
                        <span>{item.rating || '4.0'}</span>
                      </div>
                      <span className="text-gray-500">
                        {item.canteenId && canteens.find(c => c && c.id === item.canteenId)?.name || 'Unknown Canteen'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredCanteens.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No canteens found</h3>
              <p className="text-gray-500">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredCanteens.map((canteen) => canteen && (
                <div
                  key={canteen.id || 'unknown'}
                  onClick={() => handleCanteenSelect(canteen.id)}
                  className="relative bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-200"
                >
                  <div className="relative h-40">
                    <img
                      src={canteen.image || ''}
                      alt={canteen.name || 'Canteen'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    <div className={`
                      absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold
                      ${canteen && canteen.isActive
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                      }
                    `}>
                      {canteen && canteen.isActive ? 'Open' : 'Closed'}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="text-white font-bold text-lg">{canteen && canteen.name || 'Unnamed Canteen'}</h4>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>15-20 min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-[#FFD500]" />
                          <span>4.2</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>Campus</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Break Time Modal */}
      <BreakTimeModal
        isOpen={isBreakModalOpen}
        onClose={() => setIsBreakModalOpen(false)}
        onBreakTimeSelect={handleBreakTimeSelect}
        canteenName={selectedCanteenId && canteens.find(c => c && c.id === selectedCanteenId)?.name || ''}
      />

      {/* Notification System */}
      <OrderNotificationSystem
        notifications={notifications}
        onClearNotification={clearNotification}
      />
    </div>
  );
};

export default HomePage;