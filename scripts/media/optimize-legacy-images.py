#!/usr/bin/env python3
"""Non-destructive batch image derivatives for legacy VietnamClothing media.

Requirements: pip install Pillow
Usage:
  python scripts/media/optimize-legacy-images.py /path/to/legacy-media /path/to/optimized-media
Outputs responsive WebP variants and JSON manifest; never edits originals.
Run only against a COPY of authorized legacy files, not sensitive config/SQL.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError

EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
WIDTHS = (480, 800, 1200, 1920)


def convert(source: Path, root: Path, dest: Path) -> dict:
    relative = source.relative_to(root)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original)
        if getattr(image, "is_animated", False):
            return {"source": relative.as_posix(), "status": "skipped_animated"}
        image.load()
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        output = []
        for width in WIDTHS:
            if width > image.width:
                continue  # Never upscale
            height = max(1, round(image.height * width / image.width))
            derivative = image.resize((width, height), Image.Resampling.LANCZOS)
            target = dest / relative.parent / f"{relative.stem}-{width}w.webp"
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists():
                raise FileExistsError(f"Refusing to overwrite existing derivative: {target}")
            derivative.save(target, format="WEBP", quality=78, method=6)
            output.append({"path": target.relative_to(dest).as_posix(), "width": width, "height": height, "bytes": target.stat().st_size})
        return {
            "source": relative.as_posix(),
            "sha256": digest,
            "sourceBytes": source.stat().st_size,
            "width": image.width,
            "height": image.height,
            "variants": output,
            "status": "ok",
        }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    root, dest = args.source.resolve(), args.output.resolve()
    if not root.is_dir():
        parser.error("Source must be an existing directory")
    if root == dest or root in dest.parents or dest in root.parents:
        parser.error("Input and output directories must be separate, non-nested locations")
    if dest.exists() and any(dest.iterdir()):
        parser.error("Output directory must be empty; refusing to overwrite")
    entries = []
    for path in sorted(root.rglob("*")):
        if path.is_file() and path.suffix.lower() in EXTENSIONS:
            try:
                entries.append(convert(path, root, dest))
            except (UnidentifiedImageError, OSError, ValueError) as exc:
                entries.append({"source": path.relative_to(root).as_posix(), "status": "error", "error": type(exc).__name__})
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "manifest.json").write_text(json.dumps({"version": 1, "entries": entries}, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Processed {len(entries)} files; manifest: {dest / 'manifest.json'}")


if __name__ == "__main__":
    main()
