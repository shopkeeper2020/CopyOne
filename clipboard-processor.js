class ClipboardProcessor {
  static instance = null;

  constructor() {
    if (ClipboardProcessor.instance) {
      ClipboardProcessor.instance.cleanup();
    }
    ClipboardProcessor.instance = this;
    
    this.menu = null;
  }

  async init(x, y) {
    const mousePosition = { x, y };

    // 获取剪贴板内容
    const clipboardContent = await this.getClipboardContent();
    if (!clipboardContent) {
      this.showToast('剪贴板为空');
      return;
    }

    // 创建并显示菜单
    this.createMenu(clipboardContent, mousePosition.x, mousePosition.y);
    this.bindEvents();
  }

  async getClipboardContent() {
    try {
      const items = await navigator.clipboard.read();
      if (items.length === 0) return null;

      const item = items[0];
      
      // 检查是否是图片
      if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
        const blob = await item.getType(item.types[0]);
        return { type: 'image', data: blob };
      }
      
      // 检查是否是文本
      if (item.types.includes('text/plain')) {
        const text = await navigator.clipboard.readText();
        return { type: 'text', data: text };
      }

      return null;
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      return null;
    }
  }

  calculateMenuPosition(x, y, menuWidth, menuHeight) {
    const margin = 10; // 边距
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // 计算各个方向的可用空间
    const spaces = {
      right: viewport.width - x - margin,
      left: x - margin,
      bottom: viewport.height - y - margin,
      top: y - margin
    };

    // 默认位置（右下）
    let position = {
      x: x + margin,
      y: y + margin
    };

    // 检查右侧空间
    if (spaces.right < menuWidth) {
      // 如果右侧空间不足，改用左侧
      position.x = x - menuWidth - margin;
    }

    // 检查底部空间
    if (spaces.bottom < menuHeight) {
      // 如果底部空间不足，改用顶部
      position.y = y - menuHeight - margin;
    }

    // 确保不超出视口
    position.x = Math.max(margin, Math.min(position.x, viewport.width - menuWidth - margin));
    position.y = Math.max(margin, Math.min(position.y, viewport.height - menuHeight - margin));

    return position;
  }

  createMenu(content, x, y) {
    this.menu = document.createElement('div');
    this.menu.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px;
      z-index: 1000001;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      opacity: 0;
      transition: opacity 0.2s;
    `;

    // 根据内容类型设置菜单选项
    const buttons = content.type === 'image' ? 
      ['提取文本', '译中', '译英', '自定义'] :
      ['译中', '译英', '自定义'];

    buttons.forEach(text => {
      const button = document.createElement('button');
      button.className = 'processor-btn';
      button.textContent = text;
      button.dataset.action = text;
      this.menu.appendChild(button);
    });

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .processor-btn {
        display: block;
        width: 100%;
        padding: 6px 12px;
        margin: 2px 0;
        border: none;
        background: none;
        cursor: pointer;
        text-align: left;
        white-space: nowrap;
      }
      .processor-btn:hover {
        background: #f0f0f0;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.menu);

    // 计算菜单位置
    const position = this.calculateMenuPosition(
      x, y,
      this.menu.offsetWidth,
      this.menu.offsetHeight
    );

    // 设置菜单位置
    this.menu.style.left = `${position.x}px`;
    this.menu.style.top = `${position.y}px`;

    // 显示菜单
    requestAnimationFrame(() => {
      this.menu.style.opacity = '1';
    });
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      z-index: 1000002;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  bindEvents() {
    // 点击菜单按钮
    this.menu.addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      if (!action) return;

      this.menu.remove();
      // TODO: 处理具体的动作
    });

    // 点击其他区域关闭菜单
    document.addEventListener('click', (e) => {
      if (this.menu && !this.menu.contains(e.target)) {
        this.cleanup();
      }
    });

    // ESC键关闭菜单
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.cleanup();
      }
    });
  }

  cleanup() {
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
    }
  }
}

window.ClipboardProcessor = ClipboardProcessor; 