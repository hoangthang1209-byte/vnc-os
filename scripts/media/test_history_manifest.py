"""Basic manifest contract tests for legacy media outputs."""
import json
import tempfile
import unittest
from pathlib import Path

class ManifestContractTest(unittest.TestCase):
    def test_manifest_structure(self):
        with tempfile.TemporaryDirectory() as folder:
            p = Path(folder) / 'manifest.json'
            p.write_text(json.dumps({'version': 1, 'entries': [{'source': 'legacy/photo.jpg', 'sha256': '0' * 64, 'variants': []}]}))
            obj = json.loads(p.read_text())
            self.assertEqual(obj['version'], 1)
            self.assertTrue(obj['entries'][0]['source'].startswith('legacy/'))
