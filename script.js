// script.js

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
const toggleContrastButton = document.getElementById('toggle-contrast');
const toggleAutoplayButton = document.getElementById('toggle-autoplay');
const languageSelector = document.getElementById('language');
const customPrompt = document.getElementById('custom-prompt');
const includeDefaultPromptCheckbox = document.getElementById('include-default-prompt');
const devModeCheckbox = document.getElementById('dev-mode');
const actionLogSection = document.getElementById('action-log-section');
const headlineSection = document.getElementById('headline-section'); // Select the headline section
const footer = document.querySelector('footer'); // Select the footer
const cameraContainer = document.getElementById('camera-container'); // Select the camera container

// ========================
// Initialization Variables
// ========================
let lastResponse = '';
let includeDefaultPrompt = true;
let isPlaying = false;
let isRecording = false;
let recognition = null;
let holdTimer = null;
const holdThreshold = 2000; // 2 seconds
let selectedLanguage = 'en-US';
let isAutoPlay = true;
let isHighContrast = false;
let isHoldAction = false; // Flag to indicate hold action
let videoCaptureActionsInitialized = false; // Prevent multiple initializations
let currentFontSize = 16; // Default font size in pixels

// ========================
// Language Prompts Mapping
// ========================
const languagePrompts = {
    'en-US': 'I am a blind person and this is an image from my perspective. Please explain in short what I would see.',
    'es-ES': 'Soy una persona ciega y esta es una imagen desde mi perspectiva. Por favor, explica brevemente lo que vería.',
    'fr-FR': 'Je suis une personne aveugle et ceci est une image de mon point de vue. Veuillez expliquer brièvement ce que je verrais.',
    // Add more languages and their prompts as needed
};

// ========================
// Event Listeners Initialization
// ========================
window.addEventListener('load', async () => {
    await initializeCamera();
    loadSettingsFromLocalStorage();
    initCustomizationControls();
    initTabNavigation();
    initVideoCaptureActions();
    initReplayButton();
});

// ========================
// Camera Initialization Functions
// ========================

// Function to initialize camera
async function initializeCamera() {
    try {
        // Request access to any camera to get device labels
        const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = initialStream;
        await populateCameraList();
        initialStream.getTracks().forEach(track => track.stop()); // Stop the initial stream

        // After having device labels, select the back camera if available
        const savedCameraId = localStorage.getItem('selectedCameraId');
        if (savedCameraId) {
            cameraSelect.value = savedCameraId;
            await initCamera(savedCameraId);
        } else {
            // Attempt to select the back camera based on label or facing mode
            const backCameraOption = Array.from(cameraSelect.options).find(option => /back|rear|environment/i.test(option.text));
            if (backCameraOption) {
                cameraSelect.value = backCameraOption.value;
                await initCamera(backCameraOption.value);
            } else if (cameraSelect.options.length > 0) {
                // If no back camera, select the first available
                cameraSelect.selectedIndex = 0;
                await initCamera(cameraSelect.value);
            }
        }
    } catch (err) {
        console.error('Error initializing camera:', err);
        addToLog('Error accessing camera.', true);
    }
}

// Function to populate camera selection drop-down
async function populateCameraList() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        cameraSelect.innerHTML = ''; // Clear existing options

        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            // Determine if the camera is front or back based on label or facing mode
            let cameraLabel = device.label || `Camera ${index + 1}`;
            if (device.label) {
                if (/back|rear|environment/i.test(device.label)) {
                    cameraLabel = `Back Camera - ${device.label}`;
                } else if (/front|user/i.test(device.label)) {
                    cameraLabel = `Front Camera - ${device.label}`;
                }
            }
            option.text = cameraLabel;
            cameraSelect.appendChild(option);
        });

        if (videoDevices.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.text = 'No cameras found';
            cameraSelect.appendChild(option);
            cameraSelect.disabled = true;
            addToLog('No cameras found on this device.', true);
        }
    } catch (err) {
        console.error('Error enumerating devices:', err);
        addToLog('Error accessing media devices.', true);
    }
}

