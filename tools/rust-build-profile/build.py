#!/usr/bin/env python3
"""Build AOT packages with bounded compiler concurrency."""
import argparse
import datetime
import json
import os
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
RUST = ROOT / 'rust'
CARGO = ['cargo', '+1.98.1']
PARALLEL_CARGO = ['cargo', '+nightly-2026-10-02']


def preparation_commands(root):
    graph = root / 'rust/generated-aot/bodies-5'
    if not (graph / 'Cargo.toml').is_file():
        return []
    return [['node', str(root / 'tools/rules-migration/src/shared-aot-cli.mjs'),
             '--production-group', 'bodies-5', '--output', str(graph),
             '--prepared-sources', str(root / 'rust/prepared-aot/bodies-5')]]


def compiler_environment(environment, parallel_frontend):
    environment = dict(environment)
    if parallel_frontend:
        if any(environment.get(key) for key in ["RUSTFLAGS", "CARGO_ENCODED_RUSTFLAGS", "RUSTC_BOOTSTRAP"]):
            raise ValueError("Unset compiler flags and RUSTC_BOOTSTRAP for the pinned parallel mode")
        environment["RUSTFLAGS"] = "-Zthreads=4"
    return environment


def build_commands(metadata, operation, arguments, jobs, compiler=None, package_limit=2):
    cargo = compiler or CARGO
    facade = next(package for package in metadata['packages'] if package['name'] == 'nkdk-compiled-rules')
    packages = sorted({dependency['name'] for dependency in facade['dependencies']
                       if dependency['kind'] is None and dependency['name'].startswith('nkdk-compiled-rules-')})
    common = ['--offline', '--locked', '--timings']
    groups = ([packages] if package_limit is None else
              [packages[index:index + package_limit] for index in range(0, len(packages), package_limit)])
    return [cargo + ['build', *common,
                     *[argument for package in group for argument in ('-p', package)],
                     '--lib', '-j', str(jobs)]
            for group in groups] + [
                cargo + [operation, *common, '-p', 'nkdk', '-j', '2', *arguments]]



def resource_summary(records):
    if any(record.get('clock_scope') != 'system-monotonic' for record in records):
        return {'status': 'unusable-clock-scope'}
    events = []
    for record in records:
        if 'started_monotonic' in record and 'ended_monotonic' in record:
            events.extend([(record['started_monotonic'], 1, record['max_rss_bytes']),
                           (record['ended_monotonic'], -1, -record['max_rss_bytes'])])
    count = rss = peak_count = peak_rss = 0
    for _, delta, bytes in sorted(events):
        count += delta
        rss += bytes
        peak_count = max(peak_count, count)
        peak_rss = max(peak_rss, rss)
    return {'max_concurrent_compilers': peak_count,
            'concurrent_rss_upper_bound_bytes': peak_rss}


