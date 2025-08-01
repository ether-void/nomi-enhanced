let initialLoadComplete = false;
let autoPlayEnabled = true; // Default to enabled
let highlightEnabled = true; // Default to enabled
let currentObserver = null; // Track current observer to clean up
const PROCESSED_ATTRIBUTE = 'data-nomi-autoplay-processed'; // Custom attribute to mark processed messages
const HIGHLIGHT_PROCESSED_ATTRIBUTE = 'data-nomi-highlight-processed'; // Custom attribute to mark highlight processed messages

// CSS selectors are now loaded from cssConstants.js
// SELECTORS object is available globally from cssConstants.js

/**
 * Checks if a node has any of the specified classes.
 * @param {Node} node - The DOM node to check.
 * @param {string[]} classArray - An array of class names to check for.
 * @returns {boolean} - True if the node has any of the specified classes, false otherwise.
 */
function hasAnyClass(node, classArray) {
  if (!node || !node.classList || !Array.isArray(classArray)) return false;
  return classArray.some(cls => node.classList.contains(cls));
}


/**
 * Extracts the Nomi name from a message node using multiple fallback methods.
 * @param {Node} messageNode - The DOM node containing the message.
 * @returns {string|null} - The extracted Nomi name or null if not found.
 */
function extractNomiNameFromMessage(messageNode) {
  console.log('Nomi.ai Auto-Play: Attempting to extract Nomi name from:', messageNode);
  
  // Method 1: Direct selector (most reliable)
  const nameElement = messageNode.querySelector('p.css-zhge4h');
  if (nameElement && nameElement.textContent.trim()) {
    const name = nameElement.textContent.trim();
    console.log('Nomi.ai Auto-Play: Found Nomi name via direct selector:', name);
    return name;
  }
  
  // Method 2: Search within message wrapper
  const messageWrapper = messageNode.querySelector('.css-1glxx1x');
  if (messageWrapper) {
    const nameElement = messageWrapper.querySelector('p.css-zhge4h');
    if (nameElement && nameElement.textContent.trim()) {
      const name = nameElement.textContent.trim();
      console.log('Nomi.ai Auto-Play: Found Nomi name via message wrapper:', name);
      return name;
    }
  }
  
  // Method 3: DOM traversal fallback
  const nomiMessageDiv = messageNode.querySelector('div[type="Nomi"]');
  if (nomiMessageDiv) {
    console.log('Nomi.ai Auto-Play: Found Nomi message div, searching for name...');
    let current = nomiMessageDiv.parentElement;
    while (current && current !== messageNode) {
      const nameEl = current.querySelector('p.css-zhge4h');
      if (nameEl && nameEl.textContent.trim()) {
        const name = nameEl.textContent.trim();
        console.log('Nomi.ai Auto-Play: Found Nomi name via DOM traversal:', name);
        return name;
      }
      current = current.previousElementSibling;
    }
  }
  
  console.log('Nomi.ai Auto-Play: Could not extract Nomi name from message');
  return null; // Could not determine Nomi name
}

/**
 * Detects and processes Nomi messages for group chat profile management.
 * @param {Node} messageNode - The DOM node that might be a message.
 */
function detectNomiMessage(messageNode) {
  // Only process Nomi messages
  const nomiMessageContentDiv = messageNode.querySelector(SELECTORS.NOMI_MESSAGE_CONTENT);
  if (!nomiMessageContentDiv) return;
  
  // Extract which Nomi sent the message
  const nomiName = extractNomiNameFromMessage(messageNode);
  
  if (nomiName) {
    console.log('Nomi.ai Auto-Play: Message from Nomi:', nomiName);
  }
}

/**
 * Finds and plays a Nomi message if it's new and unprocessed.
 * @param {Node} messageNode - The DOM node that might be a message.
 */
