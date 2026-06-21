import { CartItem } from '../types';
import { buildApiUrl, API_ENDPOINTS } from './apiConfig';
import { fetchWithRetry, loadScriptWithRetry, NetworkError } from './networkUtils';

// Define Razorpay order response type
interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

// Define Razorpay payment response type
interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Define Razorpay options type
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions | Record<string, any>) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}

// Function to load Razorpay script — now with retry for flaky networks (Jio, BSNL, etc.)
export const loadRazorpayScript = (): Promise<boolean> => {
  // If the script is already loaded, skip
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  return loadScriptWithRetry(
    'https://checkout.razorpay.com/v1/checkout.js',
    3,    // 3 attempts
    2000  // 2s between retries
  );
};

// Function to create a Razorpay order — now with timeout + retry
export const createRazorpayOrder = async (
  items: CartItem[],
  userEmail: string,
  userId: string,
  orderNumber: string
): Promise<RazorpayOrderResponse> => {
  // Calculate base amount
  const baseAmount = items.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

  // Add 1% platform commission + extra fees
  const commissionRate = 0.01; // 1%
  const commission = baseAmount * commissionRate;
  const totalWithCommission = baseAmount + commission;

  console.log('💰 Payment Breakdown:', {
    baseAmount: `₹${baseAmount.toFixed(2)}`,
    commission: `₹${commission.toFixed(2)} (1%)`,
    total: `₹${totalWithCommission.toFixed(2)}`
  });

  try {
    const response = await fetchWithRetry(
      buildApiUrl(API_ENDPOINTS.CREATE_RAZORPAY_ORDER),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(baseAmount * 100), // Send ONLY the base amount to the server
          receipt: orderNumber,
          notes: {
            userId,
            userEmail,
            canteenId: items[0]?.canteenId || '',
            baseAmount: baseAmount.toFixed(2),
            // Server will add platformFee and totalAmount details
          }
        })
      },
      {
        timeout: 20000, // 20s timeout (Razorpay order creation can be slow)
        retries: 3,
        retryDelay: 1500,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create Razorpay order');
    }

    const orderData = await response.json();
    return orderData;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);

    // Give user-friendly messages based on error type
    if (error instanceof NetworkError) {
      throw new Error(error.message); // Already user-friendly
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error('Failed to create Razorpay order: ' + errorMessage);
  }
};

// Detect iOS device
const isIOSDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

// Detect standalone (PWA) mode
const isStandaloneMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Function to open Razorpay payment modal
// On iOS (especially standalone PWA mode), redirect-based payment flows
// break because iOS Safari can't navigate back to the standalone PWA
// after redirecting to a UPI app. We force modal/popup flow on iOS.
export const openRazorpayCheckout = (
  orderData: RazorpayOrderResponse,
  userEmail: string,
  onSuccess: (response: RazorpayPaymentResponse) => void,
  onFailure: (error: any) => void
) => {
  const isiOS = isIOSDevice();
  const isStandalone = isStandaloneMode();

  // so if a redirect does happen, it comes back to the app
  // Removed static callbackUrl due to Netlify POST 404 error

  const options: Record<string, any> = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID as string,
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'CanteenQ',
    description: 'Food Pre-order Payment',
    order_id: orderData.id,
    prefill: {
      email: userEmail,
    },
    notes: {
      receipt: orderData.receipt
    },
    theme: {
      color: '#FC8A14'
    },
    handler: function (response: RazorpayPaymentResponse) {
      onSuccess(response);
    },
    modal: {
      ondismiss: function () {
        onFailure(new Error('Payment cancelled or abandoned by user'));
      },
      // Prevent Razorpay from closing the modal and redirecting on iOS
      confirm_close: true,
      // On iOS, use the embedded flow to avoid redirect issues
      animation: true,
    },
    // CRITICAL for iOS: Force Razorpay to NOT redirect to external UPI apps
    // Instead, it will show a QR code or inline UPI collect flow
    redirect: false,
  };

  // On iOS devices, especially in standalone PWA mode:
  // - Hide UPI intent-based methods that cause redirect issues
  // - Force the checkout to use collect/QR based flows
  if (isiOS) {
    console.log('📱 iOS detected — using modal-only payment flow (redirect: false)');

    // Configure to avoid intent-based UPI apps that cause redirect issues
    options.config = {
      display: {
        blocks: {
          banks: {
            name: 'Pay via UPI / Cards',
            instruments: [
              { method: 'upi', flows: ['collect', 'qr'] },
              { method: 'card' },
              { method: 'netbanking' },
              { method: 'wallet' },
            ],
          },
        },
        sequence: ['block.banks'],
        preferences: {
          show_default_blocks: false,
        },
      },
    };

    if (isStandalone) {
      console.log('🏠 Standalone PWA mode on iOS — extra redirect protection enabled');
    }
  }

  try {
    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.on('payment.failed', function (response: any) {
      console.error('Razorpay payment.failed event:', response.error);
      // We don't necessarily call onFailure here because the modal stays open for retries
      // but if needed, we could. The user usually dismisses the modal.
    });
    razorpayInstance.open();
  } catch (error) {
    onFailure(error);
  }
};

// Function to verify Razorpay payment — now with timeout + retry
export const verifyRazorpayPayment = async (
  paymentResponse: RazorpayPaymentResponse
): Promise<boolean> => {
  try {
    const response = await fetchWithRetry(
      buildApiUrl(API_ENDPOINTS.VERIFY_RAZORPAY_PAYMENT),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentResponse)
      },
      {
        timeout: 15000, // 15s timeout
        retries: 3,
        retryDelay: 1000,
      }
    );

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    const verificationData = await response.json();
    return verificationData.verified;
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);

    if (error instanceof NetworkError) {
      throw new Error(error.message);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error('Failed to verify Razorpay payment: ' + errorMessage);
  }
};