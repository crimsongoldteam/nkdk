# Common basedOn object paths

## Context

`MetadataCatalogRules` already limits `basedOn` through an explicit `allowedObjectPaths` list. Other metadata objects with `basedOn` should use the same set of allowed object paths so YAML validation and metadata target presentation stay consistent.

## Scope

Apply the same object allow-list to:

- `Document`
- `ExchangePlan`
- `Task`
- `BusinessProcess`
- `ChartOfAccounts`
- `ChartOfCharacteristicTypes`
- `ChartOfCalculationTypes`
- `ExternalDataSource.Table`

`Catalog` must keep the same behavior, but its local list should be replaced by the shared one.

## Design

Introduce one shared constant for `basedOn` object targets. The list matches the current `Catalog` behavior:

- `ChartOfAccounts`
- `ExternalDataSource.Table`
- `ExchangePlan`
- `Catalog`
- `Document`
- `ChartOfCharacteristicTypes`
- `BusinessProcess`
- `ChartOfCalculationTypes`
- `Task`

Every `basedOn` rule in scope will set:

```ts
metadataTarget: { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths }
```

Existing field types and XML/YAML names stay unchanged unless tests show that a current type cannot support `metadataTarget`. This keeps the change focused on allowed metadata targets, not on serialization format.

## Data Flow

The parser and formatter continue to process the same XML/YAML values. The shared `allowedObjectPaths` only constrains how `metadataTarget` validates and presents possible object references.

## Errors

References outside the shared list should fail the same way as other invalid `metadataTarget` object references. Empty values and defaults keep current behavior.

## Testing

Add focused tests for one or more newly restricted `basedOn` fields to prove that:

- an allowed object path is accepted;
- an unrelated object path is rejected;
- the shared list is used by `Catalog` and the added object rules.

Run the full project test command before closing the task:

```sh
pnpm test
```
