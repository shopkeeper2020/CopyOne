import config from './config.js';
import { DEFAULT_PROMPTS, MODEL_OPTIONS } from './modelService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await config.getSettings();
  
  // 初始化 API Keys
  document.getElementById('qwenApiKey').value = settings.qwenApiKey || '';
  document.getElementById('groqApiKey').value = settings.groqApiKey || '';
  document.getElementById('geminiApiKey').value = settings.geminiApiKey || '';
  document.getElementById('baiduClientId').value = settings.baiduClientId || '';
  document.getElementById('baiduClientSecret').value = settings.baiduClientSecret || '';

  // 初始化基础模式的图片设置
  const imageVendor = document.getElementById('imageVendor');
  const imageModelSelect = document.getElementById('imageModelSelect');
  const imageModelInput = document.getElementById('imageModelInput');

  imageVendor.value = settings.imageVendor || 'qwen';
  updateModelOptions('image', imageVendor.value, imageModelSelect);

  if (isModelInList(imageVendor.value, 'image', settings.imageModel)) {
    imageModelSelect.value = settings.imageModel;
    imageModelInput.style.display = 'none';
  } else {
    imageModelSelect.value = 'custom';
    imageModelInput.style.display = 'block';
    imageModelInput.value = settings.imageModel || '';
  }

  // 初始化基础模式的文本设置
  const textVendor = document.getElementById('textVendor');
  const textModelSelect = document.getElementById('textModelSelect');
  const textModelInput = document.getElementById('textModelInput');

  textVendor.value = settings.textVendor || 'qwen';
  updateModelOptions('text', textVendor.value, textModelSelect);

  if (isModelInList(textVendor.value, 'text', settings.textModel)) {
    textModelSelect.value = settings.textModel;
    textModelInput.style.display = 'none';
  } else {
    textModelSelect.value = 'custom';
    textModelInput.style.display = 'block';
    textModelInput.value = settings.textModel || '';
  }

  // 添加厂商变更事件监听器
  imageVendor.addEventListener('change', () => {
    updateModelOptions('image', imageVendor.value, imageModelSelect);
    imageModelInput.style.display = 'none';
  });

  textVendor.addEventListener('change', () => {
    updateModelOptions('text', textVendor.value, textModelSelect);
    textModelInput.style.display = 'none';
  });

  // 添加模型选择变更事件监听器
  imageModelSelect.addEventListener('change', () => {
    imageModelInput.style.display = imageModelSelect.value === 'custom' ? 'block' : 'none';
  });

  textModelSelect.addEventListener('change', () => {
    textModelInput.style.display = textModelSelect.value === 'custom' ? 'block' : 'none';
  });

  // 添加图片高级模式切换处理
  const imageAdvancedMode = document.getElementById('imageAdvancedMode');
  const imageBasicSettings = document.getElementById('imageBasicSettings');
  const imageAdvancedSettings = document.getElementById('imageAdvancedSettings');
  const imagePromptGroup = document.querySelector('.form-group:has(#imagePrompt)');  // 获取自定义图片提示词的容器

  // 初始化高级模式状态
  imageAdvancedMode.checked = settings.imageAdvancedMode || false;
  imageBasicSettings.style.display = imageAdvancedMode.checked ? 'none' : 'block';
  imageAdvancedSettings.style.display = imageAdvancedMode.checked ? 'block' : 'none';
  imagePromptGroup.style.display = imageAdvancedMode.checked ? 'none' : 'block';

  // 监听高级模式切换
  imageAdvancedMode.addEventListener('change', () => {
    imageBasicSettings.style.display = imageAdvancedMode.checked ? 'none' : 'block';
    imageAdvancedSettings.style.display = imageAdvancedMode.checked ? 'block' : 'none';
    imagePromptGroup.style.display = imageAdvancedMode.checked ? 'none' : 'block';

    // 同步自定义提示词内容
    const customPromptInput = document.querySelector('.prompt-input[data-function="img_custom"]');
    const imagePromptInput = document.getElementById('imagePrompt');
    
    if (imageAdvancedMode.checked) {
      // 切换到高级模式时，将基础模式的内容同步到高级模式
      customPromptInput.value = imagePromptInput.value;
    } else {
      // 切换到基础模式时，将高级模式的内容同步到基础模式
      imagePromptInput.value = customPromptInput.value;
    }
  });

  // 监听两个提示词输入框的变化，保持同步
  const customPromptInput = document.querySelector('.prompt-input[data-function="img_custom"]');
  const imagePromptInput = document.getElementById('imagePrompt');

  customPromptInput.addEventListener('input', () => {
    if (!imageAdvancedMode.checked) return;  // 只在高级模式时同步
    imagePromptInput.value = customPromptInput.value;
  });

  imagePromptInput.addEventListener('input', () => {
    if (imageAdvancedMode.checked) return;  // 只在基础模式时同步
    customPromptInput.value = imagePromptInput.value;
  });

  // 初始化所有功能的厂商和模型选择
  const functions = ['extract', 'img_translateCh', 'img_translateEn', 'img_custom', 'img_translateOriginalCh', 'img_translateOriginalEn'];
  functions.forEach(func => {
    const vendorSelect = document.querySelector(`.vendor-select[data-function="${func}"]`);
    const modelSelect = document.querySelector(`.model-select[data-function="${func}"]`);
    const modelInput = document.querySelector(`.model-input[data-function="${func}"]`);

    // 设置初始值
    vendorSelect.value = settings[`${func}Vendor`] || settings.imageVendor || 'qwen';
    updateModelOptions('image', vendorSelect.value, modelSelect);

    const savedModel = settings[`${func}Model`] || settings.imageModel;
    if (MODEL_OPTIONS[vendorSelect.value]?.image.includes(savedModel)) {
      modelSelect.value = savedModel;
      modelInput.style.display = 'none';
    } else {
      modelSelect.value = 'custom';
      modelInput.style.display = 'block';
      modelInput.value = savedModel || '';
    }

    // 添加事件监听
    vendorSelect.addEventListener('change', () => {
      updateModelOptions('image', vendorSelect.value, modelSelect);
      updateModelListLink(vendorSelect.value, vendorSelect.closest('.model-input-group').querySelector('.model-list-link'));
    });

    modelSelect.addEventListener('change', () => {
      modelInput.style.display = modelSelect.value === 'custom' ? 'block' : 'none';
    });
  });

  // 填充通用设置
  document.getElementById('historyLimit').value = settings.historyLimit || 100;
  document.getElementById('qwenApiKey').value = settings.qwenApiKey || '';
  document.getElementById('groqApiKey').value = settings.groqApiKey || '';
  document.getElementById('geminiApiKey').value = settings.geminiApiKey || '';

  // 初始化所有提示词输入框
  document.querySelectorAll('.prompt-input').forEach(input => {
    const func = input.dataset.function;
    input.value = settings[`${func}Prompt`] || DEFAULT_PROMPTS[func] || '';
  });

  // 添加事件监听器
  imageVendor.addEventListener('change', () => updateModelOptions('image', imageVendor.value));
  textVendor.addEventListener('change', () => updateModelOptions('text', textVendor.value));
  
  imageModelSelect.addEventListener('change', () => {
    imageModelInput.style.display = imageModelSelect.value === 'custom' ? 'block' : 'none';
  });
  
  textModelSelect.addEventListener('change', () => {
    textModelInput.style.display = textModelSelect.value === 'custom' ? 'block' : 'none';
  });

  // 修改 API Key /隐藏按钮的事件监听器
  document.querySelectorAll('.toggle-visibility-btn').forEach(button => {
    button.addEventListener('click', () => {
      const inputId = button.dataset.for;
      const input = document.getElementById(inputId);
      const icon = button.querySelector('.toggle-icon');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.src = 'icons/隐藏.png';
      } else {
        input.type = 'password';
        icon.src = 'icons/显示.png';
      }
    });
  });

  // 初始化文本设置区域
  const textAdvancedMode = document.getElementById('textAdvancedMode');
  const textBasicSettings = document.getElementById('textBasicSettings');
  const textAdvancedSettings = document.getElementById('textAdvancedSettings');
  const textPromptGroup = document.querySelector('.form-group:has(#textPrompt)');  // 获取自定义文本提示词的容器

  // 初始化高级模式状态
  textAdvancedMode.checked = settings.textAdvancedMode || false;
  textBasicSettings.style.display = textAdvancedMode.checked ? 'none' : 'block';
  textAdvancedSettings.style.display = textAdvancedMode.checked ? 'block' : 'none';
  textPromptGroup.style.display = textAdvancedMode.checked ? 'none' : 'block';

  // 监听高级模式切换
  textAdvancedMode.addEventListener('change', () => {
    textBasicSettings.style.display = textAdvancedMode.checked ? 'none' : 'block';
    textAdvancedSettings.style.display = textAdvancedMode.checked ? 'block' : 'none';
    textPromptGroup.style.display = textAdvancedMode.checked ? 'none' : 'block';

    // 同步自定义提示词内容
    const customPromptInput = document.querySelector('.prompt-input[data-function="text_custom"]');
    const textPromptInput = document.getElementById('textPrompt');
    
    if (textAdvancedMode.checked) {
      // 切换到高级模式时，将基础模式的内容同步到高级模式
      customPromptInput.value = textPromptInput.value;
    } else {
      // 切换到基础模式时，将高级模式的内容同步到基础模式
      textPromptInput.value = customPromptInput.value;
    }
  });

  // 监听两个提示词输入框的变化，保持同步
  const textCustomPromptInput = document.querySelector('.prompt-input[data-function="text_custom"]');
  const textPromptInput = document.getElementById('textPrompt');

  textCustomPromptInput.addEventListener('input', () => {
    if (!textAdvancedMode.checked) return;  // 只在高级模式时同步
    textPromptInput.value = textCustomPromptInput.value;
  });

  textPromptInput.addEventListener('input', () => {
    if (textAdvancedMode.checked) return;  // 只在基础模式时同步
    textCustomPromptInput.value = textPromptInput.value;
  });

  // 初始化文本功能的高级设置
  const textFunctions = ['text_translateCh', 'text_translateEn', 'text_custom'];
  textFunctions.forEach(func => {
    const vendorSelect = document.querySelector(`.vendor-select[data-function="${func}"]`);
    const modelSelect = document.querySelector(`.model-select[data-function="${func}"]`);
    const modelInput = document.querySelector(`.model-input[data-function="${func}"]`);

    if (!vendorSelect || !modelSelect || !modelInput) {
      console.error(`Missing elements for function: ${func}`);
      return;
    }

    // 设置初始值
    vendorSelect.value = settings[`${func}Vendor`] || settings.textVendor || 'qwen';
    updateModelOptions('text', vendorSelect.value, modelSelect);

    const savedModel = settings[`${func}Model`] || settings.textModel;
    if (isModelInList(vendorSelect.value, 'text', savedModel)) {
      modelSelect.value = savedModel;
      modelInput.style.display = 'none';
    } else {
      modelSelect.value = 'custom';
      modelInput.style.display = 'block';
      modelInput.value = savedModel || '';
    }

    // 添加事件监听
    vendorSelect.addEventListener('change', () => {
      updateModelOptions('text', vendorSelect.value, modelSelect);
      updateModelListLink(vendorSelect.value, vendorSelect.closest('.model-input-group').querySelector('.model-list-link'));
    });

    modelSelect.addEventListener('change', () => {
      modelInput.style.display = modelSelect.value === 'custom' ? 'block' : 'none';
    });
  });

  // 填充自定义提示词
  document.getElementById('imagePrompt').value = settings.img_customPrompt || '';
  document.getElementById('textPrompt').value = settings.text_customPrompt || '';

  // 初始化聊天框背景设置
  const chatBackground = document.getElementById('chatBackground');
  chatBackground.checked = settings.chatBackground || false;

  // 修改聊天框背景设置的处理
  chatBackground.addEventListener('change', async () => {
    try {
      // 获取当前所有设置
      const currentSettings = await config.getSettings();
      
      // 更新背景设置
      const newSettings = {
        ...currentSettings,
        chatBackground: chatBackground.checked
      };
      
      // 保存设置
      await config.saveSettings(newSettings);
      
      // 不再显示成功提示
      // showStatus('背景设置已保存', 'success');  // 移除这行
    } catch (error) {
      console.error('保存背景设置失败:', error);
      showStatus('保存失败', 'error');
      // 恢复开关状态
      chatBackground.checked = !chatBackground.checked;
    }
  });

  // 修改保存按钮的事件处理
  document.getElementById('saveBtn').addEventListener('click', async () => {
    // 验证基础模式下的自定义模型输入
    if (!document.getElementById('imageAdvancedMode').checked) {
      const imageModelSelect = document.getElementById('imageModelSelect');
      const imageModelInput = document.getElementById('imageModelInput');
      if (imageModelSelect.value === 'custom' && !imageModelInput.value.trim()) {
        showStatus('请输入图片处理的自定义模型名称', 'error');
        imageModelInput.focus();
        return;
      }
    }

    if (!document.getElementById('textAdvancedMode').checked) {
      const textModelSelect = document.getElementById('textModelSelect');
      const textModelInput = document.getElementById('textModelInput');
      if (textModelSelect.value === 'custom' && !textModelInput.value.trim()) {
        showStatus('请输入文本处理的自定义模型名称', 'error');
        textModelInput.focus();
        return;
      }
    }

    // 验证高级模式下的自定义模型输入
    if (document.getElementById('imageAdvancedMode').checked) {
      const functions = ['extract', 'img_translateCh', 'img_translateEn', 'img_custom', 'img_translateOriginalCh', 'img_translateOriginalEn'];
      for (const func of functions) {
        const modelSelect = document.querySelector(`.model-select[data-function="${func}"]`);
        const modelInput = document.querySelector(`.model-input[data-function="${func}"]`);
        if (modelSelect.value === 'custom' && !modelInput.value.trim()) {
          showStatus(`请输入${getFunctionName(func)}的自定义模型名称`, 'error');
          modelInput.focus();
          return;
        }
      }
    }

    if (document.getElementById('textAdvancedMode').checked) {
      const functions = ['text_translateCh', 'text_translateEn', 'text_custom'];
      for (const func of functions) {
        const modelSelect = document.querySelector(`.model-select[data-function="${func}"]`);
        const modelInput = document.querySelector(`.model-input[data-function="${func}"]`);
        if (modelSelect.value === 'custom' && !modelInput.value.trim()) {
          showStatus(`请输入${getFunctionName(func)}的自定义模型名称`, 'error');
          modelInput.focus();
          return;
        }
      }
    }

    // 如果验证都通过，继续原有的保存逻辑
    const newSettings = {
      // 通用设置
      historyLimit: parseInt(document.getElementById('historyLimit').value) || 100,
      
      // API Keys
      qwenApiKey: document.getElementById('qwenApiKey').value.trim(),
      groqApiKey: document.getElementById('groqApiKey').value.trim(),
      geminiApiKey: document.getElementById('geminiApiKey').value.trim(),
      
      // 图片基础设置
      imageVendor: document.getElementById('imageVendor').value,
      imageModel: document.getElementById('imageModelSelect').value === 'custom' 
        ? document.getElementById('imageModelInput').value 
        : document.getElementById('imageModelSelect').value,
      imageAdvancedMode: document.getElementById('imageAdvancedMode').checked,
      
      // 文本基础设置
      textVendor: document.getElementById('textVendor').value,
      textModel: document.getElementById('textModelSelect').value === 'custom' 
        ? document.getElementById('textModelInput').value 
        : document.getElementById('textModelSelect').value,
      textAdvancedMode: document.getElementById('textAdvancedMode').checked,
      
      // 基础提示词 - 修改这里的属性名以匹配 config.js 中的处理
      img_customPrompt: document.getElementById('imagePrompt').value.trim(),
      text_customPrompt: document.getElementById('textPrompt').value.trim(),
      chatBackground: document.getElementById('chatBackground').checked,
      baiduClientId: document.getElementById('baiduClientId').value.trim(),
      baiduClientSecret: document.getElementById('baiduClientSecret').value.trim(),
    };

    // 图片高级模式设置
    if (document.getElementById('imageAdvancedMode').checked) {
      ['extract', 'img_translateCh', 'img_translateEn', 'img_custom', 'img_translateOriginalCh', 'img_translateOriginalEn'].forEach(func => {
        const vendorSelect = document.querySelector(`.vendor-select[data-function="${func}"]`);
        const modelSelect = document.querySelector(`.model-select[data-function="${func}"]`);
        const modelInput = document.querySelector(`.model-input[data-function="${func}"]`);
        const promptInput = document.querySelector(`.prompt-input[data-function="${func}"]`);

        newSettings[`${func}Vendor`] = vendorSelect.value;
        newSettings[`${func}Model`] = modelSelect.value === 'custom' 
          ? modelInput.value 
          : modelSelect.value;
        newSettings[`${func}Prompt`] = promptInput.value.trim();
      });
    }

    // 文本高级模式设置
    if (document.getElementById('textAdvancedMode').checked) {
      ['text_translateCh', 'text_translateEn', 'text_custom'].forEach(func => {
        const vendorSelect = document.querySelector(`.vendor-select[data-function="${func}"]`);
        const modelSelect = document.querySelector(`.model-select[data-function="${func}"]`);
        const modelInput = document.querySelector(`.model-input[data-function="${func}"]`);
        const promptInput = document.querySelector(`.prompt-input[data-function="${func}"]`);

        newSettings[`${func}Vendor`] = vendorSelect.value;
        newSettings[`${func}Model`] = modelSelect.value === 'custom' 
          ? modelInput.value 
          : modelSelect.value;
        newSettings[`${func}Prompt`] = promptInput.value.trim();
      });
    }

    try {
      console.log('Saving settings:', newSettings);
      await config.saveSettings(newSettings);
      showStatus('设置已保存', 'success');
      
      // 保存后重新加载设置以验证
      const savedSettings = await config.getSettings();
      console.log('Saved settings:', savedSettings);

      // 重新填充表单以显示保存的值
      document.getElementById('imagePrompt').value = savedSettings.img_customPrompt || '';
      document.getElementById('textPrompt').value = savedSettings.text_customPrompt || '';
    } catch (error) {
      console.error('保存设置失败:', error);
      showStatus('保存失败: ' + error.message, 'error');
    }
  });

  // 添加辅助函数用于获取功能的中文名称
  function getFunctionName(func) {
    const functionNames = {
      'extract': '提取文本',
      'img_translateCh': '图片译中',
      'img_translateEn': '图片译英',
      'img_custom': '图片自定义',
      'text_translateCh': '文本译中',
      'text_translateEn': '文本译英',
      'text_custom': '文本自定义',
      'img_translateOriginalCh': '原图译中',
      'img_translateOriginalEn': '原图译英'
    };
    return functionNames[func] || func;
  }

  // 添加快捷键监听
  document.addEventListener('keydown', async (e) => {
    // 检查是否按下 Ctrl+S (Windows) 或 Command+S (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault(); // 阻止浏览器默认的保存行为
      
      // 触发保存按钮的点击事件
      document.getElementById('saveBtn').click();
    }
  });

  // 添加恢复默认值按钮到每个提示词输入框旁边
  document.querySelectorAll('.prompt-input').forEach(input => {
    const func = input.dataset.function;
    const container = input.parentElement;
    
    // 恢复按钮
    const resetButton = document.createElement('button');
    resetButton.className = 'reset-prompt-btn';
    resetButton.innerHTML = '恢复默认值';
    resetButton.style.cssText = `
      padding: 4px 8px;
      margin-top: 4px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;
    
    // 添加点击事件
    resetButton.addEventListener('click', () => {
      // 查是否有默认提示词
      const defaultPrompt = DEFAULT_PROMPTS[func];
      if (defaultPrompt === undefined) {
        showStatus('该功能没有默认提示词', 'error');
        return;
      }
      
      showConfirmDialog(
        '确定要恢复默认提示词吗？',
        '此操作将覆盖当前的自定义提示词。',
        () => {
          input.value = defaultPrompt;
          showStatus('已恢复默认提示词', 'success');
        }
      );
    });
    
    // 将按钮添加到容器中
    container.appendChild(resetButton);
  });

  // 添加确认对话框函数
  function showConfirmDialog(title, message, onConfirm) {
    // 创建对话框容器
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog-overlay';
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    // 创建对话框内容
    const content = document.createElement('div');
    content.className = 'confirm-dialog';
    content.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      width: 90%;
    `;

    // 添加标题
    const titleElement = document.createElement('h3');
    titleElement.style.cssText = `
      margin: 0 0 10px 0;
      font-size: 18px;
      color: #333;
    `;
    titleElement.textContent = title;

    // 添加消息
    const messageElement = document.createElement('p');
    messageElement.style.cssText = `
      margin: 0 0 20px 0;
      color: #666;
      font-size: 14px;
    `;
    messageElement.textContent = message;

    // 添加按钮容器
    const buttons = document.createElement('div');
    buttons.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    `;

    // 创建确认按钮
    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确定';
    confirmButton.style.cssText = `
      padding: 6px 12px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    confirmButton.addEventListener('click', () => {
      onConfirm();
      dialog.remove();
    });

    // 创建取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.style.cssText = `
      padding: 6px 12px;
      background: #f5f5f5;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    cancelButton.addEventListener('click', () => {
      dialog.remove();
    });

    // 组装对话框
    buttons.appendChild(cancelButton);
    buttons.appendChild(confirmButton);
    content.appendChild(titleElement);
    content.appendChild(messageElement);
    content.appendChild(buttons);
    dialog.appendChild(content);

    // 添加到页面
    document.body.appendChild(dialog);
  }

  // 触发设置加载完成事件
  document.dispatchEvent(new Event('settingsLoaded'));

  // 添加放大编辑功能
  const modal = document.createElement('div');
  modal.className = 'textarea-modal';
  modal.innerHTML = `
    <div class="textarea-modal-content">
      <div class="modal-header">
        <h3 class="modal-title"></h3>
      </div>
      <textarea></textarea>
      <div class="textarea-modal-buttons">
        <button class="save-btn">保存</button>
        <button class="cancel-btn">取消</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // 为所有文本框添加放大功能
  document.querySelectorAll('.textarea-container').forEach(container => {
    const textarea = container.querySelector('textarea');
    const expandBtn = container.querySelector('.expand-btn');
    const modalTextarea = modal.querySelector('textarea');
    const modalTitle = modal.querySelector('.modal-title');
    const saveBtn = modal.querySelector('.save-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    expandBtn.addEventListener('click', () => {
      // 设置标题
      const functionNames = {
        'extract': '提取文本',
        'img_translateCh': '图片译中',
        'img_translateEn': '图片译英',
        'img_custom': '图片自定义',
        'text_translateCh': '文本译中',
        'text_translateEn': '文本译英',
        'text_custom': '文本自定义'
      };
      const funcId = textarea.dataset.function || textarea.id;
      modalTitle.textContent = `编辑提示词 - ${functionNames[funcId] || funcId}`;

      modalTextarea.value = textarea.value;
      modal.style.display = 'block';
      modalTextarea.focus();
      document.body.classList.add('modal-open');
      
      // 保存当前正在编辑的文本框引用
      modal.dataset.currentTextarea = funcId;
    });

    saveBtn.addEventListener('click', () => {
      const currentTextarea = document.querySelector(`textarea[data-function="${modal.dataset.currentTextarea}"], #${modal.dataset.currentTextarea}`);
      if (currentTextarea) {
        currentTextarea.value = modalTextarea.value;
        currentTextarea.dispatchEvent(new Event('input'));
      }
      closeModal();
    });

    cancelBtn.addEventListener('click', closeModal);
  });

  // 点击遮罩层关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // ESC 键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      closeModal();
    }
  });

  // 修改关闭模态框的处理
  function closeModal() {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  // 添加更新快捷键显示的函数
  async function updateShortcutDisplay() {
    try {
      const commands = await chrome.commands.getAll();
      const toggleCommand = commands.find(cmd => cmd.name === 'toggle_sidebar');
      if (toggleCommand) {
        const shortcutInput = document.getElementById('shortcut');
        shortcutInput.value = toggleCommand.shortcut || 'Not set';
      }
    } catch (error) {
      console.error('Failed to get shortcuts:', error);
    }
  }

  // 初始加载时更新快捷键显示
  await updateShortcutDisplay();

  // 添加快捷键链接的点击处理
  const shortcutLink = document.getElementById('shortcutLink');
  shortcutLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: 'chrome://extensions/shortcuts'
    });
  });

  // 监听窗口焦点变化，当用户从快捷键设置页面返回时更新显示
  window.addEventListener('focus', async () => {
    await updateShortcutDisplay();
  });

  // 为所有厂商选择器添加事件监听
  const vendorSelectors = document.querySelectorAll('select[id$="Vendor"], .vendor-select');
  vendorSelectors.forEach(vendorSelect => {
    vendorSelect.addEventListener('change', () => {
      const type = vendorSelect.id?.includes('text') || vendorSelect.dataset.function?.includes('text') ? 'text' : 'image';
      const modelSelect = vendorSelect.closest('.form-group')?.querySelector('select[id$="ModelSelect"], .model-select');
      if (modelSelect) {
        updateModelOptions(type, vendorSelect.value, modelSelect);
      }
    });
  });
});