// Function to initialize camera with a specific device ID
async function initCamera(deviceId) {
    // If there's an existing stream, stop it before starting a new one
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined
        }
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        addToLog('Camera initialized. Ready to capture.');
        // Save selected camera to localStorage
        localStorage.setItem('selectedCameraId', deviceId);
    } catch (err) {
        console.error('Error accessing camera:', err);
        addToLog('Camera access denied or not available.', true);
    }
}

// Event listener for camera selection change
cameraSelect.addEventListener('change', async (event) => {
    const selectedDeviceId = cameraSelect.value;
    if (!selectedDeviceId) {
        addToLog('No camera selected.', true);
        return;
    }
    await initCamera(selectedDeviceId);
    addToLog('Camera switched successfully.');
});

// ========================
// Capture and Analyze Image Functions
// ========================

// Function to capture image from video
function captureImage() {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
}

// Function to convert Data URL to Blob
function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

// Function to send image to OpenAI API and get description with a specific prompt
async function getImageDescriptionWithPrompt(imageBlob, apiKey, promptText) {
    // Encode image to base64
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

// Helper function to convert Blob to Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result;
            // Extract base64 string without the prefix
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Function to capture and analyze image with optional audio prompt
async function captureAndAnalyzeImage(audioPrompt = '') {
    if (isPlaying || isRecording) {
        addToLog('Please wait until the current description is finished.', true);
        return;
    }

    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        addToLog('API Key missing. Please add your OpenAI API key.', true);
        speakText('Please add your API key.');
        return;
    }

    // Check if camera is initialized
    if (!video.srcObject) {
        addToLog('Camera not initialized.', true);
        speakText('Camera not initialized.');
        return;
    }

    try {
        isPlaying = true;
        disableCaptureButtons();

        // Step 1: Capture Image
        addToLog('Capturing image...');
        const imageDataUrl = captureImage();
        
        await speakText('Image taken.');

        // Provide Audio Feedback
        const imageBlob = dataURLtoBlob(imageDataUrl);

        // Step 2: Build Prompt
        let promptText = '';
        if (audioPrompt) {
            if (includeDefaultPrompt) {
                promptText = `${languagePrompts[selectedLanguage]} ${audioPrompt}`;
                addToLog('Image will be sent with default prompt and audio prompt.');
            } else {
                promptText = audioPrompt;
                addToLog('Image will be sent with audio prompt only.');
            }
        } else {
            promptText = customPrompt.value.trim() !== '' ? customPrompt.value.trim() : (languagePrompts[selectedLanguage] || languagePrompts['en-US']);
            addToLog('Image will be sent with default prompt.');
        }

        // Log the final prompt sent to OpenAI
        addToLog(`Final prompt sent to OpenAI: "${promptText}"`);

        // Step 3: Send Image to OpenAI
        addToLog('Sending image to OpenAI...');
        const description = await getImageDescriptionWithPrompt(imageBlob, apiKey, promptText);

        // Step 4: Provide Audio Feedback
        if (audioPrompt) {
            await speakText('Image sent with audio prompt.');
        } else {
            await speakText('Image sent.');
        }

        // Step 5: Processing Image
        addToLog('Processing image...');

        // Step 6: Save and Playback Response
        lastResponse = description;

        addToLog('Response received.');
        addToLog('Playback response started.');
        await speakText(description);
    } catch (error) {
        addToLog(`Error: ${error.message}`, true);
        console.error('Error:', error);
    } finally {
        isPlaying = false;
        enableCaptureButtons();
    }
}

// ========================
// Speech Synthesis Functions
// ========================

