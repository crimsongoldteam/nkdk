#!/usr/bin/env python3
"""Measure each rustc invocation without recording source paths or arguments."""

import json
import os
import resource
import re
import subprocess
import sys
import time


def main() -> int:
    command = sys.argv[1:]
    if not command:
        raise SystemExit("Cargo must pass rustc to this wrapper")
    started = time.clock_gettime(time.CLOCK_MONOTONIC)
    # Python otherwise closes Cargo's jobserver pipes. Preserve only these
    # descriptors so rustc can borrow CPU slots for parallel LLVM work.
    descriptors = set()
    if os.name == "posix":
        for variable in ["CARGO_MAKEFLAGS", "MAKEFLAGS"]:
            for match in re.finditer(r"--jobserver-(?:auth|fds)=(\d+),(\d+)", os.environ.get(variable, "")):
                for value in match.groups():
                    descriptor = int(value)
                    try:
                        os.fstat(descriptor)
                    except OSError:
                        continue
                    descriptors.add(descriptor)
    status = subprocess.call(command, pass_fds=tuple(sorted(descriptors)))
    usage = resource.getrusage(resource.RUSAGE_CHILDREN)
    try:
        crate = command[command.index("--crate-name") + 1]
    except (ValueError, IndexError):
        crate = "rustc-query"
    ended = time.clock_gettime(time.CLOCK_MONOTONIC)
    record = {
        "clock_scope": "system-monotonic",
        "started_monotonic": started,
        "ended_monotonic": ended,
        "crate": crate,
        "wall_seconds": round(ended - started, 3),
        "user_seconds": round(usage.ru_utime, 3),
        "system_seconds": round(usage.ru_stime, 3),
        "max_rss_bytes": usage.ru_maxrss
        if sys.platform == "darwin"
        else usage.ru_maxrss * 1024,
        "exit_code": status,
    }
    with open(os.environ["NKDK_RUSTC_PROFILE_LOG"], "a", encoding="utf-8") as output:
        output.write(json.dumps(record, ensure_ascii=False) + "\n")
    return status


if __name__ == "__main__":
    raise SystemExit(main())
