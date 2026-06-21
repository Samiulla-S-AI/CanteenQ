import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl='/'
      signInUrl='/sign-in'
      signUpUrl='/sign-up'
      appearance={{
        elements: {
          formButtonPrimary: 'bg-[#FC8A14] hover:bg-orange-600 text-white',
          socialButtonsBlockButton: 'bg-white border border-gray-300 hover:bg-gray-50',
          formFieldInput: 'border-gray-300 focus:border-[#FC8A14] focus:ring-[#FC8A14]',
          card: 'rounded-xl shadow-lg',
          headerTitle: 'text-2xl font-bold text-gray-800',
          headerSubtitle: 'text-gray-600',
          footerAction: 'text-[#FC8A14] hover:text-orange-600',
          formButtonReset: 'text-[#FC8A14] hover:text-orange-600'
        },
        variables: {
          colorPrimary: '#FC8A14',
          colorText: '#1F2937',
          colorTextSecondary: '#4B5563',
          colorBackground: '#FFFFFF',
          colorDanger: '#EF4444'
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);
