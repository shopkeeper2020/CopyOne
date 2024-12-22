// 创建一个用于显示原始图片的容器
const imagePreviewContainer = document.createElement('div');
imagePreviewContainer.style.cssText = `
  position: absolute;
  display: none;
  border: 1px solid #ccc;
  background: white;
  z-index: 10000;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;
document.body.appendChild(imagePreviewContainer);

// 创建一个图片元素用于显示原始图片
const imagePreview = document.createElement('img');
imagePreview.style.cssText = `
  max-width: none; /* 确保不限制宽度 */
  max-height: none; /* 确保不限制高度 */
`;
imagePreviewContainer.appendChild(imagePreview);

// 设置变量保存原始图片的宽高
let originalWidth = 0;
let originalHeight = 0;

// 用于存储当前悬停的目标元素
let currentTarget = null;

// 添加一个缓存对象，用于存储已加载的图片信息
const imageCache = new Map();

// 添加一个新的 Map 来存储原图和翻译图片的对应关系
const imageTranslations = new Map();  // 键：原图URL，值：翻译后的图片URL

// 修改更新图片预览的函数
async function updateImagePreview(imgElement, imageUrl) {
  try {
    debug('开始更新图片预览:', imageUrl);
    
    // 检查 URL 是否有效
    if (!imageUrl) {
      throw new Error('无效的图片URL');
    }

    // 先尝试加载图片
    const img = new Image();
    img.crossOrigin = 'anonymous';  // 添加跨域支持
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        debug('图片加载成功');
        resolve();
      };
      
      img.onerror = () => {
        debug('图片加载失败:', imageUrl);
        reject(new Error('图片加载失败'));
      };
      
      img.src = imageUrl;
    });

    // 图片加载成功后，更新原始图片
    imgElement.crossOrigin = 'anonymous';  // 添加跨域支持
    imgElement.src = imageUrl;
    
    // 如果缓存中已有该图片，直接使用缓存的预览设置
    if (imageCache.has(imageUrl)) {
      const cachedImage = imageCache.get(imageUrl);
      
      if (currentTarget === imgElement && imagePreviewContainer.style.display === 'block') {
        imagePreview.crossOrigin = 'anonymous';  // 添加跨域支持
        imagePreview.src = imageUrl;
        imagePreview.style.width = `${cachedImage.displayWidth}px`;
        imagePreview.style.height = `${cachedImage.displayHeight}px`;
        updateImagePreviewPosition(event.clientX, event.clientY);
      }
      return;
    }

    // 计算显示尺寸
    const { innerWidth, innerHeight } = window;
    let displayWidth = img.width;
    let displayHeight = img.height;

    if (displayWidth > innerWidth || displayHeight > innerHeight) {
      const widthScale = innerWidth / displayWidth;
      const heightScale = innerHeight / displayHeight;
      const scale = Math.min(widthScale, heightScale, 1);

      displayWidth = displayWidth * scale;
      displayHeight = displayHeight * scale;
    }

    // 更新预览缓存
    imageCache.set(imageUrl, {
      src: imageUrl,
      width: img.width,
      height: img.height,
      displayWidth: displayWidth,
      displayHeight: displayHeight
    });

    // 更新预览显示
    if (currentTarget === imgElement && imagePreviewContainer.style.display === 'block') {
      imagePreview.src = imageUrl;
      imagePreview.style.width = `${displayWidth}px`;
      imagePreview.style.height = `${displayHeight}px`;
      updateImagePreviewPosition(event.clientX, event.clientY);
    }

    debug('图片预览更新完成');
  } catch (error) {
    debug('更新图片预览失败:', error.message);
    throw error;  // 继续抛出错误以便上层处理
  }
}

// 修改处理图片翻译的函数
async function handleImageTranslation(imgElement) {
  // 获取当前图片的 URL，优先使用 data-original-src 属性
  let currentSrc = imgElement.getAttribute('data-original-src');
  
  // 如果没有 data-original-src，则尝试获取当前图片的 src
  if (!currentSrc) {
    debug('没有 data-original-src，尝试获取当前图片的 src');
    if (imgElement.src.startsWith('http')) {
      currentSrc = imgElement.src;
    } else {
      currentSrc = new URL(imgElement.src, window.location.href).href;
    }
  }

  debug('开始处理图片翻译, 当前图片:', currentSrc);
  
  // 先检查当前图片是否有翻译记录
  if (imageTranslations.has(currentSrc)) {
    // 有翻译记录，直接切换到翻译版本
    const switchToUrl = imageTranslations.get(currentSrc);
    debug('切换到翻译版本:', switchToUrl);
    imgElement.src = switchToUrl;
    await updateImagePreview(imgElement, switchToUrl);
    return;
  }

  // 检查当前图片是否是翻译版本
  for (const [origUrl, transUrl] of imageTranslations.entries()) {
    if (transUrl === currentSrc) {
      // 是翻译版本，切换回原图
      debug('切换回原图:', origUrl);
      imgElement.src = origUrl;
      await updateImagePreview(imgElement, origUrl);
      return;
    }
  }

  // 如果没有翻译记录，请求翻译服务
  debug('没有找到翻译记录，请求翻译服务');
  try {
    // 将图片转换为 base64
    const base64Image = await convertImageToBase64(currentSrc);
    
    const response = await chrome.runtime.sendMessage({
      type: 'translate_image',
      imageUrl: base64Image,
      action: 'img_translateOriginalCh'
    });

    debug('收到翻译响应:', response);
    
    if (!response || !response.success || !response.translatedImageUrl) {
      throw new Error('翻译失败');
    }

    // 确保收到的是 base64 格式的图片
    if (!response.translatedImageUrl.startsWith('data:image')) {
      throw new Error('收到的不是有效的图片格式');
    }

    // 保存翻译记录
    imageTranslations.set(currentSrc, response.translatedImageUrl);

    // 更新图片显示
    imgElement.src = response.translatedImageUrl;
    await updateImagePreview(imgElement, response.translatedImageUrl);
    debug('翻译成功，图片已更新');

  } catch (error) {
    debug('翻译失败:', error.message);
    throw error;
  }
}

// 添加一个辅助函数来将图片转换为 base64
async function convertImageToBase64(imageUrl) {
  try {
    // 获取图片数据
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // 转换为 base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    debug('图片转换失败:', error);
    throw error;
  }
}

// 添加调试函数
function debug(...args) {
  console.log('[CopyOne]', ...args);
  // 也可以通过消息传递到background script
  chrome.runtime.sendMessage({
    type: 'debug',
    message: args.map(arg => String(arg)).join(' ')
  });
}

// 监听键盘事件
let isCtrlPressed = false;
let shouldTranslate = false;

document.addEventListener('keydown', (event) => {
  debug('Keydown event:', event.key);
  if (event.key === 'Control' && !isCtrlPressed) {
    debug('Control key pressed');
    isCtrlPressed = true;
    shouldTranslate = true;  // 标记需要翻译
  }
}, true);

document.addEventListener('keyup', async (event) => {
  if (event.key === 'Control' && isCtrlPressed) {
    debug('Control key released');
    isCtrlPressed = false;
    
    // 只有在标记需要翻译且有当前目标时才执行翻译
    if (shouldTranslate && currentTarget) {
      debug('Executing translation...');
      await handleImageTranslation(currentTarget);
      shouldTranslate = false;  // 重置标记
    }
  }
}, true);

// 更新预览图像的位置和大小
function updateImagePreviewPosition(clientX, clientY) {
    const { innerWidth, innerHeight } = window;

    // 初步计算显示位置
    let top = clientY + 10; // 默认在鼠标下方
    let left = clientX + 10; // 默认在鼠标右侧

    // 检查是否超出右边界
    if (left + imagePreview.offsetWidth > innerWidth) {
        left = clientX - imagePreview.offsetWidth - 10; // 显示在鼠标左侧
    }

    // 检查是否超出下边界
    if (top + imagePreview.offsetHeight > innerHeight) {
        top = clientY - imagePreview.offsetHeight - 30; // 显示在鼠标上方
    }

    // 如果仍然超出上边界，调整到顶部
    if (top < 0) {
        top = 10; // 离顶部10像素
    }

    // 如果仍然超出左边界，调整到左侧
    if (left < 0) {
        left = 10; // 离左侧10像素
    }

    // 考虑页面滚动
    imagePreviewContainer.style.top = `${top + window.scrollY}px`;
    imagePreviewContainer.style.left = `${left + window.scrollX}px`;
}

// 监听鼠标悬停事件
document.addEventListener('mouseover', async (event) => {
  const target = event.target;
  if (target.tagName === 'IMG' && !target.closest('.container')) {
    currentTarget = target;
    let originalSrc = target.getAttribute('data-original-src');
    
    if (!originalSrc) {
      if (target.src.startsWith('http')) {
        originalSrc = target.src;
      } else {
        originalSrc = new URL(target.src, window.location.href).href;
      }
    }

    // 检查缓存中是否已有该图片
    if (imageCache.has(originalSrc)) {
      const cachedImage = imageCache.get(originalSrc);

      // 如果图片大小比显示区域还小，则不进行预览
      if (cachedImage.width <= target.clientWidth && cachedImage.height <= target.clientHeight) {
        return;
      }

      originalWidth = cachedImage.width;
      originalHeight = cachedImage.height;
      imagePreview.src = cachedImage.src;
      imagePreview.style.width = `${cachedImage.displayWidth}px`;
      imagePreview.style.height = `${cachedImage.displayHeight}px`;
      imagePreviewContainer.style.display = 'block';
      updateImagePreviewPosition(event.clientX, event.clientY);
    } else {
      try {
        // 创建一个新的Image对象以获取原始图像的尺寸
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = originalSrc;

        img.onload = () => {
          originalWidth = img.width;
          originalHeight = img.height;

          // 如果图片大小比显示区域还小，则不进行预览
          if (originalWidth <= target.clientWidth && originalHeight <= target.clientHeight) {
            return;
          }

          // 检查是否超出边界
          const { innerWidth, innerHeight } = window;
          let displayWidth = originalWidth;
          let displayHeight = originalHeight;

          if (originalWidth > innerWidth || originalHeight > innerHeight) {
            // 超出边界，使用缩放
            const widthScale = innerWidth / originalWidth;
            const heightScale = innerHeight / originalHeight;
            const scale = Math.min(widthScale, heightScale, 1); // 确保缩放比例不超过1

            // 缩放图片
            displayWidth = originalWidth * scale;
            displayHeight = originalHeight * scale;
          }

          imagePreview.src = originalSrc;
          imagePreview.style.width = `${displayWidth}px`;
          imagePreview.style.height = `${displayHeight}px`;
          imagePreviewContainer.style.display = 'block';
          updateImagePreviewPosition(event.clientX, event.clientY);

          // 将图片信息存入缓存
          imageCache.set(originalSrc, {
            src: originalSrc,
            width: originalWidth,
            height: originalHeight,
            displayWidth: displayWidth,
            displayHeight: displayHeight
          });
        };

        img.onerror = () => {
          console.error('图片加载失败:', originalSrc);
        };
      } catch (error) {
        console.error('图片加载失败:', originalSrc, error);
      }
    }
  }
});

// 监听鼠标移动事件
document.addEventListener('mousemove', (event) => {
  if (currentTarget) {
    updateImagePreviewPosition(event.clientX, event.clientY);
  }
});

// 监听鼠标离开事件
document.addEventListener('mouseout', (event) => {
    if (event.target === currentTarget && !event.relatedTarget?.closest('#imagePreviewContainer')) {
        imagePreviewContainer.style.display = 'none';
        currentTarget = null; // 清空当前目标元素
    }
});
