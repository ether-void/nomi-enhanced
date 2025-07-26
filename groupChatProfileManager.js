/**
 * Group Chat Profile Manager
 * Manages dynamic profile picture visibility in group chats
 * Shows only the active Nomi's profile when they message or speak
 */

let dynamicProfileEnabled = false; // Default disabled

class GroupChatProfileManager {
  constructor() {
    this.activeNomi = null;
    this.profileMap = new Map(); // Map Nomi names to profile elements
    this.isGroupChat = false;
    this.originalVisibility = new Map();
    this.initialized = false;
    this.nomiImageMap = new Map(); // Map Nomi ID to image URL
    this.dynamicProfiles = new Set(); // Track dynamically created profile elements
  }

  /**
   * Initialize and detect if we're in a group chat
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('GroupChatProfileManager: Initializing...');
    
    // Load settings
    await this.loadSettings();
    
    // Wait for chat input to appear (indicates page is fully loaded)
    await this.waitForChatInput();
    
    // Wait additional time for all elements to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if in group chat
    this.isGroupChat = this.detectGroupChat();
    
    if (this.isGroupChat) {
      // Fetch group chat data to get Nomi image mappings
      await this.fetchGroupChatData();
      this.buildProfileMap();
    } else {
      console.log('GroupChatProfileManager: Not in group chat, manager inactive');
    }
    
    this.initialized = true;
  }
  
  /**
   * Wait for chat input to appear, indicating the page is fully loaded
   * (Same approach as autoNomi.js)
   */
  waitForChatInput() {
    return new Promise((resolve) => {
      const chatInput = document.querySelector('textarea[aria-label="Chat Input"], textarea[aria-label="Group Chat Input"]');
      if (chatInput) {
        setTimeout(resolve, 1000); // Give extra time for navigation
      } else {
        // Chat input doesn't exist yet, wait for it to appear
        const checkForInput = () => {
          const chatInput = document.querySelector('textarea[aria-label="Chat Input"], textarea[aria-label="Group Chat Input"]');
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
   * Fetch group chat data to get Nomi image mappings
   */
  async fetchGroupChatData() {
    try {
      // Extract group chat ID from URL
      const urlMatch = window.location.href.match(/\/group-chats\/([^\/\?]+)/);
      if (!urlMatch) {
        console.log('GroupChatProfileManager: Could not extract group chat ID from URL');
        return;
      }
      
      const groupChatId = urlMatch[1];
      const apiUrl = `https://beta.nomi.ai/api/group-chats/${groupChatId}?v=1`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.log('GroupChatProfileManager: Failed to fetch group chat data:', response.status);
        return;
      }
      
      const data = await response.json();
      
      // Build Nomi ID to image URL mapping
      if (data.nomis && Array.isArray(data.nomis)) {
        data.nomis.forEach(nomi => {
          if (nomi.id && nomi.pictureImageId) {
            const imageUrl = `https://beta.nomi.ai/api/nomis/${nomi.id}/images/${nomi.pictureImageId}.webp`;
            this.nomiImageMap.set(nomi.id.toString(), imageUrl);
          }
        });
        
        console.log(`GroupChatProfileManager: Mapped ${this.nomiImageMap.size} Nomi image URLs`);
      }
    } catch (error) {
      console.log('GroupChatProfileManager: Error fetching group chat data:', error);
    }
  }

  
  /**
   * Load settings from Chrome storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['dynamicProfileEnabled']);
      dynamicProfileEnabled = result.dynamicProfileEnabled === true;
      console.log('GroupChatProfileManager: Dynamic profile feature is', dynamicProfileEnabled ? 'enabled' : 'disabled');
    } catch (error) {
      console.log('GroupChatProfileManager: Could not load dynamic profile settings, defaulting to disabled');
      dynamicProfileEnabled = false;
    }
  }
  
  /**
   * Detect if we're in a group chat
   */
  detectGroupChat() {
    // Try multiple selectors for group chat detection
    const selectors = [
      '.css-1ruxp1v.exd19tt0',           // Original selector from docs
      '.css-1ruxp1v',                    // Just the main class
      '[class*="exd19tt0"]',             // Any element with this class
      '.css-1c0usqt.exd19tt2',           // Profile container selector
      '.css-1j7y90h.e10yhkdj0'           // Profile grid selector
    ];
    
    let groupChatElement = null;
    let usedSelector = '';
    
    for (const selector of selectors) {
      groupChatElement = document.querySelector(selector);
      if (groupChatElement) {
        usedSelector = selector;
        break;
      }
    }
    
    const isGroupChat = groupChatElement !== null;
    console.log(`GroupChatProfileManager: Group chat detection - ${isGroupChat ? 'FOUND' : 'NOT FOUND'}`);
    
    if (groupChatElement) {
      console.log(`GroupChatProfileManager: Found group chat using selector: ${usedSelector}`);
      console.log('GroupChatProfileManager: Group chat element:', groupChatElement);
      
      // Also check for profile pictures (any element with height attribute)
      const profilePictures = document.querySelectorAll('[height]');
      console.log(`GroupChatProfileManager: Found ${profilePictures.length} profile pictures`);
      
      // Additional check: look for multiple profile pictures (indicator of group chat)
      return profilePictures.length > 1;
    } else {
      // Fallback: check URL pattern for group chats
      const isGroupChatUrl = window.location.href.includes('/group-chats/');
      console.log(`GroupChatProfileManager: URL-based detection: ${isGroupChatUrl}`);
      
      if (isGroupChatUrl) {
        // Even if we can't find the sidebar, check for multiple profiles
        const profilePictures = document.querySelectorAll('[height]');
        console.log(`GroupChatProfileManager: URL suggests group chat, found ${profilePictures.length} profile pictures`);
        return profilePictures.length > 1;
      }
    }
    
    return false;
  }
  
  /**
   * Build mapping between Nomi IDs and profile pictures
   * Extract Nomi IDs from background images for reliable mapping
   */
  buildProfileMap() {
    this.profileMap.clear();
    this.originalVisibility.clear();
    
    // Find the profile container
    const profileContainer = document.querySelector('.css-1c0usqt.exd19tt2');
    if (!profileContainer) {
      console.log('GroupChatProfileManager: Profile container not found');
      return;
    }
    
    // Find all profile pictures
    const profilePictures = profileContainer.querySelectorAll('[height]');
    // Extract Nomi IDs from each profile's background image
    profilePictures.forEach((profile) => {
      const nomiId = this.extractNomiIdFromElement(profile);
      if (nomiId) {
        this.profileMap.set(nomiId, profile);
        
        // Store original visibility
        const originalDisplay = profile.style.display || '';
        this.originalVisibility.set(profile, originalDisplay);
      }
    });
    
    // Check for Nomis from buttons that don't have profile pictures yet
    this.createMissingProfileElements();
  }
  
  /**
   * Create profile elements for Nomis that don't have existing profile pictures
   */
  createMissingProfileElements() {
    // Get all Nomi buttons to find all available Nomis
    const nomiButtons = document.querySelectorAll('.css-1otg6ux button');
    const profileContainer = document.querySelector('.css-1c0usqt.exd19tt2');
    const profileGrid = profileContainer?.querySelector('.css-1j7y90h.e10yhkdj0');
    
    if (!profileContainer || !profileGrid) return;
    
    nomiButtons.forEach((button) => {
      const nomiId = this.extractNomiIdFromElement(button);
      if (nomiId && !this.profileMap.has(nomiId)) {
        // Create a new profile element for this Nomi
        const profileElement = this.createProfileElement(nomiId);
        if (profileElement) {
          // Add to the profile grid but keep hidden initially
          profileElement.style.display = 'none';
          profileGrid.appendChild(profileElement);
          
          // Add to our map and track as dynamic
          this.profileMap.set(nomiId, profileElement);
          this.originalVisibility.set(profileElement, 'none'); // Originally hidden
          this.dynamicProfiles.add(profileElement);
        }
      }
    });
  }
  
  /**
   * Create a profile element for a Nomi ID
   */
  createProfileElement(nomiId) {
    // Use the stored image URL from API data
    const profileImageUrl = this.nomiImageMap.get(nomiId.toString());
    
    if (!profileImageUrl) {
      return null; // No URL available, skip creating this profile
    }
    
    // Create a div element similar to existing profile pictures
    const profileElement = document.createElement('div');
    profileElement.setAttribute('height', '210');
    profileElement.style.width = '210px';
    profileElement.style.height = '210px';
    profileElement.style.backgroundImage = `url("${profileImageUrl}")`;
    profileElement.style.backgroundSize = 'cover';
    profileElement.style.backgroundPosition = 'center';
    profileElement.style.backgroundRepeat = 'no-repeat';
    profileElement.style.borderRadius = '8px';
    profileElement.style.flexShrink = '0';
    
    // Add classes to match existing profile pictures if possible
    const existingProfile = document.querySelector('.css-1c0usqt.exd19tt2 [height]');
    if (existingProfile) {
      profileElement.className = existingProfile.className;
    }
    
    return profileElement;
  }
  
  /**
   * Extract Nomi ID from an element's background image
   */
  extractNomiIdFromElement(element) {
    // Check background-image style
    const backgroundImage = window.getComputedStyle(element).backgroundImage;
    if (backgroundImage && backgroundImage !== 'none') {
      const nomiId = this.extractNomiIdFromUrl(backgroundImage);
      if (nomiId) return nomiId;
    }
    
    // Check inline style
    if (element.style.backgroundImage) {
      const nomiId = this.extractNomiIdFromUrl(element.style.backgroundImage);
      if (nomiId) return nomiId;
    }
    
    // Check child elements (sometimes the image is on a child)
    const children = element.querySelectorAll('*');
    for (const child of children) {
      const childBg = window.getComputedStyle(child).backgroundImage;
      if (childBg && childBg !== 'none') {
        const nomiId = this.extractNomiIdFromUrl(childBg);
        if (nomiId) return nomiId;
      }
    }
    
    return null;
  }
  
  /**
   * Extract Nomi ID from a background image URL
   */
  extractNomiIdFromUrl(backgroundImageUrl) {
    // Look for the Nomi ID in the URL path structure
    // URLs look like: url("https://beta.nomi.ai/api/nomis/402805960/selfies/...")
    const nomiIdPattern = /\/nomis\/(\d+)\//;
    const match = backgroundImageUrl.match(nomiIdPattern);
    return match ? match[1] : null;
  }
  
  
  

  /**
   * Show only the specified Nomi's profile
   */
  showOnlyProfile(nomiId) {
    if (!dynamicProfileEnabled || !this.isGroupChat) return;
    
    // Get the target profile from the map
    const targetProfile = this.profileMap.get(nomiId);
    if (!targetProfile) {
      return;
    }
    
    // Hide all profiles except the target one and expand the active profile
    const profileContainer = document.querySelector('.css-1c0usqt.exd19tt2');
    if (!profileContainer) return;
    
    // Calculate the actual container height
    const containerRect = profileContainer.getBoundingClientRect();
    const containerHeight = Math.max(containerRect.height, 210); // Use at least 210px
    
    const allProfiles = profileContainer.querySelectorAll('[height]');
    
    allProfiles.forEach((profile) => {
      if (profile === targetProfile) {
        // Show the target profile and expand it to fill the entire container
        profile.style.display = 'block'; // Force show even if it was dynamic/hidden
        profile.style.opacity = '1';
        profile.style.flex = '1';
        profile.style.width = '100%';
        profile.style.height = containerHeight + 'px';
        profile.style.backgroundSize = 'cover';
        profile.style.backgroundPosition = 'center';
        profile.style.backgroundRepeat = 'no-repeat';
        profile.style.borderRadius = '0';
      } else {
        // Hide other profiles
        profile.style.display = 'none';
      }
    });
    
    // Modify the grid to show only one profile that fills the space
    const profileGrid = profileContainer.querySelector('.css-1j7y90h.e10yhkdj0');
    if (profileGrid) {
      profileGrid.style.display = 'flex';
      profileGrid.style.justifyContent = 'center';
      profileGrid.style.alignItems = 'center';
      profileGrid.style.width = '100%';
      profileGrid.style.height = containerHeight + 'px';
    }
    
    this.activeNomi = nomiId;
  }
  
  /**
   * Reset to show all profiles
   */
  showAllProfiles() {
    if (!dynamicProfileEnabled || !this.isGroupChat) return;
    
    const profileContainer = document.querySelector('.css-1c0usqt.exd19tt2');
    if (!profileContainer) return;
    
    const allProfiles = profileContainer.querySelectorAll('[height]');
    allProfiles.forEach(profile => {
      // Restore original visibility and remove custom styles
      const originalDisplay = this.originalVisibility.get(profile) || '';
      profile.style.display = originalDisplay;
      profile.style.opacity = '1';
      profile.style.flex = '';
      profile.style.width = '';
      profile.style.height = '';
      profile.style.backgroundSize = '';
      profile.style.backgroundPosition = '';
      profile.style.backgroundRepeat = '';
      profile.style.borderRadius = '';
    });
    
    // Reset the profile grid container
    const profileGrid = profileContainer.querySelector('.css-1j7y90h.e10yhkdj0');
    if (profileGrid) {
      profileGrid.style.display = '';
      profileGrid.style.justifyContent = '';
      profileGrid.style.alignItems = '';
      profileGrid.style.width = '';
      profileGrid.style.height = '';
    }
    
    // Hide dynamically created profiles (don't remove them)
    this.dynamicProfiles.forEach(profile => {
      profile.style.display = 'none';
    });
    
    this.activeNomi = null;
  }
  
  
  
  /**
   * Reinitialize the manager (useful for navigation)
   */
  reinitialize() {
    this.initialized = false;
    this.profileMap.clear();
    this.originalVisibility.clear();
    this.activeNomi = null;
    this.initialize();
  }
}

// Create global instance
window.groupChatProfileManager = new GroupChatProfileManager();

// Initialize when DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  window.groupChatProfileManager.initialize();
} else {
  window.addEventListener('load', () => {
    window.groupChatProfileManager.initialize();
  });
}

// Listen for settings changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleDynamicProfile') {
    dynamicProfileEnabled = message.enabled;
    console.log('GroupChatProfileManager: Dynamic profile toggle received, feature is now', 
                dynamicProfileEnabled ? 'enabled' : 'disabled');
    
    // Reset to show all profiles if disabled
    if (!dynamicProfileEnabled && window.groupChatProfileManager) {
      window.groupChatProfileManager.showAllProfiles();
    }
    
    sendResponse({ success: true });
  }
});

console.log('GroupChatProfileManager: Module loaded successfully');
