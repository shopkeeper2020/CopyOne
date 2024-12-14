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
        top = clientY - imagePreview.offsetHeight - 10; // 显示在鼠标上方
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
        currentTarget = target; // 保存当前目标元素
        const originalSrc = target.getAttribute('data-original-src') || target.src;

        // 检查缓存中是否已有该图片
        if (imageCache.has(originalSrc)) {
            const cachedImage = imageCache.get(originalSrc);

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
