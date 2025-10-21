console.log('background.js 已加载');

chrome.commands.onCommand.addListener((command) => {
  console.log(`命令触发: ${command}`);
  if (command === 'simulate-typing') {
    chrome.storage.local.get('isTypingEnabled', (data) => {
      if (data.isTypingEnabled === false) {
        console.log('模拟打字已暂停');
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'simulateTyping' }, (response) => {
            console.log('快捷键响应:', response || '无响应');
          });
        } else {
          console.error('未找到活动标签页');
        }
      });
    });
  }
});