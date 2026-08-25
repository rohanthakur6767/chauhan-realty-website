#!/usr/bin/env python3
"""
Chauhan Realty — media optimization + curation pipeline.

- Fixes EXIF rotation (ImageOps.exif_transpose)
- Optional aspect crop (fractional box) to remove clutter/annotations
- Resizes to responsive widths, exports compressed WebP
- Renames messy source files to clean semantic names
- Emits a JSON manifest (intrinsic sizes) used by the site

Run:  python scripts/optimize_media.py
Needs: Pillow  (no network, no ffmpeg)
"""
import json
import os
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "images")
OUT = os.path.join(ROOT, "assets", "img")
WIDTHS = [480, 960, 1600, 2400]
QUALITY = 80

os.makedirs(OUT, exist_ok=True)

# name -> (source filename, crop-box-or-None)
# crop box is (left, top, right, bottom) as fractions of the *oriented* image
CURATION = [
    # Office — finished, premium
    ("office-reception",        "IMG_20260818_171304.jpg.jpeg", None),
    ("office-reception-wide",   "IMG_20260818_171325.jpg.jpeg", None),
    ("office-feature-wall",     "IMG_20260818_171351.jpg.jpeg", None),
    ("office-lounge",           "IMG_20260818_171431.jpg.jpeg", None),
    ("office-detail",           "WA_1787050214137.jpg.jpeg",    None),
    # Construction — structure / process
    ("construction-frame",      "IMG_5713.JPG.jpeg",            None),
    ("construction-steel",      "IMG_6160.JPG.jpeg",            None),
    ("construction-scaffold",   "IMG_6157.JPG.jpeg",            None),
    ("construction-fitout",     "IMG_6835.JPG.jpeg",            None),
    ("roof-finished",           "IMG_6304.JPG.jpeg",            None),
    # Residence — finished interiors
    ("residence-living",        "IMG_9813.JPG.jpeg",            None),
    ("residence-living-alt",    "IMG_9802.JPG.jpeg",            None),
    ("residence-kitchen",       "IMG_9806.JPG.jpeg",            None),
    ("residence-kitchen-alt",   "IMG_9804.JPG.jpeg",            None),
    ("residence-wardrobe",      "IMG_9811.JPG.jpeg",            None),
    # bathroom: crop away the marker-annotated floor (keep top 70%)
    ("residence-bathroom",      "IMG_6741.JPG.jpeg",            (0.0, 0.0, 1.0, 0.70)),
    # Brand
    ("logo",                    "logo.jpg",                     None),
]


def process(name, filename, crop):
    path = os.path.join(SRC, filename)
    if not os.path.exists(path):
        print(f"  !! MISSING {filename}")
        return None
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)            # normalize orientation
    img = img.convert("RGB")
    if crop:
        w, h = img.size
        l, t, r, b = crop
        img = img.crop((int(l * w), int(t * h), int(r * w), int(b * h)))
    ow, oh = img.size
    made = []
    for tw in WIDTHS:
        if tw > ow and made:                       # never upscale (but always emit smallest)
            continue
        w = min(tw, ow)
        h = round(oh * w / ow)
        variant = img if w == ow else img.resize((w, h), Image.LANCZOS)
        fn = f"{name}-{tw}.webp"
        variant.save(os.path.join(OUT, fn), "WEBP", quality=QUALITY, method=6)
        made.append({"w": w, "h": h, "file": f"assets/img/{fn}"})
    print(f"  ok {name:24s} {ow}x{oh}  -> {len(made)} webp")
    return {"name": name, "w": ow, "h": oh,
            "ratio": round(ow / oh, 4), "variants": made}


def main():
    print("Optimizing media ->", OUT)
    manifest = {}
    for name, filename, crop in CURATION:
        r = process(name, filename, crop)
        if r:
            manifest[name] = r
    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    # size report
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)
                if f.endswith(".webp"))
    print(f"\nDONE  {len(manifest)} images, "
          f"{sum(len(m['variants']) for m in manifest.values())} webp files, "
          f"{total/1_048_576:.1f} MB total")


if __name__ == "__main__":
    main()
