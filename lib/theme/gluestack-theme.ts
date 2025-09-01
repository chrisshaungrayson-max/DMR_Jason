import { config } from '@gluestack-ui/config';
import { createConfig } from '@gluestack-style/react';
import Colors from '@/constants/colors';

// Create custom theme that extends the default Gluestack config
// Maps existing app colors to Gluestack color tokens
export const createCustomTheme = (colorScheme: 'light' | 'dark' = 'light') => {
  const currentColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const customColors = {
    // Primary brand colors (gold theme)
    primary0: currentColors.background,
    primary50: colorScheme === 'light' ? '#faf9f7' : '#2a2a2a',
    primary100: colorScheme === 'light' ? '#f5f3ef' : '#333333',
    primary200: colorScheme === 'light' ? '#ebe7df' : '#404040',
    primary300: colorScheme === 'light' ? '#ddd6c7' : '#4d4d4d',
    primary400: colorScheme === 'light' ? '#cfc4af' : '#666666',
    primary500: currentColors.tint, // Main gold color
    primary600: colorScheme === 'light' ? '#a69158' : '#b8a369',
    primary700: colorScheme === 'light' ? '#8f7a47' : '#9d8c57',
    primary800: colorScheme === 'light' ? '#786336' : '#827545',
    primary900: colorScheme === 'light' ? '#614c25' : '#675e33',
    primary950: colorScheme === 'light' ? '#4a3b1e' : '#4c4722',
    
    // Text colors - fix light mode text colors
    textLight0: colorScheme === 'light' ? '#000000' : currentColors.text,
    textLight50: colorScheme === 'light' ? '#333333' : currentColors.darkText,
    textLight100: colorScheme === 'light' ? '#666666' : currentColors.lightText,
    textLight200: colorScheme === 'light' ? '#888888' : currentColors.placeholder,
    textLight300: colorScheme === 'light' ? '#cccccc' : currentColors.disabled,
    textLight400: colorScheme === 'light' ? '#888888' : '#aaaaaa',
    textLight900: colorScheme === 'light' ? '#000000' : '#ffffff',
    
    textDark0: colorScheme === 'dark' ? currentColors.text : '#000000',
    textDark50: colorScheme === 'dark' ? currentColors.darkText : '#333333',
    textDark100: colorScheme === 'dark' ? currentColors.lightText : '#666666',
    textDark200: colorScheme === 'dark' ? currentColors.placeholder : '#888888',
    textDark300: colorScheme === 'dark' ? currentColors.disabled : '#cccccc',
    textDark400: colorScheme === 'dark' ? '#aaaaaa' : '#888888',
    textDark900: colorScheme === 'dark' ? '#ffffff' : '#000000',
    
    // Background colors - fix light mode backgrounds
    backgroundLight0: colorScheme === 'light' ? '#ffffff' : currentColors.background,
    backgroundLight50: colorScheme === 'light' ? '#ffffff' : currentColors.cardBackground,
    backgroundLight100: colorScheme === 'light' ? '#f8f8f8' : '#1a1a1a',
    backgroundLight200: colorScheme === 'light' ? '#f0f0f0' : '#222222',
    backgroundLight900: colorScheme === 'light' ? '#1a1a1a' : '#ffffff',
    backgroundLight950: colorScheme === 'light' ? '#000000' : '#ffffff',
    
    backgroundDark0: colorScheme === 'dark' ? currentColors.background : '#ffffff',
    backgroundDark50: colorScheme === 'dark' ? currentColors.cardBackground : '#ffffff',
    backgroundDark100: colorScheme === 'dark' ? '#1a1a1a' : '#f8f8f8',
    backgroundDark200: colorScheme === 'dark' ? '#222222' : '#f0f0f0',
    backgroundDark900: colorScheme === 'dark' ? '#ffffff' : '#1a1a1a',
    backgroundDark950: colorScheme === 'dark' ? '#ffffff' : '#000000',
    
    // Border colors - fix light mode borders
    borderLight0: colorScheme === 'light' ? '#dddddd' : currentColors.border,
    borderLight100: colorScheme === 'light' ? '#e0e0e0' : '#2a2a2a',
    borderLight200: colorScheme === 'light' ? '#cccccc' : '#333333',
    borderLight300: colorScheme === 'light' ? '#cccccc' : currentColors.disabled,
    borderLight700: colorScheme === 'light' ? '#333333' : '#cccccc',
    
    borderDark0: colorScheme === 'dark' ? currentColors.border : '#dddddd',
    borderDark100: colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0',
    borderDark200: colorScheme === 'dark' ? '#333333' : '#cccccc',
    borderDark300: colorScheme === 'dark' ? currentColors.disabled : '#cccccc',
    borderDark700: colorScheme === 'dark' ? '#cccccc' : '#333333',
    
    // Success, warning, error colors
    success500: '#22c55e',
    warning500: '#f59e0b',
    error500: '#ef4444',
    info500: currentColors.tint,
    
    // White color for proper contrast
    white: '#ffffff',
    black: '#000000',
    
    // Tab colors
    tabIconDefault: currentColors.tabIconDefault,
    tabIconSelected: currentColors.tabIconSelected,
    
    // Overlay colors
    overlay: currentColors.overlay,
    
    // Gold specific colors for special use cases
    gold: currentColors.gold,
    lightGold: currentColors.lightGold,
  };

  return createConfig({
    ...config,
    tokens: {
      ...config.tokens,
      colors: {
        ...config.tokens.colors,
        ...customColors,
      }
    },
  });
};

// Export the default light theme
export const customTheme = createCustomTheme('light');

// Export both light and dark themes
export const lightTheme = createCustomTheme('light');
export const darkTheme = createCustomTheme('dark');

export default customTheme;
