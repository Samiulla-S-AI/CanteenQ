import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { FoodItem, Category, BreakTime } from '../../types';
import Button from '../common/Button';
import ImageUpload from '../common/ImageUpload';

interface FoodItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: FoodItem | null;
}

const FoodItemModal: React.FC<FoodItemModalProps> = ({ isOpen, onClose, editingItem }) => {
  const { canteens, addFoodItem, updateFoodItem } = useApp();
  const { currentAdmin } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    category: 'Food' as Category,
    breakTime: 'Morning' as BreakTime,
    quantity: '',
    canteenId: '',
    allTimeAvailable: false
  });

  const availableCanteens = currentAdmin?.isMasterAdmin
    ? canteens
    : canteens.filter(c => c.id === currentAdmin?.canteenId);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        price: editingItem.price.toString(),
        image: editingItem.image,
        category: editingItem.category,
        breakTime: editingItem.breakTime,
        quantity: editingItem.quantity.toString(),
        canteenId: editingItem.canteenId,
        allTimeAvailable: editingItem.allTimeAvailable || false
      });
    } else {
      // For new items, set canteenId based on admin type - only on mount
      const defaultCanteenId = currentAdmin?.isMasterAdmin
        ? (availableCanteens[0]?.id || '')
        : (currentAdmin?.canteenId || '');

      setFormData({
        name: '',
        price: '',
        image: '',
        category: 'Food',
        breakTime: 'Morning',
        quantity: '',
        canteenId: defaultCanteenId,
        allTimeAvailable: false
      });
    }
  }, [editingItem, isOpen]); // Removed availableCanteens and currentAdmin to prevent reset while typing

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const itemData = {
      name: formData.name,
      price: parseFloat(formData.price),
      image: formData.image || 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg',
      category: formData.category,
      breakTime: formData.breakTime,
      quantity: parseInt(formData.quantity),
      rating: 5.0, // Default rating of 5 for new items (will be updated by reviews)
      canteenId: formData.canteenId,
      allTimeAvailable: formData.allTimeAvailable
    };

    if (editingItem) {
      // Preserve the existing rating when updating an item
      updateFoodItem({ ...itemData, id: editingItem.id, rating: editingItem.rating });
    } else {
      addFoodItem(itemData);
    }

    onClose();
  };

  if (!isOpen) return null;

  const categories: Category[] = ['Food', 'Drink', 'Snack'];
  const breakTimes: BreakTime[] = ['Morning', 'Afternoon', 'Evening'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">
            {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
                required
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
              required
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Break Time *
            </label>
            <select
              value={formData.breakTime}
              onChange={(e) => setFormData(prev => ({ ...prev, breakTime: e.target.value as BreakTime }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
              required
            >
              {breakTimes.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* All-Time Available Checkbox */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allTimeAvailable}
                onChange={(e) => setFormData(prev => ({ ...prev, allTimeAvailable: e.target.checked }))}
                className="w-5 h-5 mt-0.5 text-[#FC8A14] border-gray-300 rounded focus:ring-2 focus:ring-[#FC8A14]"
              />
              <div className="flex-1">
                <span className="block text-sm font-semibold text-gray-800">
                  🕐 All-Time Available
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  When enabled, this item will be visible to users in all break times (Morning, Afternoon, and Evening), regardless of the selected break time above.
                </p>
              </div>
            </label>
          </div>

          {currentAdmin?.isMasterAdmin ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canteen *
              </label>
              <select
                value={formData.canteenId}
                onChange={(e) => setFormData(prev => ({ ...prev, canteenId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
                required
              >
                {availableCanteens.map(canteen => (
                  <option key={canteen.id} value={canteen.id}>{canteen.name}</option>
                ))}
              </select>
            </div>
          ) : (
            // For non-master admins, ensure canteenId is set from their assigned canteen
            <input
              type="hidden"
              value={formData.canteenId || currentAdmin?.canteenId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, canteenId: e.target.value }))}
            />
          )}

          {/* Rating field removed - ratings are now based on user reviews */}

          <ImageUpload
            onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
            currentUrl={formData.image}
            label="Food Item Image"
          />

          <div className="flex space-x-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FoodItemModal;