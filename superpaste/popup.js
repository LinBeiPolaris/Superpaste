document.getElementById('pasteBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'simulateTyping' }, (response) => {
      alert(response && response.success ? '打字模拟完成！' : '失败：请确保已复制文本并聚焦输入框或启用模拟打字。');
    });
  });
});

document.getElementById('customBtn').addEventListener('click', () => {
  const text = document.getElementById('customText').value;
  if (!text) {
    alert('请输入文本！');
    return;
  }
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'simulateTyping', text }, (response) => {
      alert(response && response.success ? '打字模拟完成！' : '失败：请确保聚焦输入框或启用模拟打字。');
    });
  });
});

document.getElementById('toggleTypingBtn').addEventListener('click', () => {
  chrome.storage.local.get('isTypingEnabled', (data) => {
    const enabled = !data.isTypingEnabled;
    chrome.storage.local.set({ isTypingEnabled: enabled }, () => {
      const btn = document.getElementById('toggleTypingBtn');
      btn.textContent = enabled ? '暂停模拟打字' : '启用模拟打字';
      btn.className = enabled ? 'enabled' : '';
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleTyping', enabled }, (response) => {
          alert(response && response.success ? `模拟打字已${enabled ? '启用' : '暂停'}` : '操作失败');
        });
      });
    });
  });
});

// 初始化按钮状态
chrome.storage.local.get('isTypingEnabled', (data) => {
  const enabled = data.isTypingEnabled !== false;
  const btn = document.getElementById('toggleTypingBtn');
  btn.textContent = enabled ? '暂停模拟打字' : '启用模拟打字';
  btn.className = enabled ? 'enabled' : '';
});