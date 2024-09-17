// scripts/main.js

import CameraManager from './camera.js';
import settingsManager from './settingsManager.js';
import Logger from './logger.js';
import SpeechManager from './speech.js';
import UIManager from './ui.js';
import { dataURLtoBlob, blobToBase64 } from './utils.js';

// ========================
// DOM Elements Selection
// ========================
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureButton = document.getElementById('capture-button');
const replayButton = document.getElementById('replay-button');
const videoCaptureButton = document.getElementById('video-capture-button');
const cameraSelect = document.getElementById('camera-select');
const apiKeyInput = document.getElementById('api-key');
const saveApiKeyCheckbox = document.getElementById('save-api-key');
const statusDiv = document.getElementById('status');
const logList = document.getElementById('log-list');
const increaseTextButton = document.getElementById('increase-text');
const decreaseTextButton = document.getElementById('decrease-text');
const toggleAutoplayButton = document.getElementById('toggle-autoplay');
const languageSelector = document.getElementById('language');
const customPrompt = document.getElementById('custom-prompt');
const includeDefaultPromptCheckbox = document.getElementById('include-default-prompt');
const devModeCheckbox = document.getElementById('dev-mode');
const actionLogSection = document.getElementById('action-log-section');
const header = document.querySelector('header');
const footer = document.querySelector('footer');
const cameraContainer = document.getElementById('camera-container');
const enableAudioPromptCheckbox = document.getElementById('enable-audio-prompt');
const saveSettingsButton = document.getElementById('save-settings-button'); // Added

// ========================
// Initialize Logger
// ========================
const logger = new Logger(logList);

// ========================
// Initialize Speech Manager
// ========================
const speechManager = new SpeechManager(logger);

// ========================
// Initialize Camera Manager
// ========================
const cameraManager = new CameraManager(video, cameraSelect, logger);

// ========================
// Initialize UI Manager
// ========================
const uiManager = new UIManager({
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
});

// ========================
// Language Prompts Mapping
// ========================
const languagePrompts = {
    'en-US': 'I am a blind person, and this is an image from my perspective. Please describe what I see using short but descriptive language. Address me with "you". No more than 50 words.',
    'de-DE': 'Ich bin blind. Das ist ein Bild aus meiner Sicht. Bitte beschreibe, was ich sehe, in kurzen, aber aussagekräftigen Worten. Sprich mich mit "du" an. Nicht mehr als 50 Wörter.',
    'es-ES': 'Soy una persona ciega y esta es una imagen desde mi perspectiva. Por favor, describe brevemente lo que veo, usando un lenguaje corto pero descriptivo. Háblame de "tú". No más de 50 palabras.',
    'fr-FR': 'Je suis une personne aveugle et ceci est une image de mon point de vue. Veuillez décrire ce que je vois en utilisant un langage court mais descriptif. Adresse-moi avec "tu". Pas plus de 50 mots.',
    // Add more languages and their prompts as needed
};

// ========================
// Event Listeners Initialization
// ========================
window.addEventListener('load', async () => {
    await cameraManager.initializeCamera();
    uiManager.initializeUI();
    cameraManager.addEventListeners();
    initVideoCaptureActions();
    initReplayButton();
    initTabNavigation(); // Ensure tab navigation is initialized
    activateTab('camera-log'); // Set 'camera-log' as the default active tab
});

// ========================
// Capture and Analyze Image Functions
// ========================

let lastResponse = '';

async function getImageDescriptionWithPrompt(imageBlob, apiKey, promptText) {
    const base64Image = await blobToBase64(imageBlob);

    const payload = {
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: promptText },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ]
            }
        ],
        max_tokens: 300
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errorMessage = 'Error processing image.';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error.message || errorMessage;
        } catch {
            // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
    } else {
        throw new Error('No description received from OpenAI.');
    }
}

async function captureAndAnalyzeImage(audioPrompt = '') {
    if (uiManager.isPlaying || speechManager.isRecording) {
        logger.add('Please wait until the current description is finished.', true);
        return;
    }

    const apiKey = settingsManager.get('api.apiKey'); // Retrieve saved API key
    const saveApiKey = settingsManager.get('api.saveApiKey');
    if (!apiKey) {
        logger.add('API Key missing. Please add your OpenAI API key.', true);
        await speechManager.speak('Please add your API key.');
        return;
    }

    // Check if camera is initialized
    if (!video.srcObject) {
        logger.add('Camera not initialized.', true);
        await speechManager.speak('Camera not initialized.');
        return;
    }

    try {
        uiManager.disableCaptureButtons();

        // Step 1: Capture Image
        logger.add('Capturing image...');
        const imageDataUrl = captureImage();

        await speechManager.speak('Image taken.');

        const imageBlob = dataURLtoBlob(imageDataUrl);

        // Step 2: Build Prompt
        let promptText = '';
        if (audioPrompt) {
            const includeDefault = settingsManager.get('customization.includeDefaultPrompt');
            if (includeDefault) {
                promptText = `${languagePrompts[settingsManager.get('customization.selectedLanguage')]} ${audioPrompt}`;
                logger.add('Image will be sent with default prompt and audio prompt.');
            } else {
                promptText = audioPrompt;
                logger.add('Image will be sent with audio prompt only.');
            }
        } else {
            const customPromptText = settingsManager.get('customization.customPrompt').trim();
            promptText = customPromptText !== '' ? customPromptText : (languagePrompts[settingsManager.get('customization.selectedLanguage')] || languagePrompts['en-US']);
            logger.add('Image will be sent with default prompt.');
        }

        // Log the final prompt sent to OpenAI
        logger.add(`Final prompt sent to OpenAI: "${promptText}"`);

        // Step 3: Send Image to OpenAI
        logger.add('Sending image to OpenAI...');
        const description = await getImageDescriptionWithPrompt(imageBlob, apiKey, promptText);

        // Step 4: Provide Audio Feedback
        if (audioPrompt) {
            await speechManager.speak('Image sent with audio prompt.');
        } else {
            await speechManager.speak('Image sent.');
        }

        // Step 5: Processing Image
        logger.add('Processing image...');

        // Step 6: Save and Playback Response
        lastResponse = description;

        logger.add('Response received.');
        logger.add('Playback response started.');
        await speechManager.speak(description);
    } catch (error) {
        logger.add(`Error: ${error.message}`, true);
        console.error('Error:', error);
    } finally {
        uiManager.enableCaptureButtons();
    }
}

