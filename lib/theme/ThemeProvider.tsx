import React, { createContext, useContext, useMemo } from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { createCustomTheme } from './gluestack-theme';
import { useUser } from '@/store/user-store';

// Create a context for the current theme
const ThemeContext = createContext<ReturnType<typeof createCustomTheme> | null>(null);

// Hook to use the current theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider component that integrates with useUser().colorScheme
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colorScheme } = useUser();
  
  // Create theme based on current color scheme
  const currentTheme = useMemo(() => {
    return createCustomTheme(colorScheme);
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={currentTheme}>
      <GluestackUIProvider config={currentTheme}>
        {children}
      </GluestackUIProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
