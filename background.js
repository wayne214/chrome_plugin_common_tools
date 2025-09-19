// background.js - 后台服务工作脚本

console.log('Chrome插件后台脚本已启动');

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
    console.log('插件安装详情:', details);
    
    switch (details.reason) {
        case 'install':
            console.log('插件首次安装');
            handleFirstInstall();
            break;
        case 'update':
            console.log('插件已更新');
            handleUpdate(details.previousVersion);
            break;
        case 'chrome_update':
            console.log('Chrome浏览器已更新');
            break;
    }
});

// 处理首次安装
function handleFirstInstall() {
    // 设置默认配置
    const defaultSettings = {
        autoHighlight: false,
        showToolbar: true,
        theme: 'default',
        notifications: true,
        version: '1.0.0',
        installDate: new Date().toISOString()
    };
    
    chrome.storage.local.set(defaultSettings, () => {
        console.log('默认设置已保存');
    });
    
    // 创建右键菜单
    createContextMenus();
}

// 处理插件更新
function handleUpdate(previousVersion) {
    console.log(`插件从版本 ${previousVersion} 更新到当前版本`);
    
    // 这里可以处理版本迁移逻辑
    chrome.storage.local.get(['version'], (result) => {
        if (result.version !== '1.0.0') {
            // 执行版本迁移
            migrateSettings();
        }
    });
}

// 迁移设置
function migrateSettings() {
    chrome.storage.local.set({ version: '1.0.0' }, () => {
        console.log('设置迁移完成');
    });
}

// 创建右键菜单
function createContextMenus() {
    // 移除现有菜单项（避免重复）
    chrome.contextMenus.removeAll(() => {
        // 主菜单
        chrome.contextMenus.create({
            id: 'plugin-main-menu',
            title: '我的Chrome插件',
            contexts: ['page', 'selection', 'link']
        });
        
        // 高亮选中文本
        chrome.contextMenus.create({
            id: 'highlight-selection',
            parentId: 'plugin-main-menu',
            title: '高亮选中文本',
            contexts: ['selection']
        });
        
        // 复制页面标题
        chrome.contextMenus.create({
            id: 'copy-page-title',
            parentId: 'plugin-main-menu',
            title: '复制页面标题',
            contexts: ['page']
        });
        
        // 复制页面URL
        chrome.contextMenus.create({
            id: 'copy-page-url',
            parentId: 'plugin-main-menu',
            title: '复制页面URL',
            contexts: ['page']
        });
        
        // 分隔符
        chrome.contextMenus.create({
            id: 'separator-1',
            parentId: 'plugin-main-menu',
            type: 'separator',
            contexts: ['page']
        });
        
        // 页面分析
        chrome.contextMenus.create({
            id: 'analyze-page',
            parentId: 'plugin-main-menu',
            title: '分析当前页面',
            contexts: ['page']
        });
        
        // 截图功能
        chrome.contextMenus.create({
            id: 'take-screenshot',
            parentId: 'plugin-main-menu',
            title: '📸 截取当前页面',
            contexts: ['page']
        });
        
        console.log('右键菜单创建完成');
    });
}

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('右键菜单被点击:', info);
    
    switch (info.menuItemId) {
        case 'highlight-selection':
            handleHighlightSelection(info, tab);
            break;
        case 'copy-page-title':
            handleCopyPageTitle(tab);
            break;
        case 'copy-page-url':
            handleCopyPageUrl(tab);
            break;
        case 'analyze-page':
            handleAnalyzePage(tab);
            break;
        case 'take-screenshot':
            handleTakeScreenshot(tab);
            break;
    }
});

