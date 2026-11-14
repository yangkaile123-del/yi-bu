# -*- coding: utf-8 -*-
"""零依赖生成应用图标 PNG（纯 zlib 手写，无 PIL）"""
import zlib, struct, os, math

BG   = (14, 18, 16, 255)      # 墨黑绿
GOLD = (200, 168, 75, 255)    # 铜金
GOLD2= (229, 205, 130, 255)

def png_write(path, w, h, px):
    """px: bytearray RGBA"""
    raw = bytearray()
    stride = w * 4
    for y in range(h):
        raw.append(0)
        raw += px[y*stride:(y+1)*stride]
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
    out = b"\x89PNG\r\n\x1a\n"
    out += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    out += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    out += chunk(b"IEND", b"")
    open(path, "wb").write(out)

def rounded_rect(x, y, w, h, r):
    """返回点是否在圆角矩形内"""
    cx = min(max(x, r), w - r); cy = min(max(y, r), h - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r

def draw(size, ss=3):
    S = size * ss
    # 设计：圆角方底 + 外圈金环 + 三道爻线（乾）
    pad = S * 0.03
    r   = S * 0.24
    cx = cy = S / 2
    ring_r  = S * 0.385
    ring_w  = S * 0.030
    bar_w   = S * 0.46
    bar_h   = S * 0.062
    ys = [S * 0.355, S * 0.5, S * 0.645]
    px = bytearray(size * size * 4)
    for py in range(size):
        for px_ in range(size):
            ar = ag = ab = aa = 0
            for sy in range(ss):
                for sx in range(ss):
                    x = px_ * ss + sx + 0.5
                    y = py * ss + sy + 0.5
                    col = (0, 0, 0, 0)
                    if rounded_rect(x - pad, y - pad, S - 2 * pad, S - 2 * pad, r):
                        col = BG
                        d = math.hypot(x - cx, y - cy)
                        if abs(d - ring_r) <= ring_w / 2:
                            col = GOLD
                        hit = False
                        for by in ys:
                            if abs(y - by) <= bar_h / 2 and abs(x - cx) <= bar_w / 2:
                                hit = True
                        if hit:
                            col = GOLD2
                    ar += col[0]; ag += col[1]; ab += col[2]; aa += col[3]
            n = ss * ss
            i = (py * size + px_) * 4
            px[i]   = ar // n
            px[i+1] = ag // n
            px[i+2] = ab // n
            px[i+3] = aa // n
    return px

if __name__ == "__main__":
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "android", "res")
    for dens, sz in [("mdpi",48),("hdpi",72),("xhdpi",96),("xxhdpi",144),("xxxhdpi",192)]:
        d = os.path.join(base, "mipmap-" + dens)
        os.makedirs(d, exist_ok=True)
        p = os.path.join(d, "ic_launcher.png")
        png_write(p, sz, sz, draw(sz))
        print("写入", p, os.path.getsize(p), "字节")
