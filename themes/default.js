/**
 * Default Theme Configuration
 * Original Nomi.ai interface with no modifications
 */

const DEFAULT_THEME = {
  name: 'Default',
  description: 'Original Nomi.ai interface with no modifications',
  version: '1.0.0',
  
  // No elements to hide
  hiddenElements: [],
  
  // No additional styles
  styles: '',
  
  // Theme settings
  settings: {
    hideElements: false,
    darkMode: false,
    compactMode: false,
    enhancedContrast: false
  }
};

// Export the theme configuration
const getDefaultTheme = () => DEFAULT_THEME;