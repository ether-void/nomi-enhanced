/**
 * Theme Manager Module
 * Core theme switching logic and CSS injection/removal
 */

// Theme stylesheet ID is now loaded from cssConstants.js
const THEME_STYLESHEET_ID = CSS_SELECTORS.THEME.THEME_STYLESHEET_ID;
let currentActiveTheme = 'default';
let themeStyleElement = null;

/**
 * Initialize the theme manager
 */
async function initializeThemeManager() {
  // Load current theme from storage
  currentActiveTheme = await getCurrentTheme();
  
  // Apply the theme if it's not default
  if (currentActiveTheme !== 'default') {
    await applyTheme(currentActiveTheme);
  }
  
  // Listen for theme changes
  onThemeStorageChange(async (newConfig, oldConfig) => {
    if (newConfig && newConfig.currentTheme !== currentActiveTheme) {
      await switchTheme(newConfig.currentTheme);
    }
  });
  
  console.log('Nomi Theme Manager initialized with theme:', currentActiveTheme);
}

/**
 * Switch to a different theme
 * @param {string} themeName - Name of the theme to switch to
 */
async function switchTheme(themeName) {
  console.log(`Switching theme from ${currentActiveTheme} to ${themeName}`);
  
  // Remove current theme
  await removeCurrentTheme();
  
  // Apply new theme
  await applyTheme(themeName);
  
  // Update current theme
  currentActiveTheme = themeName;
  
  // Save to storage
  await setCurrentTheme(themeName);
  
  console.log(`Theme switched to: ${themeName}`);
}

/**
 * Apply a theme by name
 * @param {string} themeName - Name of the theme to apply
 */
async function applyTheme(themeName) {
  if (themeName === 'default') {
    return; // Default theme requires no changes
  }
  
  const themeData = await getThemeData(themeName);
  if (!themeData) {
    console.error(`Theme ${themeName} not found`);
    return;
  }
  
  // Apply CSS styles
  if (themeData.styles) {
    await applyThemeStyles(themeData.styles);
  }
  
  // Enable the theme
  await setThemeEnabled(themeName, true);
  
  console.log(`Applied theme: ${themeName}`);
}

/**
 * Remove the currently active theme
 */
async function removeCurrentTheme() {
  // Remove CSS styles
  removeThemeStyles();
  
  // Remove home icon if current theme is minimalistic
  if (currentActiveTheme === 'minimalistic') {
    removeHomeIcon();
  }
  
  // Disable current theme if not default
  if (currentActiveTheme !== 'default') {
    await setThemeEnabled(currentActiveTheme, false);
  }
  
  console.log(`Removed theme: ${currentActiveTheme}`);
}

/**
 * Apply theme styles (CSS injection and element hiding)
 * @param {Object} styles - Theme styles configuration from storage
 */
async function applyThemeStyles(styles) {
  let cssContent = '';
  
  // Load theme-specific CSS based on theme name
  const themeName = await getCurrentTheme();
  console.log('Applying theme styles for:', themeName);
  
  if (themeName === 'minimalistic') {
    // Use theme file configuration for full CSS
    cssContent += await loadMinimalisticThemeCSS();
  } else {
    // For other themes, use storage configuration
    // Add hidden elements CSS
    if (styles.hiddenElements && styles.hiddenElements.length > 0) {
      const hiddenSelectors = styles.hiddenElements.join(', ');
      cssContent += `${hiddenSelectors} { display: none !important; }\n`;
    }
    
    // Add custom CSS
    if (styles.customCSS) {
      cssContent += styles.customCSS + '\n';
    }
  }
  
  // Inject CSS into the page
  if (cssContent) {
    injectThemeCSS(cssContent);
  } else {
    console.warn('No CSS content to inject for theme:', themeName);
  }
  
  // Add home icon for minimalistic theme
  if (themeName === 'minimalistic') {
    createHomeIcon();
  }
}

/**
 * Load minimalistic theme CSS
 * @returns {string} CSS content for minimalistic theme
 */
