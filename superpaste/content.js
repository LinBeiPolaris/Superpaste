// 保存最后聚焦的输入框和功能状态
let lastFocusedInput = null;
let isTypingEnabled = true;
let isTyping = false; // 是否正在打字
let typingState = null; // 保存打字状态（文本、目标、当前位置）
// 从 storage 恢复状态和上次输入框
chrome.storage.local.get(['isTypingEnabled','lastInputSelector'], (data) => {
  if (typeof data.isTypingEnabled !== 'undefined') {
    isTypingEnabled = data.isTypingEnabled !== false;
  }
  if (data.lastInputSelector) {
    try {
      const el = document.querySelector(data.lastInputSelector);
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        lastFocusedInput = el;
      }
    } catch (e) {
      console.warn('恢复 lastInputSelector 失败', e);
    }
  }
});

// 生成输入框的唯一标识（CSS 选择器）
function getInputSelector(element) {
  if (!element) return null;
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  // 过滤空 class 项，避免产生连续的点
  const classes = element.className
    ? '.' + element.className.split(/\s+/).filter(Boolean).join('.')
    : '';
  const index = Array.from(document.querySelectorAll(`${tag}${id}${classes}`)).indexOf(element);
  return `${tag}${id}${classes}${index > -1 ? `:nth-child(${index + 1})` : ''}`;
}

// 新增：统一换行格式，防止 CRLF 被重复插入
function normalizeText(text) {
  if (typeof text !== 'string') return text;
  // 把 CRLF 和 单独的 CR 都统一为单个 LF
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

// 监听焦点变化，记录输入框
document.addEventListener('focusin', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    lastFocusedInput = e.target;
    const selector = getInputSelector(e.target);
    chrome.storage.local.set({ lastInputSelector: selector }, () => {
      console.log('保存输入框:', selector);
    });
  }
});

// 创建悬浮按钮
function createFloatingButton() {
  if (document.getElementById('simulate-typing-fab')) {
    console.log('悬浮按钮已存在');
    return;
  }
  const button = document.createElement('button');
  button.id = 'simulate-typing-fab';
  button.title = '点击模拟打字或暂停/恢复';
  button.innerHTML = '📋';
  // 固定位置样式（不可拖动）
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.width = '60px';
  button.style.height = '60px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = '#4285f4';
  button.style.color = 'white';
  button.style.fontSize = '24px';
  button.style.border = '2px solid #ffffff';
  button.style.cursor = 'pointer';
  button.style.zIndex = '9999';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  button.style.outline = 'none';
  document.body.appendChild(button);

  // 清除按钮（小）
  const clearBtn = document.createElement('button');
  clearBtn.id = 'simulate-typing-clear';
  clearBtn.title = '清除待打字内容';
  clearBtn.innerHTML = '🗑️';
  clearBtn.style.position = 'fixed';
  clearBtn.style.bottom = '26px';
  clearBtn.style.right = '90px';
  clearBtn.style.width = '36px';
  clearBtn.style.height = '36px';
  clearBtn.style.borderRadius = '50%';
  clearBtn.style.backgroundColor = '#f44336';
  clearBtn.style.color = 'white';
  clearBtn.style.fontSize = '16px';
  clearBtn.style.border = '2px solid #ffffff';
  clearBtn.style.cursor = 'pointer';
  clearBtn.style.zIndex = '9999';
  clearBtn.style.display = 'flex';
  clearBtn.style.alignItems = 'center';
  clearBtn.style.justifyContent = 'center';
  clearBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  clearBtn.style.outline = 'none';
  document.body.appendChild(clearBtn);

  console.log('悬浮按钮已创建');

  // 清除逻辑：停止并丢弃当前 typingState，恢复图标
  clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!typingState && !isTyping) {
      alert('当前无待清除的打字任务');
      return;
    }
    isTyping = false;
    typingState = null;
    // 恢复主按钮图标
    const fab = document.getElementById('simulate-typing-fab');
    if (fab) fab.innerHTML = '📋';
    alert('已清除待打字内容并停止继续输入');
    console.log('typingState 已清除');
  });

  // 保留点击触发逻辑（去除拖拽）
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isTypingEnabled) {
      alert('模拟打字已暂停，请在弹出界面启用！');
      return;
    }
    if (isTyping) {
      // 暂停打字
      isTyping = false;
      button.innerHTML = '▶️'; // 暂停时显示播放图标
      console.log('打字暂停');
      return;
    } else if (typingState) {
      // 恢复打字
      isTyping = true;
      button.innerHTML = '⏸️'; // 打字时显示暂停图标
      startTyping(typingState.text, typingState.target, typingState.index);
      return;
    }
    // 开始新打字
    navigator.clipboard.readText().then(text => {
      if (!text) {
        alert('剪贴板为空，请先复制文本！');
        return;
      }
      let target = lastFocusedInput;
      if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) {
        chrome.storage.local.get('lastInputSelector', (data) => {
          if (data.lastInputSelector) {
            target = document.querySelector(data.lastInputSelector);
            if (target) {
              target.focus();
              isTyping = true;
              button.innerHTML = '⏸️';
              simulateTyping(text, target);
            } else {
              alert('保存的输入框未找到，请重新点击输入框！');
            }
          } else {
            alert('请先点击输入框获取焦点！');
          }
        });
      } else {
        target.focus();
        isTyping = true;
        button.innerHTML = '⏸️';
        simulateTyping(text, target);
      }
    }).catch(err => {
      console.error('读取剪贴板失败:', err);
      alert('无法读取剪贴板，请确保已复制文本');
    });
  });
}

