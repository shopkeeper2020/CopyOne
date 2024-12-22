class ActionService {
  constructor(sidebar) {
    this.sidebar = sidebar;
  }

  // 图片相关服务
  async handleImageAction(action, imageData = null, waitForResult = false) {
    try {
      // 如果没有传入图片数据，则从剪贴板获取
      if (!imageData) {
        // 1. 检查剪贴板权限
        if (!await this.sidebar.checkClipboardPermission()) {
          return;
        }

        // 2. 获取剪贴板内容
        const clipboardContent = await this.sidebar.getClipboardContent();
        
        if (!clipboardContent) {
          this.sidebar.showToast('剪贴板为空');
          return;
        }

        if (clipboardContent.type !== 'image') {
          this.sidebar.showToast('请先复制图片');
          return;
        }

        imageData = clipboardContent.data;
      }

      // 添加用户的图片消息到聊天界面
      const userMessageElement = this.sidebar.addImageToChat(imageData, 'user');
      
      // 将请求添加到队列
      const request = {
        type: 'image',
        action: action,
        content: imageData,
        timestamp: Date.now(),
        userMessageElement: userMessageElement
      };

      this.sidebar.requestQueue.push(request);

      if (waitForResult) {
        // 等待翻译结果
        return new Promise((resolve, reject) => {
          const checkResult = async () => {
            const assistantMessage = userMessageElement.nextElementSibling;
            if (assistantMessage && assistantMessage.classList.contains('message') && 
                assistantMessage.classList.contains('assistant')) {
              const translatedImage = assistantMessage.querySelector('.chat-image');
              if (translatedImage && translatedImage.src) {
                resolve({ translatedImageUrl: translatedImage.src });
                return;
              }
            }
            // 如果还没有结果，继续等待
            setTimeout(checkResult, 100);
          };
          
          // 开始检查结果
          if (!this.sidebar.isProcessing) {
            this.sidebar.processQueue();
          }
          checkResult();

          // 设置超时
          setTimeout(() => {
            reject(new Error('翻译超时'));
          }, 30000);  // 30秒超时
        });
      }

      // 开始处理队列
      if (!this.sidebar.isProcessing) {
        this.sidebar.processQueue();
      }

      return userMessageElement; // 返回消息元素，方便后续操作
    } catch (error) {
      console.error('Error in handleImageAction:', error);
      this.sidebar.showToast('处理图片失败');
      throw error;
    }
  }

  // 文本相关服务
  async handleTextAction(action, textData = null) {
    try {
      // 如果没有传入文本数据，则从剪贴板或输入框获取
      if (!textData) {
        textData = await this.sidebar.getClipboardText();
      }
      
      if (!textData) {
        this.sidebar.showToast('请输入文本或复制文本到剪贴板');
        return;
      }

      // 清空输入框
      const userInput = document.getElementById('userInput');
      if (userInput) {
        userInput.value = '';
      }

      // 添加用户的文本消息到聊天界面
      const userMessageElement = this.sidebar.addTextToChat(textData, 'user');
      
      // 将请求添加到队列
      this.sidebar.requestQueue.push({
        type: 'text',
        action: action,
        content: textData,
        timestamp: Date.now(),
        userMessageElement: userMessageElement
      });
      
      // 开始处理队列
      if (!this.sidebar.isProcessing) {
        this.sidebar.processQueue();
      }

      return userMessageElement; // 返回消息元素，方便后续操作
    } catch (error) {
      console.error('Error in handleTextAction:', error);
      this.sidebar.showToast('处理文本失败');
      throw error;
    }
  }

  // 自定义提示词相关服务
  async handleCustomPrompt(action, prompt) {
    try {
      if (!prompt) {
        this.sidebar.showToast('请输入自定义提示词');
        return;
      }

      // 根据action类型处理不同的自定义提示词
      if (action.startsWith('img_')) {
        return this.handleImageAction(action);
      } else if (action.startsWith('text_')) {
        return this.handleTextAction(action);
      }
    } catch (error) {
      console.error('Error in handleCustomPrompt:', error);
      this.sidebar.showToast('处理自定义提示词失败');
      throw error;
    }
  }
}

export default ActionService; 