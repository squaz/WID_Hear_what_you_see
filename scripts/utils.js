// scripts/utils.js

import { messages } from './constants.js';
import settingsManager from './settingsManager.js';

export function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error(messages.errors.invalidDataUrl);
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function getPlatform() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  // Android detection
  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  return 'Other';
}

export function getMessage(type, key) {
  const selectedLanguage = settingsManager.get('customization.selectedLanguage');
  if (messages[selectedLanguage] && messages[selectedLanguage][type] && messages[selectedLanguage][type][key]) {
    return messages[selectedLanguage][type][key];
  }
  // Fallback to English if message not found
  return messages['en-US'][type][key] || '';
}