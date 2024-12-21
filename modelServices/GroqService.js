import { BaseModelService } from './BaseModelService.js'; // 假设你有一个基类文件

class GroqService extends BaseModelService {
  constructor(apiKey, model, settings = {}) {
    super(apiKey, model, settings);
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  }

  async processImage(image, action) {
    try {
      const prompt = this.getPrompt(action);
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: "system",
            content: `${prompt}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "" },
              {
                type: "image",
                source: {
                  type: "base64",
                  data: image.split(',')[1]
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 7000
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: this.settings.abortSignal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      throw new Error(`Groq处理图片失败: ${error.message}`);
    }
  }

  async processText(text, action) {
    try {
      const prompt = this.getPrompt(action);
      const requestBody = {
        messages: [
          {
            role: "system",
            content: `${prompt}`
          },
          {
            role: "user",
            content: `${text}`
          }
        ],
        model: this.model,
        temperature: 1,
        max_tokens: 8000,
        top_p: 1,
        stream: false,
        stop: null
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      throw new Error(`Groq处理文本失败: ${error.message}`);
    }
  }
}

export default GroqService; 