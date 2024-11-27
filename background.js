let isSidebarOpen = false;

// 图标点击处理
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// 快捷键处理
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle_sidebar') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
  }
});