# Superpaste

轻量 Edge/Chrome 插件，模拟人工打字将剪贴板或自定义文本逐字符输入到页面中的输入框/文本域，常用于绕过禁止粘贴的场景。
比如：学习通！！！！
<img width="1185" height="495" alt="image" src="https://github.com/user-attachments/assets/2f45d15f-8e6a-4d58-bab7-f0433d6381e2" />
## 主要特点
- 模拟“人类打字”逐字符输入，支持随机延迟以更接近真实输入行为。
- 悬浮按钮（固定位置）方便触发：点击开始/暂停/恢复输入。
- <img width="236" height="140" alt="image" src="https://github.com/user-attachments/assets/3b1d8d9f-99ef-4381-bdf8-76e56bf79e3e" />
- 新增“清除”按钮：停止并丢弃当前未完成的打字任务，防止继续粘贴。
- <img width="84" height="66" alt="image" src="https://github.com/user-attachments/assets/534cce69-81c8-4125-aaf0-0e3ea0ab4065" />
- 支持从剪贴板或弹出窗口输入自定义文本。
- <img width="409" height="401" alt="image" src="https://github.com/user-attachments/assets/421d6e32-b422-45ce-8fee-31fcd9002caa" />
- 支持启用/暂停全局功能（通过 popup 设置），并保存上次聚焦的输入框位置以便恢复。
- 对换行进行了归一化处理（CRLF -> LF），避免出现重复换行的问题。

## 使用说明
1. 安装/加载扩展（开发者模式）到 Edge/Chrome。（直接将文件夹拖到开发者扩展页面即可）
2. 在目标页面点击需要输入的输入框或文本域（插件会记录最后聚焦的输入框）。
3. 通过悬浮按钮点击从剪贴板粘贴，或打开插件弹出窗口输入自定义文本并触发。
4. 可以点击悬浮按钮暂停当前输入，或点击垃圾桶图标清除剩余待输入内容以停止后续输入。

## 权限
- clipboardRead：读取剪贴板文本（需用户允许）。
- activeTab：向当前选项卡注入消息。
- storage：保存启用状态和上次聚焦输入框定位选择器。

## 已知问题与注意事项
- 某些页面对 KeyboardEvent 有额外处理，可能需额外兼容性调整（例如 contentEditable 区域或富文本编辑器）。
- 需要页面允许脚本执行并能操作目标输入框；在某些安全策略严格的页面可能失效。
- 读取剪贴板在无用户手势的情况下可能被浏览器限制。

## 开发与贡献
- 目录结构（主要）：manifest.json、background.js、content.js、popup.html、popup.js、content.css。
- 欢迎提交 issue / PR，描述目标站点和复现步骤以便改进兼容性。

## 许可
选择合适的开源许可（例如 MIT）并在仓库中添加 LICENSE 文件。
