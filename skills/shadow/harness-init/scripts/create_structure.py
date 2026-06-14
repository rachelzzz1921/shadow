#!/usr/bin/env python3
"""
Create the harness documentation directory structure.
Run from the project root: python skills/harness-init/scripts/create_structure.py
"""

import os
import sys

DIRS = [
    "docs/design-docs",
    "docs/exec-plans/active",
    "docs/exec-plans/completed",
    "docs/generated",
    "docs/product-specs",
    "docs/references",
]

GITKEEPS = [
    "docs/generated/.gitkeep",
    "docs/references/.gitkeep",
    "docs/exec-plans/active/.gitkeep",
    "docs/exec-plans/completed/.gitkeep",
]

def create_structure(root: str = ".") -> None:
    created = []
    skipped = []

    for d in DIRS:
        path = os.path.join(root, d)
        if not os.path.exists(path):
            os.makedirs(path, exist_ok=True)
            created.append(d + "/")
        else:
            skipped.append(d + "/")

    for f in GITKEEPS:
        path = os.path.join(root, f)
        if not os.path.exists(path):
            open(path, "w").close()
            created.append(f)

    print("=== Harness directory structure ===")
    if created:
        print("Created:")
        for item in created:
            print(f"  + {item}")
    if skipped:
        print("Already existed (skipped):")
        for item in skipped:
            print(f"  ~ {item}")

if __name__ == "__main__":
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    create_structure(root)
