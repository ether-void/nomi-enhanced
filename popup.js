document.addEventListener('DOMContentLoaded', async () => {
  const autoPlayToggle = document.getElementById('autoPlayToggle');
  const highlightToggle = document.getElementById('highlightToggle');
  const imageTransferToggle = document.getElementById('imageTransferToggle');
  const status = document.getElementById('status');
  
  // View switching elements
  const mainView = document.getElementById('mainView');
  const settingsView = document.getElementById('settingsView');
  const settingsBtn = document.getElementById('settingsBtn');
  const backBtn = document.getElementById('backBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const saveBtn = document.getElementById('saveBtn');
  const nomiIdInput = document.getElementById('nomiIdInput');
  
  let originalNomiId = '';
  
  // Load current states
  try {
    const result = await chrome.storage.local.get(['autoPlayEnabled', 'highlightEnabled', 'imageTransferEnabled', 'nomiId']);
    const autoPlayEnabled = result.autoPlayEnabled !== false; // Default to true
    const highlightEnabled = result.highlightEnabled !== false; // Default to true
    const imageTransferEnabled = result.imageTransferEnabled !== false; // Default to true
    const nomiId = result.nomiId;
    
    autoPlayToggle.checked = autoPlayEnabled;
    highlightToggle.checked = highlightEnabled;
    imageTransferToggle.checked = imageTransferEnabled;
    nomiIdInput.value = nomiId;
    originalNomiId = nomiId;
    updateStatus(autoPlayEnabled, highlightEnabled, imageTransferEnabled);
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
  
  // Handle image transfer toggle changes
  imageTransferToggle.addEventListener('change', async () => {
    await handleToggleChange('imageTransferEnabled', 'toggleImageTransfer', imageTransferToggle);
  });
  
  // View switching handlers
  settingsBtn.addEventListener('click', () => {
    showSettingsView();
  });
  
  backBtn.addEventListener('click', () => {
    showMainView();
  });
  
  cancelBtn.addEventListener('click', () => {
    nomiIdInput.value = originalNomiId;
    showMainView();
  });
  
  saveBtn.addEventListener('click', async () => {
    await saveSettings();
  });
  
  // Handle Enter key in Nomi ID input
  nomiIdInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      await saveSettings();
    }
  });
  
  async function handleToggleChange(storageKey, action, toggleElement) {
    const isEnabled = toggleElement.checked;
    
    try {
      await chrome.storage.local.set({ [storageKey]: isEnabled });
      
      const result = await chrome.storage.local.get(['autoPlayEnabled', 'highlightEnabled', 'imageTransferEnabled']);
      updateStatus(result.autoPlayEnabled !== false, result.highlightEnabled !== false, result.imageTransferEnabled !== false);
      
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
  
  function updateStatus(autoPlayEnabled, highlightEnabled, imageTransferEnabled) {
    const autoPlayStatus = autoPlayEnabled ? 'ON' : 'OFF';
    const highlightStatus = highlightEnabled ? 'ON' : 'OFF';
    const imageTransferStatus = imageTransferEnabled ? 'ON' : 'OFF';
    status.textContent = `Auto-play: ${autoPlayStatus}, Highlight: ${highlightStatus}, Image Transfer: ${imageTransferStatus}`;
  }
  
  function showSettingsView() {
    mainView.classList.remove('active');
    settingsView.classList.add('active');
  }
  
  function showMainView() {
    settingsView.classList.remove('active');
    mainView.classList.add('active');
  }
  
  async function saveSettings() {
    const nomiId = nomiIdInput.value.trim();
    
    // Validate Nomi ID
    if (!nomiId) {
      alert('Please enter a Nomi ID');
      return;
    }
    
    // Basic validation - should be numeric
    if (!/^\d+$/.test(nomiId)) {
      alert('Nomi ID should contain only numbers');
      return;
    }
    
    try {
      await chrome.storage.local.set({ nomiId: nomiId });
      originalNomiId = nomiId;
      
      // Show success feedback
      const originalSaveText = saveBtn.textContent;
      saveBtn.textContent = 'Saved!';
      saveBtn.disabled = true;
      
      setTimeout(() => {
        saveBtn.textContent = originalSaveText;
        saveBtn.disabled = false;
        showMainView();
      }, 1000);
      
    } catch (error) {
      console.error('Error saving Nomi ID:', error);
      alert('Error saving settings. Please try again.');
    }
  }
});
