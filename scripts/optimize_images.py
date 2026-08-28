#!/usr/bin/env python3
"""Convert large PNG covers and decorations to WebP for faster loading."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

# (glob pattern relative to assets/, max width, quality)
RULES: list[tuple[str, int, int]] = [
    ("prepare/cover-*.png", 640, 82),
    ("course/cover-*.png", 640, 82),
    ("classes/cover-*.png", 640, 82),
    ("prepare/hero-deco.png", 600, 80),
    ("brand/sidebar-deco.png", 400, 82),
    ("tools/assistant.png", 248, 85),
    ("prepare/graph-loading-ip.png", 300, 85),
    ("classes/cover-deco.png", 640, 82),
    ("course/cover-deco.png", 640, 82),
]


def optimize(path: Path, max_width: int, quality: int) -> tuple[int, int]:
    out = path.with_suffix(".webp")
    with Image.open(path) as im:
        im = im.convert("RGBA")
        w, h = im.size
        if w > max_width:
            nh = round(h * max_width / w)
            im = im.resize((max_width, nh), Image.Resampling.LANCZOS)
        im.save(out, "WEBP", quality=quality, method=6)
    before = path.stat().st_size
    after = out.stat().st_size
    return before, after


def main() -> int:
    total_before = 0
    total_after = 0
    converted: list[Path] = []

    for pattern, max_w, q in RULES:
        for path in sorted(ASSETS.glob(pattern)):
            if not path.is_file():
                continue
            before, after = optimize(path, max_w, q)
            total_before += before
            total_after += after
            converted.append(path)
            print(f"{path.relative_to(ROOT)}: {before // 1024}KB -> {after // 1024}KB (.webp)")

    print(f"\nConverted {len(converted)} files: {total_before // 1024}KB -> {total_after // 1024}KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
