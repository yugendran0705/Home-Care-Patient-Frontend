/**
 * Colors.tsx
 * * To use these colors in your components, you can use Expo's useColorScheme:
 * const colorScheme = useColorScheme() ?? 'light';
 * const colors = Colors[colorScheme];
 */

const tintColorLight = '#369BFF'; // Primary App Blue
const tintColorDark = '#363636';

export const Colors = {
  light: {
    // Primary & Accent
    primary: tintColorLight,
    primaryBackground: 'rgba(54, 155, 255, 0.8)',
    accent: tintColorLight,
    tint: tintColorLight,
    
    // Backgrounds
    background: '#FFFFFF',          // Standard white background
    backgroundGradient: '#E2E8F0',  // Screen gradient secondary color

    // Surfaces (Inputs, Cards)
    surface: '#F0F5FA',             // Input backgrounds & light cards
    surfaceSecondary: '#FFFFFF',    // Pure white forms
    
    // Text
    text: '#1F2937',
    textSecondary: '#646982',       // Subtitles / Muted text
    textInverted: '#F7FAFC',
    textMutedInverted: 'rgba(255, 255, 255, 0.7)', // white/70
    
    // Icons
    icon: '#646982',
    tabIconDefault: '#646982',
    tabIconSelected: tintColorLight,
    
    // Semantics
    error: '#EF4444',               // Tailwind red-500
    success: '#4CD964',             // Verified green
    warning: '#FF9500',             // Unverified orange
  },
  
  dark: {
    // Primary & Accent
    primary: tintColorDark,
    primaryBackground: tintColorDark,
    accent: tintColorLight,
    tint: tintColorDark,
    
    // Backgrounds
    background: '#000000',          // Standard black background
    backgroundGradient: '#1A1A1A',  // Deep gray for gradients

    // Surfaces (Inputs, Cards)
    surface: '#2A2A2A',             // Dark mode cards/badges
    surfaceSecondary: '#1A1A1A',    // Darker surface
    
    // Text
    text: '#F7FAFC',                // Light gray/white text
    textSecondary: 'rgba(255, 255, 255, 0.7)', 
    textInverted: '#F7FAFC',        // Dark text on light elements
    textMutedInverted: 'rgba(255, 255, 255, 0.7)', 
    
    // Icons
    icon: 'rgba(255, 255, 255, 0.7)',
    tabIconSelected: tintColorDark,
    
    // Semantics
    error: '#EF4444',               
    success: '#4CD964',             
    warning: '#FF9500',
    
    inputBackground: '#F0F5FA',
  },
};