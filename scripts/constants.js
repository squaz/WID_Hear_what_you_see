// scripts/constants.js

export const messages = {
    errors: {
      apiKeyMissing: 'API Key missing. Please add your OpenAI API key.',
      cameraNotInitialized: 'Camera not initialized.',
      processingError: 'Error processing image.',
      noDescription: 'No description received from OpenAI.',
      cameraAccessDenied: 'Camera access denied or not available.',
      cameraNotFound: 'No cameras found on this device.',
      speechNotSupported: 'Speech recognition is not supported in your browser.',
      audioPlaybackError: 'Error during audio playback.',
      speechRecognitionError: 'Error during speech recognition.',
      recordingInProgress: 'Please wait until the current description is finished.',
      noResponseToReplay: 'No response to replay.',
    },
    status: {
      capturingImage: 'Capturing image...',
      imageCaptured: 'Image captured successfully.',
      imageSent: 'Image sent to OpenAI.',
      processingImage: 'Processing image...',
      responseReceived: 'Response received.',
      playbackStarted: 'Playback response started.',
      settingsSaved: 'Settings have been saved successfully.',
      cameraInitialized: 'Camera initialized. Ready to capture.',
      cameraSwitched: 'Camera switched successfully.',
      devModeEnabled: 'Developer Mode enabled.',
      devModeDisabled: 'Developer Mode disabled.',
    },
  };
  