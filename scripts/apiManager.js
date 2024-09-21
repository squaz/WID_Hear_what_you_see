// scripts/apiManager.js

import settingsManager from './settingsManager.js';
import { dataURLtoBlob, blobToBase64, getMessage } from './utils.js';

export default class ApiManager {
  constructor(logger) {
    this.logger = logger;
    this.apiKey = settingsManager.get('api.apiKey');
  }

  updateApiKey() {
    this.apiKey = settingsManager.get('api.apiKey');
  }

  async getImageDescription(imageBlob, promptText) {
    if (!this.apiKey) {
      throw new Error(getMessage('errors', 'apiKeyMissing'));
    }

    const base64Image = await blobToBase64(imageBlob);

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 300,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = getMessage('errors', 'processingError');
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
      throw new Error(getMessage('errors', 'noDescription'));
    }
  }
}
