#!/usr/bin/env python3
"""Audit legacy URL inventory for migration, without changing public routes.

Input from sanitized rewrite_review.csv. Outputs a local collision report;
manual URL intent matching is still required before permanent redirects.
"""
import argparse
import csv
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlsplit

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    with args.input.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        items = list(reader)
    paths = defaultdict(list)
    for idx, row in enumerate(items):
        for key in ("legacy_url", "legacy_path", "old_path", "source_path", "url", "path"):
            value = (row.get(key) or "").strip()
            if value:
                normalized = urlsplit(value).path.rstrip("/") or "/"
                paths[normalized].append(idx + 2)
                break
    duplicates = [(path, lines) for path, lines in paths.items() if len(lines) > 1]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["normalized_legacy_path", "count", "csv_lines", "review"])
        for path, lines in sorted(duplicates):
            writer.writerow([path, len(lines), ",".join(map(str, lines)), "MANUAL_REVIEW"])
    print(f"rows={len(items)} parsed_paths={sum(map(len, paths.values()))} duplicate_paths={len(duplicates)}")
    print("No redirects were added, and no HTTP SEO checks were claimed.")
if __name__ == "__main__":
    main()
