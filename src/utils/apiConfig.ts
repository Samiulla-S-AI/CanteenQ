// API configuration utility for Netlify Functions

// Determine the base API URL based on environment
const getApiBaseUrl = (): string => {
  // For Netlify Functions, we use relative URLs
  // In production, API calls go to the same domain (via redirects in netlify.toml)
  // In development with 'netlify dev', it proxies to /.netlify/functions
  // This works for both scenarios!

  // Check if we're running with Netlify Dev (localhost:8888)
  if (window.location.hostname === 'localhost' && window.location.port === '8888') {
    // Netlify Dev server
    return '';
  }

  // Check if we're in production (deployed on Netlify)
  if (import.meta.env.PROD) {
    // Use relative URLs - netlify.toml redirects handle routing
    return '';
  }

  // Fallback for standard Vite dev server (localhost:5173)
  // If you're running just 'npm run dev', you need to use 'npm run dev:netlify' instead
  console.warn('⚠️ Running without Netlify Dev. Use "npm run dev:netlify" for full functionality.');
  return '';
};

// Export the API base URL
export const API_BASE_URL = getApiBaseUrl();

// Helper function to build API endpoint URLs
export const buildApiUrl = (endpoint: string): string => {
  // If API_BASE_URL is empty, just use the endpoint (relative URL)
  if (!API_BASE_URL) {
    return endpoint;
  }
  return `${API_BASE_URL}${endpoint}`;
};

// Common API endpoints
// These will be redirected by netlify.toml to the actual functions
export const API_ENDPOINTS = {
  CREATE_RAZORPAY_ORDER: '/.netlify/functions/create-razorpay-order',
  VERIFY_RAZORPAY_PAYMENT: '/.netlify/functions/verify-razorpay-payment',
  COMMISSION_DETAILS: '/.netlify/functions/commission-details',
};