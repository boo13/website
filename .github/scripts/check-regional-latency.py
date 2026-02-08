#!/usr/bin/env python3

"""Validate latency remains inside threshold and emit a message."""

import sys


def main(raw_value: str) -> int:
    if raw_value in ("", None, "null"):
        return 0
    try:
        latency = float(raw_value)
    except (TypeError, ValueError):
        return 0

    if latency > 5:
        print(f"Regional probe latency {latency:.3f}s exceeded the 5s budget")
        return 1

    print(f"Regional latency {latency:.3f}s")
    return 0


if __name__ == "__main__":
    value = sys.argv[1] if len(sys.argv) > 1 else ""
    sys.exit(main(value))
