/**
 * Command System for Nomi Extension
 * Handles command parsing, suggestions, and execution
 */

// Command system variables
let commandDropdown = null;

/**
 * Get all available commands
 */
function getAllCommands() {
  const baseCommands = [
    { cmd: 'toggle', desc: 'Toggle auto-play on/off' },
    { cmd: 'highlight', desc: 'Toggle text highlighting' },
    { cmd: 'toggle_messages', desc: 'Hide/show all messages' },
    { cmd: 'brightness', desc: 'Set background brightness (0-100)' },
    { cmd: 'status', desc: 'Show extension status' },
    { cmd: 'help', desc: 'Show all commands' }
  ];
  
  const backgroundCommands = [];
  if (window.backgroundSystem && window.backgroundSystem.BACKGROUNDS) {
    const backgrounds = window.backgroundSystem.BACKGROUNDS;
    Object.keys(backgrounds).forEach(bg => {
      backgroundCommands.push({ cmd: bg, desc: `Switch to ${backgrounds[bg]} background` });
    });
    
    if (Object.keys(backgrounds).length > 0) {
      backgroundCommands.push(
        { cmd: 'backgrounds', desc: 'List all available backgrounds' },
        { cmd: 'reset', desc: 'Reset to default background' },
        { cmd: 'time', desc: 'Override day/night (usage: /time day|night)' }
      );
    }
  }
  
  return [...baseCommands, ...backgroundCommands];
}

/**
 * Filter commands based on input
 */
function filterCommands(input) {
  const query = input.toLowerCase().replace('/', '');
  const allCommands = getAllCommands();
  
  if (!query) return allCommands;
  
  return allCommands.filter(cmd => 
    cmd.cmd.toLowerCase().startsWith(query) || 
    cmd.desc.toLowerCase().includes(query)
  );
}

/**
 * Create command suggestion dropdown
 */
function createCommandDropdown() {
  const dropdown = document.createElement('div');
  dropdown.id = 'nomi-command-dropdown';
  dropdown.style.cssText = `
    position: absolute;
    background: rgba(0, 0, 0, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    backdrop-filter: blur(10px);
    max-height: 200px;
    overflow-y: auto;
    z-index: 10001;
    font-family: Arial, sans-serif;
    font-size: 12px;
    min-width: 280px;
    display: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  `;
  document.body.appendChild(dropdown);
  return dropdown;
}

/**
 * Show command suggestions
 */
function showCommandSuggestions(input, inputElement) {
  if (!commandDropdown) {
    commandDropdown = createCommandDropdown();
  }
  
  const commands = filterCommands(input);
  
  if (commands.length === 0) {
    commandDropdown.style.display = 'none';
    return;
  }
  
  // Position dropdown
  const rect = inputElement.getBoundingClientRect();
  commandDropdown.style.left = rect.left + 'px';
  commandDropdown.style.top = (rect.top - 10) + 'px';
  commandDropdown.style.transform = 'translateY(-100%)';
  
  // Populate commands
  commandDropdown.innerHTML = commands.map((cmd, index) => `
    <div class="command-item" data-command="${cmd.cmd}"
         style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;">
      <div style="color: #fff; font-weight: 500;">/${cmd.cmd}</div>
      <div style="color: #aaa; font-size: 11px; margin-top: 2px;">${cmd.desc}</div>
    </div>
  `).join('');
  
  // Add click handlers
  commandDropdown.querySelectorAll('.command-item').forEach(item => {
    item.addEventListener('click', () => {
      const command = item.dataset.command;
      inputElement.value = '';
      hideCommandSuggestions();
      handleExtensionCommand(`/${command}`).catch(console.error);
    });
    
    // Simple hover highlight
    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });
  });
  
  commandDropdown.style.display = 'block';
}

/**
 * Hide command suggestions
 */
function hideCommandSuggestions() {
  if (commandDropdown) {
    commandDropdown.style.display = 'none';
  }
}

/**
 * Handle extension commands starting with "/"
 */
async function handleExtensionCommand(command) {
  const [cmd, ...args] = command.slice(1).split(' '); // Remove "/" and split
  
  // First check if it's a background command
  if (window.backgroundSystem) {
    const backgroundResult = await window.backgroundSystem.handleBackgroundCommand(command.slice(1));
    if (backgroundResult) {
      showCommandFeedback(backgroundResult);
      return;
    }
  }
  
  // Handle other extension commands
  switch (cmd.toLowerCase()) {
    case 'toggle':
    case 'autoplay':
      window.autoPlayEnabled = !window.autoPlayEnabled;
      chrome.storage.local.set({ 'autoPlayEnabled': window.autoPlayEnabled });
      showCommandFeedback(`Auto-play ${window.autoPlayEnabled ? 'enabled' : 'disabled'}`);
      break;
      
    case 'highlight':
      window.highlightEnabled = !window.highlightEnabled;
      chrome.storage.local.set({ 'highlightEnabled': window.highlightEnabled });
      if (window.highlightEnabled) {
        window.processExistingMessagesForHighlighting();
      } else {
        window.removeAllHighlighting();
      }
      showCommandFeedback(`Text highlighting ${window.highlightEnabled ? 'enabled' : 'disabled'}`);
      break;
      
    case 'toggle_messages':
      if (!window.messagesHidden) {
        window.messagesHidden = true;
        // Hide all messages
        const style = document.createElement('style');
        style.id = 'nomi-hide-messages';
        style.textContent = `
          ${SELECTORS.MESSAGE_CONTAINER} {
            display: none !important;
          }
          ${CSS_SELECTORS.IMAGE.IMAGE_MESSAGE_CONTAINER} {
            display: none !important;
          }
          ${CSS_SELECTORS.MESSAGE.DATE_INDICATOR} {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
        showCommandFeedback('Messages hidden');
      } else {
        window.messagesHidden = false;
        // Show all messages
        const style = document.getElementById('nomi-hide-messages');
        if (style) {
          style.remove();
        }
        showCommandFeedback('Messages shown');
      }
      break;
      
    case 'brightness':
      if (args.length === 0) {
        const currentBrightness = window.backgroundBrightness || 100;
        showCommandFeedback(`Current brightness: ${currentBrightness}%. Usage: /brightness <0-100>`);
      } else {
        const brightness = parseInt(args[0]);
        if (isNaN(brightness) || brightness < 0 || brightness > 100) {
          showCommandFeedback('Brightness must be a number between 0-100');
        } else {
          window.backgroundBrightness = brightness;
          chrome.storage.local.set({ 'backgroundBrightness': brightness });
          
          // Apply brightness filter
          let brightnessStyle = document.getElementById('nomi-brightness-filter');
          if (!brightnessStyle) {
            brightnessStyle = document.createElement('style');
            brightnessStyle.id = 'nomi-brightness-filter';
            document.head.appendChild(brightnessStyle);
          }
          
          // Trigger background system to reapply with new brightness
          if (window.backgroundSystem && window.backgroundSystem.reapplyCurrentBackground) {
            window.backgroundSystem.reapplyCurrentBackground();
          }
          
          // Remove the brightness style since we handle it in background system
          brightnessStyle.remove();
          
          showCommandFeedback(`Background brightness set to ${brightness}%`);
        }
      }
      break;
      
    case 'status':
      const bgStatus = window.backgroundSystem && window.backgroundSystem.getCurrentBackground ? 
        ` | Background: ${window.backgroundSystem.getCurrentBackground()}` : '';
      showCommandFeedback(`Auto-play: ${window.autoPlayEnabled ? 'ON' : 'OFF'} | Highlighting: ${window.highlightEnabled ? 'ON' : 'OFF'}${bgStatus}`);
      break;
      
    case 'help':
      let helpText = 'Commands: /toggle, /highlight, /status';
      if (window.backgroundSystem) {
        const backgrounds = window.backgroundSystem.BACKGROUNDS;
        if (backgrounds && Object.keys(backgrounds).length > 0) {
          const bgCommands = Object.keys(backgrounds).map(bg => `/${bg}`).join(', ');
          helpText += `, ${bgCommands}, /backgrounds, /reset, /time`;
        } else {
          helpText += ', /backgrounds (add images to backgrounds/ folder)';
        }
      }
      helpText += ', /help';
      showCommandFeedback(helpText);
      break;
      
    default:
      showCommandFeedback(`Unknown command: /${cmd}. Type /help for available commands.`);
  }
}

/**
 * Show command feedback to user
 */
function showCommandFeedback(message) {
  const feedback = document.createElement('div');
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;
  feedback.textContent = `Nomi Extension: ${message}`;
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 3000);
}

/**
 * Initialize command system
 */
function initializeCommandSystem() {
  document.addEventListener('input', (e) => {
    const chatInput = document.querySelector(SELECTORS.CHAT_INPUT);
    if (chatInput && e.target === chatInput) {
      const text = chatInput.value;
      if (text.startsWith('/') && text.length > 0) {
        showCommandSuggestions(text, chatInput);
      } else {
        hideCommandSuggestions();
      }
    }
  });
  
  document.addEventListener('keydown', (e) => {
    const chatInput = document.querySelector(SELECTORS.CHAT_INPUT);
    if (chatInput && document.activeElement === chatInput) {
      const text = chatInput.value;
      
      // Handle command dropdown interaction
      if (text.startsWith('/') && commandDropdown && commandDropdown.style.display !== 'none') {
        const commands = filterCommands(text);
        
        if (e.key === 'Tab') {
          e.preventDefault();
          // Tab completion - complete to first matching command
          if (commands.length > 0) {
            const bestMatch = commands[0];
            chatInput.value = `/${bestMatch.cmd}`;
          }
        } else if (e.key === 'Escape') {
          hideCommandSuggestions();
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          
          // Execute whatever is currently typed
          chatInput.value = '';
          hideCommandSuggestions();
          handleExtensionCommand(text.trim()).catch(console.error);
        }
      } else if (e.key === 'Enter' && !e.shiftKey && text.startsWith('/')) {
        // Handle direct command execution
        e.preventDefault();
        e.stopPropagation();
        chatInput.value = '';
        handleExtensionCommand(text.trim()).catch(console.error);
      }
    }
  }, true);
  
  // Hide dropdown when clicking elsewhere
  document.addEventListener('click', (e) => {
    const chatInput = document.querySelector(SELECTORS.CHAT_INPUT);
    if (e.target !== chatInput && !commandDropdown?.contains(e.target)) {
      hideCommandSuggestions();
    }
  });
}

// Export for use in main extension
window.commandSystem = {
  initializeCommandSystem,
  handleExtensionCommand,
  showCommandFeedback
};

