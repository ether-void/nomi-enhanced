let initialLoadComplete = false;
let autoPlayEnabled = true; // Default to enabled
let highlightEnabled = true; // Default to enabled
const PROCESSED_ATTRIBUTE = 'data-nomi-autoplay-processed'; // Custom attribute to mark processed messages
const HIGHLIGHT_PROCESSED_ATTRIBUTE = 'data-nomi-highlight-processed'; // Custom attribute to mark highlight processed messages

const SELECTORS = {
  MESSAGE_CONTAINER: '.css-fda5tg, .css-1r0bmfq',
  NOMI_MESSAGE_CONTENT: '.css-fda5tg div[type="Nomi"].css-1aa7664, .css-1r0bmfq div[type="Nomi"].css-s72bf4',
  NOMI_MESSAGE_WRAPPER: '.css-lpoi82, .css-1glxx1x',
  SPEAK_BUTTON: '.css-dvxtzn button[aria-label="Speak message"].eg18m7y0',
  CHAT_CONTAINER: 'main > div > div > div'
};

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
 * Finds and plays a Nomi message if it's new and unprocessed.
 * @param {Node} messageNode - The DOM node that might be a message.
 */
function findAndPlayNomiMessage(messageNode) {
  let messageContainers = SELECTORS.MESSAGE_CONTAINER.replaceAll('.', '').split(', ');
  // Ensure it's an element node and has the general message container class
  if (messageNode.nodeType !== Node.ELEMENT_NODE ||
    !(hasAnyClass(messageNode, messageContainers))) {
    return;
  }

  // If not initial load complete, auto-play disabled, or already processed, do nothing.
  if (!initialLoadComplete || !autoPlayEnabled || messageNode.hasAttribute(PROCESSED_ATTRIBUTE)) {
    // If it's not initial load but it's marked, we've handled it.
    // If it IS initial load, we'll mark it later if it's not already.
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
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (!initialLoadComplete) {
          // During the initial phase, if nodes are added, mark them as processed
          // so they are not played when initialLoadComplete becomes true.
          if (node.nodeType === Node.ELEMENT_NODE && hasAnyClass(node, SELECTORS.MESSAGE_CONTAINER.replaceAll('.', '').split(', '))) {
            const nomiMsgDiv = node.querySelector('div[type="Nomi"].css-1aa7664');
            if (nomiMsgDiv) { // Only mark Nomi messages
                node.setAttribute(PROCESSED_ATTRIBUTE, 'true');
            }
          }
          // If the added node itself contains multiple messages (e.g., a wrapper div loaded)
          if (node.nodeType === Node.ELEMENT_NODE) {
            const potentialMessages = node.querySelectorAll(SELECTORS.NOMI_MESSAGE_CONTENT);
            potentialMessages.forEach(nomiMsgDiv => {
                const parentMessageNode = nomiMsgDiv.closest(SELECTORS.MESSAGE_CONTAINER);
                if(parentMessageNode) parentMessageNode.setAttribute(PROCESSED_ATTRIBUTE, 'true');
            });
          }
        } else {
          // Initial load is complete, process normally
          findAndPlayNomiMessage(node);
          highlightAsteriskText(node);
          // If the added node itself contains multiple messages (e.g., a wrapper div loaded)
          if (node.nodeType === Node.ELEMENT_NODE) {
            const potentialMessages = node.querySelectorAll(SELECTORS.MESSAGE_CONTAINER);
            // Only play the last (most recent) Nomi message
            let lastNomiMessage = null;
            potentialMessages.forEach(potentialMsg => {
              highlightAsteriskText(potentialMsg);
              const nomiMsgDiv = potentialMsg.querySelector('div[type="Nomi"].css-1aa7664');
              if (nomiMsgDiv && !potentialMsg.hasAttribute(PROCESSED_ATTRIBUTE)) {
                lastNomiMessage = potentialMsg;
              }
            });
            if (lastNomiMessage) {
              findAndPlayNomiMessage(lastNomiMessage);
            }
          }
        }
      });
    }
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
  }
});

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

// Main function to set up the observer
async function initializeAutoPlayer() {
  console.log('Nomi.ai Auto-Play: Page loaded, setting up observer.');
  
  // Load the current extension states
  await loadExtensionStates();
  
  // Add highlight styles
  addHighlightStyles();

  // --- CRITICAL: ADJUST THIS SELECTOR ---
  // Try to find the most specific, stable parent element that contains all chat messages.
  // Inspect Nomi.ai's live HTML structure for the best candidate.
  // Examples: document.querySelector('#chat-area'), document.querySelector('div.chat-scroll-region')
  // The sample HTML has `div class="css-16iz7u1"` as a message row, or `css-hkk5kr` for selfie rows.
  // We need the PARENT of these rows.
  let chatContainer = document.querySelector(SELECTORS.CHAT_CONTAINER); // This is a GUESS based on typical layouts. INSPECT AND ADJUST!
                                                                     // Often, it's a div that scrolls.
  if (!chatContainer || chatContainer === document.body) { // if the guess is bad or too generic
    // Try to find a more specific parent of the first message.
    const firstMessageExample = document.querySelector(SELECTORS.MESSAGE_CONTAINER);
    if (firstMessageExample && firstMessageExample.parentElement) {
      chatContainer = firstMessageExample.parentElement;
    } else {
      chatContainer = document.body; // Fallback, less ideal
    }
  }
  console.log('Nomi.ai Auto-Play: Observing chat container:', chatContainer);
  // --- END CRITICAL SELECTOR ---

  // Mark all Nomi messages already present on the page as "processed" so they aren't played.
  const existingNomiMessages = chatContainer.querySelectorAll(SELECTORS.NOMI_MESSAGE_CONTENT);
  let markedCount = 0;
  existingNomiMessages.forEach(nomiMsgDiv => {
    const parentMessageNode = nomiMsgDiv.closest(SELECTORS.MESSAGE_CONTAINER);
    if (parentMessageNode && !parentMessageNode.hasAttribute(PROCESSED_ATTRIBUTE)) {
      parentMessageNode.setAttribute(PROCESSED_ATTRIBUTE, 'true');
      markedCount++;
    }
  });
  console.log(`Nomi.ai Auto-Play: Marked ${markedCount} existing Nomi messages as processed.`);
  
  // Process existing messages for highlighting if enabled
  if (highlightEnabled) {
    const allExistingMessages = chatContainer.querySelectorAll(SELECTORS.MESSAGE_CONTAINER);
    allExistingMessages.forEach(msg => highlightAsteriskText(msg));
  }

  // Create and start the observer
  const observer = new MutationObserver(observerCallback);
  observer.observe(chatContainer, { childList: true, subtree: true });

  // Set a timeout to consider the initial loading phase complete.
  // Adjust this duration (in milliseconds) based on how quickly Nomi.ai typically loads its initial chat messages.
  // Too short, and it might still play some initial messages. Too long, and it might miss early new messages.
  const initialLoadDelay = 3000; // 3 seconds, adjust as needed
  setTimeout(() => {
    initialLoadComplete = true;
    console.log(`Nomi.ai Auto-Play: Initial load considered complete after ${initialLoadDelay / 1000}s. Now monitoring for truly new messages.`);
  }, initialLoadDelay);
}

// Wait for the window to load before initializing.
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeAutoPlayer();
} else {
    window.addEventListener('load', initializeAutoPlayer);
}

console.log('Nomi.ai Auto-Play content script loaded and waiting for page load.');