// Function to convert a given text to speech and return a promise that resolves when speech ends
function speakText(text) {
    return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            alert('Sorry, your browser does not support text-to-speech.');
            reject(new Error('Text-to-speech not supported.'));
            return;
        }
        if (isAutoPlay) {
            const utterance = new SpeechSynthesisUtterance(text);
            // Determine language for utterance
            // 'Image sent with audio prompt.' and 'Image sent.' should always be in English
            if (/image sent/i.test(text)) {
                utterance.lang = 'en-US';
            } else {
                utterance.lang = selectedLanguage;
            }
            utterance.onend = () => {
                addToLog('Audio playback completed.');
                resolve();
            };
            utterance.onerror = (event) => {
                addToLog('Error during audio playback.', true);
                reject(new Error('Error during audio playback.'));
            };
            speechSynthesis.speak(utterance);
        } else {
            addToLog('Audio auto-play is disabled. Enable it in settings to hear descriptions.');
            resolve(); // Resolve immediately if autoplay is disabled
        }
    });
}

// ========================
// Event Logging Functions
// ========================

// Function to add messages to action log (logs are in English only)
function addToLog(message, isError = false) {
    const listItem = document.createElement('li');
    listItem.textContent = message;
    if (isError) {
        listItem.style.color = '#ff0000'; // Red for errors
    }
    logList.appendChild(listItem);
    // Auto-scroll to the latest log entry
    logList.scrollTop = logList.scrollHeight;
}

// ========================
// Tab Navigation Functions
// ========================

// Function to initialize tab navigation
function initTabNavigation() {
    const tabCameraLog = document.getElementById('tab-camera-log');
    const tabSettings = document.getElementById('tab-settings');
    const sectionCameraLog = document.getElementById('camera-log');
    const sectionSettings = document.getElementById('settings');

    tabCameraLog.addEventListener('click', () => {
        activateTab('camera-log');
    });

    tabSettings.addEventListener('click', () => {
        activateTab('settings');
    });
}

// Function to activate a specific tab
function activateTab(tabId) {
    // Deactivate all tabs
    const tabs = document.querySelectorAll('#tab-navigation button');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });

    // Hide all tab panels
    const tabPanels = document.querySelectorAll('main section[role="tabpanel"]');
    tabPanels.forEach(panel => {
        panel.hidden = true;
        panel.setAttribute('aria-hidden', 'true');
    });

    // Activate the selected tab
    const activeTab = document.getElementById('tab-' + tabId);
    activeTab.classList.add('active');
    activeTab.setAttribute('aria-selected', 'true');

    // Show the corresponding tab panel
    const activePanel = document.getElementById(tabId);
    activePanel.hidden = false;
    activePanel.setAttribute('aria-hidden', 'false');

    // Check and apply Dev Mode state when switching tabs
    checkDevModeOnTabSwitch();
}

// ========================
// Customization Controls
// ========================

