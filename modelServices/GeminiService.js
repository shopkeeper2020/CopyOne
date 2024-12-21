import { BaseModelService } from './BaseModelService.js'; // 假设你有一个基类文件

class GeminiService extends BaseModelService {
  constructor(apiKey, model, settings = {}) {
    super(apiKey, model, settings);
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async processImage(image, action) {
    try {
      const prompt = this.getPrompt(action);
      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            { 
              inlineData: {
                data: image.split(',')[1],
                mimeType: 'image/jpeg'
              }
            }
          ]
        }]
      };

      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      throw new Error(`Gemini处理图片失败: ${error.message}`);
    }
  }

  async processText(text, action) {
    try {
      const prompt = this.getPrompt(action);
      const requestBody = {
        contents: [{
          parts: [{ text: `${prompt}\n${text}` }]
        }]
      };

      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      throw new Error(`Gemini处理文本失败: ${error.message}`);
    }
  }
}

export default GeminiService; 