import React from 'react';
import { X, Sun, Clock, Moon } from 'lucide-react';
import Button from '../common/Button';
import { useApp } from '../../context/AppContext';

interface BreakTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBreakTimeSelect: (breakTime: string) => void;
  canteenName: string;
}

const BreakTimeModal: React.FC<BreakTimeModalProps> = ({
  isOpen,
  onClose,
  onBreakTimeSelect,
  canteenName
}) => {
  const { setSelectedBreakTime } = useApp();

  if (!isOpen) return null;

  const breakTimes = [
    {
      id: 'Morning',
      label: 'Morning Break',
      time: '9:00 AM - 11:00 AM',
      icon: Sun,
      color: 'from-yellow-400 to-orange-500'
    },
    {
      id: 'Afternoon',
      label: 'Lunch Break',
      time: '12:00 PM - 2:00 PM',
      icon: Clock,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'Evening',
      label: 'Evening Break',
      time: '4:00 PM - 6:00 PM',
      icon: Moon,
      color: 'from-purple-500 to-indigo-500'
    }
  ];

  const handleSelect = (breakTime: string) => {
    setSelectedBreakTime(breakTime);
    onBreakTimeSelect(breakTime);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Select Break Time</h3>
            <p className="text-sm text-gray-600">{canteenName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Break Time Options */}
        <div className="p-6 space-y-3">
          {breakTimes.map((breakTime) => {
            const Icon = breakTime.icon;
            
            return (
              <button
                key={breakTime.id}
                onClick={() => handleSelect(breakTime.id)}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-[#FC8A14] hover:bg-orange-50 transition-all duration-200 text-left group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${breakTime.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 group-hover:text-[#FC8A14]">
                      {breakTime.label}
                    </h4>
                    <p className="text-sm text-gray-600">{breakTime.time}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-6 pb-6">
          <Button onClick={onClose} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BreakTimeModal;