// 模拟打字函数
async function simulateTyping(text, element = null) {
  // 归一化换行，避免 CRLF 被分成两个字符而产生重复换行
  text = normalizeText(text);

  if (!text) {
    console.log('无文本可输入');
    return;
  }
  let target = element || lastFocusedInput || document.activeElement;
  if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) {
    chrome.storage.local.get('lastInputSelector', (data) => {
      if (data.lastInputSelector) {
        target = document.querySelector(data.lastInputSelector);
        if (target) {
          target.focus();
          startTyping(text, target, 0);
        } else {
          console.error('未找到保存的输入框');
          alert('请重新点击输入框获取焦点！');
          isTyping = false;
          document.getElementById('simulate-typing-fab').innerHTML = '📋';
        }
      } else {
        console.error('未找到输入框');
        alert('请先点击输入框获取焦点！');
        isTyping = false;
        document.getElementById('simulate-typing-fab').innerHTML = '📋';
      }
    });
    return;
  }
  startTyping(text, target, 0);
}

// 实际执行打字
async function startTyping(text, target, startIndex = 0) {
  target.focus();
  if (startIndex === 0) target.value = ''; // 新打字时清空
  typingState = { text, target, index: startIndex };
  for (let i = startIndex; i < text.length; i++) {
    if (!isTyping) {
      typingState.index = i; // 保存暂停位置
      return;
    }
    target.value += text[i];
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new KeyboardEvent('keydown', { key: text[i], bubbles: true }));
    target.dispatchEvent(new KeyboardEvent('keyup', { key: text[i], bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  }
  target.dispatchEvent(new Event('change', { bubbles: true }));
  console.log('模拟打字完成');
  isTyping = false;
  typingState = null;
  document.getElementById('simulate-typing-fab').innerHTML = '📋';
}

// 监听消息（支持快捷键、弹出界面和暂停功能）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request);
  if (request.action === 'simulateTyping') {
    if (!isTypingEnabled) {
      alert('模拟打字已暂停，请在弹出界面启用！');
      sendResponse({ success: false });
      return true;
    }
    if (isTyping) {
      alert('正在打字中，请暂停后再操作！');
      sendResponse({ success: false });
      return true;
    }
    const textPromise = request.text ? Promise.resolve(request.text) : navigator.clipboard.readText();
    textPromise.then(text => {
      console.log('输入文本:', text);
      simulateTyping(text, lastFocusedInput);
      sendResponse({ success: true });
    }).catch(err => {
      console.error('读取文本失败:', err);
      alert('无法读取文本，请确保已复制或输入文本');
      sendResponse({ success: false });
    });
    return true;
  } else if (request.action === 'toggleTyping') {
    isTypingEnabled = request.enabled;
    if (!isTypingEnabled && isTyping) {
      isTyping = false; // 暂停全局打字时停止当前打字
      document.getElementById('simulate-typing-fab').innerHTML = '▶️';
    }
    console.log('模拟打字状态:', isTypingEnabled ? '启用' : '暂停');
    sendResponse({ success: true });
  }
});

// 初始化悬浮按钮
createFloatingButton();