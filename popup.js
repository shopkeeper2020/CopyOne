// popup.js
document.getElementById('toggle-sidebar').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const activeTab = tabs[0];
      chrome.runtime.sendMessage({ action: 'toggleSidebar', tabId: activeTab.id });
    }
  });
});