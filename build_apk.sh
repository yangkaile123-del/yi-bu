#!/bin/bash
# 打包 易卜.apk —— 不依赖 gradle，aapt + javac + r8/d8 + zipalign + apksigner
set -euo pipefail
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-arm64
export PATH="$JAVA_HOME/bin:$PATH"
export JAVA_TOOL_OPTIONS="-Djava.security.egd=file:/dev/urandom"

ROOT=/root/workspace/bagua
AND=$ROOT/android
OUT=$AND/build
TOOLS=$ROOT/tools
R8=$TOOLS/r8.jar
AJAR=$TOOLS/android-34/android.jar

AAPT=$(command -v aapt2 || true); [ -n "$AAPT" ] && AAPT=aapt2
BT=$(ls -d /usr/lib/android-sdk/build-tools/*/ 2>/dev/null | head -1 || true)
if [ -x "${BT}aapt" ]; then AAPT="${BT}aapt"; fi
[ -n "${AAPT:-}" ] && [ -x "$(command -v "${AAPT##*/}" 2>/dev/null || echo "$AAPT")" ] || true
command -v aapt >/dev/null && AAPT=aapt

[ -f "$AJAR" ] || { echo "缺 android.jar: $AJAR"; exit 1; }
[ -f "$R8" ]   || { echo "缺 r8.jar"; exit 1; }

echo "→ 清理"
rm -rf "$OUT"; mkdir -p "$OUT/classes" "$OUT/dex" "$AND/assets"

echo "→ 资源与图标"
python3 "$ROOT/gen_icon.py" >/dev/null

echo "→ 准备网页资源"
cp "$ROOT/易卜.html" "$AND/assets/index.html"

echo "→ aapt 打包资源与清单"
"$AAPT" package -f -M "$AND/AndroidManifest.xml" -S "$AND/res" -A "$AND/assets" \
    -I "$AJAR" -F "$OUT/base.apk"

echo "→ javac 编译 (release 8)"
javac --release 8 -encoding UTF-8 -classpath "$AJAR" -d "$OUT/classes" \
    "$AND/src/com/yg/bagua/MainActivity.java" 2>&1 | grep -v "^注:" || true

echo "→ d8 生成 dex"
java -Xmx512m -cp "$R8" com.android.tools.r8.D8 --release \
     --min-api 21 --lib "$AJAR" --output "$OUT/dex" \
     $(find "$OUT/classes" -name '*.class')

echo "→ 合入 classes.dex"
python3 "$ROOT/add_dex.py" "$OUT/base.apk" "$OUT/dex/classes.dex" "$OUT/unaligned.apk"

echo "→ zipalign"
zipalign -p -f 4 "$OUT/unaligned.apk" "$OUT/aligned.apk"

echo "→ 签名"
KS=$ROOT/tools/debug.keystore
if [ ! -f "$KS" ]; then
  keytool -genkeypair -v -keystore "$KS" -storepass android -keypass android \
    -alias debug -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=YiBu Debug,O=YG,C=CN" >/dev/null 2>&1
fi
apksigner sign --ks "$KS" --ks-pass pass:android --key-pass pass:android \
    --v1-signing-enabled true --v2-signing-enabled true \
    --out "$ROOT/易卜.apk" "$OUT/aligned.apk"

echo "→ 校验"
apksigner verify --print-certs "$ROOT/易卜.apk" | head -4
ls -lh "$ROOT/易卜.apk"