function findAndPlayNomiMessage(messageNode) {
  if (!autoPlayEnabled) {
    return;
  }

  let messageContainers = SELECTORS.MESSAGE_CONTAINER.replaceAll('.', '').split(', ');
  // Ensure it's an element node and has the general message container class
  if (messageNode.nodeType !== Node.ELEMENT_NODE ||
    !(hasAnyClass(messageNode, messageContainers))) {
    return;
  }

  // If auto-play disabled or already processed, do nothing.
  if (!autoPlayEnabled || messageNode.hasAttribute(PROCESSED_ATTRIBUTE)) {
    return;
  }

  // Mark as processed immediately to prevent re-triggering for the same node if logic re-evaluates
  messageNode.setAttribute(PROCESSED_ATTRIBUTE, 'true');

  // Check if this message is from Nomi.
  const nomiMessageContentDiv = messageNode.querySelector(SELECTORS.NOMI_MESSAGE_CONTENT);

  if (nomiMessageContentDiv) {
    const nomiMessageContainer = nomiMessageContentDiv.closest(SELECTORS.NOMI_MESSAGE_WRAPPER);
    if (nomiMessageContainer) {
      const speakButton = nomiMessageContainer.querySelector(SELECTORS.SPEAK_BUTTON);
      if (speakButton) {
        console.log('Nomi.ai Auto-Play: New Nomi message detected, attempting to click play button:', speakButton);
        speakButton.click();
      } else {
        // console.log('Nomi.ai Auto-Play: Speak button not found for this Nomi message.');
      }
    } else {
      // console.log('Nomi.ai Auto-Play: Nomi message container (css-lpoi82) not found.');
    }
  } else {
    // Not a Nomi message, remove the processed attribute if we added it prematurely (though current logic adds it after this check)
    // messageNode.removeAttribute(PROCESSED_ATTRIBUTE);
  }
}

/**
 * Callback function for the MutationObserver.
 * @param {MutationRecord[]} mutationsList - A list of mutations that occurred.
 * @param {MutationObserver} observer - The MutationObserver instance.
 */
const observerCallback = (mutationsList, observer) => {
  // Get all added nodes from all mutations
  const allAddedNodes = [];
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      allAddedNodes.push(...mutation.addedNodes);
    }
  }
  
  // Only process the last added node (most recent)
  if (allAddedNodes.length > 0) {
    const lastNode = allAddedNodes[allAddedNodes.length - 1];
    
    // Existing functionality (unchanged)
    findAndPlayNomiMessage(lastNode);
    highlightAsteriskText(lastNode);
    
    // NEW: Detect which Nomi sent message
    detectNomiMessage(lastNode);
  }
};

// Add CSS styles for highlighting
function addHighlightStyles() {
  if (document.getElementById('nomi-highlight-styles')) return; // Already added
  
  const style = document.createElement('style');
  style.id = 'nomi-highlight-styles';
  style.textContent = `
    .nomi-highlight-text {
      background-color: #fff3cd !important;
      color: #856404 !important;
      padding: 2px 4px !important;
      border-radius: 3px !important;
      font-weight: bold !important;
    }
  `;
  document.head.appendChild(style);
}

// Function to highlight text enclosed in asterisks
function highlightAsteriskText(messageNode) {
  // Ensure it's an element node before proceeding
  if (!highlightEnabled || messageNode.nodeType !== Node.ELEMENT_NODE || messageNode.hasAttribute(HIGHLIGHT_PROCESSED_ATTRIBUTE)) {
    return;
  }
  
  messageNode.setAttribute(HIGHLIGHT_PROCESSED_ATTRIBUTE, 'true');
  
  // Find all text nodes and process them
  const walker = document.createTreeWalker(
    messageNode,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.includes('*')) {
      textNodes.push(node);
    }
  }
  
  textNodes.forEach(textNode => {
    const text = textNode.textContent;
    
    if (!text.includes('*')) {
      return;
    }
    
    // Match *text* where text doesn't contain asterisks
    const result = text.replace(/\*(.*?)\*/g, '<span class="nomi-highlight-text">$1</span>');
    
    if (result !== text) {
      const parent = textNode.parentNode;
      const wrapper = document.createElement('span');
      wrapper.innerHTML = result;
      parent.replaceChild(wrapper, textNode);
    }
  });
}

