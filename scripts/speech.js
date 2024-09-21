// scripts/speech.js

import settingsManager from './settingsManager.js';
import { messages } from './constants.js';

export default class SpeechManager {
  constructor(logger) {
    this.logger = logger;
    this.updateSettings();
    this.recognition = null;
    this.isRecording = false;
    this.isPlaying = false; // Initialize isPlaying flag
    this.holdTimer = null;
    this.holdThreshold = 1200; // 1.2 seconds
    this.isHoldAction = false;
  }

  updateSettings() {
    this.isAutoPlay = settingsManager.get('customization.isAutoPlay');
    this.selectedLanguage = settingsManager.get('customization.selectedLanguage');
    console.log('Speech language:', this.selectedLanguage);
    this.isAudioPromptEnabled = settingsManager.get('customization.isAudioPromptEnabled');
  }

  updateLanguage() {
    this.selectedLanguage = settingsManager.get('customization.selectedLanguage');
    console.log('Speech language:', this.selectedLanguage);
  }

  speak(text) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        alert(messages.errors.speechNotSupported);
        reject(new Error(messages.errors.speechNotSupported));
        return;
      }
      if (this.isAutoPlay) {
        this.isPlaying = true; // Set isPlaying to true when speech starts
        const utterance = new SpeechSynthesisUtterance(text);
        this.updateLanguage();
        utterance.lang = this.selectedLanguage;
        console.log('Speech language:', this.selectedLanguage);

        utterance.onend = () => {
          this.isPlaying = false; // Reset isPlaying when speech ends
          this.logger.add(messages.status.audioPlaybackCompleted);
          resolve();
        };
        utterance.onerror = () => {
          this.isPlaying = false; // Reset isPlaying on error
          this.logger.add(messages.errors.audioPlaybackError, true);
          reject(new Error(messages.errors.audioPlaybackError));
        };
        window.speechSynthesis.speak(utterance);
      } else {
        this.logger.add(messages.status.autoPlayDisabled);
        resolve();
      }
    });
  }

  startRecording(callback) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.logger.add(messages.errors.speechNotSupported, true);
      this.speak(messages.errors.speechNotSupported);
      return;
    }

    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }

    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.updateLanguage();
    this.recognition.lang = this.selectedLanguage;
    console.log('Record language:', this.selectedLanguage);
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isRecording = true;
      this.logger.add(messages.status.recordingStarted);
      //console.log('Recording started - speech');
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.isRecording = false;
      this.logger.add(messages.status.recordingStopped);
      this.logger.add(`Audio prompt: "${transcript}"`);
      //console.log('Recording stopped - speech');
      if (callback) callback(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isRecording = false;
      this.logger.add(messages.errors.speechRecognitionError, true);
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        this.isRecording = false;
        this.logger.add(messages.status.recordingStopped);
      }
      this.recognition = null;
    };

    this.recognition.start();
  }

  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
  }
  
}

