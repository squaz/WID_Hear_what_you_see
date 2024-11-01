// scripts/settingsManager.js

import { getPlatform } from './utils.js'

const defaultSettings = {
    camera: {
      selectedCameraId: null,
    },
    api: {
      apiKey: '',
      saveApiKey: false,
    },
    customization: {
      fontSize: 16,
      isAutoPlay: true,
      selectedLanguage: 'en-US',
      includeDefaultPrompt: true,
      // Enabled only for Android by default
      isAudioPromptEnabled: getPlatform() === 'Android', 
      customPrompt: '',
    },
    devMode: {
      isDevModeEnabled: false,
    },
  };
  
  class SettingsManager {
    constructor(storageKey = 'appSettings') {
      this.storageKey = storageKey;
      this.settings = JSON.parse(JSON.stringify(defaultSettings));
      this.loadSettings();
    }
  
    loadSettings() {
      const savedSettings = localStorage.getItem(this.storageKey);
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          this.deepMerge(this.settings, parsedSettings);
        } catch (error) {
          console.error('Error parsing settings from localStorage:', error);
        }
      }
    }
  
    saveSettings() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      } catch (error) {
        console.error('Error saving settings to localStorage:', error);
      }
    }
  
    get(settingPath) {
      return settingPath
        .split('.')
        .reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : null), this.settings);
    }
  
    set(settingPath, value) {
      const keys = settingPath.split('.');
      let obj = this.settings;
      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          obj[key] = value;
        } else {
          if (!obj[key]) obj[key] = {};
          obj = obj[key];
        }
      });
      // Note: Settings are saved when 'Save Settings' button is clicked
    }
  
    deepMerge(target, source) {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object') {
          if (!target[key] || typeof target[key] !== 'object') {
            target[key] = {};
          }
          this.deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    }
  }
  
  const settingsManager = new SettingsManager();
  export default settingsManager;
  