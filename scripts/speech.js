// scripts/speech.js

import settingsManager from './settingsManager.js';
import Logger from './logger.js';

export default class SpeechManager {
    constructor(logger) {
        this.logger = logger;
        this.isAutoPlay = settingsManager.get('customization.isAutoPlay');
        this.selectedLanguage = settingsManager.get('customization.selectedLanguage');
        this.isAudioPromptEnabled = settingsManager.get('customization.isAudioPromptEnabled');
        this.recognition = null;
        this.isRecording = false;
        this.holdTimer = null;
        this.holdThreshold = 2000; // 2 seconds
        this.isHoldAction = false;
    }

    updateSettings() {
        this.isAutoPlay = settingsManager.get('customization.isAutoPlay');
        this.selectedLanguage = settingsManager.get('customization.selectedLanguage');
        this.isAudioPromptEnabled = settingsManager.get('customization.isAudioPromptEnabled');
    }

    speak(text) {
        return new Promise((resolve, reject) => {
            if (!('speechSynthesis' in window)) {
                alert('Sorry, your browser does not support text-to-speech.');
                reject(new Error('Text-to-speech not supported.'));
                return;
            }
            if (this.isAutoPlay) {
                const utterance = new SpeechSynthesisUtterance(text);
                // Determine language for utterance
                if (/image sent/i.test(text)) {
                    utterance.lang = 'en-US';
                } else {
                    utterance.lang = this.selectedLanguage;
                }
                utterance.onend = () => {
                    this.logger.add('Audio playback completed.');
                    resolve();
                };
                utterance.onerror = () => {
                    this.logger.add('Error during audio playback.', true);
                    reject(new Error('Error during audio playback.'));
                };
                window.speechSynthesis.speak(utterance);
            } else {
                this.logger.add('Audio auto-play is disabled. Enable it in settings to hear descriptions.');
                resolve();
            }
        });
    }

    startRecording(callback) {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.logger.add('Speech Recognition not supported in your browser.', true);
            this.speak('Speech recognition is not supported in your browser.');
            return;
        }

        // Prevent multiple recognitions
        if (this.recognition) {
            this.recognition.stop();
            this.recognition = null;
        }

        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.lang = this.selectedLanguage;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isRecording = true;
            this.logger.add('Recording started.');
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.isRecording = false;
            this.logger.add('Recording stopped.');
            this.logger.add(`Audio prompt: "${transcript}"`);
            if (callback) callback(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isRecording = false;
            this.logger.add('Error during speech recognition.', true);
        };

        this.recognition.onend = () => {
            if (this.isRecording) {
                this.isRecording = false;
                this.logger.add('Recording stopped.');
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
