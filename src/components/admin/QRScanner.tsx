import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { parseQRCode, QRCodeData } from '../../utils/qrCode';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRScannerComponent: React.FC<QRScannerProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { orders, updateOrder, canteens } = useApp();
  const { currentAdmin } = useAuth();
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [scanResult, setScanResult] = useState<QRCodeData | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'scanning' | 'success' | 'error' | 'invalid'>('scanning');
  const [errorMessage, setErrorMessage] = useState('');

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string>('');

  useEffect(() => {
    console.log('QR Scanner component opened, initializing camera...');
    if (isOpen && videoRef.current) {
      // Check if we're on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('Is mobile device:', isMobile);

      // First check if camera is available
      console.log('Checking for camera availability...');
      QrScanner.hasCamera().then(hasCamera => {
        console.log('Camera available:', hasCamera);
        if (!hasCamera) {
          setPermissionError('No camera found on this device');
          setHasPermission(false);
          return;
        }

        // On mobile, try to get camera permission explicitly first
        if (isMobile) {
          console.log('Mobile device detected, requesting camera permission explicitly');
          navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          }).catch(err => {
            console.error('Mobile camera permission error:', err);
          });
        }

        // Create scanner with error handling
        const qrScanner = new QrScanner(
          videoRef.current!,
          (result: { data: string }) => {
            console.log('QR Scanner result:', result);
            handleScanResult(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
            preferredCamera: 'environment', // Use back camera on mobile devices for better QR scanning
            maxScansPerSecond: 3, // Limit scan rate to reduce CPU usage
            calculateScanRegion: (video) => {
              // Focus on the center of the video for better scanning
              const smallerDimension = Math.min(video.videoWidth, video.videoHeight);
              const scanRegionSize = Math.round(0.7 * smallerDimension);
              return {
                x: Math.round((video.videoWidth - scanRegionSize) / 2),
                y: Math.round((video.videoHeight - scanRegionSize) / 2),
                width: scanRegionSize,
                height: scanRegionSize,
              };
            },
          }
        );

        // Handle camera start errors
        console.log('Attempting to start camera...');
        qrScanner.start()
          .then(() => {
            console.log('Camera started successfully');
            setHasPermission(true);
            setPermissionError('');
            setScanner(qrScanner);
          })
          .catch(error => {
            console.error('QR Scanner error:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            setHasPermission(false);

            // Provide more specific error messages based on error type
            if (error.name === 'NotAllowedError') {
              setPermissionError('Camera access denied. Please allow camera access in your browser settings.');
            } else if (error.name === 'NotFoundError') {
              setPermissionError('Camera not found. Please ensure your device has a working camera.');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
              setPermissionError('Camera is in use by another application or not accessible.');
            } else if (error.name === 'OverconstrainedError') {
              setPermissionError('Camera does not satisfy the requested constraints.');
            } else if (error.name === 'SecurityError') {
              setPermissionError('Camera access blocked due to security restrictions.');
            } else {
              setPermissionError(`Camera error: ${error.message || 'Unknown error'}`);
            }
          });

        return () => {
          qrScanner.stop();
          qrScanner.destroy();
        };
      });
    }
  }, [isOpen]);

  const handleScanResult = (data: string) => {
    try {
      console.log('QR scan result:', data);

      // Check if the scanned data is a data URL (the QR code image itself)
      if (data.startsWith('data:image')) {
        setVerificationStatus('invalid');
        setErrorMessage('Invalid QR code: Scanned the image instead of the QR code content');
        return;
      }

      const qrData = parseQRCode(data);
      if (!qrData) {
        setVerificationStatus('invalid');
        setErrorMessage('Invalid QR code format');
        return;
      }

      console.log('Parsed QR data:', qrData);
      setScanResult(qrData);

      // Find the order
      const order = orders.find(o => o.id === qrData.orderId);
      if (!order) {
        setVerificationStatus('error');
        setErrorMessage(`Order not found: ${qrData.orderId}`);
        return;
      }

      // Check if admin can access this order
      if (!currentAdmin?.isMasterAdmin && order.canteenId !== currentAdmin?.canteenId) {
        setVerificationStatus('error');
        setErrorMessage('This order is not for your canteen');
        return;
      }

      // Verify email matches
      if (order.userEmail !== qrData.email) {
        setVerificationStatus('error');
        setErrorMessage('Order verification failed - email mismatch');
        return;
      }

      setVerificationStatus('success');

      // Allow admin to complete order from any active status (Pending, Preparing, or Ready)
      if (order.status === 'Completed') {
        setVerificationStatus('error');
        setErrorMessage('This order has already been completed.');
        return;
      }

    } catch (error) {
      console.error('QR scan error:', error);
      setVerificationStatus('invalid');
      setErrorMessage(`Failed to scan QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClose = () => {
    if (scanner) {
      scanner.stop();
      scanner.destroy();
      setScanner(null);
    }
    setScanResult(null);
    setVerificationStatus('scanning');
    setErrorMessage('');
    setHasPermission(null);
    setPermissionError('');
    onClose();
  };

  const handleMarkCompleted = () => {
    if (scanResult) {
      const order = orders.find(o => o.id === scanResult.orderId);
      if (order && order.status !== 'Completed') {
        updateOrder(scanResult.orderId, 'Completed');
        handleClose();
      } else {
        setVerificationStatus('error');
        setErrorMessage('This order has already been completed.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Scan Order QR Code</h3>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scanner */}
        <div className="p-4">
          {verificationStatus === 'scanning' && hasPermission === false && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Camera Access Required</h4>
              <p className="text-red-600 mb-4">{permissionError}</p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm text-gray-700 mb-2">To scan QR codes, please:</p>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  <li>Check that your device has a camera</li>
                  <li>Allow camera access when prompted</li>
                  <li>If denied, go to your browser settings to enable camera access</li>
                  <li>For iOS users: ensure camera access is enabled in Settings</li>
                </ol>
              </div>
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={async () => {
                    // Fully reset state first
                    setHasPermission(null);
                    setPermissionError('');
                    setVerificationStatus('scanning');

                    // Destroy old scanner if exists
                    if (scanner) {
                      try { scanner.stop(); } catch (e) { /* ignore */ }
                      try { scanner.destroy(); } catch (e) { /* ignore */ }
                      setScanner(null);
                    }

                    try {
                      // Explicitly request camera permission to trigger browser prompt
                      const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment' }
                      });
                      // Stop the stream immediately — we just needed to get permission
                      stream.getTracks().forEach(track => track.stop());

                      // Now re-initialize the QR scanner
                      if (videoRef.current) {
                        const newScanner = new QrScanner(
                          videoRef.current,
                          (result: { data: string }) => {
                            handleScanResult(result.data);
                          },
                          {
                            highlightScanRegion: true,
                            highlightCodeOutline: true,
                            returnDetailedScanResult: true,
                            preferredCamera: 'environment',
                            maxScansPerSecond: 3,
                            calculateScanRegion: (video) => {
                              const smallerDimension = Math.min(video.videoWidth, video.videoHeight);
                              const scanRegionSize = Math.round(0.7 * smallerDimension);
                              return {
                                x: Math.round((video.videoWidth - scanRegionSize) / 2),
                                y: Math.round((video.videoHeight - scanRegionSize) / 2),
                                width: scanRegionSize,
                                height: scanRegionSize,
                              };
                            },
                          }
                        );

                        await newScanner.start();
                        setHasPermission(true);
                        setPermissionError('');
                        setScanner(newScanner);
                      }
                    } catch (error: any) {
                      console.error('Camera permission denied on retry:', error);
                      setHasPermission(false);
                      if (error.name === 'NotAllowedError') {
                        setPermissionError('Camera access still denied. Please check your browser settings and allow camera access.');
                      } else {
                        setPermissionError(`Camera error: ${error.message || 'Please try again or use manual entry.'}`);
                      }
                    }
                  }}
                  className="w-full"
                >
                  Try Again
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    // Create a temporary QR code for the admin to scan with their native camera app
                    // This is a fallback method when the in-app scanner doesn't work
                    const manualEntryPrompt = prompt('Enter the order number manually:');
                    if (manualEntryPrompt) {
                      const orderNumber = manualEntryPrompt.trim();
                      // Find the order with this order number
                      const order = orders.find(o => o.orderNumber === orderNumber);
                      if (order) {
                        // Create a QR code data object similar to what would be scanned
                        const qrData = {
                          orderId: order.id,
                          orderNumber: order.orderNumber,
                          email: order.userEmail || '',
                          canteenId: order.canteenId || '', // Use the actual order's canteen ID
                          timestamp: new Date().toISOString()
                        };
                        console.log('Manual entry QR data:', qrData);
                        setScanResult(qrData);
                        handleScanResult(JSON.stringify(qrData));
                      } else {
                        alert('Order not found. Please check the order number and try again.');
                      }
                    }
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800"
                >
                  Enter Order Number Manually
                </Button>
              </div>
            </div>
          )}

          {verificationStatus === 'scanning' && hasPermission !== false && (
            <div className="text-center">
              <div className="relative mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-[#FC8A14] rounded-lg"></div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <Camera className="w-5 h-5" />
                <span>Position QR code within the frame</span>
              </div>
            </div>
          )}

          {verificationStatus === 'success' && scanResult && (() => {
            const scannedOrder = orders.find(o => o.id === scanResult.orderId);
            return (
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Order Verified!</h4>
                <div className="bg-gray-50 rounded-lg p-3 mb-3 text-left">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-semibold">{scanResult.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-semibold text-xs break-all ml-2">{scanResult.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Canteen:</span>
                      <span className="font-semibold">
                        {canteens.find(c => c.id === scanResult.canteenId)?.name || 'Unknown Canteen'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Time:</span>
                      <span className="font-semibold">
                        {new Date(scanResult.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {/* Display Order Status */}
                    {scannedOrder && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${scannedOrder.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          scannedOrder.status === 'Ready' ? 'bg-green-100 text-green-700' :
                            scannedOrder.status === 'Preparing' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {scannedOrder.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items with Quantity & Price */}
                {scannedOrder && scannedOrder.items && scannedOrder.items.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3 text-left max-h-40 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ordered Items</p>
                    <div className="space-y-1.5">
                      {scannedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="bg-[#FC8A14] text-white text-xs font-bold px-1.5 py-0.5 rounded shrink-0">
                              {item.cartQuantity || item.quantity || 1}x
                            </span>
                            <span className="text-gray-800 truncate">{item.name}</span>
                          </div>
                          <span className="font-semibold text-gray-700 ml-2 shrink-0">
                            ₹{((item.price || 0) * (item.cartQuantity || item.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Total Price Label */}
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
                      <span className="font-semibold text-gray-600 text-sm">Total Paid</span>
                      <span className="font-bold text-[#FC8A14] text-lg">₹{scannedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button onClick={handleClose} variant="outline" className="flex-1">
                    Close
                  </Button>
                  <Button onClick={handleMarkCompleted} className="flex-1">
                    Mark as Completed
                  </Button>
                </div>
              </div>
            );
          })()}

          {(verificationStatus === 'error' || verificationStatus === 'invalid') && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Verification Failed</h4>
              <p className="text-red-600 mb-4">{errorMessage}</p>
              <div className="flex space-x-3">
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setVerificationStatus('scanning');
                    setErrorMessage('');
                    setScanResult(null);
                  }}
                  className="flex-1"
                >
                  Scan Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerComponent;