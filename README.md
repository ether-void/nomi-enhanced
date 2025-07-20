# Nomi Enhanced

A Chrome browser extension that enhances your Nomi AI (nomi.ai) experience with additional features. 

## Features

- **Automatic Voice Playback**: Automatically plays new Nomi messages as they arrive
- **Text Highlighting**: Highlights text enclosed in asterisks \*like this\* with special formatting
- **Image Transfer to Nomi Art**: Right-click any image on the web and select "Send to Nomi Art" to automatically open the art page and upload it as a pose reference
- **Theme System**: Minimalistic theme

## Installation

### New Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your browser toolbar

### Updating Existing Installation
1. Download the latest version from GitHub
2. Go to `chrome://extensions/`
3. Find "Nomi Enhanced" and click the refresh/reload button
4. Or replace the extension folder and reload

**Current Version: 1.2.0** - See [CHANGELOG.md](CHANGELOG.md) for updates

## Usage

### Basic Features
1. Navigate to [nomi.ai](https://nomi.ai) and open a chat with your Nomi
2. Click the extension icon in your browser toolbar to open the settings popup
3. Use the switches to enable/disable:
   - **Interface Theme**: Choose between Default and Minimalistic themes
   - **Auto-play Nomi messages**: Automatically plays voice for new messages
   - **Highlight \*this message\* **: Highlights text enclosed in asterisks
   - **Image Transfer to Art**: Enables right-click image transfer functionality

### Image Transfer to Nomi Art
1. **Setup**: Click the settings gear icon in the popup and enter your Nomi ID
2. **Usage**: Right-click any image on the web and select "Send to Nomi Art"
3. **Result**: The extension will:
   - Open your Nomi's art generation page
   - Upload the image as a pose reference
   - If from CivitAI, automatically paste the prompt text
