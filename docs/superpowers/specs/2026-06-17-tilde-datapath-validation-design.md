# Tilde DataPath Validation Design

## Context

ERP import into `/home/nikita/git/temp-yaml` produced `361` schema errors for `DataPath` values that start with `~`, for example `~Список.DefaultPicture` and `~Список.Period~Список.Период`.

These values already exist in XML fixtures and imported YAML. They are raw platform variant paths, not ordinary dotted form paths. The project must preserve them exactly and must not try to normalize them into regular `DataPath` values.

## Goal

Treat `~` variant `DataPath` values as opaque raw strings:

- JSON Schema accepts them as valid `DataPath` values.
- Form `DataPath` resolver skips them without warnings or errors.
- Import, YAML output, XML output, and existing string values are not transformed.
- Non-tilde indexed paths like `Список[0].Поле` remain outside this change.

## Architecture

The change stays inside existing `DataPath` validation boundaries.

`packages/core/metadata/commonObjects/metadataTargets/schema.ts` owns the JSON Schema shape for `DataPath`. It should keep the existing strict dotted-path branch and add a second branch for tilde variant paths.

`packages/core/metadata/validation/dataPath/resolver.ts` owns semantic form-path validation. It already detects `value.includes("~")`; that branch should return `ok` with no target and no diagnostics.

No fromXML/toXML/fromYAML/toYAML rules are added. No XML fixtures are changed.

## Data Flow

When `validate` reads a YAML form:

1. JSON Schema accepts regular dotted paths and tilde variant paths.
2. Form validation collects `DataPath` occurrences as before.
3. Resolver sees a tilde variant path and returns `{ status: "ok", diagnostics: [] }`.
4. Other `DataPath` values continue through current semantic resolution.

## Error Handling

Tilde variant paths are intentionally not diagnosed. They are not warnings, because the requested behavior is to ignore them during validation.

Malformed non-tilde paths keep current schema behavior. Indexed paths with `[0]` are not handled by this spec.

## Testing

Add focused tests:

- JSON Schema accepts `~Список.DefaultPicture`.
- JSON Schema accepts `~Список.Period~Список.Период`.
- JSON Schema still rejects `Список[0].Поле`.
- Resolver returns `ok` and no diagnostics for tilde variant paths.
- Existing validation tests continue to pass.
