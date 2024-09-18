// scripts/main.js

import CameraManager from './camera.js';
import Logger from './logger.js';
import SpeechManager from './speech.js';
import UIManager from './ui.js';
import ApiManager from './apiManager.js';

// ========================
// DOM Elements Selection
// ========================
const videoElement = document.getElementById('video');
const logListElement = document.getElementById('log-list');

// Initialize Logger
const logger = new Logger(logListElement);

// Initialize Managers
const speechManager = new SpeechManager(logger);
const cameraManager = new CameraManager(videoElement, logger);
const apiManager = new ApiManager(logger);
const uiManager = new UIManager(logger, speechManager, cameraManager, apiManager);

// Initialize Application
window.addEventListener('load', async () => {
  await cameraManager.initializeCamera();
  uiManager.initializeUI();
  uiManager.initTabNavigation();
});