// Function to initialize customization controls
function initCustomizationControls() {
    // Text Size Controls
    increaseTextButton.addEventListener('click', () => {
        currentFontSize += 2;
        document.body.style.fontSize = `${currentFontSize}px`;
        addToLog(`Text size increased to ${currentFontSize}px.`);
        localStorage.setItem('fontSize', currentFontSize);
    });

    decreaseTextButton.addEventListener('click', () => {
        if (currentFontSize > 12) {
            currentFontSize -= 2;
            document.body.style.fontSize = `${currentFontSize}px`;
            addToLog(`Text size decreased to ${currentFontSize}px.`);
            localStorage.setItem('fontSize', currentFontSize);
        }
    });

    // High Contrast Toggle
    toggleContrastButton.addEventListener('click', () => {
        isHighContrast = !isHighContrast;
        document.body.classList.toggle('high-contrast');
        const contrastState = isHighContrast ? 'enabled' : 'disabled';
        addToLog(`High contrast mode ${contrastState}.`);
        localStorage.setItem('isHighContrast', isHighContrast);
    });

    // Auto-Play Toggle
    toggleAutoplayButton.addEventListener('click', () => {
        isAutoPlay = !isAutoPlay;
        toggleAutoplayButton.textContent = `🔊 Auto-Play: ${isAutoPlay ? 'On' : 'Off'}`;
        localStorage.setItem('isAutoPlay', isAutoPlay);
        addToLog(`Auto-play audio is now ${isAutoPlay ? 'enabled' : 'disabled'}.`);
    });

    // Language Selector
    languageSelector.addEventListener('change', (event) => {
        selectedLanguage = event.target.value;
        addToLog(`Language changed to ${event.target.selectedOptions[0].text}.`);
        // Always update the custom prompt to the default prompt of the selected language
        customPrompt.value = languagePrompts[selectedLanguage] || languagePrompts['en-US'];
        saveCustomPrompt();
        localStorage.setItem('selectedLanguage', selectedLanguage);
    });

    // Include Default Prompt Checkbox
    includeDefaultPromptCheckbox.addEventListener('change', (event) => {
        includeDefaultPrompt = event.target.checked;
        const status = includeDefaultPrompt ? 'enabled' : 'disabled';
        addToLog(`Including default prompt is now ${status}.`);
        localStorage.setItem('includeDefaultPrompt', includeDefaultPrompt);
    });
}

// Function to load customization settings from localStorage
function loadCustomizationSettings() {
    // Font Size
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        currentFontSize = parseInt(savedFontSize);
        document.body.style.fontSize = `${currentFontSize}px`;
    }

    // High Contrast
    const savedHighContrast = localStorage.getItem('isHighContrast') === 'true';
    if (savedHighContrast) {
        document.body.classList.add('high-contrast');
        isHighContrast = true;
    } else {
        document.body.classList.remove('high-contrast');
        isHighContrast = false;
    }

    // Auto-Play
    const savedAutoPlay = localStorage.getItem('isAutoPlay');
    if (savedAutoPlay === 'false') {
        isAutoPlay = false;
        toggleAutoplayButton.textContent = `🔊 Auto-Play: Off`;
    } else {
        isAutoPlay = true;
        toggleAutoplayButton.textContent = `🔊 Auto-Play: On`;
    }

    // Language
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && languagePrompts[savedLanguage]) {
        selectedLanguage = savedLanguage;
        languageSelector.value = selectedLanguage;
        customPrompt.value = languagePrompts[selectedLanguage];
    }

    // Include Default Prompt
    const savedIncludeDefaultPrompt = localStorage.getItem('includeDefaultPrompt');
    if (savedIncludeDefaultPrompt === 'false') {
        includeDefaultPrompt = false;
        includeDefaultPromptCheckbox.checked = false;
    } else {
        includeDefaultPrompt = true;
        includeDefaultPromptCheckbox.checked = true;
    }
}

// ========================
// Replay Last Response Functionality
// ========================

// Function to initialize replay button
function initReplayButton() {
    replayButton.addEventListener('click', () => {
        if (lastResponse) {
            addToLog('Playback response started.');
            speakText(lastResponse).catch(error => {
                console.error('Error during replay:', error);
                addToLog('Error during replay.', true);
            });
        } else {
            addToLog('No response to replay.', true);
        }
    });
}

// ========================
// Video Capture Actions
// ========================

// Function to initialize video capture actions (click and hold)
function initVideoCaptureActions() {
    if (videoCaptureActionsInitialized) return; // Prevent multiple initializations
    videoCaptureActionsInitialized = true;

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
    // Start hold timer
    holdTimer = setTimeout(() => {
        isHoldAction = true; // Set hold action flag
        startRecordingAudioPrompt();
    }, holdThreshold);
}

function handleMouseUp(event) {
    if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
        if (!isHoldAction) {
            // Short click action
            captureAndAnalyzeImage();
        }
    } else if (isRecording) {
        stopRecordingAudioPrompt();
    }
    isHoldAction = false; // Reset hold action flag
}

