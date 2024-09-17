# Hear what you See

**Hear what you See** is an accessible web application designed to empower visually impaired users by enabling them to capture images and receive descriptive analyses using advanced AI technology. By leveraging image capture and optional audio prompts, users can gain a deeper understanding of their surroundings through synthesized audio descriptions.

## Table of Contents
- [Features](#features)
- [Workflows](#workflows)
  - [1. Sending Image with Default Prompt](#1-sending-image-with-default-prompt)
  - [2. Sending Image with Audio Message](#2-sending-image-with-audio-message)
- [Technical Details](#technical-details)
  - [Client-Side Operations](#client-side-operations)
  - [AI Integration](#ai-integration)
  - [Speech Capabilities](#speech-capabilities)
- [Usage Notes](#usage-notes)
- [Disclaimer](#disclaimer)
- [Additional Recommendations](#additional-recommendations)
  - [Security Enhancements](#security-enhancements)
  - [User Feedback Mechanisms](#user-feedback-mechanisms)
  - [Accessibility Testing](#accessibility-testing)
  - [Performance Optimization](#performance-optimization)
  - [Localization](#localization)

## Features
- **Image Capture**: Utilize your device's camera to capture images effortlessly.
- **Audio Prompts**: Optionally add an audio message to provide context or specific instructions.
- **AI Analysis**: Send captured images to the GPT4o Mini model for descriptive analysis.
- **Customization**: Adjust text size, toggle high-contrast mode, and manage audio playback settings.
- **Developer Mode**: Access advanced features for enhanced functionality and debugging.
- **Persistent Settings**: All user preferences are saved for a seamless experience across sessions.

## Workflows

### 1. Sending Image with Default Prompt
1. **Capture Image**: Tap the Capture Image button to take a photo using your device's camera.
2. **Automatic Description**: The application automatically sends the captured image to the GPT4o Mini AI model with a default prompt tailored to provide a concise description of the image.
3. **Receive Description**: The AI processes the image and returns a descriptive text, which is read aloud using your device's text-to-speech capabilities.

### 2. Sending Image with Audio Message
1. **Initiate Audio Prompt**: Press and hold the camera view for at least 2 seconds to activate the audio recording mode.
2. **Record Audio**: Speak your custom instructions or context regarding the image you are about to capture.
3. **Capture Image**: While still holding, release the button to capture the image.
4. **Combined Analysis**: The application sends both the captured image and your recorded audio message to the GPT4o Mini AI model. The AI integrates your audio prompt with the default prompt to provide a tailored description.
5. **Receive Description**: The AI returns a descriptive text based on both the image and your audio input, which is read aloud using your device's text-to-speech capabilities.

## Technical Details

### Client-Side Operations
- **Privacy & Security**: All operations, including image capture, audio recording, and AI interactions, are performed entirely on the client side. No personal data, images, or audio recordings are sent to or stored on external servers, except for the direct interaction with the OpenAI API for analysis.
- **Local Storage**: User settings such as API keys, selected camera, language preferences, and customization choices are securely stored in the browser's localStorage. These settings persist across sessions, ensuring a consistent user experience.

### AI Integration
- **GPT4o Mini**: The application utilizes the GPT4o Mini model from OpenAI for image analysis.
- **Why GPT4o Mini?**
  - **Efficiency**: Offers a balance between performance and computational efficiency, making it suitable for client-side applications.
  - **Cost-Effective**: Reduces the cost associated with API usage while still providing meaningful insights.
  - **Quick Response**: Faster processing times enhance the user experience by delivering prompt descriptions.

### Speech Capabilities
- **Text-to-Speech (TTS)**: Descriptions and status updates are read aloud using the browser's native TTS engine, ensuring compatibility across various devices and languages without relying on external services.
- **Speech-to-Text (STT)**: Audio prompts are captured and transcribed using the browser's built-in STT capabilities, allowing users to provide context or specific instructions seamlessly.

## Usage Notes
- **Camera Permissions**: Upon first use, the application will request access to your device's camera. Please grant the necessary permissions to enable image capture functionality.
- **API Key Configuration**: Users must provide a valid OpenAI API key to utilize the image analysis features. For security, the API key is stored locally only if the user opts to save it for future sessions.
- **Customization**: Adjust text sizes and toggle high-contrast mode to suit your visual preferences. Enable or disable audio playback based on your comfort and environment.

## Disclaimer
**Hear what you See** is a research project developed to explore the integration of accessibility features with advanced AI technologies. It is not intended for commercial use. While every effort has been made to ensure functionality and accessibility, users should exercise caution and discretion when using the application. The developers do not assume any liability for misuse or technical issues that may arise during its operation.

## Additional Recommendations

### Security Enhancements
- **API Key Protection**: While storing the API key in localStorage offers convenience, it poses potential security risks. Consider implementing server-side handling for API interactions in future iterations to enhance security.

### User Feedback Mechanisms
- **Loading Indicators**: Implement visual indicators during API calls to inform users that processing is underway.
- **Error Notifications**: Enhance error messages with actionable steps to guide users in resolving issues.

### Accessibility Testing
- **Screen Reader Compatibility**: Regularly test the application with popular screen readers (e.g., NVDA, JAWS, VoiceOver) to ensure seamless navigation and interaction.
- **Keyboard Navigation**: Ensure that all interactive elements are reachable and operable via keyboard alone.

### Performance Optimization
- **Lazy Loading**: Defer loading of non-critical resources to improve initial load times.
- **Resource Management**: Optimize image handling and API interactions to reduce latency and enhance user experience.

### Localization
- **Comprehensive Language Support**: Expand the language prompts mapping to include more languages, catering to a broader user base.
- **Dynamic Content Translation**: Ensure that all user-facing text adapts to the selected language for a fully localized experience.

---

Feel free to integrate these changes into your project. If you encounter any issues or need further assistance, don't hesitate to open a issue!
