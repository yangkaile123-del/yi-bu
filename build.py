# -*- coding: utf-8 -*-
"""合并卦数据并做完整性校验"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/data")
from p1 import P1
from p2 import P2
from p3 import P3
from p4 import P4

BAGUA = {  # 下爻→上爻
    "qian": [1, 1, 1], "dui": [1, 1, 0], "li": [1, 0, 1], "zhen": [1, 0, 0],
    "xun": [0, 1, 1], "kan": [0, 1, 0], "gen": [0, 0, 1], "kun": [0, 0, 0],
}
CN = {"qian": "乾", "dui": "兑", "li": "离", "zhen": "震",
      "xun": "巽", "kan": "坎", "gen": "艮", "kun": "坤"}
SYM = {"qian": "☰", "dui": "☱", "li": "☲", "zhen": "☳",
       "xun": "☴", "kan": "☵", "gen": "☶", "kun": "☷"}
TRIGRAM_XIANG = {"qian": "天", "dui": "泽", "li": "火", "zhen": "雷",
                 "xun": "风", "kan": "水", "gen": "山", "kun": "地"}

ALL = P1 + P2 + P3 + P4
errs = []
if len(ALL) != 64:
    errs.append(f"卦数 {len(ALL)} != 64")
nos = [g["no"] for g in ALL]
if nos != list(range(1, 65)):
    errs.append(f"序号不连续/重复: {nos}")

seen = {}
out = []
for g in ALL:
    for k in ("no", "name", "full", "up", "low", "gua", "xiang", "yao", "read", "tips", "tags"):
        if k not in g:
            errs.append(f"#{g['no']} 缺字段 {k}")
    if len(g["yao"]) != 6:
        errs.append(f"#{g['no']} {g['name']} 爻数 {len(g['yao'])}")
    lines = BAGUA[g["low"]] + BAGUA[g["up"]]   # 初爻→上爻
    key = "".join(str(x) for x in lines)
    if key in seen:
        errs.append(f"重复卦象 {key}: #{seen[key]} 与 #{g['no']}")
    seen[key] = g["no"]
    item = dict(g)
    item["bits"] = lines            # 初→上，1 阳 0 阴
    item["bitsStr"] = "".join(map(str, lines))
    item["upCn"] = CN[g["up"]]
    item["lowCn"] = CN[g["low"]]
    item["upSym"] = SYM[g["up"]]
    item["lowSym"] = SYM[g["low"]]
    item["xiangName"] = TRIGRAM_XIANG[g["up"]] + TRIGRAM_XIANG[g["low"]]  # 如 天水
    out.append(item)

if len(seen) != 64:
    errs.append(f"卦象组合只有 {len(seen)} 种")

if errs:
    print("❌ 校验失败：")
    for e in errs:
        print("  -", e)
    sys.exit(1)

dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gua.json")
with open(dst, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(f"✅ 64 卦校验通过，共 {len(out)} 卦，{sum(len(g['yao']) for g in out)} 条爻辞 -> {dst} "
      f"({os.path.getsize(dst)} 字节)")
print("抽样:", out[0]["name"], out[0]["bitsStr"], out[63]["name"], out[63]["bitsStr"])