function handleMouseLeave(event) {
    if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
        if (!isHoldAction) {
            // Short click action
            captureAndAnalyzeImage();
        }
    }
    if (isRecording) {
        stopRecordingAudioPrompt();
    }
    isHoldAction = false; // Reset hold action flag
}

// Touch Events
function handleTouchStart(event) {
    event.preventDefault(); // Prevent default behavior
    holdTimer = setTimeout(() => {
        isHoldAction = true; // Set hold action flag
        startRecordingAudioPrompt();
    }, holdThreshold);
}

function handleTouchEnd(event) {
    event.preventDefault(); // Prevent default behavior
    if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
        if (!isHoldAction) {
            // Short tap action
            captureAndAnalyzeImage();
        }
    } else if (isRecording) {
        stopRecordingAudioPrompt();
    }
    isHoldAction = false; // Reset hold action flag
}

// ========================
// Recording Audio Prompt
// ========================

// Function to start recording audio prompt using Web Speech API
function startRecordingAudioPrompt() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        addToLog('Speech Recognition not supported in your browser.', true);
        speakText('Speech recognition is not supported in your browser.');
        return;
    }

    // Prevent multiple recognitions
    if (recognition) {
        recognition.stop();
        recognition = null;
    }

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = selectedLanguage;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isRecording = true;
        addToLog('Recording started.');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        isRecording = false;
        addToLog('Recording stopped.');
        addToLog(`Audio prompt: "${transcript}"`);
        // Send image with audio prompt
        captureAndAnalyzeImage(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isRecording = false;
        addToLog('Error during speech recognition.', true);
    };

    recognition.onend = () => {
        if (isRecording) {
            isRecording = false;
            addToLog('Recording stopped.');
        }
        recognition = null;
    };

    recognition.start();
}

// Function to stop recording audio prompt
function stopRecordingAudioPrompt() {
    if (recognition && isRecording) {
        recognition.stop();
    }
}

// ========================
// Settings Load and Save Functions
// ========================

// Function to load all settings from localStorage
function loadSettingsFromLocalStorage() {
    loadSavedApiKey();
    loadSavedPrompt();
    loadIncludeDefaultPromptSetting();
    loadCustomizationSettings();
    loadDevModeSetting();
}

// Function to load saved API key from localStorage
function loadSavedApiKey() {
    const savedApiKey = localStorage.getItem('openaiApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        saveApiKeyCheckbox.checked = true;
    }
}

// Function to save API key to localStorage
function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (saveApiKeyCheckbox.checked && apiKey !== '') {
        localStorage.setItem('openaiApiKey', apiKey);
        addToLog('API key saved for future sessions.');
    } else {
        localStorage.removeItem('openaiApiKey');
        addToLog('API key not saved.');
    }
}

// Save API key when input changes
apiKeyInput.addEventListener('change', saveApiKey);

// Save API key checkbox state
saveApiKeyCheckbox.addEventListener('change', saveApiKey);

// Function to load saved prompt from localStorage
function loadSavedPrompt() {
    const savedPrompt = localStorage.getItem('customPrompt');
    if (savedPrompt) {
        customPrompt.value = savedPrompt;
    } else {
        // Set default prompt based on selected language
        customPrompt.value = languagePrompts[selectedLanguage] || languagePrompts['en-US'];
    }
}

// Function to save custom prompt to localStorage
function saveCustomPrompt() {
    const prompt = customPrompt.value.trim();
    localStorage.setItem('customPrompt', prompt);
    addToLog('Custom prompt saved.');
}

// Save custom prompt on input
customPrompt.addEventListener('input', saveCustomPrompt);

// Function to load include default prompt setting from localStorage
function loadIncludeDefaultPromptSetting() {
    const savedSetting = localStorage.getItem('includeDefaultPrompt');
    if (savedSetting === 'false') {
        includeDefaultPrompt = false;
        includeDefaultPromptCheckbox.checked = false;
    } else {
        includeDefaultPrompt = true;
        includeDefaultPromptCheckbox.checked = true;
    }
}

