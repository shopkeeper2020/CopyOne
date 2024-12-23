// 添加默认提示词常量
const DEFAULT_PROMPTS = {
  extract: `## 任务：
你是一个文本提取助手，擅长把图片中的文本都提取出来。

## 要求：
- 仅输出提取之后的结果，不要输出多余内容，也不要进行解释。
- 保留原格式。`,

  img_translateCh: `## 任务：
你是一个翻译大师，擅长把图片中的文本翻译为中文。

## 要求：
- 仅输出翻译之后的结果，不要输出多余内容，也不要进行解释。
- 翻译的结果为简体中文。
- 保留原格式。`,

  img_translateEn: `##Task:
You are a translation master who excels at translating text from images into English.

##Requirement:
-Only output the translated result, do not output unnecessary content.
-The translation result is in English.
- Preserve the source format.`,

  text_translateCh: `## 任务：
你是一个翻译大师，擅长把文本翻译为中文。

## 要求：
- 仅输出翻译之后的结果，不要输出多余内容，也不要进行解释。
- 翻译的结果为简体中文。
- 保留源格式。`,

  text_translateEn: `## Task:
You are a translation master, skilled at translating texts into English.

## Requirement:
- Only output the translated result, do not output unnecessary content.
- The translation result is in English.
- Preserve the source format.`,

  img_custom: '',
  text_custom: '',
  img_translateOriginalCh: `## 任务：
你是一个翻译大师，擅长把图片中的文本翻译为中文。

## 要求：
- 输出翻译的原文和翻译之后的结果，为json格式，不使用markdown格式，尤其是代码的markdown注释。
- 仅翻译非中文的文本，忽略中文文本。
- 不要输出多余内容，也不要进行解释。
- 翻译的结果为简体中文。

## 示例输入：
假设图片中的文本为：Hello World这电影真好看。

## 示例输出：
[
  {
    "box_2d": [148, 0, 210, 113 ],
    "label": "你好世界这电影真好看。"
  }
]`,

  img_translateOriginalEn: `##Task:
Detect texts, with no more than 20 items. Output a json list where each entry contains the the 2D bounding box in "box_2d" and the content of the text. and translate it to English in "label".

##Requirement:
-Only output the translated result, do not output unnecessary content.
-The translation result is in English.
- Follow the example, use json format for output.
- Do not use markdown syntax.

## example input:
The text in the image says: "Hello World这电影真好看。", and the area of this text is [148, 0, 210, 113]

## example output:[
  {
    "box_2d": [148, 0, 210, 113 ],
    "label": "Hello World, this movie is really good."
  }
]`
};

// 添加模型列表常量
const MODEL_OPTIONS = {
  qwen: {
    image: [
      'qwen-vl-max-latest',
      'qwen-vl-max',
      'qwen-vl-plus-latest',
      'qwen-vl-plus'
    ],
    text: [
      'qwen-max-latest',
      'qwen-max',
      'qwen-plus-latest',
      'qwen-plus',
      'qwen-turbo-latest',
      'qwen-turbo',
      'qwen-long',
      { value: 'qwen-vl-max-latest', isMultimodal: true },
      { value: 'qwen-vl-max', isMultimodal: true },
      { value: 'qwen-vl-plus-latest', isMultimodal: true },
      { value: 'qwen-vl-plus', isMultimodal: true }
    ]
  },
  groq: {
    image: [
      'llama-3.2-90b-vision-preview',
      'llama-3.2-11b-vision-preview'
    ],
    text: [
      'llama-3.1-70b-versatile',
      { value: 'llama-3.2-90b-vision-preview', isMultimodal: true },
      { value: 'llama-3.2-11b-vision-preview', isMultimodal: true }
    ]
  },
  gemini: {
    image: [
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash'
    ],
    text: [
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash'
    ]
  }
};

// 模型服务基类
class BaseModelService {
  constructor(apiKey, model, settings = {}) {
    if (!apiKey) {
      throw new Error(`请先在设置中配置 ${settings.vendor} 的 API Key`);
    }
    this.apiKey = apiKey;
    this.model = model;
    this.settings = settings;
  }

