import React, { useRef } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';
import { generateBillPDF } from '../../utils/billGenerator';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

const BillModal: React.FC<BillModalProps> = ({ isOpen, onClose, order }) => {
  const { canteens } = useApp();
  const billRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const canteen = canteens.find(c => c.id === order.canteenId);
  // Calculate in paise (integer math) to match Razorpay's actual billing
  const amountPaise = Math.round(order.totalAmount * 100);
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

  // Convert back to rupees for display
  const platformFee = platformFeePaise / 100;
  const convenienceFee = convenienceFeePaise / 100;
  const gstOnConvenience = gstOnConveniencePaise / 100;
  const totalWithService = grandTotalPaise / 100;

  const handleDownloadPDF = async () => {
    if (billRef.current) {
      try {
        const pdfBlob = await generateBillPDF(billRef.current);
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CanteenQ-Bill-${order.orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        alert('Error generating PDF. Please try again.');
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CanteenQ Bill - ${order.orderNumber}`,
          text: `Order from ${canteen?.name} - Total: ₹${totalWithService}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`CanteenQ Order ${order.orderNumber} - ${canteen?.name} - Total: ₹${totalWithService}`);
      alert('Order details copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Order Bill</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Bill Content */}
        <div ref={billRef} className="p-6 bg-white">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#FC8A14] mb-2">CanteenQ</h1>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">{canteen?.name}</h2>
            <p className="text-sm text-gray-600">Campus Food Pre-ordering</p>
            <div className="w-full h-px bg-gray-300 my-4"></div>
          </div>

          {/* QR Code - Moved to top */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-3">Show this QR code to the canteen staff:</p>
            <div className="flex justify-center">
              <img
                src={order.qrCode}
                alt="Order QR Code"
                className="w-32 h-32 border border-gray-300 rounded-lg"
                data-order-id={order.id}
                data-order-number={order.orderNumber}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This QR code contains your order verification details
            </p>
          </div>

          {/* Order Details */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Order Number:</span>
              <span className="font-semibold text-gray-800">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Date & Time:</span>
              <span className="text-sm text-gray-800">
                {new Date(order.timestamp).toLocaleDateString()} at{' '}
                {new Date(order.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`text-sm font-semibold px-2 py-1 rounded-full ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                order.status === 'Preparing' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'Ready' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Items Ordered:</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="text-gray-800">{item.name}</span>
                    <span className="text-sm text-gray-500 ml-2">x{item.cartQuantity}</span>
                  </div>
                  <span className="font-semibold text-gray-800">₹{item.price * item.cartQuantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="border-t border-gray-300 pt-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-800">₹{order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Platform Fee (1%):</span>
              <span className="text-gray-800">₹{platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Convenience Charges (2%):</span>
              <span className="text-gray-800">₹{convenienceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">GST on Convenience Charges:</span>
              <span className="text-gray-800">₹{gstOnConvenience.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold border-t border-gray-300 pt-2">
              <span className="text-gray-800">Total Amount:</span>
              <span className="text-[#FC8A14]">₹{totalWithService.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
            <p>Thank you for using CanteenQ!</p>
            <p>"Skip the wait. Savor the break."</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 flex space-x-3">
          <Button onClick={handleShare} variant="outline" className="flex-1 flex items-center justify-center space-x-2">
            <Share className="w-4 h-4" />
            <span>Share</span>
          </Button>
          <Button onClick={handleDownloadPDF} className="flex-1 flex items-center justify-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BillModal;