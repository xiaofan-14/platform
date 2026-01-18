#!/bin/bash

set -e  # 遇到错误立即退出

echo '开始安装Agent'

# 获取下载基础URL
# 优先级: 命令行参数 > 环境变量 > 自动检测
if [ -n "$1" ]; then
  BASE_URL="$1"
elif [ -n "$BASE_URL" ]; then
  # 使用环境变量
  :
else
  # 尝试从脚本位置推断（适用于直接下载脚本文件后执行的情况）
  SCRIPT_PATH="${BASH_SOURCE[0]}"
  if [[ "$SCRIPT_PATH" == *"http"* ]]; then
    BASE_URL="${SCRIPT_PATH%/*}"
  else
    echo "错误: 无法自动检测下载URL"
    echo "使用方法:"
    echo "  curl -sSL https://your-domain.com/agent/install.sh | bash -s https://your-domain.com/agent"
    echo "  或"
    echo "  BASE_URL=https://your-domain.com/agent bash <(curl -sSL https://your-domain.com/agent/install.sh)"
    exit 1
  fi
fi

# 确保 BASE_URL 以 / 结尾（如果是 URL）
if [[ "$BASE_URL" == *"http"* ]] && [[ "$BASE_URL" != *"/" ]]; then
  BASE_URL="${BASE_URL}/"
fi

echo "下载地址: $BASE_URL"

# 检测操作系统
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m | tr '[:upper:]' '[:lower:]')"

# 标准化架构名称
case "$ARCH" in
  x86_64)
    ARCH="amd64"
    ;;
  aarch64|arm64)
    ARCH="arm64"
    ;;
  *)
    echo "不支持的架构: $ARCH"
    exit 1
    ;;
esac

# 根据操作系统和架构确定文件名
case "$OS" in
  linux)
    BINARY_NAME="agent-linux-${ARCH}"
    ;;
  darwin)
    BINARY_NAME="agent-darwin-${ARCH}"
    ;;
  *)
    echo "不支持的操作系统: $OS"
    exit 1
    ;;
esac

echo "检测到系统: $OS, 架构: $ARCH"
echo "下载文件: $BINARY_NAME"

# 下载Agent可执行文件
DOWNLOAD_URL="${BASE_URL}/${BINARY_NAME}"

# 检查是否支持curl或wget
if command -v curl &> /dev/null; then
  echo "使用 curl 下载..."
  curl -L -o "$BINARY_NAME" "$DOWNLOAD_URL"
elif command -v wget &> /dev/null; then
  echo "使用 wget 下载..."
  wget -O "$BINARY_NAME" "$DOWNLOAD_URL"
else
  echo "错误: 需要 curl 或 wget 来下载文件"
  exit 1
fi

# 检查下载是否成功
if [ ! -f "$BINARY_NAME" ]; then
  echo "错误: 下载失败"
  exit 1
fi

# 添加执行权限
chmod +x "$BINARY_NAME"

echo "下载完成: $BINARY_NAME"
echo "开始执行Agent..."

# 立即执行一次
echo "执行Agent..."
./"$BINARY_NAME"

# 获取可执行文件的绝对路径
BINARY_PATH="$(pwd)/$BINARY_NAME"
SERVICE_NAME="agent-service"

echo "配置系统服务..."

# 根据操作系统创建服务
case "$OS" in
  linux)
    # 检测是否使用 systemd
    if command -v systemctl &> /dev/null && [ -d /etc/systemd/system ]; then
      echo "使用 systemd 创建服务..."
      
      # 创建 systemd 服务文件
      SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
      
      sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Agent Service
After=network.target

[Service]
Type=simple
ExecStart=${BINARY_PATH}
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
EOF
      
      # 重新加载 systemd
      sudo systemctl daemon-reload
      
      # 启用服务（开机自启）
      sudo systemctl enable "${SERVICE_NAME}.service"
      
      # 启动服务
      sudo systemctl start "${SERVICE_NAME}.service"
      
      echo "服务已创建并启动: ${SERVICE_NAME}"
      echo "使用以下命令管理服务:"
      echo "  查看状态: sudo systemctl status ${SERVICE_NAME}"
      echo "  停止服务: sudo systemctl stop ${SERVICE_NAME}"
      echo "  重启服务: sudo systemctl restart ${SERVICE_NAME}"
      
    elif [ -d /etc/init.d ]; then
      # 使用 init.d (SysV)
      echo "使用 init.d 创建服务..."
      
      SERVICE_FILE="/etc/init.d/${SERVICE_NAME}"
      
      sudo tee "$SERVICE_FILE" > /dev/null <<EOF
#!/bin/bash
# chkconfig: 2345 90 10
# description: Agent Service

case "\$1" in
  start)
    ${BINARY_PATH} &
    echo \$! > /var/run/${SERVICE_NAME}.pid
    ;;
  stop)
    if [ -f /var/run/${SERVICE_NAME}.pid ]; then
      kill \$(cat /var/run/${SERVICE_NAME}.pid)
      rm /var/run/${SERVICE_NAME}.pid
    fi
    ;;
  restart)
    \$0 stop
    \$0 start
    ;;
  *)
    echo "Usage: \$0 {start|stop|restart}"
    exit 1
    ;;
esac
EOF
      
      sudo chmod +x "$SERVICE_FILE"
      
      # 设置开机自启（根据不同的发行版）
      if command -v chkconfig &> /dev/null; then
        sudo chkconfig --add "${SERVICE_NAME}"
        sudo chkconfig "${SERVICE_NAME}" on
      elif command -v update-rc.d &> /dev/null; then
        sudo update-rc.d "${SERVICE_NAME}" defaults
      fi
      
      # 启动服务
      sudo service "${SERVICE_NAME}" start
      
      echo "服务已创建并启动: ${SERVICE_NAME}"
    else
      echo "警告: 无法检测到支持的服务管理器（systemd 或 init.d）"
      echo "请手动配置服务"
    fi
    ;;
    
  darwin)
    # macOS 使用 launchd
    echo "使用 launchd 创建服务..."
    
    SERVICE_FILE="${HOME}/Library/LaunchAgents/com.${SERVICE_NAME}.plist"
    
    # 创建 LaunchAgent plist 文件
    cat > "$SERVICE_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.${SERVICE_NAME}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${BINARY_PATH}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${HOME}/Library/Logs/${SERVICE_NAME}.log</string>
  <key>StandardErrorPath</key>
  <string>${HOME}/Library/Logs/${SERVICE_NAME}.error.log</string>
</dict>
</plist>
EOF
    
    # 加载服务
    launchctl load "$SERVICE_FILE" 2>/dev/null || launchctl load -w "$SERVICE_FILE"
    
    # 启动服务
    launchctl start "com.${SERVICE_NAME}"
    
    echo "服务已创建并启动: com.${SERVICE_NAME}"
    echo "使用以下命令管理服务:"
    echo "  查看状态: launchctl list | grep ${SERVICE_NAME}"
    echo "  停止服务: launchctl stop com.${SERVICE_NAME}"
    echo "  卸载服务: launchctl unload ${SERVICE_FILE}"
    ;;
    
  *)
    echo "警告: 不支持的操作系统，无法创建系统服务"
    ;;
esac

echo "完成安装"