def compiler_resources_from_log(path):
    # A fully cached successful build starts no wrapper and creates no log.
    try:
        lines = path.read_text().splitlines()
    except FileNotFoundError:
        lines = []
    return resource_summary([json.loads(line) for line in lines])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--parallel-frontend', action='store_true',
                        help='Use pinned nightly-2026-10-02 with four frontend threads')
    parser.add_argument('--output', type=Path)
    parser.add_argument('--target-dir', type=Path)
    parser.add_argument('--compiler-jobs', type=int, choices=range(1, 5), default=4)
    parser.add_argument('operation', choices=['build', 'test'])
    parser.add_argument('arguments', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    # Profile, target and feature changes require matching prebuild settings;
    # reject them rather than secretly compiling the large packages twice.
    forbidden = ['--release', '--profile', '--features', '--all-features', '--no-default-features',
                 '--target', '--target-dir', '--workspace', '--package', '-p', '--jobs', '-j']
    cargo_arguments = args.arguments[:args.arguments.index('--')] if '--' in args.arguments else args.arguments
    if any(argument.split('=')[0] in forbidden or argument.startswith('-j') for argument in cargo_arguments):
        parser.error('This driver supports the default development profile and nkdk target only')
    output = (args.output or RUST / "target" / "build-reports" /
              (datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d-%H%M%S") + f"-{os.getpid()}")).resolve()
    output.mkdir(parents=True, exist_ok=False)
    try:
        environment = compiler_environment(os.environ, args.parallel_frontend)
    except ValueError as error:
        parser.error(str(error))
    cargo = PARALLEL_CARGO if args.parallel_frontend else CARGO
    if args.target_dir:
        environment['CARGO_TARGET_DIR'] = str(args.target_dir.resolve())
    elif args.parallel_frontend:
        environment['CARGO_TARGET_DIR'] = str(RUST / 'target' / 'frontend-nightly-2026-10-02')
    environment['NKDK_GENERATION_PROFILE_LOG'] = str(output / 'generation.jsonl')
    if environment.get('RUSTC_WRAPPER'):
        parser.error('Unset RUSTC_WRAPPER to measure each compiler with the built-in wrapper')
    environment['RUSTC_WRAPPER'] = str(Path(__file__).with_name('rustc-wrapper.py'))
    environment['NKDK_RUSTC_PROFILE_LOG'] = str(output / 'rustc.jsonl')
    preparation_environment = dict(environment)
    if args.parallel_frontend:
        # The preparation CLI uses stable Rust; nightly-only frontend flags
        # apply to the subsequent production compilation, not its host tool.
        preparation_environment.pop('RUSTFLAGS', None)
    preparation = []
    for command in preparation_commands(ROOT):
        log = output / 'preparation.log'
        started_preparation = time.monotonic()
        with log.open('w') as stream:
            result = subprocess.run(command, cwd=ROOT, env=preparation_environment, stdout=stream, stderr=stream)
        step = {'command': command, 'wall_seconds': round(time.monotonic() - started_preparation, 3),
                'exit_code': result.returncode, 'log': log.name}
        preparation.append(step)
        print(f'AOT preparation: {step["wall_seconds"]}s, exit {result.returncode}', flush=True)
        if result.returncode:
            (output / 'result.json').write_text(json.dumps({'preparation': preparation}, indent=2) + '\n')
            return result.returncode
    metadata = json.loads(subprocess.check_output(
        cargo + ['metadata', '--offline', '--locked', '--no-deps', '--format-version', '1'],
        cwd=RUST, env=environment, text=True))
    jobs = min(args.compiler_jobs, 3) if args.parallel_frontend else args.compiler_jobs
    package_limit = None if args.parallel_frontend else 2
    report = {'compiler': cargo[1], 'frontend_threads': 4 if args.parallel_frontend else 1,
              'compiler_jobs': jobs, 'operation': args.operation, 'preparation': preparation, 'steps': []}
    started = time.monotonic()
    for number, command in enumerate(build_commands(metadata, args.operation, args.arguments, jobs, cargo, package_limit)):
        log = output / f'{number:02d}-cargo.log'
        step_started = time.monotonic()
        with log.open('w') as stream:
            result = subprocess.run(command, cwd=RUST, env=environment, stdout=stream, stderr=stream)
        step = {'command': command, 'wall_seconds': round(time.monotonic() - step_started, 3),
                'exit_code': result.returncode, 'log': log.name}
        report['steps'].append(step)
        report['wall_seconds'] = round(time.monotonic() - started, 3)
        (output / 'result.json').write_text(json.dumps(report, indent=2) + '\n')
        names = [command[index + 1] for index, argument in enumerate(command) if argument == '-p']
        print(f'{", ".join(names)}: {step["wall_seconds"]}s, exit {result.returncode}', flush=True)
        if result.returncode:
            return result.returncode
    report['compiler_resources'] = compiler_resources_from_log(output / 'rustc.jsonl')
    (output / 'result.json').write_text(json.dumps(report, indent=2) + '\n')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
