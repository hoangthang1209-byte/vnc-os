#!/usr/bin/env python3
"""Validate local legacy image manifest before import. No uploads/writes."""
import argparse
import json
from pathlib import Path


def audit(path: Path) -> dict:
    manifest = json.loads(path.read_text(encoding='utf-8'))
    if manifest.get('version') != 1 or not isinstance(manifest.get('entries'), list):
        raise ValueError('Unsupported manifest')
    seen = set()
    errors = []
    for entry in manifest['entries']:
        source = entry.get('source')
        if not isinstance(source, str) or not source or source in seen:
            errors.append({'source': source, 'reason': 'missing or duplicate source'})
            continue
        seen.add(source)
        if entry.get('status') != 'ok' or not entry.get('variants'):
            errors.append({'source': source, 'reason': 'not converted or missing variants'})
    return {'total': len(manifest['entries']), 'uniqueSources': len(seen), 'failed': len(errors), 'errors': errors[:30]}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('manifest', type=Path)
    args = parser.parse_args()
    result = audit(args.manifest)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    raise SystemExit(1 if result['failed'] else 0)
