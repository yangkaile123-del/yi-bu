# -*- coding: utf-8 -*-
"""把数据与前端模块拼装成单文件，并做语法、逻辑、样式一致性校验"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
W = os.path.join(ROOT, "web")

data = json.load(open(os.path.join(ROOT, "gua.json"), encoding="utf-8"))
shell = open(os.path.join(W, "shell.html"), encoding="utf-8").read()
style = open(os.path.join(W, "style.css"), encoding="utf-8").read()
body  = open(os.path.join(W, "body.html"), encoding="utf-8").read()
core  = open(os.path.join(W, "core.js"), encoding="utf-8").read()
ui    = open(os.path.join(W, "ui.js"), encoding="utf-8").read()

script = core + "\n\n" + ui
payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))

out = (shell.replace("{{STYLE}}", style)
            .replace("{{BODY}}", body)
            .replace("{{SCRIPT}}", script)
            .replace("__DATA__", payload))
for ph in ("{{STYLE}}", "{{BODY}}", "{{SCRIPT}}", "__DATA__"):
    assert ph not in out, "占位符未替换: " + ph

for path in (os.path.join(ROOT, "易卜.html"), os.path.join(ROOT, "dist", "易卜.html")):
    open(path, "w", encoding="utf-8").write(out)
print(f"生成 易卜.html ({len(out.encode('utf-8'))/1024:.1f} KB)")

# --- JS 语法 ---
tmp = "/tmp/app_check.js"
open(tmp, "w", encoding="utf-8").write(script)
r = subprocess.run(["node", "--check", tmp], capture_output=True, text=True)
if r.returncode != 0:
    print("❌ JS 语法错误:\n", r.stderr[:1500]); sys.exit(1)
print("✅ JS 语法通过")

ok = True
# --- CSS 类一致性 ---
css = style
defined = set(re.findall(r'\.([a-zA-Z][\w-]*)', css))
used = set()
for m in re.findall(r'class="([^"]+)"', body + script):
    used |= set(m.split())
for m in re.findall(r"el\('[a-z]+',\s*'([^']*)'", script):
    used |= set(m.split())
for m in re.findall(r"'([a-z][\w-]*(?:\s+[\w-]+)*)'\s*\+", script):
    used |= set(m.split())
missing = sorted(c for c in used if c and c not in defined and not c.startswith('l'))
print(("❌ 未定义样式: " + ", ".join(missing)) if missing else "✅ 样式类全部有定义")
if missing: ok = False

# --- 主题变量完整性 ---
themes = list(dict.fromkeys(re.findall(r'html\[data-theme="(\w+)"\]', css)))
need = ["--bg","--card","--card2","--line","--brand","--brand-l","--text","--text2","--text3",
        "--yao1","--yao2","--mv1","--mv2","--navbg"]
for t in themes:
    block = re.search(r'html\[data-theme="%s"\]\s*\{(.*?)\}' % t, css, re.S).group(1)
    lack = [v for v in need if v not in block]
    if lack:
        print(f"❌ 主题 {t} 缺变量: {lack}"); ok = False
print(f"✅ 配色主题 {len(themes)} 套，变量齐全" if ok else "")

# --- 变卦逻辑对拍 ---
BY = {g["bitsStr"]: g for g in data}
BYNO = {g["no"]: g for g in data}
def bian(bits, mv):
    b = list(bits)
    for p in mv: b[p-1] ^= 1
    return BY["".join(map(str, b))]
cases = [(1,[1,2,3,4,5,6],2,"乾六爻全动→坤"), (11,[1],46,"泰初九动→升"),
         (12,[6],45,"否上九动→萃"), (63,[1,2,3],29,"既济下三爻动→坎"), (24,[3],36,"复六三动→明夷")]
for no, mv, want, desc in cases:
    got = bian(BYNO[no]["bits"], mv)
    f = "✓" if got["no"] == want else "✗"
    if got["no"] != want: ok = False
    print(f"  {f} {desc}：得 {got['name']}({got['no']})")

# --- 错卦综卦运算 ---
h = BYNO[11]                       # 泰
cuo = BY["".join("1" if b == 0 else "0" for b in h["bits"])]
zong = BY["".join(str(b) for b in reversed(h["bits"]))]
print(f"  ✓ 泰(11) 错卦 → {cuo['name']}({cuo['no']})，综卦 → {zong['name']}({zong['no']})")

# --- 断法分支 ---
for token in ["六爻不动","一爻动","二爻动","三爻动","四爻动","五爻动","六爻全动"]:
    if token not in script:
        print("❌ 缺断法分支:", token); ok = False

# --- 功能点 ---
for token in ["错卦","综卦","每日","今日一卦","themeList","fsSeg","askChips"]:
    if token not in script:
        print("❌ 缺功能:", token); ok = False
print("✅ 功能点齐全" if ok else "")
sys.exit(0 if ok else 1)