// ========================
// Dev Mode Toggle Functionality
// ========================

// Load the saved Dev Mode setting from localStorage
function loadDevModeSetting() {
    const isDevModeEnabled = localStorage.getItem('isDevModeEnabled') === 'true';
    devModeCheckbox.checked = isDevModeEnabled;
    setDevMode(isDevModeEnabled);
}

// Set the Dev Mode state
function setDevMode(enabled) {
    if (enabled) {
        addToLog('Developer Mode enabled.');
        showDevElements(); // Show elements when Dev Mode is enabled
        enableFullscreenCamera(); // Expand camera to full screen
    } else {
        addToLog('Developer Mode disabled.');
        hideDevElements(); // Hide elements when Dev Mode is disabled
        disableFullscreenCamera(); // Revert camera size
    }
}

// Show elements that should be visible in Dev Mode
function showDevElements() {
    actionLogSection.classList.remove('hidden');
    replayButton.classList.remove('hidden');
    captureButton.classList.remove('hidden');
    headlineSection.classList.remove('hidden');
    footer.classList.remove('hidden');
}

// Hide elements that should be hidden in non-Dev Mode
function hideDevElements() {
    actionLogSection.classList.add('hidden');
    replayButton.classList.add('hidden');
    captureButton.classList.add('hidden');
    headlineSection.classList.add('hidden');
    footer.classList.add('hidden');
}

// Enable full-screen camera view
function enableFullscreenCamera() {
    cameraContainer.classList.add('fullscreen-camera');
    //document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Disable full-screen camera view
function disableFullscreenCamera() {
    cameraContainer.classList.remove('fullscreen-camera');
    //document.body.style.overflow = ''; // Restore scrolling
}

// Save the Dev Mode state to localStorage and set the state
devModeCheckbox.addEventListener('change', () => {
    const isDevModeEnabled = devModeCheckbox.checked;
    localStorage.setItem('isDevModeEnabled', isDevModeEnabled);
    setDevMode(isDevModeEnabled);
});

// Ensure the correct state is applied when the user switches tabs
function checkDevModeOnTabSwitch() {
    const isDevModeEnabled = localStorage.getItem('isDevModeEnabled') === 'true';
    setDevMode(isDevModeEnabled);
}

// ========================
// Button Disable/Enable Functions
// ========================

// Function to disable capture buttons
function disableCaptureButtons() {
    captureButton.disabled = true;
    replayButton.disabled = true;
    videoCaptureButton.disabled = true;
    cameraSelect.disabled = true;
}

// Function to enable capture buttons
function enableCaptureButtons() {
    captureButton.disabled = false;
    replayButton.disabled = false;
    videoCaptureButton.disabled = false;
    cameraSelect.disabled = false;
}

// ========================
// Accessibility Enhancements for Touch Devices
// ========================

// Ensure buttons, selects, and textareas are large enough for touch
document.querySelectorAll('button, select, textarea').forEach(element => {
    element.style.touchAction = 'manipulation';
    element.style.userSelect = 'none';
});

// Prevent accidental double taps on touch devices
let lastTap = 0;
document.addEventListener('touchend', function (event) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 500 && tapLength > 0) {
        event.preventDefault();
    }
    lastTap = currentTime;
}, false);

// ========================
// Miscellaneous Functions
// ========================

// Function to play audio cues (e.g., start, end)
// Removed audio cues during recording as per requirement
function playAudioCue(type) {
    // No audio cues are played during recording
    // This function can be used for other audio cues if needed
}

// ========================
// Event Handling for Capture Button
// ========================

// Event listener for capture button (single click)
captureButton.addEventListener('click', () => {
    captureAndAnalyzeImage();
});

// ========================
// Final Checks and Error Handling
// ========================

// Additional error handling can be added here as needed
