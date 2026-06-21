import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';
import { Canteen } from '../../types';
import ImageUpload from '../common/ImageUpload';

interface CanteenModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCanteen?: Canteen | null;
}

const CanteenModal: React.FC<CanteenModalProps> = ({ isOpen, onClose, editingCanteen }) => {
  const { addCanteen, updateCanteen } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    isActive: true,
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
    bankName: ''
  });
  
  useEffect(() => {
    if (editingCanteen) {
      setFormData({
        name: editingCanteen.name,
        image: editingCanteen.image,
        isActive: editingCanteen.isActive,
        accountNumber: editingCanteen.accountNumber || '',
        ifscCode: editingCanteen.ifscCode || '',
        panNumber: editingCanteen.panNumber || '',
        bankName: editingCanteen.bankName || ''
      });
    } else {
      setFormData({
        name: '',
        image: '',
        isActive: true,
        accountNumber: '',
        ifscCode: '',
        panNumber: '',
        bankName: ''
      });
    }
  }, [editingCanteen, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCanteen) {
      updateCanteen(editingCanteen.id, {
        name: formData.name,
        image: formData.image || 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg',
        isActive: formData.isActive,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        panNumber: formData.panNumber,
        bankName: formData.bankName
      });
    } else {
      addCanteen({
        name: formData.name,
        image: formData.image || 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg',
        isActive: formData.isActive,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        panNumber: formData.panNumber,
        bankName: formData.bankName
      });
    }

    setFormData({ 
      name: '', 
      image: '', 
      isActive: true,
      accountNumber: '',
      ifscCode: '',
      panNumber: '',
      bankName: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">{editingCanteen ? 'Edit Canteen' : 'Add New Canteen'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canteen Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
              required
              placeholder="e.g., Central Canteen"
            />
          </div>

          <ImageUpload
            onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
            currentUrl={formData.image}
            label="Canteen Image"
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-[#FC8A14] bg-gray-100 border-gray-300 rounded focus:ring-[#FC8A14] focus:ring-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Canteen is active
            </label>
          </div>

          <h4 className="text-md font-semibold text-gray-700 mt-6 mb-2">Payment Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
                placeholder="e.g., State Bank of India"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
                placeholder="e.g., 1234567890"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code
              </label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
                placeholder="e.g., SBIN0001234"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN Number
              </label>
              <input
                type="text"
                value={formData.panNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, panNumber: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-transparent"
                placeholder="e.g., ABCDE1234F"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 pt-6">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingCanteen ? 'Update Canteen' : 'Add Canteen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CanteenModal;