// 高亮选中文本
async function handleHighlightSelection(info, tab) {
    if (info.selectionText) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: (selectedText) => {
                    // 查找并高亮选中的文本
                    const walker = document.createTreeWalker(
                        document.body,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                    );
                    
                    let node;
                    let count = 0;
                    while (node = walker.nextNode()) {
                        if (node.textContent.includes(selectedText)) {
                            const parent = node.parentElement;
                            if (parent && !parent.classList.contains('chrome-plugin-helper-toolbar')) {
                                parent.style.backgroundColor = '#ffeb3b';
                                parent.style.padding = '2px';
                                parent.style.border = '1px solid #fbc02d';
                                count++;
                            }
                        }
                    }
                    
                    // 显示通知
                    const notification = document.createElement('div');
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #4caf50;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 6px;
                        z-index: 10001;
                        font-family: Arial, sans-serif;
                    `;
                    notification.textContent = `已高亮 ${count} 处包含"${selectedText}"的文本`;
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 3000);
                },
                args: [info.selectionText]
            });
        } catch (error) {
            console.error('高亮选中文本失败:', error);
        }
    }
}

// 复制页面标题
async function handleCopyPageTitle(tab) {
    try {
        await navigator.clipboard.writeText(tab.title);
        showNotification('页面标题已复制到剪贴板');
    } catch (error) {
        console.error('复制页面标题失败:', error);
    }
}

// 复制页面URL
async function handleCopyPageUrl(tab) {
    try {
        await navigator.clipboard.writeText(tab.url);
        showNotification('页面URL已复制到剪贴板');
    } catch (error) {
        console.error('复制页面URL失败:', error);
    }
}

// 分析页面
async function handleAnalyzePage(tab) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const analysis = {
                    title: document.title,
                    url: window.location.href,
                    wordCount: 0,
                    linkCount: 0,
                    imageCount: 0,
                    headingCount: 0,
                    paragraphCount: 0
                };
                
                // 统计字数
                const text = document.body.innerText || '';
                analysis.wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
                
                // 统计各种元素
                analysis.linkCount = document.querySelectorAll('a[href]').length;
                analysis.imageCount = document.querySelectorAll('img').length;
                analysis.headingCount = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
                analysis.paragraphCount = document.querySelectorAll('p').length;
                
                return analysis;
            }
        });
        
        if (results && results[0] && results[0].result) {
            const analysis = results[0].result;
            
            // 将分析结果保存到存储中
            chrome.storage.local.set({
                [`analysis_${tab.id}`]: {
                    ...analysis,
                    timestamp: new Date().toISOString()
                }
            });
            
            console.log('页面分析完成:', analysis);
            showNotification('页面分析完成，请查看插件弹窗获取详细信息');
        }
    } catch (error) {
        console.error('页面分析失败:', error);
    }
}

// 处理来自content script和popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('后台收到消息:', request);
    
    switch (request.action) {
        case 'getSettings':
            handleGetSettings(sendResponse);
            break;
        case 'saveSettings':
            handleSaveSettings(request.settings, sendResponse);
            break;
        case 'getAnalysis':
            handleGetAnalysis(request.tabId, sendResponse);
            break;
        case 'takeScreenshot':
            handleTakeScreenshotRequest(sender, sendResponse);
            break;
        default:
            sendResponse({ success: false, error: '未知操作' });
    }
    
    return true; // 保持消息通道开放
});

// 获取设置
function handleGetSettings(sendResponse) {
    chrome.storage.local.get(null, (result) => {
        sendResponse({ success: true, settings: result });
    });
}

// 保存设置
function handleSaveSettings(settings, sendResponse) {
    chrome.storage.local.set(settings, () => {
        if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError });
        } else {
            sendResponse({ success: true });
        }
    });
}

// 获取页面分析结果
function handleGetAnalysis(tabId, sendResponse) {
    chrome.storage.local.get([`analysis_${tabId}`], (result) => {
        const analysis = result[`analysis_${tabId}`];
        sendResponse({ success: true, analysis: analysis || null });
    });
}

// 显示系统通知
function showNotification(message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '我的Chrome插件',
        message: message
    });
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log(`标签页 ${tabId} 加载完成: ${tab.url}`);
        
        // 可以在这里执行一些页面加载完成后的操作
        chrome.storage.local.get(['autoHighlight'], (result) => {
            if (result.autoHighlight) {
                // 自动高亮功能
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    function: () => {
                        // 自动高亮主要内容
                        const mainContent = document.querySelector('main, article, .content, #content');
                        if (mainContent) {
                            mainContent.style.backgroundColor = '#fffde7';
                            mainContent.style.padding = '10px';
                            mainContent.style.border = '2px solid #ffeb3b';
                        }
                    }
                }).catch(error => {
                    console.log('自动高亮失败:', error);
                });
            }
        });
    }
});

// 监听标签页激活
chrome.tabs.onActivated.addListener((activeInfo) => {
    console.log(`切换到标签页: ${activeInfo.tabId}`);
});

// 监听窗口焦点变化
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        console.log('浏览器失去焦点');
    } else {
        console.log(`窗口 ${windowId} 获得焦点`);
    }
});

console.log('Chrome插件后台脚本初始化完成');

// 处理截图功能
async function handleTakeScreenshot(tab) {
    try {
        console.log('开始截图:', tab.id);
        
        // 使用 chrome.tabs.captureVisibleTab API 截取当前可见区域
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
            format: 'png',
            quality: 90
        });
        
        if (!dataUrl) {
            throw new Error('截图失败，无法获取图像数据');
        }
        
        // 保存截图到存储中
        const timestamp = new Date().toISOString();
        const screenshotData = {
            dataUrl: dataUrl,
            timestamp: timestamp,
            pageTitle: tab.title,
            pageUrl: tab.url,
            tabId: tab.id
        };
        
        await chrome.storage.local.set({
            [`screenshot_${timestamp}`]: screenshotData
        });
        
        // 在页面中显示通知
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: (title) => {
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #4caf50;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    z-index: 10001;
                    font-family: Arial, sans-serif;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                `;
                notification.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 4px;">📸 截图完成</div>
                    <div style="font-size: 12px; opacity: 0.9;">${title}</div>
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 4000);
            },
            args: [tab.title]
        });
        
        // 显示系统通知
        showNotification(`截图完成: ${tab.title}`);
        
        console.log('截图保存成功:', timestamp);
        
        // 清理旧的截图（保留最近20张）
        await cleanupOldScreenshots();
        
    } catch (error) {
        console.error('截图失败:', error);
        
        // 在页面中显示错误通知
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: (errorMsg) => {
                    const notification = document.createElement('div');
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #f44336;
                        color: white;
                        padding: 12px 20px;
                        border-radius: 6px;
                        z-index: 10001;
                        font-family: Arial, sans-serif;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    `;
                    notification.innerHTML = `
                        <div style="font-weight: bold; margin-bottom: 4px;">❌ 截图失败</div>
                        <div style="font-size: 12px; opacity: 0.9;">${errorMsg}</div>
                    `;
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 5000);
                },
                args: [error.message]
            });
        } catch (notificationError) {
            console.error('显示错误通知失败:', notificationError);
        }
    }
}

// 清理旧的截图（保留最近20张）
async function cleanupOldScreenshots() {
    try {
        const allData = await chrome.storage.local.get(null);
        const screenshots = [];
        
        for (const [key, value] of Object.entries(allData)) {
            if (key.startsWith('screenshot_') && value.timestamp) {
                screenshots.push({ key, timestamp: value.timestamp });
            }
        }
        
        // 按时间降序排列
        screenshots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (screenshots.length > 20) {
            const keysToRemove = screenshots.slice(20).map(item => item.key);
            for (const key of keysToRemove) {
                await chrome.storage.local.remove(key);
            }
            console.log(`清理了 ${keysToRemove.length} 张旧截图`);
        }
    } catch (error) {
        console.error('清理旧截图失败:', error);
    }
}

// 处理来自 content script 的截图请求
async function handleTakeScreenshotRequest(sender, sendResponse) {
    try {
        if (!sender.tab) {
            throw new Error('无法获取标签页信息');
        }
        
        await handleTakeScreenshot(sender.tab);
        sendResponse({ success: true });
        
    } catch (error) {
        console.error('处理截图请求失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}