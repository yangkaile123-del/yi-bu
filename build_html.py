# -*- coding: utf-8 -*-
"""把卦数据注入模板，生成单文件 HTML，并做语法与逻辑校验"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(ROOT, "gua.json"), encoding="utf-8"))
html = open(os.path.join(ROOT, "template.html"), encoding="utf-8").read()

payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
assert "__DATA__" in html
out = html.replace("__DATA__", payload)
dst = os.path.join(ROOT, "易卜.html")
open(dst, "w", encoding="utf-8").write(out)
print(f"生成 {dst} ({os.path.getsize(dst)/1024:.1f} KB)")

# --- 抽出 JS 做语法检查 ---
scripts = re.findall(r"<script>(.*?)</script>", out, re.S)
js = scripts[-1]
tmp = "/tmp/app_check.js"
open(tmp, "w", encoding="utf-8").write(js)
r = subprocess.run(["node", "--check", tmp], capture_output=True, text=True)
if r.returncode != 0:
    print("❌ JS 语法错误:\n", r.stderr[:2000]); sys.exit(1)
print("✅ JS 语法通过")

# --- 逻辑对拍：变卦 / 断法分支 ---
BY = {g["bitsStr"]: g for g in data}
BYNO = {g["no"]: g for g in data}

def bian(bits, moving):
    b = list(bits)
    for p in moving:
        b[p-1] ^= 1
    return BY["".join(map(str, b))]

cases = [
    (1, [1,2,3,4,5,6], 2, "乾六爻全动 → 坤"),
    (11, [1], 46, "泰初九动 → 地风升"),
    (12, [6], 45, "否上九动 → 泽地萃"),
    (63, [1,2,3], 29, "既济下三爻皆动 → 下卦离变坎，得坎为水"),
    (24, [3], 36, "复六三动 → 明夷"),
]
ok = True
for no, mv, want, desc in cases:
    got = bian(BYNO[no]["bits"], mv)
    flag = "✓" if got["no"] == want else "✗"
    if got["no"] != want: ok = False
    print(f"  {flag} {desc}：得 {got['name']}({got['no']})")

# 全部 64 卦位运算自反
for g in data:
    assert bian(g["bits"], [])["no"] == g["no"]
    assert bian(bian(g["bits"], [1,3,5])["bits"], [1,3,5])["no"] == g["no"]
print("✅ 变卦运算自反性通过")

# 断法条目覆盖检查（源码里六个分支）
for token in ["六爻不动", "一爻动", "二爻动", "三爻动", "四爻动", "五爻动", "六爻全动"]:
    if token not in js:
        print("❌ 缺断法分支:", token); ok = False
print("✅ 断法分支齐全" if ok else "❌ 有问题")
sys.exit(0 if ok else 1)
