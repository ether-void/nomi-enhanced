// Art Page Handler for Nomi Enhanced extension
// Handles image upload functionality on the art generation page

console.log("Nomi Enhanced: Art page handler loaded");

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'uploadImage') {
    console.log("Nomi Enhanced: Received upload image message");
    handleImageUpload(message.imageData).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error("Nomi Enhanced: Upload failed:", error);
      sendResponse({ success: false, error: error.message });
    });
  }
  return true; // Keep message channel open for async response
});

async function handleImageUpload(imageData) {
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Nomi Enhanced: Starting image upload process (attempt ${attempt}/${maxRetries})`);
      
      // Wait for page to be fully loaded
      await waitForPageReady();
      
      // Find the file input for pose reference
      const fileInput = document.querySelector('.css-j7qwjs input[type="file"][accept="image/*"]');
      if (!fileInput) {
        throw new Error("Upload input not found");
      }
      
      console.log("Nomi Enhanced: Found file input, converting image data");
      
      // Convert base64 to File object
      const file = base64ToFile(imageData.base64, imageData.filename, imageData.type);
      
      // Validate file was created successfully
      if (!file || file.size === 0) {
        throw new Error("Failed to create file from image data");
      }
      
      // Create FileList and assign to input
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      
      console.log("Nomi Enhanced: File assigned to input, triggering events");
      
      // Trigger multiple events for better compatibility
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Wait a moment and verify upload was successful
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (fileInput.files.length > 0) {
        console.log(`Nomi Enhanced: Successfully uploaded ${imageData.filename}`);
        
        // If we have a prompt from CivitAI, paste it into the prompt field
        if (imageData.prompt && imageData.prompt.trim()) {
          await pastePromptText(imageData.prompt);
        }
        
        return; // Success - exit retry loop
      } else {
        throw new Error("File upload verification failed");
      }
      
    } catch (error) {
      lastError = error;
      console.error(`Nomi Enhanced: Upload attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        console.log(`Nomi Enhanced: Retrying in ${attempt * 500}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }
  }
  
  // All retries failed
  console.error("Nomi Enhanced: All upload attempts failed:", lastError);
  showManualUploadFallback(imageData);
  throw lastError;
}

function waitForPageReady() {
  return new Promise((resolve, reject) => {
    const maxWaitTime = 15000; // 15 seconds max wait time
    const checkInterval = 300; // Check every 300ms
    let elapsedTime = 0;
    
    const checkReady = () => {
      // Check timeout
      if (elapsedTime >= maxWaitTime) {
        reject(new Error("Page readiness timeout exceeded"));
        return;
      }
      
      // Check if we're on the art page
      if (!window.location.href.includes('/make-art')) {
        console.log("Nomi Enhanced: Not on art page, waiting...");
        setTimeout(checkReady, checkInterval);
        elapsedTime += checkInterval;
        return;
      }
      
      // Check if the file input exists and is interactable
      const fileInput = document.querySelector('.css-j7qwjs input[type="file"][accept="image/*"]');
      const uploadContainer = document.querySelector('.css-j7qwjs');
      
      if (fileInput && uploadContainer && !fileInput.disabled) {
        // Additional check - ensure the container is visible and interactive
        const containerRect = uploadContainer.getBoundingClientRect();
        if (containerRect.width > 0 && containerRect.height > 0) {
          console.log("Nomi Enhanced: Art page ready for upload");
          resolve();
          return;
        }
      }
      
      console.log("Nomi Enhanced: File input not ready, waiting...");
      setTimeout(checkReady, checkInterval);
      elapsedTime += checkInterval;
    };
    
    // Initial check
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkReady);
    } else {
      checkReady();
    }
  });
}

function base64ToFile(base64Data, filename, mimeType) {
  try {
    // Validate inputs
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error("Invalid base64 data");
    }
    
    if (!filename || typeof filename !== 'string') {
      throw new Error("Invalid filename");
    }
    
    if (!mimeType || !mimeType.startsWith('image/')) {
      throw new Error("Invalid MIME type");
    }
    
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    
    // Validate base64 string
    if (!base64 || base64.length === 0) {
      throw new Error("Empty base64 data");
    }
    
    // Convert base64 to binary with error handling
    let byteCharacters;
    try {
      byteCharacters = atob(base64);
    } catch (error) {
      throw new Error("Failed to decode base64 data");
    }
    
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    
    // Create file object with validation
    const file = new File([byteArray], filename, { type: mimeType });
    
    // Validate file was created successfully
    if (!file || file.size === 0) {
      throw new Error("Failed to create file object");
    }
    
    console.log(`Nomi Enhanced: Created file - ${filename} (${file.size} bytes, ${mimeType})`);
    return file;
    
  } catch (error) {
    console.error("Nomi Enhanced: Failed to convert base64 to file:", error);
    throw error;
  }
}

function showManualUploadFallback(imageData) {
  // Remove any existing indicators first
  const existingIndicators = document.querySelectorAll('.nomi-enhanced-indicator');
  existingIndicators.forEach(indicator => indicator.remove());
  
  // Create a visual indicator for manual upload
  const indicator = document.createElement('div');
  indicator.className = 'nomi-enhanced-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff6b6b;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    float: right;
    margin-left: 10px;
    padding: 0;
    line-height: 1;
  `;
  
  const message = document.createElement('div');
  message.textContent = `Auto-upload failed for ${imageData.filename}. Please upload manually using the "+ Add a Pose Reference" button.`;
  
  indicator.appendChild(message);
  indicator.appendChild(closeBtn);
  document.body.appendChild(indicator);
  
  // Close button functionality
  closeBtn.addEventListener('click', () => {
    indicator.remove();
  });
  
  // Auto-remove after 8 seconds
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.remove();
    }
  }, 8000);
  
  // Try to highlight the upload button
  try {
    const uploadButton = document.querySelector('.css-j7qwjs .css-4g6ai3');
    if (uploadButton) {
      uploadButton.style.animation = 'pulse 2s infinite';
      uploadButton.style.setProperty('--pulse-color', '#ff6b6b');
      
      // Add CSS animation if not already present
      if (!document.querySelector('#nomi-enhanced-styles')) {
        const style = document.createElement('style');
        style.id = 'nomi-enhanced-styles';
        style.textContent = `
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 var(--pulse-color, #ff6b6b); }
            70% { box-shadow: 0 0 0 10px transparent; }
            100% { box-shadow: 0 0 0 0 transparent; }
          }
        `;
        document.head.appendChild(style);
      }
      
      // Remove animation after 10 seconds
      setTimeout(() => {
        if (uploadButton) {
          uploadButton.style.animation = '';
        }
      }, 10000);
    }
  } catch (error) {
    console.log("Nomi Enhanced: Could not highlight upload button:", error);
  }
  
  console.log("Nomi Enhanced: Manual upload fallback displayed");
}

