// scripts/ui.js

import settingsManager from './settingsManager.js';
import { languagePrompts } from '../prompts/prompts.js';
import { messages } from './constants.js';
import { dataURLtoBlob, getPlatform } from './utils.js';

export default class UIManager {
  constructor(logger, speechManager, cameraManager, apiManager) {
    this.logger = logger;
    this.speechManager = speechManager;
    this.cameraManager = cameraManager;
    this.apiManager = apiManager;
    // Detect platform
    this.platform = getPlatform();

    // DOM Elements
    this.increaseTextButton = document.getElementById('increase-text');
    this.decreaseTextButton = document.getElementById('decrease-text');
    this.toggleAutoplayButton = document.getElementById('toggle-autoplay');
    this.languageSelector = document.getElementById('language');
    this.customPromptInput = document.getElementById('custom-prompt');
    this.includeDefaultPromptCheckbox = document.getElementById('include-default-prompt');
    this.enableAudioPromptCheckbox = document.getElementById('enable-audio-prompt');
    this.devModeCheckbox = document.getElementById('dev-mode');
    this.actionLogSection = document.getElementById('action-log-section');
    this.replayButton = document.getElementById('replay-button');
    this.captureButton = document.getElementById('capture-button');
    this.header = document.querySelector('header');
    this.footer = document.querySelector('footer');
    this.cameraContainer = document.getElementById('camera-container');
    this.videoCaptureButton = document.getElementById('video-capture-button');
    this.cameraSelect = document.getElementById('camera-select');
    this.apiKeyInput = document.getElementById('api-key');
    this.saveApiKeyCheckbox = document.getElementById('save-api-key');
    this.saveSettingsButton = document.getElementById('save-settings-button');
    this.currentFontSize = settingsManager.get('customization.fontSize') || 16;

    // New properties
    this.lastResponse = '';
    this.canvasElement = document.getElementById('canvas');
    this.isProcessing = false; // Initialize isProcessing flag
  }

  initializeUI() {
    this.applyCustomizationSettings();
    this.loadSettings();
    this.setDefaultPrompt();
    this.addEventListeners();
    this.initVideoCaptureActions();
    this.initReplayButton();
    this.activateTab('camera-log');

    // Platform-specific handling
    if (this.platform === 'iOS') {
      //
    }
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
  }

