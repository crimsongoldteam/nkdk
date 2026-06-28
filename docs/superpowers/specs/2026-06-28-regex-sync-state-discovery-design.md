# Regex Sync State Discovery Design

## Context

`init-sync-state` now indexes all YAML-side project files needed for incremental XML sync, but repeated ERP runs are slow.
The latest measured run on `/Users/nikita/git/nkdk-yaml` took `112.80s` for `121463` files.

Measured time split:

- discovery: `81.46s`
- file read + XXH3: `32.30s`
- sort: `0.31s`
- YAML stringify: `1.01s`
- write: `0.19s`

Instrumented discovery showed it performs many filesystem and YAML operations:

- `stat`: `248325` calls, `14.92s`
- `readdir`: `98770` calls, `14.00s`
- `readFile`: `27386` calls, `11.23s`

The main bottleneck is discovery, especially repeated directory probing and YAML parsing used only to discover child names.

## Goal

Make repeated `init-sync-state` runs faster by replacing precise YAML-parsing discovery with a single tree walk filtered by precompiled path matchers derived from metadata rules.

The target behavior remains:

- `/Users/nikita/git/nkdk-yaml` compared with `/Users/nikita/git/round-trip/erp/.nkdk-sync.yaml` reports `missedCount: 0`.
- `extraCount` should stay `0` for the ERP fixture.
- Service files stay excluded: `.git`, `.DS_Store`, `.nkdk-sync.yaml`.
- `Миграции/**` stays excluded.

## Non-Goals

- Do not change hash format; keep `xxh3-64`.
- Do not add mtime-based incremental hashing in this stage.
- Do not parse YAML during discovery.
- Do not implement a broad extension-only fallback unless the rule-derived matchers miss real ERP files.

## Approach

Build `compileSyncStatePathMatchers()` once per process from:

- `configurationMetadataProjectSpec`
- `metadataProjectSpecs`
- `describeMetadataRuleResources(rule)`
- rule properties with `nkdkPath`, `nkdkDir`, `externalFile`, `folderName`, and `syncExternalOnly`
- known external sync types whose YAML-side directory is type-defined, such as `WSDefinitionSchemas -> XSD`
- nested subsystem convention from the existing metadata project layout

Then replace recursive rule-driven collection with:

1. Walk the project directory once with `fs.promises.readdir(..., { withFileTypes: true })`.
2. Skip service directories and files before matcher checks.
3. Normalize each relative path to `/`.
4. Add the file when at least one compiled matcher accepts it.
5. Sort paths with the existing Russian locale ordering.

## Matcher Model

Use simple predicate objects instead of raw regular expressions everywhere:

- exact file matcher: `Конфигурация.yaml`, root modules, static `nkdkPath`
- object root matcher: `<itemTypePrefix>/<objectName>/Свойства.yaml`
- recursive directory matcher: `nkdkDir`, `folderName`, `externalFile.dir`, `syncExternalOnly` YAML folders
- basename-family matcher: `Template.*`, `Form.*`, `Модуль*.bin` alternatives for rule-declared files
- dynamic path matcher: function paths such as `Команды/${name}.bsl` become a regex like `^Справочник/[^/]+/Команды/[^/]+\.bsl$`
- nested subsystem matcher: `Подсистема/<name>(/Подсистемы/<name>)*/...`

The public collector still returns `Promise<string[]>`; only the internal discovery strategy changes.

## Accuracy Trade-Off

This is intentionally less exact than YAML-parsing discovery.
For example, `Команды/*.bsl` will be indexed even if the command is not listed in `Свойства.yaml`.
That is acceptable for sync state because the goal is to register changes to files that are valid by project path shape.

The matchers must still be stricter than extension-only discovery:

- unknown files in arbitrary directories are not included
- files under `Миграции/**` are not included
- service files are not included

## Testing

Add tests for `collectSyncStateFilePaths` that prove:

- child command modules are included without requiring YAML parsing of command names
- form resource folders are included by path shape
- common form `Form.*` alternatives are included
- common template extra files are included by rule-derived template directory behavior
- nested subsystem help files are included
- unknown files outside matcher-covered paths remain excluded
- migrations and service files remain excluded

Keep existing `hashProjectFiles` tests green.

Add an ERP verification command to the plan:

- rebuild `/Users/nikita/git/round-trip/erp/.nkdk-sync.yaml`
- compare it with `/Users/nikita/git/nkdk-yaml`
- require `missedCount: 0` and `extraCount: 0`

## Performance Verification

Measure before and after with:

- `/usr/bin/time -p pnpm --filter @nakidka/cli dev -- init-sync-state /Users/nikita/git/nkdk-yaml /Users/nikita/git/round-trip/erp`
- a focused discovery timing script for `collectSyncStateFilePaths`

Expected result:

- discovery should no longer perform YAML `readFile` operations
- discovery should use one directory walk rather than many repeated probes
- full runtime should move closer to the measured read + hash floor of about `32s`, plus tree walk and serialization overhead

## Risks

- Dynamic `nkdkPath` functions may not all be reducible to safe regexes automatically. Start with the known existing forms: static paths and single `{ name }` filename patterns.
- Recursive directory matchers can accidentally include too much if applied at the wrong root. Tests should include unknown files near valid directories.
- The previous discovery had explicit existence checks for rule paths. A full tree walk only sees existing files, so this behavior is preserved.

## Self-Review

- No placeholders remain.
- Scope is a single implementation stage: replace discovery internals with path matchers.
- The design keeps the public API and hash format unchanged.
- The accepted accuracy trade-off is explicit: valid path shape is enough, YAML membership is not required.
