# Complete sync state file discovery

## Context

`init-sync-state` already builds `.nkdk-sync.yaml` from the YAML project without re-importing XML and hashes files with XXH3. File discovery is now rule-guided, but the ERP comparison showed that `/Users/nikita/git/nkdk-yaml` has 43,009 model files missing from the generated state, excluding `.git`, `.DS_Store`, and `.nkdk-sync.yaml`.

The largest missed groups are child resources: object templates, form help, form dynamic list queries, form images, command modules, and a few declared external files such as WS reference XSD files. These files are part of the YAML model and must be registered for change detection. `Миграции/*.yaml` must remain outside sync state.

## Goal

Update sync state discovery so every YAML-model file represented by `rules.ts` is included in `.nkdk-sync.yaml`. For the ERP project, the verification comparison between all files in `/Users/nikita/git/nkdk-yaml` and the generated state must report zero missed files, after excluding `.git`, `.DS_Store`, `.nkdk-sync.yaml`, and `Миграции/**`.

## Approach

Use the existing rule graph as the source of truth instead of adding hard-coded filename globs.

`collectSyncStateFilePaths` will keep its current top-level behavior, then expand each metadata object through its rule:

- Add direct `nkdkPath`, `nkdkDir`, `syncArea`, and `externalFile` resources as today.
- Follow `childCollections` from the owner rule. For each child item listed in the owner YAML, derive the child name and apply the child `itemRule`, so command modules like `Команды/<Имя>.bsl` are collected through `MetadataCommandRules`.
- Treat rule properties with `folderName` and `forReferenceOnly: true` as rule-declared child resource roots. If such a directory exists, include all files below it, because these directories store child metadata outside the owner YAML. This covers forms and templates without hard-coding their Russian folder names.
- Reuse the same external resource collection for forms, so nested resources declared by form rules, such as dynamic list query files, form help, and form images, are included.

The collector will still avoid general project traversal. A file is included only when it is reachable from top-level metadata specs, configuration rules, child collections, or rule-declared external resource directories.

## Data Flow

1. Start from `Конфигурация.yaml` and top-level metadata directories from `metadataProjectSpecs`.
2. For each object, read its `Свойства.yaml` only when needed to identify declared child names.
3. Traverse `childCollections` and `folderName` resource roots described by the current rule.
4. Add existing files to the result set using normalized project-relative paths.
5. Hash the final path list with the existing parallel XXH3 path.

## Exclusions

The design intentionally excludes service and non-model files:

- `.git/**`
- `.DS_Store`
- `.nkdk-sync.yaml`
- `Миграции/**`

These exclusions are not a replacement for rule-guided discovery. They only keep generated or service files out of the final verification baseline.

## Error Handling

Missing optional folders and files remain non-errors. Malformed YAML in a metadata object should surface as a clear error because the collector cannot safely derive child names from it.

If a rule has a dynamic path function and the collector lacks the required name context, the path is skipped only for that unsupported context and covered by a test if it is a known model shape.

## Testing

Add focused tests for `collectSyncStateFilePaths`:

- child command modules are discovered via `childCollections` and `MetadataCommandRules`;
- form external resources are discovered through rule-declared form directories;
- template directory contents are included through `folderName`/`forReferenceOnly`;
- unknown files and `Миграции/*.yaml` remain excluded.

Add or keep an ERP verification command during manual verification:

- rebuild `.nkdk-sync.yaml` for `/Users/nikita/git/nkdk-yaml` and `/Users/nikita/git/round-trip/erp`;
- compare all YAML-project files against state entries with the service exclusions above;
- require `missedCount: 0`.

Run `pnpm test` before closing the work.
