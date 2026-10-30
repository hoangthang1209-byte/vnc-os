#!/usr/bin/env python3
"""Validate VNC OS public catalog export before preview publication.
Fail closed: legacy Active=1 is never sufficient for public approval.
Usage: python3 tools/validate_catalog_feed.py catalog-data.json
"""
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

CATEGORIES = {"entertainment", "promotional", "corporate", "sourcing", "apparel"}
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

def check(path):
    feed = json.loads(Path(path).read_text(encoding="utf-8"))
    errors = []
    if feed.get("site") != "vietnamclothing.vn" or feed.get("schemaVersion") != 1:
        errors.append("Unexpected site or schema version")
    products = feed.get("products")
    if not isinstance(products, list):
        return ["Missing products list"]
    seen = set()
    for i, p in enumerate(products):
        label = f"products[{i}]"
        if not isinstance(p, dict):
            errors.append(f"{label}: not an object")
            continue
        slug = p.get("slug", "")
        if not isinstance(slug, str) or not SLUG.fullmatch(slug) or slug in seen:
            errors.append(f"{label}: invalid or duplicate slug")
        seen.add(slug)
        if p.get("site") != "vietnamclothing.vn" or p.get("category") not in CATEGORIES:
            errors.append(f"{label}: invalid site/category")
        if p.get("status") != "PUBLISHED" or p.get("publicApproved") is not True or p.get("mediaRightsApproved") is not True:
            errors.append(f"{label}: publication and media rights approvals required")
        if not isinstance(p.get("title"), str) or not p["title"].strip():
            errors.append(f"{label}: missing title")
        media = p.get("media", [])
        if not isinstance(media, list) or not media:
            errors.append(f"{label}: missing media")
            continue
        approved = False
        for j, m in enumerate(media):
            if not isinstance(m, dict):
                errors.append(f"{label}.media[{j}]: invalid item")
                continue
            url = m.get("url", "")
            valid = (isinstance(url, str) and urlsplit(url).scheme == "https"
                     and bool(urlsplit(url).netloc)
                     and m.get("approved") is True and m.get("visibility") == "PUBLIC"
                     and m.get("usageRightsApproved") is True and isinstance(m.get("alt"), str) and bool(m["alt"].strip()))
            approved |= valid
            if not valid:
                errors.append(f"{label}.media[{j}]: URL/approval/alt invalid")
        if not approved:
            errors.append(f"{label}: no approved image")
    return errors

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: validate_catalog_feed.py catalog-data.json", file=sys.stderr)
        sys.exit(2)
    problems = check(sys.argv[1])
    if problems:
        for issue in problems:
            print("FAIL:", issue, file=sys.stderr)
        sys.exit(1)
    print("OK: approved catalog feed passed validation")
