#!/usr/bin/env python3
"""Measure a clean build and a rebuild after one YAML change."""

import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import time


ROOT = Path(__file__).resolve().parents[2]
RUST = ROOT / "rust"
WRAPPER = Path(__file__).with_name("rustc-wrapper.py")
DECLARATION = RUST / "declarations/common/font-reference.yaml"


def run_build(target: Path, label: str) -> dict:
    rustc_log = target.parent / f"{label}-rustc.jsonl"
    generation_log = target.parent / f"{label}-generation.jsonl"
    cargo_log = target.parent / f"{label}-cargo.log"
    environment = os.environ.copy()
    environment.update(
        {
            "CARGO_TARGET_DIR": str(target),
            "CARGO_BUILD_JOBS": "1",
            "CARGO_INCREMENTAL": "0",
            "CARGO_PROFILE_DEV_DEBUG": "0",
            "RUSTC_WRAPPER": str(WRAPPER),
            "NKDK_RUSTC_PROFILE_LOG": str(rustc_log),
            "NKDK_GENERATION_PROFILE_LOG": str(generation_log),
        }
    )
    started = time.monotonic()
    result = subprocess.run(
        ["cargo", "build", "--offline", "--locked", "-p", "nkdk-compiled-rules-probes"],
        cwd=RUST,
        env=environment,
        capture_output=True,
        text=True,
    )
    cargo_log.write_text(result.stdout + result.stderr)
    rustc = [json.loads(line) for line in rustc_log.read_text().splitlines()]
    generation = [json.loads(line) for line in generation_log.read_text().splitlines()]
    return {
        "label": label,
        "wall_seconds": round(time.monotonic() - started, 3),
        "exit_code": result.returncode,
        "rustc": rustc,
        "generation": generation,
        "cargo_log": str(cargo_log.relative_to(ROOT)),
    }


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: run.py <new-output-directory>")
    output = Path(sys.argv[1]).resolve()
    output.mkdir(parents=True, exist_ok=False)
    target = output / "target"
    baseline = run_build(target, "clean")
    if baseline["exit_code"] == 0:
        os.utime(DECLARATION, None)
        edited = run_build(target, "one-yaml-change")
    else:
        edited = None
    report = {
        "platform": platform.platform(),
        "rustc_version": subprocess.check_output(["rustc", "--version"], text=True).strip(),
        "crate": "nkdk-compiled-rules-probes",
        "changed_declaration": str(DECLARATION.relative_to(ROOT)),
        "clean": baseline,
        "one_yaml_change": edited,
    }
    report_path = output / "build-baseline.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(report_path)
    return baseline["exit_code"] or (edited["exit_code"] if edited else 1)


if __name__ == "__main__":
    raise SystemExit(main())
