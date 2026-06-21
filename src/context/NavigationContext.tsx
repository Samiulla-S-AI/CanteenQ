import React, { createContext, useContext } from 'react';

interface NavigationContextType {
  handleTabChange: (tab: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider: React.FC<{ 
  children: React.ReactNode;
  handleTabChange: (tab: string) => void;
}> = ({ children, handleTabChange }) => {
  return (
    <NavigationContext.Provider value={{ handleTabChange }}>
      {children}
    </NavigationContext.Provider>
  );
};