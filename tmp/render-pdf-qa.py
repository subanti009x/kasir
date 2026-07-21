import sys
from pathlib import Path

sys.path.insert(0, str(Path(r"D:\website kasir\tmp\manual-py").resolve()))

import fitz
from PIL import Image, ImageDraw

ROOT = Path(r"D:\website kasir")
PDF = ROOT / "output" / "manual" / "Technical_User_Manual_Admin_Solutions_Inovatif_POS.pdf"
OUT = ROOT / "output" / "manual" / "pdf-rendered"
SHEET = ROOT / "output" / "manual" / "pdf-contact-sheet.png"

OUT.mkdir(parents=True, exist_ok=True)

doc = fitz.open(str(PDF))
paths = []
for i, page in enumerate(doc, start=1):
    pix = page.get_pixmap(matrix=fitz.Matrix(1.35, 1.35), alpha=False)
    p = OUT / f"page-{i:02d}.png"
    pix.save(str(p))
    paths.append(p)

thumbs = []
for p in paths:
    im = Image.open(p).convert("RGB")
    im.thumbnail((220, 286), Image.LANCZOS)
    canvas = Image.new("RGB", (240, 326), "white")
    canvas.paste(im, ((240 - im.width) // 2, 10))
    d = ImageDraw.Draw(canvas)
    d.text((10, 300), p.stem, fill=(15, 23, 42))
    thumbs.append(canvas)

cols = 4
rows = (len(thumbs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * 240, rows * 326), (226, 232, 240))
for idx, im in enumerate(thumbs):
    x = (idx % cols) * 240
    y = (idx // cols) * 326
    sheet.paste(im, (x, y))
sheet.save(SHEET)
print(f"pages={len(paths)}")
print(SHEET)
