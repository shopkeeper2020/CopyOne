// 默认设置
const DEFAULT_SETTINGS = {
  // 通用设置
  historyLimit: 50,
  
  // API Keys
  qwenApiKey: '',
  groqApiKey: '',
  geminiApiKey: '',
  
  // 图片处理基础设置
  imageVendor: 'qwen',
  imageModel: 'qwen-vl-plus',
  imageAdvancedMode: false,
  
  // 文本处理基础设置
  textVendor: 'qwen',
  textModel: 'qwen-turbo',
  textAdvancedMode: false,
  
  // 百度翻译API配置
  baiduClientId: '',
  baiduClientSecret: '',
};

class Config {
  constructor() {
    this.settings = null;
  }

  async getSettings() {
    try {
      // 每次都从 storage 重新获取设置，不使用缓存
      const result = await chrome.storage.local.get('settings');
      this.settings = { ...DEFAULT_SETTINGS, ...result.settings };
      return this.settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(newSettings) {
    try {
      // 保存前打印日志
      console.log('Saving new settings:', newSettings);
      
      // 直接使用新设置覆盖旧设置，但保留默认值作为后备
      this.settings = {
        ...DEFAULT_SETTINGS,  // 基础默认值
        ...newSettings        // 新的设置值直接覆盖
      };
      
      // 保存到 chrome.storage
      await chrome.storage.local.set({ settings: this.settings });
      
      // 保存后打印日志
      console.log('Settings saved successfully:', this.settings);
      
      return this.settings;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  async getFunctionSettings(action) {
    // 每次都重新获取最新设置
    const settings = await this.getSettings();
    
    // 如果是高级模式，使用功能特定的设置
    if ((action.startsWith('img_') || action === 'extract') && settings.imageAdvancedMode) {
      return {
        vendor: settings[`${action}Vendor`] || settings.imageVendor,
        model: settings[`${action}Model`] || settings.imageModel,
        prompt: settings[`${action}Prompt`],
        qwenApiKey: settings.qwenApiKey,
        groqApiKey: settings.groqApiKey,
        geminiApiKey: settings.geminiApiKey,
        advancedMode: true
      };
    }
    
    if (action.startsWith('text_') && settings.textAdvancedMode) {
      return {
        vendor: settings[`${action}Vendor`] || settings.textVendor,
        model: settings[`${action}Model`] || settings.textModel,
        prompt: settings[`${action}Prompt`],
        qwenApiKey: settings.qwenApiKey,
        groqApiKey: settings.groqApiKey,
        geminiApiKey: settings.geminiApiKey,
        advancedMode: true
      };
    }
    
    // 基础模式使用通用设置
    return {
      vendor: action.startsWith('text_') ? settings.textVendor : settings.imageVendor,
      model: action.startsWith('text_') ? settings.textModel : settings.imageModel,
      prompt: settings[`${action}Prompt`],
      qwenApiKey: settings.qwenApiKey,
      groqApiKey: settings.groqApiKey,
      geminiApiKey: settings.geminiApiKey,
      advancedMode: false
    };
  }
}

export default new Config(); 