// Load extension states from storage
async function loadExtensionStates() {
  try {
    const result = await chrome.storage.local.get(['autoPlayEnabled', 'highlightEnabled']);
    autoPlayEnabled = result.autoPlayEnabled !== false; // Default to true
    highlightEnabled = result.highlightEnabled !== false; // Default to true
    console.log('Nomi.ai Auto-Play: Loaded states - auto-play:', autoPlayEnabled ? 'enabled' : 'disabled', 'highlight:', highlightEnabled ? 'enabled' : 'disabled');
  } catch (error) {
    console.log('Nomi.ai Auto-Play: Could not load states, defaulting to enabled');
    autoPlayEnabled = true;
    highlightEnabled = true;
  }
}

// Listen for toggle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleAutoPlay') {
    autoPlayEnabled = message.enabled;
    console.log('Nomi.ai Auto-Play: Toggle received, auto-play is now', autoPlayEnabled ? 'enabled' : 'disabled');
    sendResponse({ success: true });
  } else if (message.action === 'toggleHighlight') {
    highlightEnabled = message.enabled;
    console.log('Nomi.ai Auto-Play: Highlight toggle received, highlighting is now', highlightEnabled ? 'enabled' : 'disabled');
    
    if (highlightEnabled) {
      // Re-process all existing messages for highlighting
      processExistingMessagesForHighlighting();
    } else {
      // Remove highlighting from all messages
      removeAllHighlighting();
    }
    
    sendResponse({ success: true });
  } else if (message.action === 'switchTheme') {
    // Handle theme switching
    const themeName = message.theme;
    console.log('Nomi.ai Auto-Play: Theme switch received, switching to', themeName);
    
    // Use the theme manager to switch themes
    if (typeof switchTheme === 'function') {
      switchTheme(themeName).then(() => {
        console.log('Theme switched successfully to:', themeName);
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error switching theme:', error);
        sendResponse({ success: false, error: error.message });
      });
    } else {
      console.error('Theme manager not available');
      sendResponse({ success: false, error: 'Theme manager not available' });
    }
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

/**
 * Monitor voice playback by listening to speak button clicks
 */
function monitorVoicePlayback() {
  // Monitor all speak button clicks
  document.addEventListener('click', (e) => {
    const speakButton = e.target.closest('button[aria-label="Speak message"]');
    if (speakButton) {
      const messageContainer = speakButton.closest('.css-1r0bmfq, .css-fda5tg');
      if (messageContainer) {
        const nomiName = extractNomiNameFromMessage(messageContainer);
        
        if (nomiName) {
          console.log('Nomi.ai Auto-Play: Voice started for', nomiName);
          
          // Step 3: Show profile when voice message is played
          if (window.groupChatProfileManager && window.groupChatProfileManager.isGroupChat) {
            const nomiId = window.groupChatProfileManager.extractNomiIdFromElement(messageContainer);
            if (nomiId) {
              window.groupChatProfileManager.showOnlyProfile(nomiId);
            }
          }
        }
      }
    }
  });
}


/**
 * Initialize voice monitoring when the page is ready
 */
function initializeVoiceMonitoring() {
  console.log('Nomi.ai Auto-Play: Initializing voice monitoring...');
  monitorVoicePlayback();
}

// Helper functions for highlighting management
function processExistingMessagesForHighlighting() {
  const allMessages = document.querySelectorAll(SELECTORS.MESSAGE_CONTAINER);
  allMessages.forEach(msg => {
    msg.removeAttribute(HIGHLIGHT_PROCESSED_ATTRIBUTE);
    highlightAsteriskText(msg);
  });
}

function removeAllHighlighting() {
  const highlightedElements = document.querySelectorAll('.nomi-highlight-text');
  highlightedElements.forEach(element => {
    const parent = element.parentNode;
    parent.replaceChild(document.createTextNode('*' + element.textContent + '*'), element);
    parent.normalize(); // Merge adjacent text nodes
  });
  
  // Remove processed attributes
  const allMessages = document.querySelectorAll(SELECTORS.MESSAGE_CONTAINER);
  allMessages.forEach(msg => {
    msg.removeAttribute(HIGHLIGHT_PROCESSED_ATTRIBUTE);
  });
}

/**
 * Waits for the chat input to appear, indicating the page is fully loaded
 */
function waitForChatInput() {
  return new Promise((resolve) => {
    const chatInput = document.querySelector(SELECTORS.CHAT_INPUT);
    if (chatInput) {
      setTimeout(resolve, 1000); // Give extra time for navigation
    } else {
      // Chat input doesn't exist yet, wait for it to appear
      const checkForInput = () => {
        const chatInput = document.querySelector(SELECTORS.CHAT_INPUT);
        if (chatInput) {
          resolve();
        } else {
          setTimeout(checkForInput, 100);
        }
      };
      checkForInput();
    }
  });
}

/**
 * Check active Nomi from selector buttons
 */
function checkActiveNomiFromButtons() {
  if (!window.groupChatProfileManager || !window.groupChatProfileManager.isGroupChat) return;
  
  const nomiButtons = document.querySelectorAll('.css-1otg6ux button');
  if (nomiButtons.length === 0) return;
  
  let enabledButtons = [];
  
  nomiButtons.forEach((button, index) => {
    const innerDiv = button.querySelector('div');
    const isDisabled = innerDiv && innerDiv.hasAttribute('disabled');
    
    if (!isDisabled) {
      enabledButtons.push(button);
    }
  });
  
  if (enabledButtons.length === 1) {
    // Exactly one button enabled = that Nomi is active
    const activeButton = enabledButtons[0];
    const nomiId = window.groupChatProfileManager.extractNomiIdFromElement(activeButton);
    if (nomiId) {
      window.groupChatProfileManager.showOnlyProfile(nomiId);
    }
  } else if (enabledButtons.length === nomiButtons.length) {
    // All buttons enabled = normal state, show all profiles
    // window.groupChatProfileManager.showAllProfiles();
  }
}

/**
 * Initialize Nomi button monitoring for dynamic profiles
 */
function initializeNomiButtonMonitoring() {
  // Function to set up button monitoring once container is found
  const setupButtonMonitoring = (buttonContainer) => {
    // Initial check
    checkActiveNomiFromButtons();
    
    // Set up dedicated observer for button changes
    const buttonObserver = new MutationObserver(() => {
      checkActiveNomiFromButtons();
    });
    
    buttonObserver.observe(buttonContainer, {
      attributes: true,
      attributeFilter: ['disabled', 'class'],
      subtree: true
    });
  };
  
  // Try to find button container immediately
  const buttonContainer = document.querySelector('.css-1otg6ux');
  if (buttonContainer) {
    setupButtonMonitoring(buttonContainer);
  } else {
    // Wait for button container to appear
    const containerObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (addedNode.nodeType === Node.ELEMENT_NODE) {
            // Check if this node is the button container
            if (addedNode.classList && addedNode.classList.contains('css-1otg6ux')) {
              containerObserver.disconnect();
              setupButtonMonitoring(addedNode);
              return;
            }
            
            // Check if this node contains the button container
            const buttonContainer = addedNode.querySelector && addedNode.querySelector('.css-1otg6ux');
            if (buttonContainer) {
              containerObserver.disconnect();
              setupButtonMonitoring(buttonContainer);
              return;
            }
          }
        }
      }
    });
    
    // Start observing for the button container
    containerObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Main function to set up the observer
