import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bankDetails: AdminBankDetails) => void;
  currentBankDetails?: AdminBankDetails | null;
}

export interface AdminBankDetails {
  accountNumber: string;
  ifscCode: string;
  panNumber: string;
  bankName: string;
}

const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  currentBankDetails 
}) => {
  const { currentAdmin } = useAuth();
  const [formData, setFormData] = useState<AdminBankDetails>({
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
    bankName: ''
  });

  useEffect(() => {
    if (currentBankDetails) {
      setFormData({
        accountNumber: currentBankDetails.accountNumber || '',
        ifscCode: currentBankDetails.ifscCode || '',
        panNumber: currentBankDetails.panNumber || '',
        bankName: currentBankDetails.bankName || ''
      });
    } else {
      setFormData({
        accountNumber: '',
        ifscCode: '',
        panNumber: '',
        bankName: ''
      });
    }
  }, [currentBankDetails, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen || !currentAdmin?.isMasterAdmin) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Master Admin Payment Settings</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
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
                required
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
                required
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
                required
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
                required
              />
            </div>
          </div>
          
          <div className="flex space-x-3 pt-6">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettingsModal;