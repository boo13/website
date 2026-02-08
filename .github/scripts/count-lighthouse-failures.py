#!/usr/bin/env python3

"""Count consecutive completed workflow runs that ended in failure."""

import json
import sys
from pathlib import Path


def main(path: str) -> int:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    count = 0
    for run in data.get("workflow_runs", []):
        conclusion = run.get("conclusion")
        if conclusion == "success":
            break
        if conclusion is None:
            continue
        count += 1
    return count


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("0")
        sys.exit(0)
    try:
        streak = main(sys.argv[1])
    except FileNotFoundError:
        print("0")
    else:
        print(streak)
