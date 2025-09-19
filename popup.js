// popup.js - 弹出窗口的JavaScript逻辑

document.addEventListener('DOMContentLoaded', function() {
    // 获取当前活跃标签页的信息
    getCurrentTab().then(tab => {
        if (tab) {
            document.getElementById('page-title').textContent = tab.title || '无标题';
            document.getElementById('page-url').textContent = tab.url || '无URL';
        }
    });

    // 绑定按钮事件
    document.getElementById('highlight-btn').addEventListener('click', highlightText);
    document.getElementById('count-words-btn').addEventListener('click', countWords);
    document.getElementById('extract-links-btn').addEventListener('click', extractLinks);
});

// 获取当前活跃标签页
async function getCurrentTab() {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        return tab;
    } catch (error) {
        console.error('获取当前标签页失败:', error);
        return null;
    }
}

// 高亮页面文本
async function highlightText() {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: () => {
                // 在页面中执行的代码
                const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span');
                let count = 0;
                
                elements.forEach(element => {
                    if (element.innerText && element.innerText.trim().length > 0) {
                        element.style.backgroundColor = '#ffeb3b';
                        element.style.padding = '2px';
                        element.style.border = '1px solid #fbc02d';
                        count++;
                    }
                });
                
                // 显示通知
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #4caf50;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 10000;
                    font-family: Arial, sans-serif;
                `;
                notification.textContent = `已高亮 ${count} 个元素`;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 3000);
            }
        });
        
        console.log('文本高亮完成');
    } catch (error) {
        console.error('高亮文本失败:', error);
    }
}

// 统计页面字数
async function countWords() {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        const results = await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: () => {
                const text = document.body.innerText || document.body.textContent || '';
                const words = text.trim().split(/\s+/).filter(word => word.length > 0);
                return {
                    wordCount: words.length,
                    charCount: text.length
                };
            }
        });
        
        if (results && results[0] && results[0].result) {
            const {wordCount, charCount} = results[0].result;
            document.getElementById('word-count-value').textContent = `${wordCount} 词, ${charCount} 字符`;
            document.getElementById('word-count').style.display = 'block';
        }
        
    } catch (error) {
        console.error('统计字数失败:', error);
    }
}

// 提取页面链接
async function extractLinks() {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        const results = await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: () => {
                const links = document.querySelectorAll('a[href]');
                const linkData = Array.from(links).map(link => ({
                    text: link.textContent.trim(),
                    href: link.href
                })).filter(link => link.href && link.href.startsWith('http'));
                
                return linkData.length;
            }
        });
        
        if (results && results[0] && typeof results[0].result === 'number') {
            document.getElementById('link-count-value').textContent = results[0].result;
            document.getElementById('link-count').style.display = 'block';
        }
        
    } catch (error) {
        console.error('提取链接失败:', error);
    }
}

// 保存数据到Chrome存储
async function saveData(key, value) {
    try {
        await chrome.storage.local.set({[key]: value});
        console.log('数据保存成功');
    } catch (error) {
        console.error('保存数据失败:', error);
    }
}

// 从Chrome存储读取数据
async function loadData(key) {
    try {
        const result = await chrome.storage.local.get([key]);
        return result[key];
    } catch (error) {
        console.error('读取数据失败:', error);
        return null;
    }
}

// 截图功能
async function takeScreenshot() {
    try {
        // 显示加载状态
        document.getElementById('screenshot-status').textContent = '正在截图...';
        document.getElementById('screenshot-result').style.display = 'block';
        
        // 获取当前活跃的标签页
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        if (!tab) {
            throw new Error('无法获取当前标签页');
        }
        
        // 使用 chrome.tabs.captureVisibleTab API 截取当前可见区域
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
            format: 'png',
            quality: 90
        });
        
        if (!dataUrl) {
            throw new Error('截图失败，无法获取图像数据');
        }
        
        // 显示截图预览
        const previewContainer = document.getElementById('screenshot-preview');
        previewContainer.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.cssText = 'max-width: 200px; height: auto; border-radius: 4px; border: 1px solid #ddd;';
        img.alt = '截图预览';
        
        previewContainer.appendChild(img);
        
        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = `screenshot-${new Date().getTime()}.png`;
        downloadLink.textContent = '💾 下载截图';
        downloadLink.style.cssText = `
            display: inline-block;
            margin-top: 8px;
            padding: 6px 12px;
            background: #4caf50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 12px;
            transition: background 0.3s ease;
        `;
        
        downloadLink.addEventListener('mouseenter', () => {
            downloadLink.style.background = '#45a049';
        });
        
        downloadLink.addEventListener('mouseleave', () => {
            downloadLink.style.background = '#4caf50';
        });
        
        previewContainer.appendChild(document.createElement('br'));
        previewContainer.appendChild(downloadLink);
        
        // 将截图保存到存储中（可选）
        const timestamp = new Date().toISOString();
        await saveData(`screenshot_${timestamp}`, {
            dataUrl: dataUrl,
            timestamp: timestamp,
            pageTitle: tab.title,
            pageUrl: tab.url
        });
        
        document.getElementById('screenshot-status').textContent = '截图完成！';
        
        console.log('截图保存成功');
        
    } catch (error) {
        console.error('截图失败:', error);
        document.getElementById('screenshot-status').textContent = `截图失败: ${error.message}`;
        
        // 如果是权限问题，给出具体提示
        if (error.message.includes('Cannot access') || error.message.includes('permission')) {
            document.getElementById('screenshot-status').textContent = '截图失败：需要在chrome://extensions/中重新加载插件';
        }
    }
}

// 区域截图功能
async function takeAreaScreenshot() {
    try {
        // 显示状态
        document.getElementById('screenshot-status').textContent = '请在页面中选择截图区域...';
        document.getElementById('screenshot-result').style.display = 'block';
        
        // 获取当前活跃的标签页
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        if (!tab) {
            throw new Error('无法获取当前标签页');
        }
        
        // 向 content script 发送消息，启动区域选择
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'startAreaSelection'
        });
        
        if (!response || !response.success) {
            throw new Error('启动区域选择失败');
        }
        
        // 关闭弹窗，让用户在页面中进行选择
        window.close();
        
    } catch (error) {
        console.error('区域截图失败:', error);
        document.getElementById('screenshot-status').textContent = `区域截图失败: ${error.message}`;
        
        // 如果是 content script 未加载的问题
        if (error.message.includes('不能建立连接') || error.message.includes('Could not establish connection')) {
            document.getElementById('screenshot-status').textContent = '请先刷新页面，然后再试';
        }
    }
}