#!/bin/bash
# 准备 APK 构建环境（Debian/Ubuntu，aarch64 或 x86_64 均可）
# 不使用 gradle：aapt + javac + r8/d8 + zipalign + apksigner
set -euo pipefail

ROOT=$(cd "$(dirname "$0")" && pwd)
TOOLS=$ROOT/tools
mkdir -p "$TOOLS"

echo "→ apt 安装 JDK 与安卓打包工具"
DEBIAN_FRONTEND=noninteractive apt-get update -qq || true
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    openjdk-17-jdk-headless aapt apksigner zipalign curl ca-certificates

echo "→ 下载 android.jar (API 34)"
if [ ! -f "$TOOLS/android-34/android.jar" ]; then
    python3 - <<'PY'
import urllib.request, zipfile, io, os
url = "https://dl.google.com/android/repository/platform-34-ext7_r02.zip"
print("   下载", url)
data = urllib.request.urlopen(urllib.request.Request(
    url, headers={"User-Agent": "Mozilla/5.0"}), timeout=300).read()
zipfile.ZipFile(io.BytesIO(data)).extractall(os.path.join("tools"))
PY
fi

echo "→ 下载 r8 (dex 编译器，纯 Java，架构无关)"
if [ ! -f "$TOOLS/r8.jar" ]; then
    python3 - <<'PY'
import urllib.request
url = "https://maven.aliyun.com/repository/google/com/android/tools/r8/8.2.42/r8-8.2.42.jar"
print("   下载", url)
d = urllib.request.urlopen(urllib.request.Request(
    url, headers={"User-Agent": "Mozilla/5.0"}), timeout=300).read()
open("tools/r8.jar", "wb").write(d)
PY
fi

echo "✅ 环境就绪，运行 bash build_apk.sh 打包"
