#!/usr/bin/env python3
"""
简单的PNG图标生成脚本
"""

def create_simple_png_icons():
    """创建简单的PNG图标文件"""
    
    # 简单的16x16蓝色PNG（base64编码）
    png_16_data = """iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABdJREFUOI1jZGBg+M9AAWBhGDVg1ABSA1QAAIB2AAF7UNDwAAAAAElFTkSuQmCC"""
    
    # 32x32
    png_32_data = """iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABdJREFUWIXt1EERACAIQEG2/6VBwGQ8nM4DAAD8jwYOOOCAAw444IADDjjggAP+nwEAAAAAAAAAAAAAAAAAAHjRAKQTAAGE9+OyAAAAAElFTkSuQmCC"""
    
    # 48x48
    png_48_data = """iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABdJREFUaIHt1kERAAAIA6H939pQwGQ8nPYAAAD8jwYOOOCAAw444IADDjjggAP+nwEAAAAAAAAAAAAAAAAAAHjRAKQTAAGE9+OyAAAAAElFTkSuQmCC"""
    
    # 128x128
    png_128_data = """iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABdJREFUeJztwQEBAAAAgiD/r25IQAEAAAAAAAAAAAAAAAAAAAAAAAAAwKsGJ8QAAQ4EhTQAAAAASUVORK5CYII="""
    
    import base64
    
    # 写入文件
    icons = [
        ('icon16.png', png_16_data),
        ('icon32.png', png_32_data),
        ('icon48.png', png_48_data),
        ('icon128.png', png_128_data)
    ]
    
    for filename, data in icons:
        try:
            with open(filename, 'wb') as f:
                f.write(base64.b64decode(data))
            print(f"创建了 {filename}")
        except Exception as e:
            print(f"创建 {filename} 失败: {e}")

if __name__ == "__main__":
    create_simple_png_icons()