import json
import tempfile
import unittest
from pathlib import Path
from importlib.util import spec_from_file_location, module_from_spec

PATH = Path(__file__).with_name('audit-manifest.py')
SPEC = spec_from_file_location('audit_manifest', PATH)
MOD = module_from_spec(SPEC)
SPEC.loader.exec_module(MOD)

class AuditManifestTest(unittest.TestCase):
    def test_success_and_duplicate_detection(self):
        with tempfile.TemporaryDirectory() as folder:
            p = Path(folder) / 'manifest.json'
            good = {'source': 'image.jpg', 'status': 'ok', 'variants': [{'path': 'image.jpg-480w.webp'}]}
            p.write_text(json.dumps({'version': 1, 'entries': [good]}))
            self.assertEqual(MOD.audit(p)['failed'], 0)
            p.write_text(json.dumps({'version': 1, 'entries': [good, good]}))
            self.assertEqual(MOD.audit(p)['failed'], 1)