  getPrompt(action) {
    // 如果是高级模式且有自定义提示词，使用自定义提示词
    if (this.settings.advancedMode && this.settings.prompt) {
      return this.settings.prompt;
    }
    
    // 如果是自定义功能，使用对应的自定义提示词
    if (action === 'img_custom' && this.settings.img_customPrompt) {
      return this.settings.img_customPrompt;
    }
    if (action === 'text_custom' && this.settings.text_customPrompt) {
      return this.settings.text_customPrompt;
    }
    
    // 否则使用默认提示词
    return DEFAULT_PROMPTS[action] || '';
  }

  async processImage(image, action) {
    throw new Error('Not implemented');
  }

  async processText(text, action) {
    throw new Error('Not implemented');
  }
}

// 通义千问服务
class QwenService extends BaseModelService {
  constructor(apiKey, model, settings = {}) {
    super(apiKey, model, settings);
    this.baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  }

  async processImage(image, action) {
    try {
      const prompt = this.getPrompt(action);
      console.log('Using prompt for image:', prompt);
      console.log('action:', action);

      const requestBody = {
        model: this.model,
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: [
              { type: "text", text: "" },
              { 
                type: "image_url",
                image_url: { url: image }
              }
            ]
          }
        ]
      };

      console.log('Request body:', requestBody);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
      console.log('Qwen image response:', data.choices[0].message.content);
      return data.choices[0].message.content;

    } catch (error) {
      throw new Error(`通义千问处理图片失败: ${error.message}`);
    }
  }

  async processText(text, action) {
    try {
      const prompt = this.getPrompt(action);
      console.log('Using prompt for text:', prompt);
      
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: text
          }
        ]
      };

      console.log('Request body:', requestBody);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
      console.log('Qwen text response:', data.choices[0].message.content);
      return data.choices[0].message.content;

    } catch (error) {
      throw new Error(`通义千问处理文本失败: ${error.message}`);
    }
  }
}

// Groq服务
class GroqService extends BaseModelService {
  constructor(apiKey, model, settings = {}) {
    super(apiKey, model, settings);
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  }

  async processImage(image, action) {
    try {
      const prompt = this.getPrompt(action);

      // 修改请求体结构以匹配 Groq API 的要求
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
                  data: image.split(',')[1] // 移除 data:image/jpeg;base64, 前缀
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
      console.log('Groq image response:', data.choices[0].message.content);
      return data.choices[0].message.content;
      
    } catch (error) {
      console.error('Error processing image with Groq:', error);
      throw new Error(`Groq处理图片失败: ${error.message}`);
    }
  }

  async processText(text, action) {
    try {
      const prompt = this.getPrompt(action);

      // 构建请求体 - 文本模型
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
      console.log('Groq text response:', data.choices[0].message.content);
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error processing text with Groq:', error);
      throw new Error(`Groq处理文本失败: ${error.message}`);
    }
  }
}

// Gemini服务
class GeminiService extends BaseModelService {
  constructor(apiKey, model, settings = {}) {
    super(apiKey, model, settings);
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async processImage(image, action) {
    try {
      const prompt = this.getPrompt(action);

      // 构建请求体 - 多模态模型
      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            { 
              inlineData: {
                data: image.split(',')[1], // 移除 data:image/jpeg;base64, 前缀
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
      console.log('Gemini image response:', data.candidates[0].content.parts[0].text);
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error processing image with Gemini:', error);
      throw new Error(`Gemini处理图片失败: ${error.message}`);
    }
  }

  async processText(text, action) {
    try {
      const prompt = this.getPrompt(action);

      // 构建请求体 - 文本模型
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
      console.log('Gemini text response:', data.candidates[0].content.parts[0].text);
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error processing text with Gemini:', error);
      throw new Error(`Gemini处理文本失败: ${error.message}`);
    }
  }
}

// 模型服务工厂
class ModelServiceFactory {
  static createService(vendor, model, apiKey, settings = {}) {
    // 添加 vendor 到 settings
    const serviceSettings = {
      ...settings,
      vendor: vendor
    };

    switch (vendor) {
      case 'qwen':
        return new QwenService(apiKey, model, serviceSettings);
      case 'groq':
        return new GroqService(apiKey, model, serviceSettings);
      case 'gemini':
        return new GeminiService(apiKey, model, serviceSettings);
      default:
        throw new Error(`不支持的服务商: ${vendor}`);
    }
  }
}

export { ModelServiceFactory, DEFAULT_PROMPTS, MODEL_OPTIONS };