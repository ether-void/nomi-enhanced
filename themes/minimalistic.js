/**
 * Minimalistic Theme Configuration
 * Theme that removes UI noise and focuses on chat interface
 */

const MINIMALISTIC_THEME = {
  name: 'Minimalistic',
  description: 'Clean, distraction-free chat interface with hidden sidebar and navigation',
  version: '1.0.0',
  
  // Elements to hide completely
  hiddenElements: MINIMALISTIC_HIDDEN_SELECTORS,
  
  // CSS styles to apply
  styles: `
    /* Hide UI elements for minimalistic theme */
    ${MINIMALISTIC_HIDDEN_SELECTORS.join(', ')} {
      display: none !important;
    }
    
    /* Main content area adjustments */
    ${CSS_SELECTORS.LAYOUT.MAIN_CONTENT} {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Chat content area */
    ${CSS_SELECTORS.LAYOUT.CHAT_CONTENT} {
      margin-top: 0 !important;
      padding: 20px !important;
      height: 100vh !important;
      overflow-y: auto !important;
      position: relative !important;
      z-index: 3 !important;
    }
    
    /* Main container width */
    ${CSS_SELECTORS.LAYOUT.MAIN_WRAPPER} {
      width: 100% !important;
    }
    
    /* Chat container padding */
    ${CSS_SELECTORS.LAYOUT.CHAT_CONTAINER_INNER} {
      padding: 0 !important;
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
    
    /* Focus state for input */
    textarea[aria-label="Chat Input"]:focus, 
    textarea[aria-label="Group Chat Input"]:focus {
      outline: none !important;
      border-color: #9610FF !important;
      box-shadow: 0 0 0 2px rgba(150, 16, 255, 0.3) !important;
    }
    
    /* Button styling */
    button[aria-label="Speak message"] {
      background-color: rgba(150, 16, 255, 0.8) !important;
      border: none !important;
      border-radius: 6px !important;
      padding: 8px 12px !important;
      transition: all 0.3s ease !important;
    }
    
    ${CSS_SELECTORS.MESSAGE.SPEAK_BUTTON_SIMPLE}:hover {
      background-color: rgba(150, 16, 255, 1) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 8px rgba(150, 16, 255, 0.3) !important;
    }
    
    /* Scrollbar styling */
    ::-webkit-scrollbar {
      width: 8px !important;
    }
    
    ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1) !important;
      border-radius: 4px !important;
    }
    
    ::-webkit-scrollbar-thumb {
      background: rgba(150, 16, 255, 0.6) !important;
      border-radius: 4px !important;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(150, 16, 255, 0.8) !important;
    }
    
    /* Main container background */
    .css-1uob4wx {
      background: #0a0a0a !important;
    }
    
    /* Text readability */
    h1, h2, h3, h4, h5, h6, p, span, div {
      color: #ffffff !important;
    }
    
    /* Nomi message styling */
    div[type="Nomi"] {
      background-color: rgba(150, 16, 255, 0.1) !important;
      border-left: 3px solid #9610FF !important;
      padding-left: 15px !important;
    }
    
    /* User message styling */
    div[type="User"] {
      background-color: rgba(255, 255, 255, 0.08) !important;
      border-left: 3px solid #ffffff !important;
      padding-left: 15px !important;
    }
    
    /* Center image messages */
    ${CSS_SELECTORS.IMAGE.IMAGE_MESSAGE_CONTAINER} {
      margin: 15px auto !important;
      text-align: center !important;
    }
    
    /* Style date indicators */
    ${CSS_SELECTORS.MESSAGE.DATE_INDICATOR} {
      background-color: rgba(0, 0, 0, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 20px !important;
      padding: 8px 16px !important;
      margin: 20px auto !important;
      text-align: center !important;
      color: rgba(255, 255, 255, 0.9) !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      backdrop-filter: blur(10px) !important;
      max-width: fit-content !important;
      display: block !important;
    }
    
    /* Simple message containers */
    ${CSS_SELECTORS.MESSAGE.MESSAGE_CONTAINER} {
      max-width: 800px !important;
      margin: 15px auto !important;
      padding: 15px !important;
      border-radius: 8px !important;
      background: rgba(0, 0, 0, 0.7) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
    }

    /* Remove background from chat input container */

    ${CSS_SELECTORS.INPUT.CHAT_INPUT_CONTAINER} {
      background: transparent !important;
    }
    
    /* Simple input styling */
    ${CSS_SELECTORS.INPUT.CHAT_INPUT} {
      background: rgba(0, 0, 0, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 6px !important;
      padding: 12px !important;
      color: #ffffff !important;
    }
    
    ${CSS_SELECTORS.INPUT.CHAT_INPUT}:focus {
      outline: none !important;
      border-color: rgba(255, 255, 255, 0.4) !important;
    }
    
    /* Improved speak button styling */
    ${CSS_SELECTORS.MESSAGE.SPEAK_BUTTON_SIMPLE} {
      background: rgba(255, 255, 255, 0.08) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
      color: #ffffff !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      transition: all 0.2s ease !important;
      backdrop-filter: blur(10px) !important;
      min-width: 60px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
    }
    
    ${CSS_SELECTORS.MESSAGE.SPEAK_BUTTON_SIMPLE}:hover {
      background: rgba(255, 255, 255, 0.15) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
    }
    
    /* Playing state - keep same style as default */
    ${CSS_SELECTORS.MESSAGE.SPEAK_BUTTON_SIMPLE}[aria-pressed="true"] {
      background: rgba(255, 255, 255, 0.08) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
      color: #ffffff !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      transition: all 0.2s ease !important;
      backdrop-filter: blur(10px) !important;
      min-width: 60px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
    }
    
    /* Stop button styling - same as play button */
    button[aria-label="Stop speaking message"] {
      background: rgba(255, 255, 255, 0.08) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
      color: #ffffff !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      transition: all 0.2s ease !important;
      backdrop-filter: blur(10px) !important;
      min-width: 60px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
    }
    
    button[aria-label="Stop speaking message"]:hover {
      background: rgba(255, 255, 255, 0.15) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
    }
    
    /* Style the play icon inside the button */
    ${CSS_SELECTORS.MESSAGE.SPEAK_BUTTON_SIMPLE} svg {
      width: 16px !important;
      height: 16px !important;
      fill: #ffffff !important;
      opacity: 0.9 !important;
    }
    
    button[aria-label="Speak message"]:hover svg {
      opacity: 1 !important;
    }
    
    /* Style the stop icon inside the button - same size as play icon */
    button[aria-label="Stop speaking message"] svg {
      width: 16px !important;
      height: 16px !important;
      fill: #ffffff !important;
      opacity: 0.9 !important;
    }
    
    button[aria-label="Stop speaking message"]:hover svg {
      opacity: 1 !important;
    }
    
    /* Processing button styling - same as play/stop buttons */
    button[aria-label="Processing..."] {
      background: rgba(255, 255, 255, 0.08) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
      color: #ffffff !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      transition: all 0.2s ease !important;
      backdrop-filter: blur(10px) !important;
      min-width: 60px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
    }
    
    /* Processing icon styling - same size as play/stop icons */
    button[aria-label="Processing..."] svg {
      width: 16px !important;
      height: 16px !important;
      fill: #ffffff !important;
      opacity: 0.9 !important;
    }
    
    /* Simple scrollbar */
    ${CSS_SELECTORS.SCROLLBAR.SCROLLBAR} {
      width: 8px !important;
    }
    
    ${CSS_SELECTORS.SCROLLBAR.SCROLLBAR_TRACK} {
      background: rgba(0, 0, 0, 0.2) !important;
    }
    
    ${CSS_SELECTORS.SCROLLBAR.SCROLLBAR_THUMB} {
      background: rgba(255, 255, 255, 0.3) !important;
      border-radius: 4px !important;
    }
    
    ${CSS_SELECTORS.SCROLLBAR.SCROLLBAR_THUMB_HOVER} {
      background: rgba(255, 255, 255, 0.5) !important;
    }
    
    /* Simple body styling with background image */
    body {
      background: 
        linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
        url('BACKGROUND_IMAGE_URL_PLACEHOLDER') !important;
      background-size: cover !important;
      background-position: center !important;
      background-attachment: fixed !important;
      background-repeat: no-repeat !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }
    
    /* Main container */
    ${CSS_SELECTORS.LAYOUT.MAIN_CONTAINER} {
      background: transparent !important;
    }
    
    /* Simple text styling */
    h1, h2, h3, h4, h5, h6, p, span, div {
      color: #ffffff !important;
    }
    
    /* Simple message type styling */
    ${CSS_SELECTORS.MESSAGE.NOMI_MESSAGE_TYPE} {
      border-left: 3px solid #9610FF !important;
      padding-left: 15px !important;
    }
    
    ${CSS_SELECTORS.MESSAGE.USER_MESSAGE_TYPE} {
      border-left: 3px solid #ffffff !important;
      padding-left: 15px !important;
    }
    
    /* Minimalistic highlight styling for *text* */
    ${CSS_SELECTORS.THEME.HIGHLIGHT_TEXT} {
      background-color: rgba(255, 255, 255, 0.15) !important;
      color: #ffffff !important;
      padding: 1px 3px !important;
      border-radius: 3px !important;
      font-weight: 400 !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      font-style: italic !important;
    }
    
    /* Minimal home icon */
    .nomi-home-icon {
      position: fixed !important;
      top: 40px !important;
      left: 20px !important;
      width: 32px !important;
      height: 32px !important;
      background-color: rgba(0, 0, 0, 0.7) !important;
      border-radius: 8px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      z-index: 9999 !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      backdrop-filter: blur(10px) !important;
    }
    
    .nomi-home-icon:hover {
      background-color: rgba(0, 0, 0, 0.9) !important;
      border-color: rgba(255, 255, 255, 0.4) !important;
      transform: scale(1.05) !important;
    }
    
    .nomi-home-icon::before {
      content: "⌂" !important;
      color: rgba(255, 255, 255, 0.8) !important;
      font-size: 18px !important;
      font-weight: normal !important;
    }
    
    .nomi-home-icon:hover::before {
      color: rgba(255, 255, 255, 1) !important;
    }
  `,
  
  // Theme settings
  settings: {
    hideElements: true,
    darkMode: true,
    compactMode: true,
    enhancedContrast: true
  }
};

// Export the theme configuration
const getMinimalisticTheme = () => MINIMALISTIC_THEME;
