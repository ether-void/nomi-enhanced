/**
 * Background System for Nomi Extension
 * Handles dynamic background changes based on location and time
 */

// Background system constants - will be populated dynamically
let BACKGROUNDS = {};

const BACKGROUND_STYLE_ID = 'nomi-background-style';
let currentBackground = null;

/**
 * Scans the backgrounds folder and populates BACKGROUNDS object
 */
async function discoverBackgrounds() {
  BACKGROUNDS = {}; // Reset
  
  try {
    // Try to fetch the list of available backgrounds by testing common folder names
    const testFolders = [
      'bedroom', 'livingroom', 'outside', 'kitchen', 'office', 'cafe', 
      'park', 'beach', 'forest', 'city', 'home', 'studio', 'library', 'street'
    ];
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    for (const folder of testFolders) {
      // Test if any day OR night image exists in this folder
      let folderFound = false;
      
      for (const ext of imageExtensions) {
        // Check for day image
        const dayImageUrl = chrome.runtime.getURL(`backgrounds/${folder}/day.${ext}`);
        try {
          const dayResponse = await fetch(dayImageUrl, { method: 'HEAD' });
          if (dayResponse.ok) {
            folderFound = true;
            break;
          }
        } catch (error) {
          // If day image not found, try night image
        }
        
        // Check for night image if day not found
        if (!folderFound) {
          const nightImageUrl = chrome.runtime.getURL(`backgrounds/${folder}/night.${ext}`);
          try {
            const nightResponse = await fetch(nightImageUrl, { method: 'HEAD' });
            if (nightResponse.ok) {
              folderFound = true;
              break;
            }
          } catch (error) {
            // Try next extension
          }
        }
      }
      
      if (folderFound) {
        // Folder exists, add to BACKGROUNDS with proper capitalization
        const displayName = folder.charAt(0).toUpperCase() + folder.slice(1).replace(/([a-z])([A-Z])/g, '$1 $2');
        BACKGROUNDS[folder] = displayName;
      }
    }
  } catch (error) {
    console.error('Nomi Background: Error discovering backgrounds:', error);
    // Fallback to default backgrounds
    BACKGROUNDS = {
      bedroom: 'Bedroom',
      livingroom: 'Living Room',
      outside: 'Outside'
    };
  }
}

/**
 * Determines if it's day or night based on current time
 * @returns {string} 'day' or 'night'
 */
function getTimeOfDay() {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? 'day' : 'night';
}

/**
 * Gets the extension's base URL for loading local images
 * @returns {string} Base URL for extension resources
 */
function getExtensionBaseUrl() {
  return chrome.runtime.getURL('');
}

/**
 * Applies a background to the chat interface
 * @param {string} location - Location name (bedroom, livingroom, outside)
 * @param {string} timeOverride - Optional time override ('day' or 'night')
 */
async function applyBackground(location, timeOverride = null) {
  let time = timeOverride || getTimeOfDay();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  let imagePath = null;
  let imageUrl = null;
  
  // Try to find an image with any supported extension
  for (const ext of imageExtensions) {
    const testPath = `backgrounds/${location}/${time}.${ext}`;
    const testUrl = chrome.runtime.getURL(testPath);
    
    try {
      const response = await fetch(testUrl, { method: 'HEAD' });
      if (response.ok) {
        imagePath = testPath;
        imageUrl = testUrl;
        break;
      }
    } catch (error) {
      // Try next extension
    }
  }
  
  // If no image found for requested time, try opposite time
  if (!imageUrl) {
    const fallbackTime = time === 'day' ? 'night' : 'day';
    for (const ext of imageExtensions) {
      const testPath = `backgrounds/${location}/${fallbackTime}.${ext}`;
      const testUrl = chrome.runtime.getURL(testPath);
      
      try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        if (response.ok) {
          time = fallbackTime;
          imagePath = testPath;
          imageUrl = testUrl;
          break;
        }
      } catch (error) {
        // Try next extension
      }
    }
  }
  
  // If still no image found, use default path for CSS fallback
  if (!imageUrl) {
    imagePath = `backgrounds/${location}/${time}.jpg`;
    imageUrl = chrome.runtime.getURL(imagePath);
  }
  
  // Remove existing background style
  const existingStyle = document.getElementById(BACKGROUND_STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create new background style that follows minimalistic theme pattern
  const style = document.createElement('style');
  style.id = BACKGROUND_STYLE_ID;
  
  // Calculate brightness overlay - higher brightness = less dark overlay
  const brightness = (window.backgroundBrightness || 100) / 100;
  const overlayOpacity = 0.6 + (1 - brightness) * 0.4; // Range from 0.6 to 1.0
  
  style.textContent = `
    /* Background styling following minimalistic theme pattern */
    body {
      background: 
        linear-gradient(rgba(0, 0, 0, ${overlayOpacity}), rgba(0, 0, 0, ${overlayOpacity})),
        url('${imageUrl}') !important;
      background-size: cover !important;
      background-position: center !important;
      background-attachment: fixed !important;
      background-repeat: no-repeat !important;
      color: #ffffff !important;
    }
    
    /* Ensure message containers remain readable with theme styling */
    .css-fda5tg, .css-1r0bmfq {
      background: rgba(0, 0, 0, 0.7) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      backdrop-filter: blur(10px) !important;
    }
    
    /* Main container transparency */
    .css-1uob4wx {
      background: transparent !important;
    }
    
    /* Input area with background */
    textarea[aria-label="Chat Input"], 
    textarea[aria-label="Group Chat Input"] {
      background: rgba(0, 0, 0, 0.6) !important;
      backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      color: #ffffff !important;
    }
  `;
  
  document.head.appendChild(style);
  
  // Save current background
  currentBackground = { location, time };
  chrome.storage.local.set({ 'currentBackground': currentBackground });
  
  // Trigger theme refresh if minimalistic theme is active
  if (typeof switchTheme === 'function') {
    const currentTheme = await getCurrentTheme?.() || 'default';
    if (currentTheme === 'minimalistic') {
      setTimeout(() => switchTheme('minimalistic'), 100);
    }
  }
  
  console.log(`Nomi Background: Applied ${location} ${time} background`);
}

