// content.js - 内容脚本，在网页中运行

console.log('Chrome插件内容脚本已加载');

// 创建插件专用的样式前缀，避免与页面样式冲突
const PLUGIN_PREFIX = 'chrome-plugin-helper';

// 插件初始化
function initializePlugin() {
    // 添加插件样式
    addPluginStyles();
    
    // 创建浮动工具栏
    createFloatingToolbar();
    
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener(handleMessage);
    
    console.log('Chrome插件内容脚本初始化完成');
}

// 添加插件专用样式
function addPluginStyles() {
    if (document.getElementById(`${PLUGIN_PREFIX}-styles`)) {
        return; // 样式已存在
    }
    
    const style = document.createElement('style');
    style.id = `${PLUGIN_PREFIX}-styles`;
    style.textContent = `
        .${PLUGIN_PREFIX}-toolbar {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 12px;
            min-width: 200px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        
        .${PLUGIN_PREFIX}-toolbar:hover {
            background: rgba(0, 0, 0, 0.9);
        }
        
        .${PLUGIN_PREFIX}-toolbar-header {
            font-weight: bold;
            margin-bottom: 8px;
            color: #4fc3f7;
        }
        
        .${PLUGIN_PREFIX}-toolbar-btn {
            display: block;
            width: 100%;
            padding: 6px 10px;
            margin: 4px 0;
            border: none;
            border-radius: 4px;
            background: #333;
            color: white;
            cursor: pointer;
            font-size: 11px;
            transition: background 0.2s ease;
        }
        
        .${PLUGIN_PREFIX}-toolbar-btn:hover {
            background: #555;
        }
        
        .${PLUGIN_PREFIX}-highlight {
            background-color: #ffeb3b !important;
            padding: 2px !important;
            border: 1px solid #fbc02d !important;
            transition: all 0.3s ease !important;
        }
        
        .${PLUGIN_PREFIX}-notification {
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
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: ${PLUGIN_PREFIX}-slideDown 0.3s ease;
        }
        
        @keyframes ${PLUGIN_PREFIX}-slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        .${PLUGIN_PREFIX}-hidden {
            opacity: 0 !important;
            pointer-events: none !important;
        }
    `;
    
    document.head.appendChild(style);
}

// 创建浮动工具栏
function createFloatingToolbar() {
    // 避免重复创建
    if (document.getElementById(`${PLUGIN_PREFIX}-toolbar`)) {
        return;
    }
    
    const toolbar = document.createElement('div');
    toolbar.id = `${PLUGIN_PREFIX}-toolbar`;
    toolbar.className = `${PLUGIN_PREFIX}-toolbar`;
    
    toolbar.innerHTML = `
        <div class="${PLUGIN_PREFIX}-toolbar-header">Chrome插件工具</div>
        <button class="${PLUGIN_PREFIX}-toolbar-btn" id="${PLUGIN_PREFIX}-highlight-all">高亮所有文本</button>
        <button class="${PLUGIN_PREFIX}-toolbar-btn" id="${PLUGIN_PREFIX}-clear-highlight">清除高亮</button>
        <button class="${PLUGIN_PREFIX}-toolbar-btn" id="${PLUGIN_PREFIX}-scroll-to-top">回到顶部</button>
        <button class="${PLUGIN_PREFIX}-toolbar-btn" id="${PLUGIN_PREFIX}-take-screenshot">📸 截图</button>
        <button class="${PLUGIN_PREFIX}-toolbar-btn" id="${PLUGIN_PREFIX}-hide-toolbar">隐藏工具栏</button>
    `;
    
    document.body.appendChild(toolbar);
    
    // 绑定工具栏按钮事件
    bindToolbarEvents();
}

// 绑定工具栏事件
function bindToolbarEvents() {
    const highlightBtn = document.getElementById(`${PLUGIN_PREFIX}-highlight-all`);
    const clearBtn = document.getElementById(`${PLUGIN_PREFIX}-clear-highlight`);
    const scrollBtn = document.getElementById(`${PLUGIN_PREFIX}-scroll-to-top`);
    const screenshotBtn = document.getElementById(`${PLUGIN_PREFIX}-take-screenshot`);
    const hideBtn = document.getElementById(`${PLUGIN_PREFIX}-hide-toolbar`);
    
    if (highlightBtn) {
        highlightBtn.addEventListener('click', highlightAllText);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearHighlight);
    }
    
    if (scrollBtn) {
        scrollBtn.addEventListener('click', scrollToTop);
    }
    
    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', takeScreenshotFromContent);
    }
    
    if (hideBtn) {
        hideBtn.addEventListener('click', hideToolbar);
    }
}

// 高亮所有文本
function highlightAllText() {
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span, li, td, th');
    let count = 0;
    
    elements.forEach(element => {
        if (element.innerText && 
            element.innerText.trim().length > 0 && 
            !element.classList.contains(`${PLUGIN_PREFIX}-toolbar`)) {
            
            element.classList.add(`${PLUGIN_PREFIX}-highlight`);
            count++;
        }
    });
    
    showNotification(`已高亮 ${count} 个文本元素`);
}

