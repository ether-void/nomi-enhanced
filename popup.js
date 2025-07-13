document.addEventListener('DOMContentLoaded', async () => {
  const autoPlayToggle = document.getElementById('autoPlayToggle');
  const highlightToggle = document.getElementById('highlightToggle');
  const status = document.getElementById('status');
  
  // Load current states
  try {
    const result = await chrome.storage.local.get(['autoPlayEnabled', 'highlightEnabled']);
    const autoPlayEnabled = result.autoPlayEnabled !== false; // Default to true
    const highlightEnabled = result.highlightEnabled !== false; // Default to true
    
    autoPlayToggle.checked = autoPlayEnabled;
    highlightToggle.checked = highlightEnabled;
    updateStatus(autoPlayEnabled, highlightEnabled);
  } catch (error) {
    console.error('Error loading state:', error);
    status.textContent = 'Error loading settings';
  }
  
  // Handle auto-play toggle changes
  autoPlayToggle.addEventListener('change', async () => {
    await handleToggleChange('autoPlayEnabled', 'toggleAutoPlay', autoPlayToggle);
  });
  
  // Handle highlight toggle changes
  highlightToggle.addEventListener('change', async () => {
    await handleToggleChange('highlightEnabled', 'toggleHighlight', highlightToggle);
  });
  
  async function handleToggleChange(storageKey, action, toggleElement) {
    const isEnabled = toggleElement.checked;
    
    try {
      await chrome.storage.local.set({ [storageKey]: isEnabled });
      
      const result = await chrome.storage.local.get(['autoPlayEnabled', 'highlightEnabled']);
      updateStatus(result.autoPlayEnabled !== false, result.highlightEnabled !== false);
      
      // Notify content script of the change
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('nomi.ai')) {
        await chrome.tabs.sendMessage(tab.id, { 
          action: action, 
          enabled: isEnabled 
        });
      }
    } catch (error) {
      console.error('Error saving state:', error);
      status.textContent = 'Error saving settings';
      // Revert toggle state
      toggleElement.checked = !isEnabled;
    }
  }
  
  function updateStatus(autoPlayEnabled, highlightEnabled) {
    const autoPlayStatus = autoPlayEnabled ? 'ON' : 'OFF';
    const highlightStatus = highlightEnabled ? 'ON' : 'OFF';
    status.textContent = `Auto-play: ${autoPlayStatus}, Highlight: ${highlightStatus}`;
  }
});