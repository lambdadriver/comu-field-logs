#!/usr/bin/env python3
"""Assemble the experimental T-Card page from its source parts.

The standalone HTML is head.html, then body.html, then app1.js, app2.js,
and app3.js, concatenated with nothing between them. The three scripts are
the script text inside the page. This is the whole assembly; there is no
other build step.

Copyright 2026 lambdadriver. GPL-3.0. See LICENSE at the repository root.
"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent
PARTS = ["src/head.html", "src/body.html", "src/app1.js", "src/app2.js", "src/app3.js"]
OUT = ROOT / "TCard_Tracker_v1.2-exp.2.html"

def main():
    data = b"".join((ROOT / p).read_bytes() for p in PARTS)
    OUT.write_bytes(data)
    print(OUT.name, len(data))

if __name__ == "__main__":
    main()
