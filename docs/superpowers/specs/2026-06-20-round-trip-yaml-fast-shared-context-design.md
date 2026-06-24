# Shared Context For round-trip-yaml-fast

## Problem

`round-trip-yaml-fast` now checks top-level XML files, forms, and child file-item XML files such as:

- `ExternalDataSources/*/Tables/*.xml`
- `ExternalDataSources/*/Cubes/*.xml`
- `ExternalDataSources/*/Cubes/*/DimensionTables/*.xml`

The coverage is useful, but child file-item XML files are currently checked as independent metadata items. That makes the fast check diverge from the working import/sync path: the child item has a rule and a local name, but it lacks the full owner context that the normal project traversal has.

The visible failures are:

- `InternalInfo` generated type names lose the parent object name, for example `ExternalDataSourceTableManager.TableName` instead of `ExternalDataSourceTableManager.ExternalDataSourceName.TableName`.
- `metadataTarget` fields with `owner: "this"` fail for default forms under external data source tables and cubes because the owner stack does not identify the current nested object.

This is a false signal from the fast checker. It should diagnose behavior through the same metadata traversal semantics as the working project path.

## Goal

Make `round-trip-yaml-fast` use the same owner/path context mechanism as the normal metadata import/sync traversal when it checks child file-item metadata as separate round-trip units.

The fast checker may remain different in output strategy: it does not need to write full YAML/XML trees to disk. It must not remain different in metadata item discovery, parent ownership, or target owner context.

## Non-Goals

- Do not add one-off fixes to `InternalInfo`.
- Do not relax `metadataTargets` parsing to accept invalid owner context.
- Do not remove child file-item XML from fast coverage.
- Do not change existing XML fixtures.
- Do not add YAML behavior annotations for this fix.

## Proposed Approach

Introduce a shared traversal/context helper in the metadata orchestration layer. The helper should describe each metadata file-item as a checkable unit with enough context to run XML, YAML, and XML export consistently:

- relative XML file path;
- absolute XML file path;
- metadata item rule;
- item name;
- parent name where existing APIs still require it;
- owner stack for `metadataTargetOwners`;
- enough item tree context for XML export helpers that inspect parents.

`round-trip-yaml-fast` should consume this helper instead of reconstructing its own partial traversal. The working import/sync path should use the same helper or the helper should be extracted from the existing working path so both contours share one source of truth.

For external data source children the resulting owner stack should be:

- table: `MetadataExternalDataSource -> MetadataExternalDataSourceTable`;
- cube: `MetadataExternalDataSource -> MetadataExternalDataSourceCube`;
- dimension table: `MetadataExternalDataSource -> MetadataExternalDataSourceCube -> MetadataExternalDataSourceDimensionTable`.

Forms discovered under these objects should inherit the owner stack of the owning metadata item.

## Data Flow

1. The shared traversal walks top-level metadata objects and their `fileItemRule` child collections.
2. Each recursion appends the current item to the owner stack.
3. `round-trip-yaml-fast` receives traversal entries and passes the owner stack into:
   - XML -> YAML export context;
   - YAML -> model import context;
   - model -> XML export context.
4. `metadataTargetOwnerFromRule` and `InternalInfo.getName` then see the same parent information they see in the normal path.
5. The generated XML is compared with the original XML as before.

## Error Handling

If the shared traversal cannot determine a required parent for a child file-item, the fast checker should report a structured error for that file instead of silently falling back to a rootless context.

This makes missing context explicit and prevents future false diffs that look like metadata behavior regressions.

## Testing

Add focused tests around `roundTripYAMLFast` using external data source child file-items:

- a table XML with `InternalInfo` keeps `ExternalDataSourceName.TableName` in generated type names;
- a cube XML keeps `ExternalDataSourceName.CubeName` in generated type names;
- a dimension table XML keeps `ExternalDataSourceName.CubeName.DimensionTableName`;
- table and cube default form targets with `owner: "this"` do not throw on `Table` or `Cube` path segments.

Run the fast skill on `/home/nikita/git/round-trip/all` and confirm that the current five `InternalInfo` diffs and two owner-context errors disappear or move to real metadata issues.

Before closing the issue, run `pnpm test` from the repository root.