  setDefaultPrompt() {
    const selectedLanguage = settingsManager.get('customization.selectedLanguage');
    const customPromptText = settingsManager.get('customization.customPrompt').trim();

    if (customPromptText === '') {
      const defaultPrompt = this.getDefaultPrompt(selectedLanguage);
      this.customPromptInput.value = defaultPrompt;
      settingsManager.set('customization.customPrompt', defaultPrompt);
      this.logger.add('Default prompt set based on selected language.');
    } else {
      this.customPromptInput.value = customPromptText;
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

      const defaultPrompt = this.getDefaultPrompt(selectedLanguage);
      this.customPromptInput.value = defaultPrompt;
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
      if(isAudioPromptEnabled && this.platform === 'iOS') {
        this.showiOSWarning();  
      }
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

    // Camera Selection
    this.cameraSelect.addEventListener('change', async () => {
      const selectedDeviceId = this.cameraSelect.value;
      if (!selectedDeviceId) {
        this.logger.add(messages.errors.cameraNotFound, true);
        return;
      }
      await this.cameraManager.initCamera(selectedDeviceId);
      this.logger.add(messages.status.cameraSwitched);
    });

    // Capture Button
    this.captureButton.addEventListener('click', () => {
      this.captureAndAnalyzeImage();
    });
  }

  buildPromptText(audioPrompt) {
    let promptText = '';
    if (audioPrompt) {
      const includeDefault = settingsManager.get('customization.includeDefaultPrompt');
      if (includeDefault) {
        promptText = `${languagePrompts[settingsManager.get('customization.selectedLanguage')]} ${audioPrompt}`;
        this.logger.add('Image will be sent with default prompt and audio prompt.');
      } else {
        promptText = audioPrompt;
        this.logger.add('Image will be sent with audio prompt only.');
      }
    } else {
      const customPromptText = settingsManager.get('customization.customPrompt').trim();
      promptText =
        customPromptText !== ''
          ? customPromptText
          : languagePrompts[settingsManager.get('customization.selectedLanguage')] || languagePrompts['en-US'];
      this.logger.add('Image will be sent with default prompt.');
    }

    this.logger.add(`Final prompt sent to OpenAI: "${promptText}"`);
    return promptText;
  }

  getDefaultPrompt(language) {
    return languagePrompts[language] || languagePrompts['en-US'];
  }

  setDevMode(enabled) {
    if (enabled) {
      this.logger.add(messages.status.devModeEnabled);
      this.showDevElements();
      this.enableFullscreenCamera();
    } else {
      this.logger.add(messages.status.devModeDisabled);
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
    this.videoCaptureButton.disabled = true;
    this.cameraSelect.disabled = true;
  }

  enableCaptureButtons() {
    this.captureButton.disabled = false;
    this.replayButton.disabled = false;
    this.videoCaptureButton.disabled = false;
    this.cameraSelect.disabled = false;
  }

  saveAllSettings() {
    // Collect all settings from the form
    const apiKey = this.apiKeyInput.value.trim();
    const saveApiKey = this.saveApiKeyCheckbox.checked;
    const selectedLanguage = this.languageSelector.value;
    const customPrompt = this.customPromptInput.value.trim();
    const includeDefaultPrompt = this.includeDefaultPromptCheckbox.checked;
    const isAudioPromptEnabled = this.enableAudioPromptCheckbox.checked;
    const isDevModeEnabled = this.devModeCheckbox.checked;
    const fontSize = this.currentFontSize;
    const isAutoPlay = settingsManager.get('customization.isAutoPlay');

    // Update settings in settingsManager
    settingsManager.set('api.apiKey', saveApiKey ? apiKey : '');
    settingsManager.set('api.saveApiKey', saveApiKey);
    settingsManager.set('customization.selectedLanguage', selectedLanguage);
    settingsManager.set('customization.customPrompt', customPrompt || this.getDefaultPrompt(selectedLanguage));
    settingsManager.set('customization.includeDefaultPrompt', includeDefaultPrompt);
    settingsManager.set('customization.isAudioPromptEnabled', isAudioPromptEnabled);
    settingsManager.set('devMode.isDevModeEnabled', isDevModeEnabled);
    settingsManager.set('customization.fontSize', fontSize);

    // Save settings to localStorage
    settingsManager.saveSettings();

    // Update API Key in ApiManager
    this.apiManager.updateApiKey();

    // Provide feedback to the user
    this.logger.add(messages.status.settingsSaved);
    alert(messages.status.settingsSaved);
  }

  initVideoCaptureActions() {
    // Bind the event handlers
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    // Add event listeners
    this.videoCaptureButton.addEventListener('mousedown', this.handleMouseDown);
    this.videoCaptureButton.addEventListener('mouseup', this.handleMouseUp);
    this.videoCaptureButton.addEventListener('mouseleave', this.handleMouseLeave);
    this.videoCaptureButton.addEventListener('touchstart', this.handleTouchStart);
    this.videoCaptureButton.addEventListener('touchend', this.handleTouchEnd);
  }

// Mouse Events
handleMouseDown(event) {
  if (settingsManager.get('customization.isAudioPromptEnabled')) {
    // Start hold timer only if the feature is enabled
    this.speechManager.holdTimer = setTimeout(() => {
      this.speechManager.isHoldAction = true;
      this.speechManager.startRecording(this.captureAndAnalyzeImage.bind(this));
    }, this.speechManager.holdThreshold);
  }
}

handleMouseUp(event) {
  // If the hold timer is active, clear it (user released before threshold)
  if (this.speechManager.holdTimer) {
    clearTimeout(this.speechManager.holdTimer);
    this.speechManager.holdTimer = null;
  }

  // If it was not a hold action, treat it as a tap (capture and analyze)
  if (!this.speechManager.isHoldAction) {
    this.captureAndAnalyzeImage();
  }

  // If recording is in progress, stop it when the mouse is released
  if (this.speechManager.isRecording) {
    this.speechManager.stopRecording();
  }

  // Reset the hold action flag
  this.speechManager.isHoldAction = false;
}

handleMouseLeave(event) {
  // If the user moves the mouse out before the timer is triggered, treat it as a tap
  if (this.speechManager.holdTimer) {
    clearTimeout(this.speechManager.holdTimer);
    this.speechManager.holdTimer = null;
  }

  // If it was not a hold action, capture and analyze
  if (!this.speechManager.isHoldAction) {
    this.captureAndAnalyzeImage();
  }

  // Stop recording if it was in progress
  if (this.speechManager.isRecording) {
    this.speechManager.stopRecording();
  }

  // Reset the hold action flag
  this.speechManager.isHoldAction = false;
}

// Touch Events
handleTouchStart(event) {
  event.preventDefault(); // Prevent default behavior

  // Only start the hold timer if the feature is enabled
  if (settingsManager.get('customization.isAudioPromptEnabled')) {
    this.speechManager.holdTimer = setTimeout(() => {
      this.speechManager.isHoldAction = true;
      this.speechManager.startRecording(this.captureAndAnalyzeImage.bind(this));
    }, this.speechManager.holdThreshold);
  }
}

handleTouchEnd(event) {
  event.preventDefault(); // Prevent default behavior

  // Clear the hold timer if the touch ended before the threshold
  if (this.speechManager.holdTimer) {
    clearTimeout(this.speechManager.holdTimer);
    this.speechManager.holdTimer = null;
  }

  // If it was not a hold action, treat it as a tap (capture and analyze)
  if (!this.speechManager.isHoldAction) {
    this.captureAndAnalyzeImage();
  }

  // Stop the recording if it was a hold action and recording is active
  if (this.speechManager.isRecording) {
    this.speechManager.stopRecording();
  }

  // Reset the hold action flag
  this.speechManager.isHoldAction = false;
}


  async captureAndAnalyzeImage(audioPrompt = '') {
    if (this.isProcessing) {
      this.logger.add(messages.errors.recordingInProgress, true);
      return;
    }

    this.isProcessing = true; // Set processing flag
    this.disableCaptureButtons();

    if (this.speechManager.isPlaying || this.speechManager.isRecording) {
      this.logger.add(messages.errors.recordingInProgress, true);
      this.isProcessing = false; // Reset processing flag
      this.enableCaptureButtons();
      return;
    }

    const apiKey = settingsManager.get('api.apiKey');
    if (!apiKey) {
      this.logger.add(messages.errors.apiKeyMissing, true);
      await this.speechManager.speak(messages.errors.apiKeyMissing);
      this.isProcessing = false; // Reset processing flag
      this.enableCaptureButtons();
      return;
    }

    if (!this.cameraManager.videoElement.srcObject) {
      this.logger.add(messages.errors.cameraNotInitialized, true);
      await this.speechManager.speak(messages.errors.cameraNotInitialized);
      this.isProcessing = false; // Reset processing flag
      this.enableCaptureButtons();
      return;
    }

    try {
      // Capture Image
      this.logger.add(messages.status.capturingImage);
      const imageDataUrl = this.cameraManager.captureImage(this.canvasElement);
      await this.speechManager.speak(messages.status.imageCaptured);
      const imageBlob = dataURLtoBlob(imageDataUrl);

      // Build Prompt
      let promptText = this.buildPromptText(audioPrompt);

      // Send Image to OpenAI
      this.logger.add(messages.status.imageSent);
      const description = await this.apiManager.getImageDescription(imageBlob, promptText);

      // Process Response
      this.lastResponse = description;
      this.logger.add(messages.status.responseReceived);
      this.logger.add(messages.status.playbackStarted);
      await this.speechManager.speak(description);
    } catch (error) {
      this.logger.add(`Error: ${error.message}`, true);
      console.error('Error:', error);
    } finally {
      this.isProcessing = false; // Reset processing flag
      this.enableCaptureButtons();
    }
  }

  initReplayButton() {
    this.replayButton.addEventListener('click', () => {
      if (this.lastResponse) {
        this.logger.add(messages.status.playbackStarted);
        this.speechManager.speak(this.lastResponse).catch((error) => {
          console.error('Error during replay:', error);
          this.logger.add(messages.errors.audioPlaybackError, true);
        });
      } else {
        this.logger.add(messages.errors.noResponseToReplay, true);
      }
    });
  }

  initTabNavigation() {
    const tabCameraLog = document.getElementById('tab-camera-log');
    const tabSettings = document.getElementById('tab-settings');

    tabCameraLog.addEventListener('click', () => {
      this.activateTab('camera-log');
    });

    tabSettings.addEventListener('click', () => {
      this.activateTab('settings');
    });
  }

  activateTab(tabId) {
    // Deactivate all tabs
    const tabs = document.querySelectorAll('#tab-navigation button');
    tabs.forEach((tab) => {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
      tab.style.display = 'block';
    });

    // Hide the active tab button
    const activeTab = document.getElementById(`tab-${tabId}`);
    activeTab.style.display = 'none';
    activeTab.setAttribute('aria-selected', 'true');

    // Hide all tab panels
    const tabPanels = document.querySelectorAll('main section[role="tabpanel"]');
    tabPanels.forEach((panel) => {
      panel.hidden = true;
      panel.setAttribute('aria-hidden', 'true');
    });

    // Show the corresponding tab panel
    const activePanel = document.getElementById(tabId);
    activePanel.hidden = false;
    activePanel.setAttribute('aria-hidden', 'false');

    // Apply the 'active' class to the corresponding tab panel
    activeTab.classList.add('active');

    // Check and apply Dev Mode state when switching tabs
    const isDevModeEnabled = settingsManager.get('devMode.isDevModeEnabled');
    if (isDevModeEnabled) {
      this.setDevMode(true);
    }
  }

  showiOSWarning() {
    // Display a warning message similar to the settings save message
    this.logger.add(messages.errors.iosWarning, true);
    alert(messages.errors.iosWarning);
  }
}
