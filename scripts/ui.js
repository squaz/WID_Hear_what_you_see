// scripts/ui.js

import settingsManager from './settingsManager.js';
import Logger from './logger.js';

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
        this.logger = logger;
        this.currentFontSize = settingsManager.get('customization.fontSize') || 16;
    }

    initializeUI() {
        this.applyCustomizationSettings();
        this.loadApiKey();
        this.setDefaultPrompt();
        this.addEventListeners();
    }

    applyCustomizationSettings() {
        // Font Size
        document.body.style.fontSize = `${this.currentFontSize}px`;

        // Auto-Play
        const isAutoPlay = settingsManager.get('customization.isAutoPlay');
        this.toggleAutoplayButton.textContent = `≡ƒöè Auto-Play: ${isAutoPlay ? 'On' : 'Off'}`;

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

    loadApiKey() {
        const savedApiKey = settingsManager.get('api.apiKey');
        const saveApiKey = settingsManager.get('api.saveApiKey');

        if (saveApiKey && savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
            this.saveApiKeyCheckbox.checked = true;
        }
    }

    setDefaultPrompt() {
        const customPromptText = settingsManager.get('customization.customPrompt').trim();
        if (customPromptText === '') {
            const selectedLanguage = settingsManager.get('customization.selectedLanguage');
            const defaultPrompt = this.getDefaultPrompt(selectedLanguage);
            this.customPrompt.value = defaultPrompt;
            settingsManager.set('customization.customPrompt', defaultPrompt);
            this.logger.add('Default prompt set based on selected language.');
        }
    }

    addEventListeners() {
        // Text Size Controls
        this.increaseTextButton.addEventListener('click', () => {
            this.currentFontSize += 2;
            document.body.style.fontSize = `${this.currentFontSize}px`;
            this.logger.add(`Text size increased to ${this.currentFontSize}px.`);
            settingsManager.set('customization.fontSize', this.currentFontSize);
        });

        this.decreaseTextButton.addEventListener('click', () => {
            if (this.currentFontSize > 12) {
                this.currentFontSize -= 2;
                document.body.style.fontSize = `${this.currentFontSize}px`;
                this.logger.add(`Text size decreased to ${this.currentFontSize}px.`);
                settingsManager.set('customization.fontSize', this.currentFontSize);
            }
        });

        // Auto-Play Toggle
        this.toggleAutoplayButton.addEventListener('click', () => {
            const isAutoPlay = settingsManager.get('customization.isAutoPlay');
            settingsManager.set('customization.isAutoPlay', !isAutoPlay);
            this.toggleAutoplayButton.textContent = `≡ƒöè Auto-Play: ${!isAutoPlay ? 'On' : 'Off'}`;
            this.logger.add(`Auto-play audio is now ${!isAutoPlay ? 'enabled' : 'disabled'}.`);
        });

        // Language Selector
        this.languageSelector.addEventListener('change', (event) => {
            const selectedLanguage = event.target.value;
            settingsManager.set('customization.selectedLanguage', selectedLanguage);
            this.logger.add(`Language changed to ${event.target.selectedOptions[0].text}.`);
            // Update custom prompt to default for selected language if necessary
            const defaultPrompt = this.getDefaultPrompt(selectedLanguage);
            const currentPrompt = this.customPrompt.value.trim();
            if (currentPrompt === '' || currentPrompt === settingsManager.get('customization.customPrompt')) {
                this.customPrompt.value = defaultPrompt;
                settingsManager.set('customization.customPrompt', defaultPrompt);
                this.logger.add('Custom prompt updated to default for the selected language.');
            }
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

        // Custom Prompt Input
        this.customPrompt.addEventListener('input', () => {
            const prompt = this.customPrompt.value.trim();
            settingsManager.set('customization.customPrompt', prompt);
            this.logger.add('Custom prompt saved.');
        });

        // Dev Mode Checkbox
        this.devModeCheckbox.addEventListener('change', () => {
            const isDevModeEnabled = this.devModeCheckbox.checked;
            settingsManager.set('devMode.isDevModeEnabled', isDevModeEnabled);
            this.setDevMode(isDevModeEnabled);
        });

        // Save API Key Checkbox
        this.saveApiKeyCheckbox.addEventListener('change', () => {
            const saveApiKey = this.saveApiKeyCheckbox.checked;
            settingsManager.set('api.saveApiKey', saveApiKey);
            if (!saveApiKey) {
                // If unchecked, remove the saved API key
                settingsManager.set('api.apiKey', '');
                this.apiKeyInput.value = '';
                this.logger.add('API key removal confirmed.');
            } else {
                // If checked, save the current API key
                const currentApiKey = this.apiKeyInput.value.trim();
                settingsManager.set('api.apiKey', currentApiKey);
                this.logger.add('API key saved for future sessions.');
            }
        });

        // API Key Input
        this.apiKeyInput.addEventListener('input', () => {
            const apiKey = this.apiKeyInput.value.trim();
            const saveApiKey = this.saveApiKeyCheckbox.checked;
            if (saveApiKey) {
                settingsManager.set('api.apiKey', apiKey);
                this.logger.add('API key updated and saved.');
            }
        });
    }

    getDefaultPrompt(language) {
        const languagePrompts = {
            'en-US': 'I am a blind person, and this is an image from my perspective. Please describe what I see using short but descriptive language. Address me with "you". No more than 50 words.',
            'de-DE': 'Ich bin blind. Das ist ein Bild aus meiner Sicht. Bitte beschreibe, was ich sehe, in kurzen, aber aussagekräftigen Worten. Sprich mich mit "du" an. Nicht mehr als 50 Wörter.',
            'es-ES': 'Soy una persona ciega y esta es una imagen desde mi perspectiva. Por favor, describe brevemente lo que veo, usando un lenguaje corto pero descriptivo. Háblame de "tú". No más de 50 palabras.',
            'fr-FR': 'Je suis une personne aveugle et ceci est une image de mon point de vue. Veuillez décrire ce que je vois en utilisant un langage court mais descriptif. Adresse-moi avec "tu". Pas plus de 50 mots.',
            // Add more languages and their prompts as needed
        };
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
        this.captureButton.disabled = true;
        this.replayButton.disabled = true;
        this.videoCaptureButton.disabled = true;  // Now defined
        this.cameraSelect.disabled = true;        // Now defined
    }

    enableCaptureButtons() {
        this.captureButton.disabled = false;
        this.replayButton.disabled = false;
        this.videoCaptureButton.disabled = false; // Now defined
        this.cameraSelect.disabled = false;       // Now defined
    }
}
