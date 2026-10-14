"""Convert preserved environment PNGs to alpha WebP; never repaint or key their ink."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/assets/env'
OUT.mkdir(parents=True, exist_ok=True)
total = 0
for path in sorted((ROOT / 'art/env').glob('front_*.png')):
    with Image.open(path) as image:
        if image.mode != 'RGBA' or image.getchannel('A').getextrema()[0] != 0:
            raise ValueError(f'{path.name}: genuine transparency required')
        target = OUT / f'{path.stem}.webp'
        image.save(target, 'WEBP', quality=85, method=6)
        with Image.open(target) as check:
            assert check.size == image.size and check.mode == 'RGBA'
            assert check.getchannel('A').tobytes() == image.getchannel('A').tobytes()
        total += target.stat().st_size
        print(f'{path.name}: {image.size}, alpha preserved, {target.stat().st_size:,} bytes')
print(f'Environment total: {total:,} bytes')