async function initializeAutoPlayer() {
  console.log('Nomi.ai Auto-Play: Initializing auto-player...');
  
  // Clean up previous observer if it exists
  if (currentObserver) {
    currentObserver.disconnect();
  }
  
  // Reset state for new page
  initialLoadComplete = false;
  
  // Load the current extension states
  await loadExtensionStates();
  
  // Add highlight styles
  addHighlightStyles();
  
  // Initialize voice monitoring
  initializeVoiceMonitoring();
  
  // Initialize Nomi button monitoring for dynamic profiles
  initializeNomiButtonMonitoring();

  // Wait for chat input to appear (indicates page is fully loaded)
  await waitForChatInput();
  
  // Wait additional 3 seconds after chat input appears to ensure all messages are loaded
  await new Promise(resolve => setTimeout(resolve, 2000));

  // --- CRITICAL: ADJUST THIS SELECTOR ---
  // Try to find the most specific, stable parent element that contains all chat messages.
  // Inspect Nomi.ai's live HTML structure for the best candidate.
  // Examples: document.querySelector('#chat-area'), document.querySelector('div.chat-scroll-region')
  // The sample HTML has `div class="css-16iz7u1"` as a message row, or `css-hkk5kr` for selfie rows.
  // We need the PARENT of these rows.
  let chatContainer = document.querySelector(SELECTORS.CHAT_CONTAINER); // This is a GUESS based on typical layouts. INSPECT AND ADJUST!
                                                                     // Often, it's a div that scrolls.
  if (!chatContainer || chatContainer === document.body) { // if the guess is bad or too generic
    // Find chat container by looking at the parent of the last message
    const allMessages = document.querySelectorAll(SELECTORS.MESSAGE_CONTAINER);
    if (allMessages.length > 0) {
      chatContainer = allMessages[allMessages.length - 1].parentElement;
    } else {
      chatContainer = document.body; // Fallback, less ideal
    }
  }
  console.log('Nomi.ai Auto-Play: Observing chat container:', chatContainer);
  // --- END CRITICAL SELECTOR ---

  // Mark ALL existing messages as processed so they aren't played
  const allExistingMessages = chatContainer.querySelectorAll(SELECTORS.MESSAGE_CONTAINER);
  let markedCount = 0;
  allExistingMessages.forEach(messageNode => {
    if (!messageNode.hasAttribute(PROCESSED_ATTRIBUTE)) {
      messageNode.setAttribute(PROCESSED_ATTRIBUTE, 'true');
      markedCount++;
    }
  });
  console.log(`Nomi.ai Auto-Play: Marked ${markedCount} existing messages as processed.`);
  
  // Process existing messages for highlighting if enabled
  if (highlightEnabled) {
    const allExistingMessages = chatContainer.querySelectorAll(SELECTORS.MESSAGE_CONTAINER);
    allExistingMessages.forEach(msg => highlightAsteriskText(msg));
  }

  // Page is fully loaded, enable auto-play for new messages
  initialLoadComplete = true;
  console.log('Nomi.ai Auto-Play: Page fully loaded, now monitoring for new messages.');

  // Create and start the observer
  currentObserver = new MutationObserver(observerCallback);
  currentObserver.observe(chatContainer, { childList: true, subtree: true });
  console.log('Nomi.ai Auto-Play: New observer created and started');
}

// Track URL for navigation detection
let lastUrl = location.href;

// Initialize on page load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeAutoPlayer();
} else {
    window.addEventListener('load', initializeAutoPlayer);
}

// SPA Navigation Detection using MutationObserver
const navigationObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
        // Clean up current observer
        if (currentObserver) {
            currentObserver.disconnect();
            currentObserver = null;
        }
        
        lastUrl = location.href;
        
        // Reinitialize after delay
        setTimeout(() => {
            initializeAutoPlayer();
        }, 500);
    }
});

// Start monitoring for navigation changes
navigationObserver.observe(document, {
    subtree: true,
    childList: true
});

// Handle back/forward navigation
window.addEventListener('popstate', () => {
  setTimeout(() => {
    initializeAutoPlayer();
  }, 500);
});
