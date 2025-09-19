# Icon Generation Instructions

由于Chrome插件需要PNG格式的图标，您可以使用以下方法将SVG转换为PNG：

## 方法1: 使用在线转换工具
1. 访问 https://convertio.co/svg-png/ 或类似的在线转换工具
2. 上传SVG文件（icons/目录下的icon16.svg, icon32.svg, icon48.svg, icon128.svg）
3. 下载转换后的PNG文件
4. 重命名为对应的 icon16.png, icon32.png, icon48.png, icon128.png

## 方法2: 使用命令行工具（如果已安装ImageMagick）
```bash
# 安装ImageMagick (macOS)
brew install imagemagick

# 转换SVG到PNG
convert icons/icon16.svg icons/icon16.png
convert icons/icon32.svg icons/icon32.png
convert icons/icon48.svg icons/icon48.png
convert icons/icon128.svg icons/icon128.png
```

## 方法3: 临时使用base64编码的简单PNG图标
如果您希望快速测试插件，可以使用我们提供的临时PNG文件。