// 清除高亮
function clearHighlight() {
    const highlightedElements = document.querySelectorAll(`.${PLUGIN_PREFIX}-highlight`);
    highlightedElements.forEach(element => {
        element.classList.remove(`${PLUGIN_PREFIX}-highlight`);
    });
    
    showNotification(`已清除 ${highlightedElements.length} 个高亮元素`);
}

// 滚动到页面顶部
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    showNotification('已滚动到页面顶部');
}

// 隐藏工具栏
function hideToolbar() {
    const toolbar = document.getElementById(`${PLUGIN_PREFIX}-toolbar`);
    if (toolbar) {
        toolbar.classList.add(`${PLUGIN_PREFIX}-hidden`);
        setTimeout(() => {
            toolbar.style.display = 'none';
        }, 300);
    }
    
    // 创建显示工具栏的按钮
    createShowToolbarButton();
}

// 创建显示工具栏的按钮
function createShowToolbarButton() {
    if (document.getElementById(`${PLUGIN_PREFIX}-show-btn`)) {
        return;
    }
    
    const showBtn = document.createElement('button');
    showBtn.id = `${PLUGIN_PREFIX}-show-btn`;
    showBtn.textContent = '🔧';
    showBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 50%;
        background: #2196f3;
        color: white;
        font-size: 16px;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
    `;
    
    showBtn.addEventListener('click', showToolbar);
    showBtn.addEventListener('mouseenter', () => {
        showBtn.style.transform = 'scale(1.1)';
    });
    showBtn.addEventListener('mouseleave', () => {
        showBtn.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(showBtn);
}

// 显示工具栏
function showToolbar() {
    const toolbar = document.getElementById(`${PLUGIN_PREFIX}-toolbar`);
    const showBtn = document.getElementById(`${PLUGIN_PREFIX}-show-btn`);
    
    if (toolbar) {
        toolbar.style.display = 'block';
        toolbar.classList.remove(`${PLUGIN_PREFIX}-hidden`);
    }
    
    if (showBtn) {
        showBtn.remove();
    }
}

// 显示通知
function showNotification(message) {
    // 移除现有通知
    const existingNotification = document.querySelector(`.${PLUGIN_PREFIX}-notification`);
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `${PLUGIN_PREFIX}-notification`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// 处理来自popup的消息
function handleMessage(request, sender, sendResponse) {
    console.log('收到消息:', request);
    
    switch (request.action) {
        case 'highlight':
            highlightAllText();
            sendResponse({success: true});
            break;
            
        case 'clearHighlight':
            clearHighlight();
            sendResponse({success: true});
            break;
            
        case 'getPageInfo':
            sendResponse({
                title: document.title,
                url: window.location.href,
                wordCount: getWordCount(),
                linkCount: getLinkCount()
            });
            break;
            
        default:
            sendResponse({success: false, error: '未知操作'});
    }
}

// 获取页面字数
function getWordCount() {
    const text = document.body.innerText || document.body.textContent || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return {
        words: words.length,
        characters: text.length
    };
}

// 获取页面链接数量
function getLinkCount() {
    const links = document.querySelectorAll('a[href]');
    return Array.from(links).filter(link => 
        link.href && link.href.startsWith('http')
    ).length;
}

// 页面加载完成后初始化插件
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlugin);
} else {
    initializePlugin();
}

// 从 content script 发起截图请求
function takeScreenshotFromContent() {
    // 显示加载状态
    showNotification('正在截图...');
    
    // 发送消息给 background script 请求截图
    chrome.runtime.sendMessage({
        action: 'takeScreenshot',
        pageInfo: {
            title: document.title,
            url: window.location.href
        }
    }, (response) => {
        if (response && response.success) {
            showNotification('截图成功！请查看插件弹窗获取详情');
        } else {
            const errorMsg = response ? response.error : '未知错误';
            showNotification(`截图失败: ${errorMsg}`);
        }
    });
}

// 监听键盘快捷键（Ctrl+Shift+S 截图）
document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+S 或 Cmd+Shift+S 截图
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        takeScreenshotFromContent();
    }
});

// 添加双击截图功能（双击右上角）
let doubleClickTimer = null;
document.addEventListener('dblclick', (event) => {
    // 检查是否在右上角区域（窗口的右上 20% 区域）
    const rightTopArea = {
        x: window.innerWidth * 0.8,
        y: 0,
        width: window.innerWidth * 0.2,
        height: window.innerHeight * 0.2
    };
    
    if (event.clientX >= rightTopArea.x && 
        event.clientY >= rightTopArea.y && 
        event.clientX <= rightTopArea.x + rightTopArea.width && 
        event.clientY <= rightTopArea.y + rightTopArea.height) {
        
        event.preventDefault();
        takeScreenshotFromContent();
    }
});