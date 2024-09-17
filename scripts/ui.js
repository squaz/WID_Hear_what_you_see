// scripts/ui.js

import settingsManager from './settingsManager.js';
import Logger from './logger.js';
import { languagePrompts } from '../prompts/prompts.js';

export default class UIManager {
    constructor({
        increaseTextButton,
        decreaseTextButton,
        toggleAutoplayButton,
        languageSelector,
        customPrompt,
        includeDefaultPromptCheckbox,
        enableAudioPromptCheckbox,
        devModeCheckbox,
        actionLogSection,
        replayButton,
        captureButton,
        header,
        footer,
        cameraContainer,
        videoCaptureButton,      // Added
        cameraSelect,            // Added
        apiKeyInput,             // Added
        saveApiKeyCheckbox,      // Added
        saveSettingsButton,      // Added
        logger
    }) {
        this.increaseTextButton = increaseTextButton;
        this.decreaseTextButton = decreaseTextButton;
        this.toggleAutoplayButton = toggleAutoplayButton;
        this.languageSelector = languageSelector;
        this.customPrompt = customPrompt;
        this.includeDefaultPromptCheckbox = includeDefaultPromptCheckbox;
        this.enableAudioPromptCheckbox = enableAudioPromptCheckbox;
        this.devModeCheckbox = devModeCheckbox;
        this.actionLogSection = actionLogSection;
        this.replayButton = replayButton;
        this.captureButton = captureButton;
        this.header = header;
        this.footer = footer;
        this.cameraContainer = cameraContainer;
        this.videoCaptureButton = videoCaptureButton;    // Added
        this.cameraSelect = cameraSelect;                // Added
        this.apiKeyInput = apiKeyInput;                  // Added
        this.saveApiKeyCheckbox = saveApiKeyCheckbox;    // Added
        this.saveSettingsButton = saveSettingsButton;    // Added
        this.logger = logger;
        this.currentFontSize = settingsManager.get('customization.fontSize') || 16;
    }

    initializeUI() {
        this.applyCustomizationSettings();
        this.loadSettings();
        this.setDefaultPrompt();
        this.addEventListeners();
    }

    applyCustomizationSettings() {
        // Font Size
        document.body.style.fontSize = `${this.currentFontSize}px`;

        // Auto-Play
        const isAutoPlay = settingsManager.get('customization.isAutoPlay');
        this.toggleAutoplayButton.textContent = `Auto-Play: ${isAutoPlay ? 'On' : 'Off'}`;

        // Language
        const selectedLanguage = settingsManager.get('customization.selectedLanguage');
        this.languageSelector.value = selectedLanguage;

        // Include Default Prompt
        const includeDefaultPrompt = settingsManager.get('customization.includeDefaultPrompt');
        this.includeDefaultPromptCheckbox.checked = includeDefaultPrompt;

        // Audio Prompt Enabled
        const isAudioPromptEnabled = settingsManager.get('customization.isAudioPromptEnabled');
        this.enableAudioPromptCheckbox.checked = isAudioPromptEnabled;

        // Dev Mode
        const isDevModeEnabled = settingsManager.get('devMode.isDevModeEnabled');
        this.devModeCheckbox.checked = isDevModeEnabled;
        this.setDevMode(isDevModeEnabled);
    }

    loadSettings() {
        // Load API Key if saved
        const savedApiKey = settingsManager.get('api.apiKey');
        const saveApiKey = settingsManager.get('api.saveApiKey');

        if (saveApiKey && savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
            this.saveApiKeyCheckbox.checked = true;
        } else {
            this.apiKeyInput.value = '';
            this.saveApiKeyCheckbox.checked = false;
        }

        // Load other settings are already handled in applyCustomizationSettings()
    }

    setDefaultPrompt() {
        const selectedLanguage = settingsManager.get('customization.selectedLanguage');
        const customPromptText = settingsManager.get('customization.customPrompt').trim();
        
        // If custom prompt is empty, set to default prompt
        if (customPromptText === '') {
            const defaultPrompt = this.getDefaultPrompt(selectedLanguage);
            this.customPrompt.value = defaultPrompt;
            settingsManager.set('customization.customPrompt', defaultPrompt);
            this.logger.add('Default prompt set based on selected language.');
        } else {
            // Otherwise, use the existing custom prompt
            this.customPrompt.value = customPromptText;
        }
    }

