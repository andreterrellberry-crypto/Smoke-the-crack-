#!/usr/bin/env python3
"""Lay cut figures side by side on a ruled sheet (lines every 10% of each figure's height) so you can read off the
fractions src/cast/puppet.js needs for each character: neck (where the head meets the body), hip (the waist line),
nx (x of the neck) and hx (x of the face centre).

  python3 tools/art/rulers.py src/assets/cast/*.webp --out /tmp/rulers.png
"""
import argparse

from PIL import Image, ImageDraw


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('files', nargs='+')
    ap.add_argument('--out', default='rulers.png')
    ap.add_argument('--height', type=int, default=720)
    args = ap.parse_args()
    ims = [Image.open(f).convert('RGBA') for f in args.files]
    k = args.height / max(i.height for i in ims)
    ims = [i.resize((max(1, round(i.width * k)), max(1, round(i.height * k)))) for i in ims]
    W = sum(i.width for i in ims) + 30 * len(ims) + 10
    H = args.height + 40
    sheet = Image.new('RGB', (W, H), (235, 232, 224))
    d = ImageDraw.Draw(sheet)
    x = 10
    for f, i in zip(args.files, ims):
        y = H - 20 - i.height
        sheet.paste(i, (x, y), i)
        for t in range(1, 10):
            yy = y + round(i.height * t / 10)
            d.line([(x, yy), (x + i.width, yy)], fill=(220, 0, 0) if t == 5 else (0, 120, 255), width=1)
            d.text((x + 1, yy - 11), f'.{t}', fill=(200, 0, 0))
        for t in range(1, 4):
            xx = x + round(i.width * t / 4)
            d.line([(xx, y), (xx, y + i.height)], fill=(0, 170, 90), width=1)
        d.text((x, H - 16), f.split('/')[-1][:18], fill=(0, 0, 0))
        x += i.width + 30
    sheet.save(args.out)
    print('wrote', args.out)


if __name__ == '__main__':
    main()
