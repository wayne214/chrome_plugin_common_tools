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
        
        /* 区域选择样式 */
        .${PLUGIN_PREFIX}-selection-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.3);
            z-index: 999999;
            cursor: crosshair;
            user-select: none;
        }
        
        .${PLUGIN_PREFIX}-selection-box {
            position: absolute;
            border: 2px dashed #007cff;
            background: rgba(0, 124, 255, 0.1);
            pointer-events: none;
        }
        
        .${PLUGIN_PREFIX}-selection-info {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 24px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            text-align: center;
            z-index: 1000000;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            max-width: 400px;
        }
        
        .${PLUGIN_PREFIX}-selection-controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            z-index: 1000000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        
        .${PLUGIN_PREFIX}-selection-btn {
            margin: 0 4px;
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            background: #007cff;
            color: white;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.3s ease;
            min-width: 120px;
            box-shadow: 0 2px 8px rgba(0, 124, 255, 0.3);
        }
        
        .${PLUGIN_PREFIX}-selection-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 124, 255, 0.4);
        }
        
        .${PLUGIN_PREFIX}-selection-btn.primary {
            background: linear-gradient(135deg, #007cff, #0056b3);
            font-weight: 600;
        }
        
        .${PLUGIN_PREFIX}-selection-btn.secondary {
            background: linear-gradient(135deg, #28a745, #20c997);
        }
        
        .${PLUGIN_PREFIX}-selection-btn.secondary:hover {
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
        }
        
        .${PLUGIN_PREFIX}-selection-btn.cancel {
            background: linear-gradient(135deg, #dc3545, #c82333);
        }
        
        .${PLUGIN_PREFIX}-selection-btn.cancel:hover {
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
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
    
    // 先测试消息传递是否正常
    chrome.runtime.sendMessage({
        action: 'test'
    }, (testResponse) => {
        console.log('测试消息响应:', testResponse);
        
        if (chrome.runtime.lastError) {
            console.error('测试消息失败:', chrome.runtime.lastError);
            showNotification('❌ 插件通信失败，请重新加载插件');
            return;
        }
        
        if (!testResponse || !testResponse.success) {
            console.error('后台脚本响应异常:', testResponse);
            showNotification('❌ 后台脚本异常，请检查插件状态');
            return;
        }
        
        // 测试通过，发送实际截图请求
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

// 区域选择相关变量
let isSelectingArea = false;
let selectionOverlay = null;
let selectionBox = null;
let startPoint = { x: 0, y: 0 };
let endPoint = { x: 0, y: 0 };
let selectionCallback = null;

// 开始区域选择
function startAreaSelection(callback) {
    if (isSelectingArea) {
        callback({ success: false, error: '正在选择区域中' });
        return;
    }
    
    isSelectingArea = true;
    selectionCallback = callback;
    
    // 创建覆盖层
    createSelectionOverlay();
    
    // 显示提示信息
    showSelectionInfo();
    
    callback({ success: true });
}

// 创建选择覆盖层
function createSelectionOverlay() {
    // 隐藏浮动工具栏
    const toolbar = document.getElementById(`${PLUGIN_PREFIX}-toolbar`);
    if (toolbar) {
        toolbar.style.display = 'none';
    }
    
    // 创建覆盖层
    selectionOverlay = document.createElement('div');
    selectionOverlay.className = `${PLUGIN_PREFIX}-selection-overlay`;
    
    // 创建选择框
    selectionBox = document.createElement('div');
    selectionBox.className = `${PLUGIN_PREFIX}-selection-box`;
    selectionBox.style.display = 'none';
    
    selectionOverlay.appendChild(selectionBox);
    document.body.appendChild(selectionOverlay);
    
    // 绑定事件
    selectionOverlay.addEventListener('mousedown', handleMouseDown);
    selectionOverlay.addEventListener('mousemove', handleMouseMove);
    selectionOverlay.addEventListener('mouseup', handleMouseUp);
    
    // 禁止页面滚动
    document.body.style.overflow = 'hidden';
}

// 显示选择提示信息
function showSelectionInfo() {
    const infoDiv = document.createElement('div');
    infoDiv.className = `${PLUGIN_PREFIX}-selection-info`;
    infoDiv.innerHTML = `
        <div style="font-size: 20px; margin-bottom: 12px;">✂️ 区域截图选择</div>
        <div style="margin-bottom: 8px;">拖拽鼠标选择要截图的区域</div>
        <div style="margin-bottom: 8px;">或者单击位置创建默认区域</div>
        <div style="font-size: 14px; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 8px; margin-top: 8px;">
            <div>• 按 <kbd style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px;">ESC</kbd> 取消</div>
            <div>• 支持重新选择区域</div>
        </div>
    `;
    
    selectionOverlay.appendChild(infoDiv);
    
    // 4秒后隐藏提示
    setTimeout(() => {
        if (infoDiv.parentNode) {
            infoDiv.style.opacity = '0';
            infoDiv.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => infoDiv.remove(), 300);
        }
    }, 4000);
}

// 鼠标按下事件
function handleMouseDown(event) {
    if (event.button !== 0) return; // 只处理左键
    
    startPoint = {
        x: event.clientX + window.scrollX,
        y: event.clientY + window.scrollY
    };
    
    // 初始化选择框
    selectionBox.style.left = startPoint.x + 'px';
    selectionBox.style.top = startPoint.y + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
    
    // 记录是否正在拖拽
    selectionBox.dataset.dragging = 'true';
    
    event.preventDefault();
}

// 鼠标移动事件
function handleMouseMove(event) {
    if (selectionBox.style.display === 'none' || selectionBox.dataset.dragging !== 'true') return;
    
    endPoint = {
        x: event.clientX + window.scrollX,
        y: event.clientY + window.scrollY
    };
    
    const left = Math.min(startPoint.x, endPoint.x);
    const top = Math.min(startPoint.y, endPoint.y);
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);
    
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
    
    // 更新选择框的显示样式，显示尺寸信息
    const sizeInfo = selectionBox.querySelector('.size-info');
    if (!sizeInfo && width > 0 && height > 0) {
        const info = document.createElement('div');
        info.className = 'size-info';
        info.style.cssText = `
            position: absolute;
            top: -30px;
            left: 0;
            background: rgba(0, 124, 255, 0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-family: Arial, sans-serif;
            white-space: nowrap;
            pointer-events: none;
        `;
        selectionBox.appendChild(info);
    }
    
    if (sizeInfo) {
        sizeInfo.textContent = `${Math.round(width)} × ${Math.round(height)}`;
    }
}

// 鼠标释放事件
function handleMouseUp(event) {
    if (selectionBox.style.display === 'none') return;
    
    // 停止拖拽状态
    selectionBox.dataset.dragging = 'false';
    
    const left = Math.min(startPoint.x, endPoint.x || startPoint.x);
    const top = Math.min(startPoint.y, endPoint.y || startPoint.y);
    const width = Math.abs((endPoint?.x || startPoint.x) - startPoint.x);
    const height = Math.abs((endPoint?.y || startPoint.y) - startPoint.y);
    
    // 如果没有拖拽（只是点击），创建一个默认区域
    if (width < 3 && height < 3) {
        const defaultSize = 200; // 默认200x200像素
        const newLeft = startPoint.x - defaultSize / 2;
        const newTop = startPoint.y - defaultSize / 2;
        
        // 确保默认区域不超出视口边界
        const finalLeft = Math.max(0, Math.min(newLeft, window.innerWidth - defaultSize));
        const finalTop = Math.max(0, Math.min(newTop, window.innerHeight - defaultSize));
        
        selectionBox.style.left = (finalLeft + window.scrollX) + 'px';
        selectionBox.style.top = (finalTop + window.scrollY) + 'px';
        selectionBox.style.width = defaultSize + 'px';
        selectionBox.style.height = defaultSize + 'px';
        
        showSelectionControls(finalLeft + window.scrollX, finalTop + window.scrollY, defaultSize, defaultSize);
        showNotification(`已创建默认区域 ${defaultSize}x${defaultSize}，您可以直接截图或重新选择`);
        return;
    }
    
    // 检查选择区域是否足够大（降低最小尺寸要求）
    if (width < 3 || height < 3) {
        showNotification('请选择一个区域进行截图，最小3x3像素');
        selectionBox.style.display = 'none';
        return;
    }
    
    // 显示确认按钮
    showSelectionControls(left, top, width, height);
    showNotification(`选择区域: ${Math.round(width)} × ${Math.round(height)} 像素`);
}

// 显示选择控制按钮
function showSelectionControls(left, top, width, height) {
    // 移除已存在的控制按钮
    const existingControls = selectionOverlay.querySelector(`.${PLUGIN_PREFIX}-selection-controls`);
    if (existingControls) {
        existingControls.remove();
    }
    
    const controlsDiv = document.createElement('div');
    controlsDiv.className = `${PLUGIN_PREFIX}-selection-controls`;
    controlsDiv.innerHTML = `
        <div style="margin-bottom: 15px; text-align: center;">
            <strong>选择区域:</strong> ${Math.round(width)} × ${Math.round(height)} 像素<br>
            <span style="font-size: 12px; opacity: 0.8;">可以重新拖拽选择或使用下方工具</span>
        </div>
        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="${PLUGIN_PREFIX}-selection-btn primary" data-action="save">
                📸 截图并保存
            </button>
            <button class="${PLUGIN_PREFIX}-selection-btn secondary" data-action="download">
                💾 直接下载
            </button>
            <button class="${PLUGIN_PREFIX}-selection-btn secondary" data-action="copy">
                📋 复制到剪贴板
            </button>
            <button class="${PLUGIN_PREFIX}-selection-btn cancel" data-action="cancel">
                ❌ 取消
            </button>
        </div>
    `;
    
    selectionOverlay.appendChild(controlsDiv);
    
    // 使用事件委托绑定所有按钮事件
    controlsDiv.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        console.log('工具栏按钮被点击，操作:', action);
        
        // 防止重复点击
        if (button.disabled) return;
        button.disabled = true;
        
        // 显示按钮状态
        const originalText = button.innerHTML;
        button.innerHTML = action === 'cancel' ? '⏳ 取消中...' : '⏳ 处理中...';
        
        // 延迟执行以显示状态变化
        setTimeout(() => {
            try {
                if (action === 'cancel') {
                    cancelAreaSelection();
                } else {
                    confirmAreaSelection(left, top, width, height, action);
                }
            } catch (error) {
                console.error('处理按钮点击失败:', error);
                // 恢复按钮状态
                button.disabled = false;
                button.innerHTML = originalText;
                showNotification('操作失败，请重试');
            }
        }, 100);
    });
}

// 确认区域选择
function confirmAreaSelection(left, top, width, height, action = 'save') {
    console.log('开始确认区域选择，操作:', action, '区域:', { left, top, width, height });
    
    // 计算相对于视口的位置
    const selection = {
        x: left - window.scrollX,
        y: top - window.scrollY,
        width: width,
        height: height,
        devicePixelRatio: window.devicePixelRatio || 1
    };
    
    console.log('计算的选择区域:', selection);
    
    // 显示加载状态
    const actionText = {
        'save': '保存截图',
        'download': '下载截图',
        'copy': '复制截图'
    };
    
    showNotification(`正在${actionText[action] || '处理截图'}...`);
    
    // 先测试消息传递是否正常
    chrome.runtime.sendMessage({
        action: 'test'
    }, (testResponse) => {
        console.log('测试消息响应:', testResponse);
        
        if (chrome.runtime.lastError) {
            console.error('测试消息失败:', chrome.runtime.lastError);
            showNotification('❌ 插件通信失败，请重新加载插件');
            return;
        }
        
        if (!testResponse || !testResponse.success) {
            console.error('后台脚本响应异常:', testResponse);
            showNotification('❌ 后台脚本异常，请检查插件状态');
            return;
        }
        
        // 测试通过，发送实际区域截图请求
        sendAreaScreenshotRequest(selection, action);
    });
}

// 发送区域截图请求
function sendAreaScreenshotRequest(selection, action) {
    // 发送区域截图请求给 background script
    console.log('发送消息给后台脚本:', {
        action: 'takeAreaScreenshot',
        selection: selection,
        actionType: action,
        pageInfo: {
            title: document.title,
            url: window.location.href
        }
    });
    
    chrome.runtime.sendMessage({
        action: 'takeAreaScreenshot',
        selection: selection,
        actionType: action, // 'save', 'download', 'copy'
        pageInfo: {
            title: document.title,
            url: window.location.href
        }
    }, (response) => {
        console.log('收到后台响应:', response);
        console.log('chrome.runtime.lastError:', chrome.runtime.lastError);
        
        // 检查是否有运行时错误
        if (chrome.runtime.lastError) {
            console.error('Chrome runtime 错误:', chrome.runtime.lastError);
            showNotification(`❌ 消息传递失败: ${chrome.runtime.lastError.message}`);
            return;
        }
        
        // 检查是否接收到响应
        if (!response) {
            console.error('未接收到后台响应');
            showNotification('❌ 后台脚本无响应，请检查插件状态');
            return;
        }
        
        if (response.success) {
            console.log(`${action} 操作成功`);
            switch (action) {
                case 'save':
                    showNotification('✅ 区域截图已保存！请在插件弹窗中查看');
                    break;
                case 'download':
                    showNotification('✅ 截图已开始下载！');
                    break;
                case 'copy':
                    showNotification('✅ 截图已复制到剪贴板！');
                    break;
            }
            
            // 成功后稍延迟清理界面，让用户看到成功消息
            setTimeout(() => {
                cleanupAreaSelection();
            }, 2000);
            
        } else {
            const errorMsg = response.error || '未知错误';
            console.error(`区域截图${action}失败:`, errorMsg);
            showNotification(`❌ 操作失败: ${errorMsg}`);
            
            // 失败时不清理界面，让用户可以重试
        }
    });
    
    chrome.runtime.sendMessage({
        action: 'takeAreaScreenshot',
        selection: selection,
        actionType: action, // 'save', 'download', 'copy'
        pageInfo: {
            title: document.title,
            url: window.location.href
        }
    }, (response) => {
        console.log('收到后台响应:', response);
        console.log('chrome.runtime.lastError:', chrome.runtime.lastError);
        
        // 检查是否有运行时错误
        if (chrome.runtime.lastError) {
            console.error('Chrome runtime 错误:', chrome.runtime.lastError);
            showNotification(`❌ 消息传递失败: ${chrome.runtime.lastError.message}`);
            return;
        }
        
        // 检查是否接收到响应
        if (!response) {
            console.error('未接收到后台响应');
            showNotification('❌ 后台脚本无响应，请检查插件状态');
            return;
        }
        
        if (response.success) {
            console.log(`${action} 操作成功`);
            switch (action) {
                case 'save':
                    showNotification('✅ 区域截图已保存！请在插件弹窗中查看');
                    break;
                case 'download':
                    showNotification('✅ 截图已开始下载！');
                    break;
                case 'copy':
                    showNotification('✅ 截图已复制到剪贴板！');
                    break;
            }
            
            // 成功后稍延迟清理界面，让用户看到成功消息
            setTimeout(() => {
                cleanupAreaSelection();
            }, 2000);
            
        } else {
            const errorMsg = response.error || '未知错误';
            console.error(`区域截图${action}失败:`, errorMsg);
            showNotification(`❌ 操作失败: ${errorMsg}`);
            
            // 失败时不清理界面，让用户可以重试
        }
    });
}

// 取消区域选择
function cancelAreaSelection() {
    showNotification('已取消区域选择');
    cleanupAreaSelection();
}

// 清理区域选择界面
function cleanupAreaSelection() {
    isSelectingArea = false;
    
    // 移除覆盖层
    if (selectionOverlay) {
        selectionOverlay.remove();
        selectionOverlay = null;
        selectionBox = null;
    }
    
    // 恢复页面滚动
    document.body.style.overflow = '';
    
    // 显示浮动工具栏
    const toolbar = document.getElementById(`${PLUGIN_PREFIX}-toolbar`);
    if (toolbar) {
        toolbar.style.display = 'block';
    }
    
    selectionCallback = null;
}

// 监听 ESC 键取消选择
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && isSelectingArea) {
        event.preventDefault();
        cancelAreaSelection();
    }
});

