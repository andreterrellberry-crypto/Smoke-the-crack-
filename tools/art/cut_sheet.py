#!/usr/bin/env python3
"""Cut a generated art sheet (e.g. a ChatGPT cast lineup) into one WebP per figure.

Every separate figure on the sheet is found as a connected blob of opaque pixels, ordered the way you read
(top row first, left to right), cropped tight with its soft anti-aliased edge kept, and saved as
<out>/<name>.webp. This is how src/assets/cast/*.webp was made from art/cast_lineup.png:

  python3 tools/art/cut_sheet.py art/cast_lineup.png --out src/assets/cast \
      --names tbone,fresh,mandrake,karim,chidi,ryo,shaz,booster

Sheets with a flat #00FF00 background instead of transparency: add --chroma.
Pieces that are drawn as separate blobs but belong together (two eyes, a pair of shoes) need --join, which merges
blobs closer than that many pixels. Run with --list first to see what it found.
Needs: Pillow, numpy (no scipy).
"""
import argparse
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter


def load(path, chroma):
    im = Image.open(path).convert('RGBA')
    a = np.array(im)
    if chroma:
        r, g, b = a[:, :, 0].astype(int), a[:, :, 1].astype(int), a[:, :, 2].astype(int)
        key = (g > 180) & (r < 120) & (b < 120)
        a[:, :, 3] = np.where(key, 0, a[:, :, 3])
    return a


def label(mask):
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    comps = []
    n = 0
    for y in range(h):
        for x in np.nonzero(mask[y] & (lab[y] == 0))[0]:
            if lab[y, x]:
                continue
            n += 1
            q = deque([(y, x)])
            lab[y, x] = n
            c, x0, x1, y0, y1 = 0, x, x, y, y
            while q:
                cy, cx = q.popleft()
                c += 1
                x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = n
                        q.append((ny, nx))
            comps.append({'ids': [n], 'area': c, 'box': [x0, y0, x1, y1]})
    return lab, comps


def join(comps, gap):
    merged = True
    while merged:
        merged = False
        for i in range(len(comps)):
            for j in range(i + 1, len(comps)):
                a, b = comps[i]['box'], comps[j]['box']
                dx = max(0, max(a[0], b[0]) - min(a[2], b[2]))
                dy = max(0, max(a[1], b[1]) - min(a[3], b[3]))
                if dx <= gap and dy <= gap:
                    comps[i] = {'ids': comps[i]['ids'] + comps[j]['ids'], 'area': comps[i]['area'] + comps[j]['area'],
                                'box': [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]}
                    del comps[j]
                    merged = True
                    break
            if merged:
                break
    return comps


def reading_order(comps):
    # rows: figures whose vertical centres sit within half a typical height of each other
    hs = sorted(c['box'][3] - c['box'][1] for c in comps)
    tol = hs[len(hs) // 2] * 0.5 if hs else 0
    rows = []
    for c in sorted(comps, key=lambda c: (c['box'][1] + c['box'][3]) / 2):
        cy = (c['box'][1] + c['box'][3]) / 2
        if rows and abs(rows[-1]['cy'] - cy) < tol:
            rows[-1]['items'].append(c)
        else:
            rows.append({'cy': cy, 'items': [c]})
    return [c for r in rows for c in sorted(r['items'], key=lambda c: c['box'][0])]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('sheet')
    ap.add_argument('--out', default='.')
    ap.add_argument('--names', default='', help='comma-separated names in reading order')
    ap.add_argument('--min-area', type=int, default=1500, help='ignore specks smaller than this many pixels')
    ap.add_argument('--alpha', type=int, default=30, help='alpha above this counts as part of a figure')
    ap.add_argument('--join', type=int, default=0, help='merge blobs closer than this many pixels')
    ap.add_argument('--chroma', action='store_true', help='treat flat #00FF00 green as transparent')
    ap.add_argument('--quality', type=int, default=88)
    ap.add_argument('--list', action='store_true', help='only list what was found')
    args = ap.parse_args()

    a = load(args.sheet, args.chroma)
    mask = a[:, :, 3] > args.alpha
    lab, comps = label(mask)
    comps = [c for c in comps if c['area'] >= args.min_area]
    if args.join:
        comps = join(comps, args.join)
    comps = reading_order(comps)
    names = [n for n in args.names.split(',') if n]
    for i, c in enumerate(comps):
        x0, y0, x1, y1 = c['box']
        print(f"{i:2d} {names[i] if i < len(names) else '?':14s} box=({x0},{y0})-({x1},{y1}) size={x1 - x0 + 1}x{y1 - y0 + 1} area={c['area']}")
    if args.list:
        return
    if names and len(names) != len(comps):
        sys.exit(f'found {len(comps)} figures but got {len(names)} names; check with --list, adjust --join/--min-area')
    os.makedirs(args.out, exist_ok=True)
    for i, c in enumerate(comps):
        x0, y0, x1, y1 = c['box']
        sub = a[y0:y1 + 1, x0:x1 + 1].copy()
        own = np.isin(lab[y0:y1 + 1, x0:x1 + 1], c['ids'])
        # keep the faint anti-aliased rim that sits just outside the threshold mask
        grow = np.array(Image.fromarray((own * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
        sub[~grow] = 0
        img = Image.fromarray(sub, 'RGBA')
        img = img.crop(img.getbbox())
        name = names[i] if names else f'piece_{i:02d}'
        path = os.path.join(args.out, f'{name}.webp')
        img.save(path, 'WEBP', quality=args.quality, method=6)
        print(f'wrote {path} {img.size[0]}x{img.size[1]} {os.path.getsize(path) // 1024}KB')


if __name__ == '__main__':
    main()
