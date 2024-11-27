import config from './config.js';
import { ModelServiceFactory } from './modelService.js';
import { marked } from './marked.js';

class Sidebar {
  constructor() {
    console.log('Sidebar 构造函数被调用');
    
    // 初始化请求队列
    this.requestQueue = [];
    this.isProcessing = false;
    
    // 确保 DOM 已经加载完成再初始化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }

    // 添加设置变化监听
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.settings) {
        console.log('Settings changed:', changes.settings.newValue);
        this.applySettings(changes.settings.newValue);
      }
    });
  }

  init() {
    console.log('开始初始化 Sidebar');
    this.initElements();
    this.initEventListeners();
    this.loadSettings();
    this.loadHistory();
    this.currentAction = null;
    this.currentContent = null;
    console.log('Sidebar 初始化完成');
  }

  initElements() {
    console.log('始初始化元素');
    try {
      // 获取按钮元素
      this.settingsBtn = document.getElementById('settingsBtn');
      this.clearBtn = document.getElementById('clearBtn');
      this.extractTextBtn = document.getElementById('extractTextBtn');
      this.translateImgChBtn = document.getElementById('translateImgChBtn');
      this.translateImgEnBtn = document.getElementById('translateImgEnBtn');
      this.customImgBtn = document.getElementById('customImgBtn');
      
      // 检查元素是否成功获取
      const elements = {
        settingsBtn: this.settingsBtn,
        clearBtn: this.clearBtn,
        extractTextBtn: this.extractTextBtn,
        translateImgChBtn: this.translateImgChBtn,
        translateImgEnBtn: this.translateImgEnBtn,
        customImgBtn: this.customImgBtn
      };

      // 检查是否有任何元素未找到
      const missingElements = Object.entries(elements)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingElements.length > 0) {
        throw new Error(`未找到以下元素: ${missingElements.join(', ')}`);
      }

      console.log('所有按钮元素已找到');

      // 其他元素初始化...
      this.chatContainer = document.getElementById('chatContainer');
      this.translateTextChBtn = document.getElementById('translateTextChBtn');
      this.translateTextEnBtn = document.getElementById('translateTextEnBtn');
      this.customTextBtn = document.getElementById('customTextBtn');
      this.settingsModal = document.getElementById('settingsModal');
      this.saveSettingsBtn = document.getElementById('saveSettings');
      this.cancelSettingsBtn = document.getElementById('cancelSettings');
      this.customPromptArea = document.getElementById('customPromptArea');
      this.customPromptInput = document.getElementById('customPromptInput');
      this.submitCustomPrompt = document.getElementById('submitCustomPrompt');
      this.cancelCustomPrompt = document.getElementById('cancelCustomPrompt');
      
      console.log('元素初始化完成');
    } catch (error) {
      console.error('元素初始化失败:', error);
      throw error;
    }
  }

  initEventListeners() {
    console.log('开始绑定事件监听器');
    try {
      // 设按钮事件
      if (this.settingsBtn) {
        this.settingsBtn.addEventListener('click', () => {
          chrome.runtime.openOptionsPage();
        });
      }

      if (this.saveSettingsBtn) {
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
      }

      if (this.cancelSettingsBtn) {
        this.cancelSettingsBtn.addEventListener('click', () => this.hideSettings());
      }
      
      // 清空按钮事件
      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', () => this.clearChat());
      }
      
      // 图片功能区按钮事件
      if (this.extractTextBtn) {
        this.extractTextBtn.addEventListener('click', () => {
          console.log('提取文本按钮被点击');
          this.handleImageAction('extract');
        });
      }

      if (this.translateImgChBtn) {
        this.translateImgChBtn.addEventListener('click', () => {
          console.log('图片译中按钮被点击');
          this.handleImageAction('img_translateCh');
        });
      }

      if (this.translateImgEnBtn) {
        this.translateImgEnBtn.addEventListener('click', () => {
          console.log('图片译英按钮被点击');
          this.handleImageAction('img_translateEn');
        });
      }

      if (this.customImgBtn) {
        this.customImgBtn.addEventListener('click', () => {
          console.log('自定义图片按钮被点击');
          this.handleImageAction('img_custom');
        });
      }

      // 文本功能区按钮事件
      if (this.translateTextChBtn) {
        this.translateTextChBtn.addEventListener('click', () => this.handleTextAction('text_translateCh'));
      }

      if (this.translateTextEnBtn) {
        this.translateTextEnBtn.addEventListener('click', () => this.handleTextAction('text_translateEn'));
      }

      if (this.customTextBtn) {
        this.customTextBtn.addEventListener('click', () => this.handleTextAction('text_custom'));
      }

      // 自定义提示词相关事件
      if (this.submitCustomPrompt) {
        this.submitCustomPrompt.addEventListener('click', () => this.handleCustomPromptSubmit());
      }

      if (this.cancelCustomPrompt) {
        this.cancelCustomPrompt.addEventListener('click', () => this.hideCustomPromptArea());
      }

      console.log('事件监听器绑定完成');
    } catch (error) {
      console.error('事件监听器绑定失败:', error);
      throw error;
    }
  }

  async loadSettings() {
    try {
      const settings = await config.getSettings();
      console.log('Loaded settings:', settings);
      this.applySettings(settings);
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }

  hideSettings() {
    this.settingsModal.style.display = 'none';
  }

  async saveSettings() {
    const settings = {
      apiKey: document.getElementById('apiKey').value,
      model: document.getElementById('model').value,
      historyLimit: parseInt(document.getElementById('historyLimit').value) || 100,
      customPrompt: document.getElementById('customPrompt').value
    };
    await config.saveSettings(settings);
    this.settings = settings;
    
    // 应用新的历史记录限制
    await this.applyHistoryLimit();
    
    this.hideSettings();
  }

  async applyHistoryLimit() {
    const { history = [] } = await chrome.storage.local.get('history');
    if (history.length > this.settings.historyLimit) {
      // 保留最新的消息
      const newHistory = history.slice(-this.settings.historyLimit);
      await chrome.storage.local.set({ history: newHistory });
      
      // 重新加载显示
      this.chatContainer.innerHTML = '';
      newHistory.forEach(item => {
        this.handleScreenshotResult(item, false);
      });
    }
  }

  async clearChat() {
    try {
      // 清空显示
      this.chatContainer.innerHTML = '';
      // 清空存储的历史记录
      await chrome.storage.local.set({ history: [] });
      this.showToast('历史记录已清空');
    } catch (error) {
      console.error('Failed to clear chat:', error);
      this.showToast('清空失败');
    }
  }

  async loadHistory() {
    try {
      const { history = [] } = await chrome.storage.local.get('history');
      console.log('加载历史记录:', history);
      
      // 按时间戳排序，确保消按正确顺序显示
      history.sort((a, b) => a.timestamp - b.timestamp);
      
      // 清空当前显示的消息
      this.chatContainer.innerHTML = '';
      
      // 重新加载所有历史消息
      history.forEach(item => {
        if (item.type === 'image') {
          this.addImageToChat(item.data, item.role, false);
        } else if (item.type === 'text') {
          // 创建消息元素
          const messageDiv = document.createElement('div');
          messageDiv.className = `message ${item.role}`;
          messageDiv.dataset.timestamp = item.timestamp;

          // 创建消息头部
          const headerDiv = document.createElement('div');
          headerDiv.className = 'message-header';
          
          // 创建头部左侧内容容器
          const headerLeft = document.createElement('div');
          headerLeft.className = 'message-header-left';
          
          const avatar = document.createElement('img');
          avatar.src = item.role === 'user' ? 'icons/用户.png' : 'icons/icon.png';
          avatar.alt = item.role === 'user' ? 'You' : 'CopySide';
          
          const name = document.createElement('span');
          if (item.role === 'assistant') {
            const functionNames = {
              'extract': '提取文本',
              'img_translateCh': '图片译中',
              'img_translateEn': '图片译英',
              'img_custom': '图片自定义',
              'text_translateCh': '文本译中',
              'text_translateEn': '文本译英',
              'text_custom': '文本自定义'
            };
            name.textContent = `CopyOne · ${functionNames[item.action] || ''}`;
          } else {
            name.textContent = 'You';
          }
          
          headerLeft.appendChild(avatar);
          headerLeft.appendChild(name);
          headerDiv.appendChild(headerLeft);

          // 创建操作按钮容器
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'message-actions';
          
          const copyBtn = document.createElement('button');
          copyBtn.innerHTML = '<img src="icons/复制.png" alt="复制">';
          copyBtn.setAttribute('data-tooltip', '复制到剪贴板');
          copyBtn.onclick = () => this.copyToClipboard(item.data);

          // 创建时间信息
          const timeDiv = document.createElement('span');
          timeDiv.className = 'message-time';
          const date = new Date(item.timestamp);
          const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          timeDiv.textContent = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日 ${weekdays[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

          // 如果是用户消息，添加时间信息
          if (item.role === 'user') {
            actionsDiv.appendChild(timeDiv);
          }
          
          // 如果是 AI 回复，添加耗时信息
          if (item.role === 'assistant' && item.duration) {
            const durationDiv = document.createElement('span');
            durationDiv.className = 'message-duration';
            durationDiv.textContent = `耗时: ${item.duration}s`;  // 直接使用保存的耗时
            actionsDiv.appendChild(durationDiv);
          }

          actionsDiv.appendChild(copyBtn);
          headerDiv.appendChild(actionsDiv);
          messageDiv.appendChild(headerDiv);

          // 创建消息主体
          const bodyDiv = document.createElement('div');
          bodyDiv.className = 'message-body';

          const textContainer = document.createElement('div');
          textContainer.className = 'message-content markdown-body';
          textContainer.style.whiteSpace = 'pre-wrap';
          
          const markedOptions = {
            breaks: false,
            gfm: true,
            sanitize: false,
            headerIds: false,
            mangle: false,
          };
          
          const renderedContent = marked.parse(item.data, markedOptions);
          textContainer.innerHTML = renderedContent.replace(/\n$/, '');

          bodyDiv.appendChild(textContainer);
          messageDiv.appendChild(bodyDiv);

          this.chatContainer.appendChild(messageDiv);
        }
      });

      // 滚动到底部
      this.scrollToBottom();
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  }

  async saveToHistory(item) {
    try {
      const { history = [] } = await chrome.storage.local.get('history');
      
      // 添加时间戳
      const newItem = {
        ...item,
        timestamp: Date.now()
      };
      
      history.push(newItem);
      
      // 如果超出历史记录限制，删除最旧的记录
      if (history.length > (this.settings?.historyLimit || 100)) {
        history.shift();
      }
      
      await chrome.storage.local.set({ history });
      console.log('保存历史记录成功:', newItem);
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  }

  async deleteFromHistory(timestamp) {
    try {
      const { history = [] } = await chrome.storage.local.get('history');
      
      // 确保时间戳是数字类型
      const timestampNum = parseInt(timestamp);
      
      // 过滤掉要删除的消息
      const newHistory = history.filter(item => item.timestamp !== timestampNum);
      
      // 保存新的历史记录
      await chrome.storage.local.set({ history: newHistory });
      
      // 从 DOM 中移除消息
      const messageElement = this.chatContainer.querySelector(`[data-timestamp="${timestamp}"]`);
      if (messageElement) {
        messageElement.remove();
        this.showToast('已删除');
      }
    } catch (error) {
      console.error('删除历史记录失败:', error);
      this.showToast('删除失败');
    }
  }

  handleScreenshotResult(message, shouldSave = true) {
    const { imageData, mode, timestamp } = message;

    // 创建消息容器
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.dataset.timestamp = timestamp || Date.now();

    // 创建图片容器
    const imageContainer = document.createElement('div');
    imageContainer.className = 'message-content image-container';
    imageContainer.style.width = '60%';

    // 创建图片元素
    const img = document.createElement('img');
    img.src = imageData;
    img.style.cssText = `
      width: 100%;
      height: auto;
      display: block;
      cursor: pointer;
    `;

    // 添加点击图片放大预览的功能
    img.onclick = () => this.showImagePreview(imageData);

    // 创建按钮容器
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container';
    buttonsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    // 创建复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-button';
    copyBtn.innerHTML = '<img src="icons/复制.png" alt="复制">';
    copyBtn.setAttribute('data-tooltip', '复制到剪贴板');
    copyBtn.onclick = async () => {
      try {
        const response = await fetch(imageData);
        const blob = await response.blob();
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        this.showToast('图片已复制到剪贴板');
      } catch (error) {
        console.error('Failed to copy image:', error);
        this.showToast('复制失败');
      }
    };

    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-button';
    deleteBtn.innerHTML = '<img src="icon.png" alt="删除">';
    deleteBtn.onclick = async () => {
      try {
        // 使用消息的时间戳
        const msgTimestamp = messageDiv.dataset.timestamp;
        await this.deleteFromHistory(msgTimestamp);
      } catch (error) {
        console.error('Failed to delete message:', error);
        this.showToast('删除失败');
      }
    };

    // 组装消息
    imageContainer.appendChild(img);
    buttonsContainer.appendChild(copyBtn);
    buttonsContainer.appendChild(deleteBtn);
    messageDiv.appendChild(imageContainer);
    messageDiv.appendChild(buttonsContainer);

    // 添加到聊天容器
    this.chatContainer.appendChild(messageDiv);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;

    // 保存到历史记录
    if (shouldSave) {
      this.saveToHistory({
        type: 'image',
        data: imageData,
        mode,
        timestamp: messageDiv.dataset.timestamp
      });
    }
  }

  showImagePreview(imageUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      cursor: zoom-out;
    `;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
    `;

    modal.appendChild(img);
    document.body.appendChild(modal);

    modal.onclick = () => modal.remove();
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      z-index: 10001;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  async getClipboardContent() {
    console.log('开始读取剪贴板...');
    try {
      const clipboardItems = await navigator.clipboard.read();
      console.log('剪贴板项目:', clipboardItems);
      
      if (clipboardItems.length > 0) {
        const item = clipboardItems[0];
        console.log('剪贴板类型:', item.types);
        
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            try {
              console.log('发现片类型:', type);
              const blob = await item.getType(type);
              const base64Data = await this.blobToBase64(blob);
              console.log('图片转换完成');
              return {
                type: 'image',
                data: base64Data
              };
            } catch (error) {
              console.error('读取图片败:', error);
            }
          }
        }
      }
      
      console.log('剪贴板中没有找到图片');
      return null;
    } catch (error) {
      console.error('访问剪贴板失败:', error);
      return null;
    }
  }

  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async handleStreamResponse(stream, processChunk, messageElement) {
    try {
      if (!stream) {
        console.error('Stream is undefined');
        throw new Error('Stream is undefined');
      }

      let accumulatedText = '';
      
      while (true) {
        const { value, done } = await stream.read();
        
        if (done) {
          console.log('Stream complete');
          this.scrollToBottom();
          return accumulatedText;
        }

        // 处理数据块
        const text = processChunk(value);
        if (text) {
          accumulatedText += text;
          
          // 使用相同的 marked 选项
          const markedOptions = {
            breaks: false,
            gfm: true,
            sanitize: false,
            headerIds: false,
            mangle: false,
          };
          
          // 移除尾部换行
          messageElement.innerHTML = marked.parse(accumulatedText, markedOptions).replace(/\n$/, '');
          this.scrollToBottom();
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
        throw new Error('请被取消');
      }
      console.error('Stream error:', error);
      throw error;
    }
  }

  // 修改队列处理方法
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      // 获取所有待处理的请求
      const currentRequests = [...this.requestQueue];
      this.requestQueue = [];  // 清空队列
      
      // 并发处理所有请求
      await Promise.all(currentRequests.map(request => {
        if (request.type === 'image') {
          return this._processImageRequest(request);
        } else if (request.type === 'text') {
          return this._processTextRequest(request);
        }
      }));

    } finally {
      this.isProcessing = false;
      
      // 如果队列中还有新的请求，继续处理
      if (this.requestQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  // 修改请求添加方法
  async handleImageAction(action) {
    try {
      // 1. 检查剪贴板权限
      if (!await this.checkClipboardPermission()) {
        return;
      }

      // 2. 获取剪贴板内容
      const clipboardContent = await this.getClipboardContent();
      
      if (!clipboardContent) {
        this.showToast('剪贴板为空');
        return;
      }

      if (clipboardContent.type !== 'image') {
        this.showToast('请先复制图片');
        return;
      }

      // 3. 立即添加用户的图片消息到聊天界面
      const userMessageElement = this.addImageToChat(clipboardContent.data, 'user');
      
      // 4. 将请求添加到队列
      this.requestQueue.push({
        type: 'image',
        action: action,
        content: clipboardContent.data,
        timestamp: Date.now(),
        userMessageElement: userMessageElement
      });
      
      // 5. 开始处理队列
      if (!this.isProcessing) {
        this.processQueue();
      }
    } catch (error) {
      console.error('Error in handleImageAction:', error);
      this.showToast('处理图片失败');
    }
  }

  // 修改文本处理方法
  async handleTextAction(action) {
    try {
      // 1. 获取文本
      const text = await this.getClipboardText();
      
      if (!text) {
        this.showToast('请输入文本或复制文本到剪贴板');
        return;
      }

      // 2. 清空输入框
      const userInput = document.getElementById('userInput');
      if (userInput) {
        userInput.value = '';
      }

      // 3. 添加用户的文本消息到聊天界面
      const userMessageElement = this.addTextToChat(text, 'user');
      
      // 4. 将请求添加到队列
      this.requestQueue.push({
        type: 'text',
        action: action,
        content: text,
        timestamp: Date.now(),
        userMessageElement: userMessageElement
      });
      
      // 5. 开始处理队列
      if (!this.isProcessing) {
        this.processQueue();
      }
    } catch (error) {
      console.error('Error in handleTextAction:', error);
      this.showToast('处理文本失败');
    }
  }

  // 处理图片请求
  async _processImageRequest(request) {
    this.startTime = request.timestamp;
    const loadingMessageId = this.addLoadingMessage(request.userMessageElement);

    try {
      const settings = await config.getFunctionSettings(request.action);
      const modelService = ModelServiceFactory.createService(
        settings.vendor,
        settings.model,
        settings[`${settings.vendor}ApiKey`],
        {
          advancedMode: false,
          prompt: settings.prompt,
          abortSignal: this.abortController.signal
        }
      );

      const result = await modelService.processImage(request.content, request.action);
      this.removeLoadingMessage(loadingMessageId);
      
      // 在用户消息后插入 AI 响应
      const responseElement = this.createMessageElement(result, 'assistant', request.action);
      request.userMessageElement.insertAdjacentElement('afterend', responseElement);
      
      // 保存 AI 响应到历史记录
      this.saveToHistory({
        type: 'text',
        data: result,
        role: 'assistant',
        action: request.action,
        timestamp: Date.now(),
        duration: ((Date.now() - this.startTime) / 1000).toFixed(2)
      });
      
      this.scrollToBottom();
    } catch (error) {
      this.removeLoadingMessage(loadingMessageId);
      const errorMessage = error.message.includes('不支持的服务商') 
        ? error.message 
        : `处理失败：${error.message}`;
      this.showToast(errorMessage);
    }
  }

  // 处理文本请求
  async _processTextRequest(request) {
    this.startTime = request.timestamp;
    const loadingMessageId = this.addLoadingMessage(request.userMessageElement);

    try {
      const settings = await config.getFunctionSettings(request.action);
      const modelService = ModelServiceFactory.createService(
        settings.vendor,
        settings.model,
        settings[`${settings.vendor}ApiKey`],
        {
          advancedMode: false,
          prompt: settings.prompt,
          abortSignal: this.abortController.signal
        }
      );

      const result = await modelService.processText(request.content, request.action);
      this.removeLoadingMessage(loadingMessageId);
      
      // 在用户消息后插入 AI 响应
      const responseElement = this.createMessageElement(result, 'assistant', request.action);
      request.userMessageElement.insertAdjacentElement('afterend', responseElement);
      
      // 保存 AI 响应到历史记录
      this.saveToHistory({
        type: 'text',
        data: result,
        role: 'assistant',
        action: request.action,
        timestamp: Date.now(),
        duration: ((Date.now() - this.startTime) / 1000).toFixed(2)
      });
      
      this.scrollToBottom();
    } catch (error) {
      this.removeLoadingMessage(loadingMessageId);
      const errorMessage = error.message.includes('不支持的服务商') 
        ? error.message 
        : `处理失败：${error.message}`;
      this.showToast(errorMessage);
    }
  }

  // 添加在指定消息后插入响应的方法
  insertResponseAfterMessage(text, role, afterElement, action) {
    const responseElement = this.createMessageElement(text, role, action);
    afterElement.insertAdjacentElement('afterend', responseElement);
    this.scrollToBottom();
  }

  // 修改加载消息的添加方法
  addLoadingMessage(afterElement) {
    const messageId = Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.dataset.messageId = messageId;

    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'message-content loading-container';
    loadingContainer.style.background = '#f5f5f5';
    loadingContainer.style.display = 'flex';
    loadingContainer.style.alignItems = 'center';
    loadingContainer.style.justifyContent = 'space-between';

    // 左侧加载动画和文本
    const leftContent = document.createElement('div');
    leftContent.style.display = 'flex';
    leftContent.style.alignItems = 'center';

    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading';

    const loadingText = document.createElement('span');
    loadingText.textContent = ' 正在处理...';
    loadingText.style.marginLeft = '8px';
    loadingText.style.color = '#666';

    leftContent.appendChild(loadingSpinner);
    leftContent.appendChild(loadingText);

    // 右侧暂停按钮
    const stopButton = document.createElement('button');
    stopButton.textContent = '停止';
    stopButton.style.cssText = `
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      background: #ff4d4f;
      color: white;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    `;
    stopButton.onmouseover = () => {
      stopButton.style.background = '#ff7875';
    };
    stopButton.onmouseout = () => {
      stopButton.style.background = '#ff4d4f';
    };

    // 添加停止功能
    this.abortController = new AbortController();
    stopButton.onclick = () => {
      console.log('请求被用户终止');
      this.abortController.abort();
      this.removeLoadingMessage(messageId);
      this.showToast('已停止处理');
    };

    loadingContainer.appendChild(leftContent);
    loadingContainer.appendChild(stopButton);
    messageDiv.appendChild(loadingContainer);

    // 在指定元素后插入加载消息
    afterElement.insertAdjacentElement('afterend', messageDiv);
    this.scrollToBottom();

    return messageId;
  }

  // 创建消息元素的辅助方法
  createMessageElement(text, role, action) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.dataset.timestamp = Date.now();

    // 创建消息头部
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    
    // 创建头部左侧内容容器
    const headerLeft = document.createElement('div');
    headerLeft.className = 'message-header-left';
    
    const avatar = document.createElement('img');
    avatar.src = role === 'user' ? 'icons/用户.png' : 'icons/icon.png';
    avatar.alt = role === 'user' ? 'You' : 'GLM-WEB';
    
    const name = document.createElement('span');
    if (role === 'assistant') {
      const functionNames = {
        'extract': '提取文本',
        'img_translateCh': '图片译中',
        'img_translateEn': '图片译英',
        'img_custom': '图片自定义',
        'text_translateCh': '文本译中',
        'text_translateEn': '文本译英',
        'text_custom': '文本自定义'
      };
      name.textContent = `CopyOne · ${functionNames[action] || ''}`;
    } else {
      name.textContent = 'You';
    }
    
    headerLeft.appendChild(avatar);
    headerLeft.appendChild(name);
    headerDiv.appendChild(headerLeft);

    // 创建操作按钮容器
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    
    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = '<img src="icons/复制.png" alt="复制">';
    copyBtn.setAttribute('data-tooltip', '复制到剪贴板');
    copyBtn.onclick = () => this.copyToClipboard(text);

    // 创建时间信息
    const timeDiv = document.createElement('span');
    timeDiv.className = 'message-time';
    const date = new Date(Date.now());
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    timeDiv.textContent = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日 ${weekdays[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

    // 如果是用户消息，添加时间信息
    if (role === 'user') {
      actionsDiv.appendChild(timeDiv);
    }
    
    // 如果是 AI 回复，添加耗时信息
    if (role === 'assistant' && this.startTime) {
      const durationDiv = document.createElement('span');
      durationDiv.className = 'message-duration';
      const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
      durationDiv.textContent = `耗时: ${duration}s`;
      actionsDiv.appendChild(durationDiv);
    }

    actionsDiv.appendChild(copyBtn);
    headerDiv.appendChild(actionsDiv);
    messageDiv.appendChild(headerDiv);

    // 创建消息主体
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'message-body';

    const textContainer = document.createElement('div');
    textContainer.className = 'message-content markdown-body';
    textContainer.style.whiteSpace = 'pre-wrap';
    
    // 修改 marked 选项，禁用自动添加换行
    const markedOptions = {
      breaks: false,        // 禁用自动换行
      gfm: true,
      sanitize: false,
      headerIds: false,     // 禁用标题ID
      mangle: false,        // 禁用标题转义
    };
    
    // 直接使用原始文本，不做任何预处理
    const renderedContent = marked.parse(text, markedOptions);
    
    // 移除可能的尾部换行
    textContainer.innerHTML = renderedContent.replace(/\n$/, '');

    bodyDiv.appendChild(textContainer);
    messageDiv.appendChild(bodyDiv);

    return messageDiv; // 返回消息元素引用
  }

  addImageToChat(imageUrl, role = 'user', shouldSave = true) {
    const timestamp = Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.dataset.timestamp = timestamp;

    // 创建消息头部
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    
    // 创建头部左侧内容容器
    const headerLeft = document.createElement('div');
    headerLeft.className = 'message-header-left';
    
    const avatar = document.createElement('img');
    avatar.src = role === 'user' ? 'icons/用户.png' : 'icons/icon.png';
    avatar.alt = role === 'user' ? 'You' : 'GLM-WEB';
    
    const name = document.createElement('span');
    name.textContent = role === 'user' ? 'You' : 'GLM-WEB';
    
    headerLeft.appendChild(avatar);
    headerLeft.appendChild(name);
    headerDiv.appendChild(headerLeft);

    // 创建操作按钮容器
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    
    // 创建时间信息
    if (role === 'user') {
      const timeDiv = document.createElement('span');
      timeDiv.className = 'message-time';
      const date = new Date(timestamp);
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      timeDiv.textContent = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日 ${weekdays[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
      actionsDiv.appendChild(timeDiv);
    }

    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = '<img src="icons/复制.png" alt="复制">';
    copyBtn.setAttribute('data-tooltip', '复制到剪贴板');
    copyBtn.onclick = async () => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        this.showToast('图片已复制到剪贴板');
      } catch (error) {
        console.error('Failed to copy image:', error);
        this.showToast('复制失败');
      }
    };

    actionsDiv.appendChild(copyBtn);
    headerDiv.appendChild(actionsDiv);
    messageDiv.appendChild(headerDiv);

    // 创建消息主体
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'message-body';

    // 创建图片容器
    const imageContainer = document.createElement('div');
    imageContainer.className = 'message-content image-container';

    // 创建图片元素
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
      width: 100%;
      height: auto;
      display: block;
      cursor: pointer;
    `;

    // 添加点击图片放大预览的功能
    img.onclick = () => this.showImagePreview(imageUrl);

    imageContainer.appendChild(img);
    bodyDiv.appendChild(imageContainer);
    messageDiv.appendChild(bodyDiv);

    this.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();

    if (shouldSave) {
      this.saveToHistory({
        type: 'image',
        data: imageUrl,
        role,
        timestamp
      });
    }

    return messageDiv; // 返回消息元素引用
  }

  async getClipboardText() {
    // 首先检查输入框
    const userInput = document.getElementById('userInput');
    if (userInput && userInput.value.trim()) {
      return userInput.value.trim();
    }

    // 如果输入框为空，则从剪贴板读取
    try {
      const text = await navigator.clipboard.readText();
      return text && text.trim() ? text : null;
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      return null;
    }
  }

  addTextToChat(text, role = 'user', shouldSave = true, action = '') {
    const timestamp = Date.now();
    // 计算耗时（仅对 AI 回复有效）
    const duration = role === 'assistant' && this.startTime ? 
      ((Date.now() - this.startTime) / 1000).toFixed(2) : null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.dataset.timestamp = timestamp;

    // 创建消息头部
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    
    // 创建头部左侧内容容器
    const headerLeft = document.createElement('div');
    headerLeft.className = 'message-header-left';
    
    const avatar = document.createElement('img');
    avatar.src = role === 'user' ? 'icons/用户.png' : 'icons/icon.png';
    avatar.alt = role === 'user' ? 'You' : 'GLM-WEB';
    
    const name = document.createElement('span');
    if (role === 'assistant') {
      const functionNames = {
        'extract': '提取文本',
        'img_translateCh': '图片译中',
        'img_translateEn': '图片译英',
        'img_custom': '图片自定义',
        'text_translateCh': '文本译中',
        'text_translateEn': '文本译英',
        'text_custom': '文本自定义'
      };
      name.textContent = `CopyOne · ${functionNames[action] || ''}`;
    } else {
      name.textContent = 'You';
    }
    
    headerLeft.appendChild(avatar);
    headerLeft.appendChild(name);
    headerDiv.appendChild(headerLeft);

    // 创建操作按钮容器
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    
    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = '<img src="icons/复制.png" alt="复制">';
    copyBtn.setAttribute('data-tooltip', '复制到剪贴板');
    copyBtn.onclick = () => this.copyToClipboard(text);

    // 创建时间信息
    const timeDiv = document.createElement('span');
    timeDiv.className = 'message-time';
    const date = new Date(timestamp);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    timeDiv.textContent = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日 ${weekdays[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

    // 如果是用户消息，添加时间信息
    if (role === 'user') {
      actionsDiv.appendChild(timeDiv);
    }
    
    // 如果是 AI 回复，添加耗时信息
    if (role === 'assistant' && duration) {
      const durationDiv = document.createElement('span');
      durationDiv.className = 'message-duration';
      durationDiv.textContent = `耗时: ${duration}s`;
      actionsDiv.appendChild(durationDiv);
    }

    actionsDiv.appendChild(copyBtn);
    headerDiv.appendChild(actionsDiv);
    messageDiv.appendChild(headerDiv);

    // 创建消息主体
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'message-body';

    const textContainer = document.createElement('div');
    textContainer.className = 'message-content markdown-body';
    textContainer.style.whiteSpace = 'pre-wrap';
    
    // 修改 marked 选项，禁用自动添加换行
    const markedOptions = {
      breaks: false,        // 禁用自动换行
      gfm: true,
      sanitize: false,
      headerIds: false,     // 禁用标题ID
      mangle: false,        // 禁用标题转义
    };
    
    // 直接使用原始文本，不做任何预处理
    const renderedContent = marked.parse(text, markedOptions);
    
    // 移除可能的尾部换行
    textContainer.innerHTML = renderedContent.replace(/\n$/, '');

    bodyDiv.appendChild(textContainer);
    messageDiv.appendChild(bodyDiv);

    this.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();

    if (shouldSave) {
      this.saveToHistory({
        type: 'text',
        data: text,
        role,
        action,
        timestamp,
        duration, // 添加耗时信息到历史记录
      });
    }

    return messageDiv; // 返回消息元素引用
  }

  async copyToClipboard(content) {
    try {
      if (typeof content === 'string') {
        if (content.startsWith('data:image')) {
          // 如果是 Base64 图片，先转换回 Blob
          const response = await fetch(content);
          const blob = await response.blob();
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
        } else {
          await navigator.clipboard.writeText(content);
        }
      }
      this.showToast('已复制到剪贴板');
    } catch (error) {
      console.error('Failed to copy:', error);
      this.showToast('复制失败');
    }
  }

  // 添加一个辅助方法来检查剪贴板权限
  async checkClipboardPermission() {
    console.log('检查剪贴板权限...');
    try {
      await navigator.clipboard.read();
      console.log('剪贴板权限已获取');
      return true;
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        console.log('剪贴板权限被拒绝');
        this.showToast('需要剪贴板访问权限');
        return false;
      }
      console.log('其他剪贴板错误:', error);
      return true; // 其他错误可能是剪贴板为空，返回 true
    }
  }

  // 添加一个滚动到底部的辅助方法
  scrollToBottom() {
    // 使用 requestAnimationFrame 确保在 DOM 更新后滚动
    requestAnimationFrame(() => {
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    });
  }

  // 添加移除加载消息的方法
  removeLoadingMessage(messageId) {
    const loadingMessage = document.querySelector(`[data-message-id="${messageId}"]`);
    if (loadingMessage) {
      loadingMessage.remove();
    }
  }

  // 添加应用设置的方法
  applySettings(settings) {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
      chatContainer.dataset.hasBackground = settings.chatBackground ? "true" : "false";
      console.log('Applied chat background setting:', chatContainer.dataset.hasBackground);
    }
  }
}

// 初始化
console.log('准备初始化 Sidebar...');
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 加载完成，开始创建 Sidebar 实例');
  new Sidebar();
});