    addEventListeners() {
        // Text Size Controls
        this.increaseTextButton.addEventListener('click', () => {
            this.currentFontSize += 2;
            document.body.style.fontSize = `${this.currentFontSize}px`;
            this.logger.add(`Text size increased to ${this.currentFontSize}px.`);
        });

        this.decreaseTextButton.addEventListener('click', () => {
            if (this.currentFontSize > 12) {
                this.currentFontSize -= 2;
                document.body.style.fontSize = `${this.currentFontSize}px`;
                this.logger.add(`Text size decreased to ${this.currentFontSize}px.`);
            }
        });

        // Auto-Play Toggle
        this.toggleAutoplayButton.addEventListener('click', () => {
            const isAutoPlay = settingsManager.get('customization.isAutoPlay');
            settingsManager.set('customization.isAutoPlay', !isAutoPlay);
            this.toggleAutoplayButton.textContent = `Auto-Play: ${!isAutoPlay ? 'On' : 'Off'}`;
            this.logger.add(`Auto-play audio is now ${!isAutoPlay ? 'enabled' : 'disabled'}.`);
        });

        // Language Selector
        this.languageSelector.addEventListener('change', (event) => {
            const selectedLanguage = event.target.value;
            settingsManager.set('customization.selectedLanguage', selectedLanguage);
            this.logger.add(`Language changed to ${event.target.selectedOptions[0].text}.`);
            
            // Always update the prompt to the default prompt for the selected language
            const defaultPrompt = this.getDefaultPrompt(selectedLanguage);
            this.customPrompt.value = defaultPrompt;
            settingsManager.set('customization.customPrompt', defaultPrompt);
            this.logger.add('Custom prompt updated to default for the selected language.');
        });

        // Include Default Prompt Checkbox
        this.includeDefaultPromptCheckbox.addEventListener('change', (event) => {
            const includeDefaultPrompt = event.target.checked;
            settingsManager.set('customization.includeDefaultPrompt', includeDefaultPrompt);
            const status = includeDefaultPrompt ? 'enabled' : 'disabled';
            this.logger.add(`Including default prompt is now ${status}.`);
        });

        // Audio Prompt Checkbox
        this.enableAudioPromptCheckbox.addEventListener('change', (event) => {
            const isAudioPromptEnabled = event.target.checked;
            settingsManager.set('customization.isAudioPromptEnabled', isAudioPromptEnabled);
            this.logger.add(`Audio prompt via hold is now ${isAudioPromptEnabled ? 'enabled' : 'disabled'}.`);
        });

        // Dev Mode Checkbox
        this.devModeCheckbox.addEventListener('change', () => {
            const isDevModeEnabled = this.devModeCheckbox.checked;
            settingsManager.set('devMode.isDevModeEnabled', isDevModeEnabled);
            this.setDevMode(isDevModeEnabled);
        });

        // Save Settings Button
        this.saveSettingsButton.addEventListener('click', () => {
            this.saveAllSettings();
        });
    }

    saveAllSettings() {
        // Collect all settings from the form
        const apiKey = this.apiKeyInput.value.trim();
        const saveApiKey = this.saveApiKeyCheckbox.checked;
        const selectedLanguage = this.languageSelector.value;
        const selectedCamera = this.cameraSelect.value;
        const customPrompt = this.customPrompt.value.trim();
        const includeDefaultPrompt = this.includeDefaultPromptCheckbox.checked;
        const isAudioPromptEnabled = this.enableAudioPromptCheckbox.checked;
        const isDevModeEnabled = this.devModeCheckbox.checked;
        const fontSize = this.currentFontSize;
        const isAutoPlay = settingsManager.get('customization.isAutoPlay'); // Current state

        // Update settings in settingsManager
        settingsManager.set('api.apiKey', saveApiKey ? apiKey : '');
        settingsManager.set('api.saveApiKey', saveApiKey);
        settingsManager.set('customization.selectedLanguage', selectedLanguage);
        settingsManager.set('customization.customPrompt', customPrompt === '' ? this.getDefaultPrompt(selectedLanguage) : customPrompt);
        settingsManager.set('customization.includeDefaultPrompt', includeDefaultPrompt);
        settingsManager.set('customization.isAudioPromptEnabled', isAudioPromptEnabled);
        settingsManager.set('devMode.isDevModeEnabled', isDevModeEnabled);
        settingsManager.set('customization.fontSize', fontSize);
        // Note: isAutoPlay is already toggled via the toggleAutoplayButton event listener

        // Save settings to localStorage
        settingsManager.saveSettings();

        // Provide feedback to the user
        this.logger.add('Settings have been saved successfully.');
        alert('Settings have been saved successfully.');
    }

    getDefaultPrompt(language) {
        return languagePrompts[language] || languagePrompts['en-US'];
    }

    setDevMode(enabled) {
        if (enabled) {
            this.logger.add('Developer Mode enabled.');
            this.showDevElements();
            this.enableFullscreenCamera();
        } else {
            this.logger.add('Developer Mode disabled.');
            this.hideDevElements();
            this.disableFullscreenCamera();
        }
    }

    showDevElements() {
        this.actionLogSection.classList.remove('hidden');
        this.replayButton.classList.remove('hidden');
        this.captureButton.classList.remove('hidden');
        this.header.classList.remove('hidden');
        this.footer.classList.remove('hidden');
    }

    hideDevElements() {
        this.actionLogSection.classList.add('hidden');
        this.replayButton.classList.add('hidden');
        this.captureButton.classList.add('hidden');
        this.header.classList.add('hidden');
        this.footer.classList.add('hidden');
    }

    enableFullscreenCamera() {
        this.cameraContainer.classList.add('fullscreen-camera');
    }

    disableFullscreenCamera() {
        this.cameraContainer.classList.remove('fullscreen-camera');
    }

    disableCaptureButtons() {
        if (this.captureButton) this.captureButton.disabled = true;
        if (this.replayButton) this.replayButton.disabled = true;
        if (this.videoCaptureButton) this.videoCaptureButton.disabled = true;
        if (this.cameraSelect) this.cameraSelect.disabled = true;
    }

    enableCaptureButtons() {
        if (this.captureButton) this.captureButton.disabled = false;
        if (this.replayButton) this.replayButton.disabled = false;
        if (this.videoCaptureButton) this.videoCaptureButton.disabled = false;
        if (this.cameraSelect) this.cameraSelect.disabled = false;
    }
}
