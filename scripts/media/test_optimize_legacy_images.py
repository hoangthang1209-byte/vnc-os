"""Tests for non-destructive VietnamClothing image optimization.

Run: python -m unittest discover -s scripts/media -p 'test_*.py'
Requires Pillow.
"""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

try:
    from PIL import Image
except ImportError:
    Image = None


@unittest.skipIf(Image is None, "Pillow not installed")
class LegacyMediaPipelineTest(unittest.TestCase):
    def test_non_destructive_webp_manifest(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "legacy"
            target = root / "optimized"
            (source / "photos").mkdir(parents=True)
            original = source / "photos" / "product.jpg"
            Image.new("RGB", (1000, 600), (220, 35, 50)).save(original)
            before = original.read_bytes()
            script = Path(__file__).with_name("optimize-legacy-images.py")
            first = subprocess.run(
                [sys.executable, str(script), str(source), str(target)],
                capture_output=True, text=True,
            )
            self.assertEqual(first.returncode, 0, first.stderr)
            self.assertEqual(original.read_bytes(), before)
            manifest = json.loads((target / "manifest.json").read_text())
            self.assertEqual(len(manifest["entries"]), 1)
            entry = manifest["entries"][0]
            self.assertEqual(entry["source"], "photos/product.jpg")
            self.assertEqual([v["width"] for v in entry["variants"]], [480, 800])
            self.assertTrue((target / "photos" / "product-480w.webp").exists())
            second = subprocess.run(
                [sys.executable, str(script), str(source), str(target)],
                capture_output=True, text=True,
            )
            self.assertNotEqual(second.returncode, 0, "Must refuse overwrite")

    def test_reject_nested_output(self):
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / "photos"
            source.mkdir()
            script = Path(__file__).with_name("optimize-legacy-images.py")
            result = subprocess.run(
                [sys.executable, str(script), str(source), str(source / "out")],
                capture_output=True, text=True,
            )
            self.assertNotEqual(result.returncode, 0)
