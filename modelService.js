import { DEFAULT_PROMPTS, MODEL_OPTIONS } from './modelServices/modelConstants.js';
import QwenService from './modelServices/QwenService.js';
import GroqService from './modelServices/GroqService.js';
import GeminiService from './modelServices/GeminiService.js';

// 模型服务工厂
class ModelServiceFactory {
  static createService(vendor, model, apiKey, settings = {}) {
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