/**
 * Removes current background and restores default
 */
async function resetBackground() {
  const existingStyle = document.getElementById(BACKGROUND_STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  currentBackground = null;
  chrome.storage.local.remove('currentBackground');
  
  // Trigger theme refresh if minimalistic theme is active
  if (typeof switchTheme === 'function') {
    const currentTheme = await getCurrentTheme?.() || 'default';
    if (currentTheme === 'minimalistic') {
      setTimeout(() => switchTheme('minimalistic'), 100);
    }
  }
  
  console.log('Nomi Background: Reset to default');
}

/**
 * Loads saved background from storage
 */
async function loadSavedBackground() {
  try {
    const result = await chrome.storage.local.get(['currentBackground']);
    if (result.currentBackground) {
      const { location, time } = result.currentBackground;
      // Reapply with current time (not saved time) for automatic day/night switching
      await applyBackground(location);
    }
  } catch (error) {
    console.log('Nomi Background: Could not load saved background');
  }
}

/**
 * Handles background-related commands
 * @param {string} command - The command to handle
 * @returns {string} Feedback message
 */
async function handleBackgroundCommand(command) {
  const [cmd, ...args] = command.toLowerCase().split(' ');
  
  // Check if it's a valid background command
  if (BACKGROUNDS[cmd]) {
    await applyBackground(cmd);
    const time = getTimeOfDay();
    return `Background changed to ${BACKGROUNDS[cmd]} (${time})`;
  }
  
  switch (cmd) {
      
    case 'backgrounds':
      const locations = Object.keys(BACKGROUNDS).map(key => `/${key}`).join(', ');
      return `Available backgrounds: ${locations}, /reset`;
      
    case 'reset':
      await resetBackground();
      return 'Background reset to default';
      
    case 'time':
      if (args[0] && currentBackground) {
        const timeArg = args[0].toLowerCase();
        if (timeArg === 'day' || timeArg === 'night') {
          await applyBackground(currentBackground.location, timeArg);
          return `Time changed to ${timeArg} for ${BACKGROUNDS[currentBackground.location]}`;
        }
      }
      return 'Usage: /time day or /time night (requires active background)';
      
    default:
      return null; // Not a background command
  }
}

/**
 * Gets current background info
 * @returns {string} Current background description
 */
function getCurrentBackground() {
  if (!currentBackground) {
    return 'Default';
  }
  return `${BACKGROUNDS[currentBackground.location]} (${currentBackground.time})`;
}

/**
 * Reapply current background with updated brightness
 */
async function reapplyCurrentBackground() {
  if (currentBackground) {
    await applyBackground(currentBackground.location, currentBackground.time);
  }
}

/**
 * Initializes the background system
 */
async function initializeBackgroundSystem() {
  console.log('Nomi Background: Initializing background system...');
  
  // Discover available backgrounds
  await discoverBackgrounds();
  
  // Load saved background
  await loadSavedBackground();
  
  // Set up automatic day/night switching every hour
  setInterval(async () => {
    if (currentBackground) {
      const newTime = getTimeOfDay();
      if (newTime !== currentBackground.time) {
        await applyBackground(currentBackground.location);
      }
    }
  }, 3600000); // Check every hour
}

// Export functions for use in main extension
window.backgroundSystem = {
  handleBackgroundCommand,
  initializeBackgroundSystem,
  applyBackground,
  resetBackground,
  reapplyCurrentBackground,
  getTimeOfDay,
  getCurrentBackground,
  get BACKGROUNDS() { return BACKGROUNDS; } // Use getter to return current BACKGROUNDS
};

console.log('Background System loaded successfully');