async function pastePromptText(promptText) {
  try {
    console.log("Nomi Enhanced: Attempting to paste prompt text");
    
    // Find the prompt textarea on the Nomi art page
    const promptTextarea = document.querySelector('textarea.css-1n5lnq7');
    
    if (!promptTextarea) {
      console.log("Nomi Enhanced: Prompt textarea not found");
      return;
    }
    
    // Clear existing content and set new prompt
    promptTextarea.value = '';
    promptTextarea.value = promptText;
    
    // Trigger events to notify the page of the change
    promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    promptTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Focus on the textarea to make it obvious
    promptTextarea.focus();
    
    console.log(`Nomi Enhanced: Successfully pasted prompt: "${promptText.substring(0, 50)}..."`);
    
    // Show a brief success indicator
    showPromptPastedIndicator();
    
  } catch (error) {
    console.error("Nomi Enhanced: Failed to paste prompt text:", error);
  }
}

function showPromptPastedIndicator() {
  // Remove any existing indicators first
  const existingIndicators = document.querySelectorAll('.nomi-enhanced-prompt-indicator');
  existingIndicators.forEach(indicator => indicator.remove());
  
  // Create a success indicator
  const indicator = document.createElement('div');
  indicator.className = 'nomi-enhanced-prompt-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  
  indicator.textContent = 'Prompt pasted from CivitAI!';
  document.body.appendChild(indicator);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.remove();
    }
  }, 3000);
}