function captureImage() {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
}

// ========================
// Video Capture Actions
// ========================

function initVideoCaptureActions() {
    // Event listeners for holding the video capture button
    videoCaptureButton.addEventListener('mousedown', handleMouseDown);
    videoCaptureButton.addEventListener('mouseup', handleMouseUp);
    videoCaptureButton.addEventListener('mouseleave', handleMouseLeave);

    // For touch devices
    videoCaptureButton.addEventListener('touchstart', handleTouchStart);
    videoCaptureButton.addEventListener('touchend', handleTouchEnd);
}

// Mouse Events
function handleMouseDown(event) {
    if (!settingsManager.get('customization.isAudioPromptEnabled')) return;
    // Start hold timer
    speechManager.holdTimer = setTimeout(() => {
        speechManager.isHoldAction = true;
        speechManager.startRecording(captureAndAnalyzeImage);
    }, speechManager.holdThreshold);
}

function handleMouseUp(event) {
    if (speechManager.holdTimer) {
        clearTimeout(speechManager.holdTimer);
        speechManager.holdTimer = null;
        if (!speechManager.isHoldAction) {
            // Short click action
            captureAndAnalyzeImage();
        }
    } else if (speechManager.isRecording) {
        speechManager.stopRecording();
    }
    speechManager.isHoldAction = false;
}

function handleMouseLeave(event) {
    if (speechManager.holdTimer) {
        clearTimeout(speechManager.holdTimer);
        speechManager.holdTimer = null;
        if (!speechManager.isHoldAction) {
            // Short click action
            captureAndAnalyzeImage();
        }
    }
    if (speechManager.isRecording) {
        speechManager.stopRecording();
    }
    speechManager.isHoldAction = false;
}

// Touch Events
function handleTouchStart(event) {
    event.preventDefault(); // Prevent default behavior
    if (!settingsManager.get('customization.isAudioPromptEnabled')) return;
    speechManager.holdTimer = setTimeout(() => {
        speechManager.isHoldAction = true;
        speechManager.startRecording(captureAndAnalyzeImage);
    }, speechManager.holdThreshold);
}

function handleTouchEnd(event) {
    event.preventDefault(); // Prevent default behavior
    if (speechManager.holdTimer) {
        clearTimeout(speechManager.holdTimer);
        speechManager.holdTimer = null;
        if (!speechManager.isHoldAction) {
            // Short tap action
            captureAndAnalyzeImage();
        }
    } else if (speechManager.isRecording) {
        speechManager.stopRecording();
    }
    speechManager.isHoldAction = false;
}

// ========================
// Replay Last Response Functionality
// ========================

function initReplayButton() {
    replayButton.addEventListener('click', () => {
        if (lastResponse) {
            logger.add('Playback response started.');
            speechManager.speak(lastResponse).catch(error => {
                console.error('Error during replay:', error);
                logger.add('Error during replay.', true);
            });
        } else {
            logger.add('No response to replay.', true);
        }
    });
}

// ========================
// Tab Navigation and Activation
// ========================

function initTabNavigation() {
    const tabCameraLog = document.getElementById('tab-camera-log');
    const tabSettings = document.getElementById('tab-settings');

    tabCameraLog.addEventListener('click', () => {
        activateTab('camera-log');
    });

    tabSettings.addEventListener('click', () => {
        activateTab('settings');
    });
}

function activateTab(tabId) {
    // Deactivate all tabs
    const tabs = document.querySelectorAll('#tab-navigation button');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
        tab.style.display = 'block'; // Show all tabs initially
    });

    // Hide the active tab button
    const activeTab = document.getElementById('tab-' + tabId);
    activeTab.style.display = 'none'; // Hide the currently active tab
    activeTab.setAttribute('aria-selected', 'true');

    // Hide all tab panels
    const tabPanels = document.querySelectorAll('main section[role="tabpanel"]');
    tabPanels.forEach(panel => {
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
        uiManager.setDevMode(true);
    }
}
