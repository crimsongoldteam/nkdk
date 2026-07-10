# Validation Object Table Snapshot File Paths Design

## Problem

Parallel project validation builds an object table during first pass and sends its snapshot to worker threads for second pass.

The table currently stores file existence implicitly through object records, but its snapshot keeps only records reachable through the owner lookup map. That map is keyed by `kind:name`.

This is not enough for recursive metadata objects such as subsystems. Different subsystem branches can contain objects with the same local name, for example `СтандартныеОтчеты` or `НастройкиИСправочники`. When the table is snapshotted, records with the same local owner key overwrite each other. As a result, the restored worker-side table loses some file paths even though those files were discovered and validated in first pass.

The visible symptom is a false second-pass diagnostic:

```text
Не найден объект "Подсистема...."
```

The YAML files exist. The worker-side validation table simply no longer knows about some of their paths after snapshot restoration.

## Goal

Make full parallel validation preserve file existence exactly across the first-pass to second-pass worker boundary.

The fix must be narrow:

- Do not redesign subsystem naming.
- Do not change `OwnerTypeRef` or owner lookup semantics in this step.
- Do not add subsystem-specific conditions to common validation layers.
- Keep sequential validation and parallel validation behavior aligned.

## Design

Extend `ValidationObjectTableSnapshot` with a separate `filePaths: string[]` field.

`ValidationObjectTable` will continue to maintain two pieces of state:

- `recordsByOwner`: current owner lookup keyed by `kind:name`.
- `filePaths`: all discovered/accepted record file paths, keyed by resolved absolute path.

When creating a snapshot, the table will serialize both:

- `records`: the current owner lookup records, as today.
- `filePaths`: every file path known to the table.

When restoring from a snapshot, the table will:

- merge `records` as today;
- add every `filePaths` entry into the file path set.

This keeps `hasFile(filePath)` accurate in worker second pass even when duplicate local owner names caused owner-record overwrites.

## Data Flow

1. First pass discovers and validates YAML files.
2. Each successful file contributes a `ValidationObjectRecord`.
3. `mergeRecords()` adds the record path to `filePaths`.
4. The main thread creates a snapshot with both `records` and `filePaths`.
5. Workers restore the table from the snapshot.
6. `ProjectMetadataResolver` uses `table.hasFile(filePath)` and sees the same file paths that first pass saw.

## Error Handling

No new user-facing error type is needed. The change removes false missing-object diagnostics caused by snapshot data loss.

Malformed or truly missing subsystem references should still produce the existing `Не найден объект ...` diagnostics.

## Testing

Add focused tests around `ValidationObjectTable`:

- A table with two records that share the same `ownerRef` key but have different `filePath` values should keep both paths after `snapshot()` and restore.
- `getOwner()` can still return the last owner record for that key; this design does not change owner lookup behavior.

Add an integration validation test:

- Build a project with two subsystem files that share the same local name in different branches.
- Validate with `concurrency: 2`.
- Assert that references to both existing subsystem paths do not produce false `Не найден объект` diagnostics.

Run the full project test suite with `pnpm test`.
