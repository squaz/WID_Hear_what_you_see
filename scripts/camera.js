// scripts/camera.js

import settingsManager from './settingsManager.js';
import Logger from './logger.js';

export default class CameraManager {
    constructor(videoElement, cameraSelectElement, logger) {
        this.video = videoElement;
        this.cameraSelect = cameraSelectElement;
        this.logger = logger;
        this.currentStream = null;
    }

    async initializeCamera() {
        try {
            const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.video.srcObject = initialStream;
            await this.populateCameraList();
            initialStream.getTracks().forEach(track => track.stop()); // Stop the initial stream

            // Select saved camera or default
            const savedCameraId = settingsManager.get('camera.selectedCameraId');
            if (savedCameraId) {
                this.cameraSelect.value = savedCameraId;
                await this.initCamera(savedCameraId);
            } else {
                // Attempt to select the back camera based on label or facing mode
                const backCameraOption = Array.from(this.cameraSelect.options).find(option => /back|rear|environment/i.test(option.text));
                if (backCameraOption) {
                    this.cameraSelect.value = backCameraOption.value;
                    await this.initCamera(backCameraOption.value);
                } else if (this.cameraSelect.options.length > 0) {
                    // If no back camera, select the first available
                    this.cameraSelect.selectedIndex = 0;
                    await this.initCamera(this.cameraSelect.value);
                }
            }
        } catch (err) {
            console.error('Error initializing camera:', err);
            this.logger.add('Error accessing camera.', true);
        }
    }

    async populateCameraList() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            this.cameraSelect.innerHTML = ''; // Clear existing options

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
                this.cameraSelect.appendChild(option);
            });

            if (videoDevices.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.text = 'No cameras found';
                this.cameraSelect.appendChild(option);
                this.cameraSelect.disabled = true;
                this.logger.add('No cameras found on this device.', true);
            }
        } catch (err) {
            console.error('Error enumerating devices:', err);
            this.logger.add('Error accessing media devices.', true);
        }
    }

    async initCamera(deviceId) {
        // Stop existing stream
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                deviceId: deviceId ? { exact: deviceId } : undefined
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = stream;
            this.currentStream = stream;
            this.logger.add('Camera initialized. Ready to capture.');
            // Save selected camera to settings
            settingsManager.set('camera.selectedCameraId', deviceId);
        } catch (err) {
            console.error('Error accessing camera:', err);
            this.logger.add('Camera access denied or not available.', true);
        }
    }

    addEventListeners() {
        this.cameraSelect.addEventListener('change', async (event) => {
            const selectedDeviceId = this.cameraSelect.value;
            if (!selectedDeviceId) {
                this.logger.add('No camera selected.', true);
                return;
            }
            await this.initCamera(selectedDeviceId);
            this.logger.add('Camera switched successfully.');
        });
    }
}