function updateModelOptions(type, vendor, selectElement) {
  // 如果没有提供特定的 select 元素，使用默认的
  const select = selectElement || document.getElementById(`${type}ModelSelect`);
  const models = MODEL_OPTIONS[vendor]?.[type] || [];
  
  // 获取已存在的输入框
  const modelInputGroup = select.closest('.model-input-group');
  const modelInput = modelInputGroup.querySelector('.model-input');
  
  // 清除现有选项，保留自定义选项
  select.innerHTML = '<option value="custom">自定义输入</option>';
  
  // 添加新选项
  if (type === 'text') {
    models.forEach(model => {
      const option = document.createElement('option');
      if (typeof model === 'string') {
        option.value = model;
        option.textContent = model;
      } else {
        option.value = model.value;
        option.textContent = `${model.value} 📷`;
        option.title = '此模型同时支持图片和文本处理';
      }
      select.appendChild(option);
    });
  } else {
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      select.appendChild(option);
    });
  }

  // 更新模型列表链接
  const link = modelInputGroup.querySelector('.model-list-link');
  if (link) {
    updateModelListLink(vendor, link);
  }

  // 根据选择显示/隐藏输入框
  select.addEventListener('change', () => {
    if (modelInput) {
      modelInput.style.display = select.value === 'custom' ? 'block' : 'none';
    }
  });

  // 初始化时也要检查是否显示输入框
  if (modelInput) {
    modelInput.style.display = select.value === 'custom' ? 'block' : 'none';
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  // 使用动画结束事件来隐藏提示
  status.addEventListener('animationend', () => {
    status.style.display = 'none';
  }, { once: true }); // 确保事件监听器只触发一次
}

// 辅助函数：检查模型是否在列表中
function isModelInList(vendor, type, model) {
  const models = MODEL_OPTIONS[vendor]?.[type] || [];
  return models.some(m => {
    if (typeof m === 'string') {
      return m === model;
    } else {
      return m.value === model;
    }
  });
}

// 更新模型列表链接
function updateModelListLink(vendor, linkElement) {
  if (!linkElement) return;

  const links = {
    qwen: {
      url: 'https://help.aliyun.com/zh/model-studio/getting-started/models#cf6cc4aa2aokf',
      text: '查看通义千问模型列表'
    },
    gemini: {
      url: 'https://ai.google.dev/gemini-api/docs/models/gemini?hl=zh-cn#model-versions',
      text: '查看 Gemini 模型列表'
    },
    groq: {
      url: 'https://console.groq.com/docs/models',
      text: '查看 Groq 模型列表'
    }
  };

  const linkInfo = links[vendor] || { url: '#', text: '' };
  linkElement.href = linkInfo.url;
  linkElement.textContent = linkInfo.text;
  
  // 添加新标签页打开属性
  linkElement.target = '_blank';
  linkElement.rel = 'noopener noreferrer';  // 添加安全属性
}