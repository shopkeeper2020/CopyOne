document.addEventListener('DOMContentLoaded', () => {
  // 为所有提示词文本框添加自动调整高度功能
  const textareas = document.querySelectorAll('.prompt-input, #imagePrompt, #textPrompt');
  
  textareas.forEach(textarea => {
    // 等待一小段时间后进行初始调整，确保内容已加载
    setTimeout(() => {
      adjustTextareaHeight(textarea);
    }, 100);
    
    // 监听输入事件
    textarea.addEventListener('input', () => {
      adjustTextareaHeight(textarea);
    });

    // 监听值变化事件（用于处理程序设置值的情况）
    const observer = new MutationObserver(() => {
      adjustTextareaHeight(textarea);
    });
    observer.observe(textarea, { attributes: true, attributeFilter: ['value'] });
  });

  // 监听设置加载完成事件
  document.addEventListener('settingsLoaded', () => {
    textareas.forEach(textarea => {
      adjustTextareaHeight(textarea);
    });
  });
});

function adjustTextareaHeight(element) {
  // 保存当前滚动位置
  const scrollPos = window.scrollY;
  
  // 临时设置高度为 auto 来获取实际内容高度
  element.style.height = 'auto';
  
  // 获取内容实际高度
  const scrollHeight = element.scrollHeight;
  
  // 计算新高度，确保在最小和最大高度之间
  const newHeight = Math.min(Math.max(scrollHeight, 80), 200);
  
  // 设置新高度
  element.style.height = newHeight + 'px';
  
  // 恢复滚动位置
  window.scrollTo(0, scrollPos);
} 