async function loadMinimalisticThemeCSS() {
  // Get the minimalistic theme configuration
  if (typeof getMinimalisticTheme === 'function') {
    const themeConfig = getMinimalisticTheme();
    console.log('Loaded minimalistic theme config:', themeConfig);
    
    // Check if there's an active background from the background system
    const hasActiveBackground = document.getElementById('nomi-background-style') !== null;
    
    let cssContent = themeConfig.styles || '';
    if (cssContent.includes('BACKGROUND_IMAGE_URL_PLACEHOLDER')) {
      if (hasActiveBackground) {
        // Skip setting background - let the background system handle it
        cssContent = cssContent.replace(/\/\* Simple body styling with background image \*\/[\s\S]*?background-repeat: no-repeat !important;\s*color: #ffffff !important;\s*font-family: -apple-system[^}]*}/g, 
          `/* Background handled by background system */
          body {
            color: #ffffff !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }`);
        console.log('Active background detected, skipping theme background');
      } else {
        // Use theme background as normal
        const imageUrl = chrome.runtime.getURL('themes/image/background.webp');
        cssContent = cssContent.replace(/BACKGROUND_IMAGE_URL_PLACEHOLDER/g, imageUrl);
        console.log('Background image URL replaced with:', imageUrl);
      }
    }
    
    return cssContent;
  }
  
  console.log('getMinimalisticTheme function not available, using fallback CSS');
  // Fallback CSS if theme file is not loaded
  return `
    /* Main content area adjustments */
    .css-7n1ipl {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Chat content area */
    .css-5svgrr {
      margin-top: 0 !important;
      padding: 20px !important;
      height: 100vh !important;
      overflow-y: auto !important;
    }
    
    /* Main container width */
    .css-gfwp6t {
      width: 100% !important;
    }
    
    /* Body background */
    body {
      background-color: #0a0a0a !important;
    }
    
    /* Message container styling */
    .css-fda5tg, .css-1r0bmfq {
      max-width: 800px !important;
      margin: 0 auto 20px auto !important;
      padding: 15px !important;
      border-radius: 12px !important;
      background-color: rgba(255, 255, 255, 0.05) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    
    /* Input area styling */
    textarea[aria-label="Chat Input"], 
    textarea[aria-label="Group Chat Input"] {
      background-color: rgba(255, 255, 255, 0.08) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 8px !important;
      padding: 12px !important;
      color: #ffffff !important;
    }
    
    /* Button styling */
    button[aria-label="Speak message"] {
      background-color: rgba(150, 16, 255, 0.8) !important;
      border: none !important;
      border-radius: 6px !important;
      padding: 8px 12px !important;
      transition: all 0.3s ease !important;
    }
    
    /* Text readability */
    h1, h2, h3, h4, h5, h6, p, span, div {
      color: #ffffff !important;
    }
  `;
}

/**
 * Inject CSS into the page
 * @param {string} cssContent - CSS content to inject
 */
function injectThemeCSS(cssContent) {
  // Remove existing theme styles
  removeThemeStyles();
  
  // Create and inject new style element
  themeStyleElement = document.createElement('style');
  themeStyleElement.id = THEME_STYLESHEET_ID;
  themeStyleElement.textContent = cssContent;
  document.head.appendChild(themeStyleElement);
  
  console.log('Theme CSS injected, content length:', cssContent.length);
  console.log('CSS content preview:', cssContent.substring(0, 200) + '...');
}

/**
 * Remove theme styles from the page
 */
function removeThemeStyles() {
  if (themeStyleElement) {
    themeStyleElement.remove();
    themeStyleElement = null;
    console.log('Theme CSS removed');
  }
  
  // Also check for any existing style elements with our ID
  const existingStyle = document.getElementById(THEME_STYLESHEET_ID);
  if (existingStyle) {
    existingStyle.remove();
  }
}

/**
 * Get the currently active theme
 * @returns {string} Current theme name
 */
function getCurrentActiveTheme() {
  return currentActiveTheme;
}

/**
 * Check if a theme is currently active
 * @param {string} themeName - Theme name to check
 * @returns {boolean} True if theme is active
 */
function isThemeActive(themeName) {
  return currentActiveTheme === themeName;
}

/**
 * Toggle between default and minimalistic themes
 */
async function toggleMinimalisticTheme() {
  const newTheme = currentActiveTheme === 'minimalistic' ? 'default' : 'minimalistic';
  await switchTheme(newTheme);
}

/**
 * Create minimal home icon for navigation
 */
function createHomeIcon() {
  // Check if we're on a page where home icon should appear
  const currentPath = window.location.pathname;
  const shouldShowHomeIcon = currentPath.match(/^\/nomis\/[^\/]+$/) || currentPath.match(/^\/group_chats\/[^\/]+$/);
  
  if (!shouldShowHomeIcon) {
    return;
  }
  
  // Remove existing home icon if any
  const existingIcon = document.querySelector('.nomi-home-icon');
  if (existingIcon) {
    existingIcon.remove();
  }
  
  // Create home icon element
  const homeIcon = document.createElement('div');
  homeIcon.className = 'nomi-home-icon';
  homeIcon.title = 'Go to Nomis';
  
  // Add click handler to navigate to /nomis
  homeIcon.addEventListener('click', () => {
    window.location.href = '/nomis';
  });
  
  // Add to page
  document.body.appendChild(homeIcon);
}

/**
 * Remove home icon from the page
 */
function removeHomeIcon() {
  const homeIcon = document.querySelector('.nomi-home-icon');
  if (homeIcon) {
    homeIcon.remove();
    console.log('Home icon removed');
  }
}

// Initialize theme manager when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeThemeManager);
} else {
  initializeThemeManager();
}
