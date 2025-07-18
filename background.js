// Background script for Nomi Enhanced extension
// Handles context menu and image transfer functionality

chrome.runtime.onInstalled.addListener(async () => {
  // Set default values if not already set
  const result = await chrome.storage.local.get(['imageTransferEnabled', 'nomiId']);
  
  if (result.imageTransferEnabled === undefined) {
    await chrome.storage.local.set({ imageTransferEnabled: true });
  }
  
  // Create context menu based on current setting
  await updateContextMenu(result.imageTransferEnabled !== false);
});

async function updateContextMenu(enabled) {
  // Remove existing context menu
  await chrome.contextMenus.removeAll();
  
  // Create context menu only if enabled
  if (enabled) {
    chrome.contextMenus.create({
      id: "sendToNomiArt",
      title: "Send to Nomi Art",
      contexts: ["image"],
      enabled: true
    });
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "sendToNomiArt") {
    await captureAndOpenArtPage(info.srcUrl, tab);
  }
});

// Listen for storage changes to update context menu
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local' && changes.imageTransferEnabled) {
    const enabled = changes.imageTransferEnabled.newValue !== false;
    await updateContextMenu(enabled);
  }
});

async function captureAndOpenArtPage(imageUrl, tab) {
  try {
    // Check if feature is enabled and get Nomi ID
    const settings = await chrome.storage.local.get(['imageTransferEnabled', 'nomiId']);
    if (settings.imageTransferEnabled === false) return;
    
    const nomiId = settings.nomiId
    
    // Fetch image data
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // Validate image format
    if (!blob.type.startsWith('image/')) {
      throw new Error('Invalid image format');
    }
    
    // Convert blob to base64 for message passing
    const base64Data = await blobToBase64(blob);
    
    // Extract prompt if from CivitAI
    let promptText = '';
    if (tab.url && tab.url.includes('civitai.com')) {
      promptText = await extractCivitAIPrompt(tab.id, imageUrl);
    }
    
    // Create image data object
    const imageData = {
      base64: base64Data,
      type: blob.type,
      size: blob.size,
      filename: extractFilename(imageUrl),
      url: imageUrl,
      fromTabUrl: tab.url,
      prompt: promptText
    };
    
    // Check if art page tab already exists
    const artPageUrl = `https://beta.nomi.ai/nomis/${nomiId}/make-art`;
    const existingTabs = await chrome.tabs.query({ url: artPageUrl });
    
    let artTab;
    if (existingTabs.length > 0) {
      // Use existing tab and make it active
      artTab = existingTabs[0];
      await chrome.tabs.update(artTab.id, { active: true });
      console.log("Nomi Enhanced: Using existing art page tab");
    } else {
      // Create new tab
      artTab = await chrome.tabs.create({
        url: artPageUrl,
        active: true
      });
      console.log("Nomi Enhanced: Created new art page tab");
    }
    
    // Send image data to the tab
    if (existingTabs.length > 0) {
      // Tab already exists and is loaded, send message immediately
      setTimeout(() => {
        sendMessageWithRetry(artTab.id, {
          action: 'uploadImage',
          imageData: imageData
        }, 3).then(() => {
          console.log("Nomi Enhanced: Image upload message sent successfully to existing tab");
        }).catch(error => {
          console.error("Nomi Enhanced: Failed to send message to existing tab:", error);
        });
      }, 500); // Small delay to ensure tab is active
    } else {
      // New tab - wait for it to load
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === artTab.id && info.status === 'complete') {
          // Wait for content script to be ready and send message with retry
          sendMessageWithRetry(tabId, {
            action: 'uploadImage',
            imageData: imageData
          }, 3).then(() => {
            console.log("Nomi Enhanced: Image upload message sent successfully to new tab");
          }).catch(error => {
            console.error("Nomi Enhanced: Failed to send message to new tab:", error);
          });
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    }
    
  } catch (error) {
    console.error("Nomi Enhanced: Failed to transfer image:", error);
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function sendMessageWithRetry(tabId, message, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add progressive delay between attempts
      const delay = attempt > 1 ? attempt * 500 : 0;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const response = await chrome.tabs.sendMessage(tabId, message);
      
      if (response && response.success) {
        return response;
      } else {
        throw new Error(`Invalid response from content script: ${JSON.stringify(response)}`);
      }
    } catch (error) {
      console.log(`Nomi Enhanced: Message attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Check if tab still exists before retry
      try {
        await chrome.tabs.get(tabId);
      } catch (tabError) {
        throw new Error("Tab was closed or no longer exists");
      }
    }
  }
}

async function extractCivitAIPrompt(tabId, imageUrl) {
  try {
    // Extract image ID from the URL or DOM
    const imageId = await extractCivitAIImageId(tabId, imageUrl);
    if (!imageId) {
      console.log('Nomi Enhanced: Could not extract CivitAI image ID');
      return '';
    }
    
    // Call CivitAI API to get generation data
    const apiUrl = `https://civitai.com/api/trpc/image.getGenerationData?input=${encodeURIComponent(JSON.stringify({
      json: {
        id: parseInt(imageId),
        authed: true
      }
    }))}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const prompt = data?.result?.data?.json?.meta?.prompt || '';
    
    console.log(`Nomi Enhanced: Successfully extracted prompt from CivitAI API for image ${imageId}`);
    return prompt;
    
  } catch (error) {
    console.error('Nomi Enhanced: Failed to extract CivitAI prompt via API:', error);
    return '';
  }
}

async function extractCivitAIImageId(tabId, imageUrl) {
  try {
    // First try to extract from URL
    const urlMatch = imageUrl.match(/\/(\d+)\.jpeg$/);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    // If URL doesn't contain ID, try to extract from DOM
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (imgUrl) => {
        // Find the image element
        const img = document.querySelector(`img[src="${imgUrl}"]`);
        if (!img) return null;
        
        // Look for image ID in parent container's href
        const parentLink = img.closest('a[href*="/images/"]');
        if (parentLink) {
          const hrefMatch = parentLink.href.match(/\/images\/(\d+)$/);
          if (hrefMatch) {
            return hrefMatch[1];
          }
        }
        
        // Try to find in data attributes
        const container = img.closest('[data-image-id]');
        if (container && container.dataset.imageId) {
          return container.dataset.imageId;
        }
        
        return null;
      },
      args: [imageUrl]
    });
    
    return results[0]?.result || null;
  } catch (error) {
    console.error('Nomi Enhanced: Failed to extract CivitAI image ID:', error);
    return null;
  }
}

function extractFilename(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    
    // If no filename or extension, generate one
    if (!filename || !filename.includes('.')) {
      return `image_${Date.now()}.jpg`;
    }
    
    return filename;
  } catch (error) {
    return `image_${Date.now()}.jpg`;
  }
}
