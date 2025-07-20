/**
 * Theme Storage Module
 * Manages theme preferences and configuration using Chrome storage API
 */

const THEME_STORAGE_KEY = 'nomi_theme_preferences';
const DEFAULT_THEME_CONFIG = {
  currentTheme: 'default',
  themes: {
    default: {
      name: 'Default',
      enabled: false,
      styles: {
        hiddenElements: [],
        customCSS: ''
      }
    },
    minimalistic: {
      name: 'Minimalistic',
      enabled: false,
      styles: {
        hiddenElements: MINIMALISTIC_HIDDEN_SELECTORS,
        customCSS: ''
      }
    }
  }
};

async function getThemeConfig() {
  try {
    const result = await chrome.storage.sync.get(THEME_STORAGE_KEY);
    return result[THEME_STORAGE_KEY] || DEFAULT_THEME_CONFIG;
  } catch (error) {
    console.error('Error getting theme config:', error);
    return DEFAULT_THEME_CONFIG;
  }
}

async function saveThemeConfig(config) {
  try {
    await chrome.storage.sync.set({
      [THEME_STORAGE_KEY]: config
    });
    return true;
  } catch (error) {
    console.error('Error saving theme config:', error);
    return false;
  }
}

async function getCurrentTheme() {
  const config = await getThemeConfig();
  return config.currentTheme;
}

async function setCurrentTheme(themeName) {
  const config = await getThemeConfig();
  config.currentTheme = themeName;
  return await saveThemeConfig(config);
}

async function getThemeData(themeName) {
  const config = await getThemeConfig();
  return config.themes[themeName] || null;
}

async function isThemeEnabled(themeName) {
  const themeData = await getThemeData(themeName);
  return themeData ? themeData.enabled : false;
}

async function setThemeEnabled(themeName, enabled) {
  const config = await getThemeConfig();
  if (config.themes[themeName]) {
    config.themes[themeName].enabled = enabled;
    return await saveThemeConfig(config);
  }
  return false;
}

async function resetThemeToDefault() {
  return await saveThemeConfig(DEFAULT_THEME_CONFIG);
}

function onThemeStorageChange(callback) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes[THEME_STORAGE_KEY]) {
      callback(changes[THEME_STORAGE_KEY].newValue, changes[THEME_STORAGE_KEY].oldValue);
    }
  });
}