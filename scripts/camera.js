// scripts/camera.js

import settingsManager from './settingsManager.js';
import Logger from './logger.js';
import { getMessage } from './utils.js';

export default class CameraManager {
  constructor(videoElement, logger) {
    this.videoElement = videoElement;
    this.logger = logger;
    this.currentStream = null;
    this.cameraSelect = document.getElementById('camera-select');
  }

  async initializeCamera() {
    try {
      const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.srcObject = initialStream;
      await this.populateCameraList();
      initialStream.getTracks().forEach((track) => track.stop());

      const savedCameraId = settingsManager.get('camera.selectedCameraId');
      if (savedCameraId) {
        this.cameraSelect.value = savedCameraId;
        await this.initCamera(savedCameraId);
      } else {
        const backCameraOption = Array.from(this.cameraSelect.options).find((option) =>
          /back|rear|environment/i.test(option.text)
        );
        if (backCameraOption) {
          this.cameraSelect.value = backCameraOption.value;
          await this.initCamera(backCameraOption.value);
        } else if (this.cameraSelect.options.length > 0) {
          this.cameraSelect.selectedIndex = 0;
          await this.initCamera(this.cameraSelect.value);
        }
      }
    } catch (err) {
      console.error('Error initializing camera:', err);
      this.logger.add(getMessage('errors', 'cameraAccessDenied'), true);
    }
  }

  async populateCameraList() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');

      this.cameraSelect.innerHTML = '';

      videoDevices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
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
        option.text = getMessage('errors', 'cameraNotFound');
        this.cameraSelect.appendChild(option);
        this.cameraSelect.disabled = true;
        this.logger.add(getMessage('errors', 'cameraNotFound'), true);
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
      this.logger.add(getMessage('errors', 'cameraAccessDenied'), true);
    }
  }

  async initCamera(deviceId) {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
    }

    const constraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = stream;
      this.currentStream = stream;
      this.logger.add(getMessage('status', 'cameraInitialized'));
      settingsManager.set('camera.selectedCameraId', deviceId);
    } catch (err) {
      console.error('Error accessing camera:', err);
      this.logger.add(getMessage('errors', 'cameraAccessDenied'), true);
    }
  }

  captureImage(canvasElement) {
    const context = canvasElement.getContext('2d');
    canvasElement.width = this.videoElement.videoWidth;
    canvasElement.height = this.videoElement.videoHeight;
    context.drawImage(this.videoElement, 0, 0, canvasElement.width, canvasElement.height);
    return canvasElement.toDataURL('image/jpeg');
  }
}
