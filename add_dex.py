import sys, zipfile

src, dex, dst = sys.argv[1], sys.argv[2], sys.argv[3]
with zipfile.ZipFile(src) as zin, zipfile.ZipFile(dst, "w") as zout:
    for it in zin.infolist():
        data = zin.read(it.filename)
        info = zipfile.ZipInfo(it.filename, date_time=it.date_time)
        info.compress_type = it.compress_type
        info.external_attr = it.external_attr
        zout.writestr(info, data)
    zout.write(dex, "classes.dex", compress_type=zipfile.ZIP_STORED)
print("已并入 classes.dex ->", dst)
