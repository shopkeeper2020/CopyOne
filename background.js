import config from './config.js';


// 图标点击处理
chrome.action.onClicked.addListener(async(tab) => {
  chrome.sidePanel.open({ tabId: tab.id });

  const settings = await config.getSettings();
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  // 如果没有设置 API Key，打开设置页面，并且获取当前标签页，如果当前标签页已经是设置页面，则不重复打开
  if(settings.qwenApiKey === '' && settings.groqApiKey === '' && settings.geminiApiKey === '' && tabs[0].url !== chrome.runtime.getURL('options.html')) {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  }
});

// 快捷键处理
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle_sidebar') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });

    const settings = await config.getSettings();
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    // 如果没有设置 API Key，打开设置页面，并且获取当前标签页，如果当前标签页已经是设置页面，则不重复打开
    if(settings.qwenApiKey === '' && settings.groqApiKey === '' && settings.geminiApiKey === '' && tabs[0].url !== chrome.runtime.getURL('options.html')) {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    }
  }
});

// 处理来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'debug') {
    console.log(`[Content Script Debug] ${message.message}`);
  } else if (message.type === 'translate_image') {
    // 获取当前标签页的 sidePanel
    chrome.sidePanel.getOptions({ tabId: sender.tab.id }).then(options => {
      // 向 sidePanel 发送消息，模拟点击按钮
      chrome.runtime.sendMessage({
        type: 'simulate_button_click',
        action: message.action,
        imageUrl: message.imageUrl
      }).then(response => {
        sendResponse(response);
      }).catch(error => {
        console.error('Translation failed:', error);
        sendResponse({ error: error.message });
      });
    });
    return true; // 保持消息通道开放
  }
});