import importlib.util
from pathlib import Path
import unittest


class BuildPlanTests(unittest.TestCase):
    def test_heavy_dependencies_are_separate_before_the_requested_operation(self):
        spec = importlib.util.spec_from_file_location('phased_build', Path(__file__).with_name('build.py'))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        metadata = {'packages': [{'name': 'nkdk-compiled-rules', 'dependencies': [
            {'name': 'nkdk-compiled-rules-base', 'kind': None},
            {'name': 'nkdk-conversion-core', 'kind': None},
            {'name': 'nkdk-compiled-rules-bodies', 'kind': None},
            {'name': 'nkdk-compiled-rules-owners', 'kind': None},
            {'name': 'test-only', 'kind': 'dev'},
        ]}]}
        commands = module.build_commands(metadata, 'test', ['--test', 'facts', '--', '--test-threads=1'], 4)
        self.assertEqual([[command[index + 1] for index, argument in enumerate(command) if argument == '-p']
                          for command in commands],
                         [['nkdk-compiled-rules-base', 'nkdk-compiled-rules-bodies'],
                          ['nkdk-compiled-rules-owners'], ['nkdk']])
        self.assertTrue(all(command[2] == 'build' and command[command.index('-j') + 1] == '4'
                            for command in commands[:-1]))
        self.assertEqual(commands[-1][2], 'test')
        self.assertEqual(commands[-1][-4:], ['--test', 'facts', '--', '--test-threads=1'])
        self.assertEqual(commands[-1][commands[-1].index('-j') + 1], '2')
        self.assertTrue(all('--offline' in command and '--locked' in command for command in commands))


    def test_parallel_mode_keeps_three_compilers_busy_without_a_pair_barrier(self):
        spec = importlib.util.spec_from_file_location('phased_build', Path(__file__).with_name('build.py'))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        metadata = {'packages': [{'name': 'nkdk-compiled-rules', 'dependencies': [
            {'name': f'nkdk-compiled-rules-{name}', 'kind': None}
            for name in ['base', 'bodies', 'bodies-2', 'owners']]}]}
        commands = module.build_commands(metadata, 'build', [], 3,
                                        compiler=module.PARALLEL_CARGO, package_limit=None)
        self.assertEqual(len(commands), 2)
        self.assertEqual(commands[0][1], '+nightly-2026-10-02')
        self.assertEqual(commands[0].count('-p'), 4)
        self.assertEqual(commands[0][commands[0].index('-j') + 1], '3')
        self.assertEqual(commands[-1][commands[-1].index('-p') + 1], 'nkdk')

    def test_memory_report_adds_only_simultaneously_active_compiler_peaks(self):
        spec = importlib.util.spec_from_file_location('phased_build', Path(__file__).with_name('build.py'))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        records = [{'clock_scope': 'system-monotonic', 'started_monotonic': start, 'ended_monotonic': end, 'max_rss_bytes': rss}
                   for start, end, rss in [(0, 2, 100), (1, 3, 200), (3, 4, 400)]]
        self.assertEqual(module.resource_summary(records),
                         {'max_concurrent_compilers': 2, 'concurrent_rss_upper_bound_bytes': 400})
        import tempfile
        import json
        with tempfile.TemporaryDirectory() as directory:
            log = Path(directory) / 'rustc.jsonl'
            self.assertEqual(module.compiler_resources_from_log(log),
                             {'max_concurrent_compilers': 0, 'concurrent_rss_upper_bound_bytes': 0})
            log.write_text(''.join(json.dumps(record) + '\n' for record in records))
            self.assertEqual(module.compiler_resources_from_log(log), module.resource_summary(records))

    def test_parallel_frontend_is_explicit_and_does_not_enable_bootstrap(self):
        spec = importlib.util.spec_from_file_location('phased_build', Path(__file__).with_name('build.py'))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        environment = module.compiler_environment({}, parallel_frontend=True)
        self.assertEqual(environment['RUSTFLAGS'], '-Zthreads=4')
        self.assertNotIn('RUSTC_BOOTSTRAP', environment)
        self.assertEqual(module.compiler_environment({}, parallel_frontend=False), {})
        with self.assertRaises(ValueError):
            module.compiler_environment({'RUSTFLAGS': '-Copt-level=3'}, parallel_frontend=True)
        with self.assertRaises(ValueError):
            module.compiler_environment({'RUSTC_BOOTSTRAP': '1'}, parallel_frontend=True)


class WrapperTests(unittest.TestCase):
    def test_cargo_jobserver_descriptors_reach_the_real_compiler(self):
        import os
        import subprocess
        import sys
        import tempfile
        import json
        import time
        read, write = os.pipe()
        try:
            with tempfile.TemporaryDirectory() as directory:
                environment = dict(os.environ, CARGO_MAKEFLAGS=f'-j --jobserver-auth={read},{write}',
                                   NKDK_RUSTC_PROFILE_LOG=str(Path(directory) / 'profile.jsonl'))
                started = time.clock_gettime(time.CLOCK_MONOTONIC)
                output = subprocess.run([sys.executable, str(Path(__file__).with_name('rustc-wrapper.py')),
                                         sys.executable, '-c', f'import os; os.fstat({read}); os.fstat({write})'],
                                        env=environment, pass_fds=(read, write), capture_output=True, text=True)
                ended = time.clock_gettime(time.CLOCK_MONOTONIC)
                self.assertEqual(output.returncode, 0, output.stderr)
                record = json.loads((Path(directory) / 'profile.jsonl').read_text())
                self.assertGreaterEqual(record['started_monotonic'], started)
                self.assertLessEqual(record['ended_monotonic'], ended)
        finally:
            os.close(read)
            os.close(write)

class PreparationTests(unittest.TestCase):
    def test_tracked_shared_catalog_is_prepared_before_cargo_metadata(self):
        import tempfile
        spec = importlib.util.spec_from_file_location('phased_build', Path(__file__).with_name('build.py'))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.assertEqual(module.preparation_commands(root), [])
            graph = root / 'rust/generated-aot/bodies-5'
            graph.mkdir(parents=True)
            (graph / 'Cargo.toml').write_text('[package]\nname="nkdk-shared-catalog-bodies-5"\n')
            self.assertEqual(module.preparation_commands(root), [[
                'node', str(root / 'tools/rules-migration/src/shared-aot-cli.mjs'),
                '--production-group', 'bodies-5', '--output', str(graph),
                '--prepared-sources', str(root / 'rust/prepared-aot/bodies-5'),
            ]])
