/**
 * CSS Constants for Nomi.ai Interface
 * Centralized location for all CSS selectors used throughout the extension
 * Update this file when Nomi.ai changes their CSS classes
 */

// Message-related selectors
const MESSAGE_SELECTORS = {
  MESSAGE_CONTAINER: '.css-fda5tg, .css-1r0bmfq',
  NOMI_MESSAGE_CONTENT: '.css-fda5tg div[type="Nomi"].css-1aa7664, .css-1r0bmfq div[type="Nomi"].css-s72bf4',
  NOMI_MESSAGE_WRAPPER: '.css-lpoi82, .css-1glxx1x',
  NOMI_MESSAGE_TYPE: 'div[type="Nomi"]',
  USER_MESSAGE_TYPE: 'div[type="User"]',
  SPEAK_BUTTON: '.css-dvxtzn button[aria-label="Speak message"].eg18m7y0',
  SPEAK_BUTTON_SIMPLE: 'button[aria-label="Speak message"]',
  DATE_INDICATOR: '.css-ygnlmt.e1rfoea80',
  NOMI_NAME_ELEMENT: '.css-zhge4h'
};

// Layout and navigation selectors
const LAYOUT_SELECTORS = {
  MAIN_CONTAINER: '.css-1uob4wx',
  MAIN_WRAPPER: '.css-gfwp6t',
  MAIN_CONTENT: '.css-7n1ipl',
  CHAT_CONTENT: '.css-5svgrr',
  CHAT_CONTAINER: 'main > div > div > div',
  CHAT_CONTAINER_INNER: '.css-da68i2'
};

// Input and interaction selectors
const INPUT_SELECTORS = {
  CHAT_INPUT: 'textarea[aria-label="Chat Input"], textarea[aria-label="Group Chat Input"]',
  CHAT_INPUT_USER: 'textarea[aria-label="Chat Input"]',
  CHAT_INPUT_GROUP: 'textarea[aria-label="Group Chat Input"]'
};

// Elements to hide in minimalistic theme
const HIDDEN_ELEMENTS = {
  LEFT_SIDEBAR: '.ChatSidebarLayout_sidebar___cf0i',
  BOTTOM_NAVIGATION: '.css-mxn7fm',
  CHAT_HEADER: '.css-1hcto2w',
  TOP_HEADER: '.css-n7u4e3'
};

// Image message selectors
const IMAGE_MESSAGE_SELECTORS = {
  IMAGE_MESSAGE_CONTAINER: '.css-hkk5kr',
  IMAGE_MESSAGE_CONTENT: '.css-1nrbegk',
  IMAGE_MESSAGE_WRAPPER: '.css-19s5kpq',
  IMAGE_CONTAINER: '.css-1cdpxqz',
  IMAGE_OVERLAY: '.css-39c2j4',
  IMAGE_PLACEHOLDER: '.css-1xjpsh2',
  IMAGE_ICON_OVERLAY: '.css-1iw9n18'
};

// Like/dislike and interaction selectors
const INTERACTION_SELECTORS = {
  LIKE_DISLIKE_CONTAINER: '.css-11iyxsa',
  LIKE_DISLIKE_BUTTONS: '.css-k008qs',
  LIKE_DISLIKE_BUTTON: '.css-16hofwr',
  LIKE_DISLIKE_EMOJI: '.css-wio1rn'
};

// Scrollbar selectors
const SCROLLBAR_SELECTORS = {
  SCROLLBAR: '::-webkit-scrollbar',
  SCROLLBAR_TRACK: '::-webkit-scrollbar-track',
  SCROLLBAR_THUMB: '::-webkit-scrollbar-thumb',
  SCROLLBAR_THUMB_HOVER: '::-webkit-scrollbar-thumb:hover'
};

// Group chat profile selectors
const GROUP_CHAT_SELECTORS = {
  PROFILE_SIDEBAR: '.css-1ruxp1v.exd19tt0',
  PROFILE_CONTAINER: '.css-1j7y90h.eco4y9y0',
  PROFILE_GRID: '.css-1j7y90h.e10yhkdj0',
  PROFILE_PICTURE: '.css-1c0usqt.exd19tt2 [height="210"]',
  NOMI_NAME_ELEMENT: '.css-zhge4h'
};

// Theme-specific selectors
const THEME_SELECTORS = {
  HIGHLIGHT_TEXT: '.nomi-highlight-text',
  THEME_STYLESHEET_ID: 'nomi-theme-styles',
  HIGHLIGHT_STYLESHEET_ID: 'nomi-highlight-styles'
};

// Consolidated selectors object for easy access
const CSS_SELECTORS = {
  MESSAGE: MESSAGE_SELECTORS,
  LAYOUT: LAYOUT_SELECTORS,
  INPUT: INPUT_SELECTORS,
  HIDDEN: HIDDEN_ELEMENTS,
  IMAGE: IMAGE_MESSAGE_SELECTORS,
  INTERACTION: INTERACTION_SELECTORS,
  SCROLLBAR: SCROLLBAR_SELECTORS,
  GROUP_CHAT: GROUP_CHAT_SELECTORS,
  THEME: THEME_SELECTORS
};

// Export for use in other files
const NOMI_CSS_CONSTANTS = CSS_SELECTORS;

const SELECTORS = {
  MESSAGE_CONTAINER: MESSAGE_SELECTORS.MESSAGE_CONTAINER,
  NOMI_MESSAGE_CONTENT: MESSAGE_SELECTORS.NOMI_MESSAGE_CONTENT,
  NOMI_MESSAGE_WRAPPER: MESSAGE_SELECTORS.NOMI_MESSAGE_WRAPPER,
  SPEAK_BUTTON: MESSAGE_SELECTORS.SPEAK_BUTTON,
  CHAT_CONTAINER: LAYOUT_SELECTORS.CHAT_CONTAINER,
  CHAT_INPUT: INPUT_SELECTORS.CHAT_INPUT
};

// Individual selector arrays for theme usage
const MINIMALISTIC_HIDDEN_SELECTORS = [
  HIDDEN_ELEMENTS.LEFT_SIDEBAR,
  HIDDEN_ELEMENTS.BOTTOM_NAVIGATION,
  HIDDEN_ELEMENTS.CHAT_HEADER,
  HIDDEN_ELEMENTS.TOP_HEADER
];

// Validation helper to check if selectors exist in DOM
function validateSelectors(selectorList) {
  const results = {};
  selectorList.forEach(selector => {
    results[selector] = document.querySelector(selector) !== null;
  });
  return results;
}

// Get all selectors as a flat array for validation
function getAllSelectors() {
  const allSelectors = [];
  
  function extractSelectors(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Handle comma-separated selectors
        const selectors = obj[key].split(',').map(s => s.trim());
        allSelectors.push(...selectors);
      } else if (typeof obj[key] === 'object') {
        extractSelectors(obj[key]);
      }
    }
  }
  
  extractSelectors(CSS_SELECTORS);
  return [...new Set(allSelectors)]; // Remove duplicates
}

console.log('CSS Constants loaded successfully');
