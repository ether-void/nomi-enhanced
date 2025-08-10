document.addEventListener('DOMContentLoaded', async () => {
  const autoPlayToggle = document.getElementById('autoPlayToggle');
  const highlightToggle = document.getElementById('highlightToggle');
  const imageTransferToggle = document.getElementById('imageTransferToggle');
  const dynamicProfileToggle = document.getElementById('dynamicProfileToggle');
  const commandSystemToggle = document.getElementById('commandSystemToggle');
  const themeSelect = document.getElementById('themeSelect');
  const themePreview = document.getElementById('themePreview');
  const status = document.getElementById('status');
  const themeStatus = document.getElementById('themeStatus');
  
  // Theme preview descriptions
  const themeDescriptions = {
    default: 'Original Nomi.ai interface with all features visible',
    minimalistic: 'Clean, distraction-free interface with hidden sidebar and navigation'
  };
  
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
    const result = await chrome.storage.local.get(['autoPlayEnabled', 'highlightEnabled', 'imageTransferEnabled', 'dynamicProfileEnabled', 'commandSystemEnabled', 'nomiId']);
    const autoPlayEnabled = result.autoPlayEnabled !== false; // Default to true
    const highlightEnabled = result.highlightEnabled !== false; // Default to true
    const imageTransferEnabled = result.imageTransferEnabled !== false; // Default to true
    const dynamicProfileEnabled = result.dynamicProfileEnabled === true; // Default to false
    const commandSystemEnabled = result.commandSystemEnabled !== false; // Default to true
    const nomiId = result.nomiId;
    
    autoPlayToggle.checked = autoPlayEnabled;
    highlightToggle.checked = highlightEnabled;
    imageTransferToggle.checked = imageTransferEnabled;
    dynamicProfileToggle.checked = dynamicProfileEnabled;
    commandSystemToggle.checked = commandSystemEnabled;
    nomiIdInput.value = nomiId;
    originalNomiId = nomiId;
    updateStatus(autoPlayEnabled, highlightEnabled, imageTransferEnabled, dynamicProfileEnabled, commandSystemEnabled);
    
    // Load theme state
    await loadThemeState();
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
  
  // Handle dynamic profile toggle changes
  dynamicProfileToggle.addEventListener('change', async () => {
    await handleToggleChange('dynamicProfileEnabled', 'toggleDynamicProfile', dynamicProfileToggle);
  });

  // Handle command system toggle changes
  commandSystemToggle.addEventListener('change', async () => {
    await handleToggleChange('commandSystemEnabled', 'toggleCommandSystem', commandSystemToggle);
  });
  
  // Handle theme selection changes
  themeSelect.addEventListener('change', async () => {
    await handleThemeChange(themeSelect.value);
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
      
      const result = await chrome.storage.local.get(['autoPlayEnabled', 'highlightEnabled', 'imageTransferEnabled', 'dynamicProfileEnabled', 'commandSystemEnabled']);
      updateStatus(result.autoPlayEnabled !== false, result.highlightEnabled !== false, result.imageTransferEnabled !== false, result.dynamicProfileEnabled === true, result.commandSystemEnabled !== false);
      
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
  
  function updateStatus(autoPlayEnabled, highlightEnabled, imageTransferEnabled, dynamicProfileEnabled, commandSystemEnabled) {
    const autoPlayStatus = autoPlayEnabled ? 'ON' : 'OFF';
    const highlightStatus = highlightEnabled ? 'ON' : 'OFF';
    const imageTransferStatus = imageTransferEnabled ? 'ON' : 'OFF';
    const dynamicProfileStatus = dynamicProfileEnabled ? 'ON' : 'OFF';
    const commandSystemStatus = commandSystemEnabled ? 'ON' : 'OFF';
    status.textContent = `Auto-play: ${autoPlayStatus}, Highlight: ${highlightStatus}, Image Transfer: ${imageTransferStatus}, Dynamic Profile: ${dynamicProfileStatus}, Commands: ${commandSystemStatus}`;
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

  async function loadThemeState() {
    try {
      // Load theme from chrome storage sync (used by theme system)
      const result = await chrome.storage.sync.get('nomi_theme_preferences');
      const themeConfig = result.nomi_theme_preferences;
      
      let currentTheme = 'default';
      if (themeConfig && themeConfig.currentTheme) {
        currentTheme = themeConfig.currentTheme;
      }
      
      themeSelect.value = currentTheme;
      updateThemePreview(currentTheme);
      updateThemeStatus(currentTheme);
    } catch (error) {
      console.error('Error loading theme state:', error);
      themeStatus.textContent = 'Theme: Error loading';
    }
  }
  
  async function handleThemeChange(selectedTheme) {
    try {
      // Update theme preview immediately
      updateThemePreview(selectedTheme);
      
      // Notify content script to switch theme
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('nomi.ai')) {
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'switchTheme', 
          theme: selectedTheme 
        });
        
        updateThemeStatus(selectedTheme);
      } else {
        // If not on nomi.ai page, just update the storage
        await chrome.storage.sync.get('nomi_theme_preferences').then(async (result) => {
          const config = result.nomi_theme_preferences || {
            currentTheme: 'default',
            themes: {
              default: { name: 'Default', enabled: false },
              minimalistic: { name: 'Minimalistic', enabled: false }
            }
          };
          
          config.currentTheme = selectedTheme;
          await chrome.storage.sync.set({ nomi_theme_preferences: config });
          updateThemeStatus(selectedTheme);
        });
      }
    } catch (error) {
      console.error('Error switching theme:', error);
      themeStatus.textContent = 'Theme: Error switching';
    }
  }
  
  function updateThemePreview(theme) {
    const description = themeDescriptions[theme] || 'Unknown theme';
    themePreview.textContent = description;
  }
  
  function updateThemeStatus(theme) {
    const themeName = theme === 'default' ? 'Default' : 'Minimalistic';
    themeStatus.textContent = `Theme: ${themeName}`;
  }
});
