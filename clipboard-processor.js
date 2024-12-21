class ClipboardProcessor {
  static instance = null;

  constructor() {
    if (ClipboardProcessor.instance) {
      ClipboardProcessor.instance.cleanup();
    }
    ClipboardProcessor.instance = this;
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

  cleanup() {
    // 清理资源的方法
    ClipboardProcessor.instance = null;
  }
}

window.ClipboardProcessor = ClipboardProcessor; 