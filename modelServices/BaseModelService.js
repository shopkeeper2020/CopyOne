import { DEFAULT_PROMPTS } from './modelConstants.js';

class BaseModelService {
  constructor(apiKey, model, settings = {}) {
    if (!apiKey) {
      throw new Error(`请先在设置中配置 API Key`);
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
}

export { BaseModelService }; 