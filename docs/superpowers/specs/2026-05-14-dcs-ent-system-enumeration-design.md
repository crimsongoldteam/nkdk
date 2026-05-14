# DCS ent:* system enumeration import

## Context

Short round-trip stops while importing a form DCS value:

```xml
<dcssch:value xsi:type="ent:AccumulationRecordType">Expense</dcssch:value>
```

`MetadataDcsMetadataValue` already supports system enumerations when a rule explicitly says
`valueType: "SystemEnumeration"` and provides `typeSE`. The failing DCS value is parsed through a
generic `Primitive` rule, so the importer reaches the unsupported `xsi:type` branch before any XML
diff can be produced.

## Decision

Use approach B1: add a generic import fallback for known `ent:*` system enumerations.

When `dcsMetadataValue/fromXML.ts` sees an unknown `xsi:type` with the `ent:` prefix, it should:

1. extract the type name after `ent:`;
2. verify that the name exists in `SystemEnumerationTypeMap`;
3. import the value through the existing `importSystemEnumerationFromDcsXML` helper with
   `valueType: "SystemEnumeration"` and the inferred `typeSE`;
4. leave truly unknown `ent:*` values on the current explicit error path.

The model remains unchanged: the imported value is still the raw enumeration value string, for
example `"Expense"` or `"Receipt"`.

## Export

Do not add heuristic export for raw strings. A generic string value does not carry `typeSE`, so
choosing an `ent:*` type during export would be ambiguous.

Existing export remains the supported path:

```ts
{ type: "MetadataDcsMetadataValue", valueType: "SystemEnumeration", typeSE: "AccumulationRecordType" }
```

This keeps round-trip behavior explicit on export while unblocking import of real DCS XML where the
type is already present in `xsi:type`.

## Tests

Add a focused XML import fixture for `ent:AccumulationRecordType` under
`packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue`.

Expected behavior:

- `xsi:type="ent:AccumulationRecordType"` imports as `"Expense"`;
- the existing unsupported-type error still applies to unknown `ent:*` names;
- export tests continue to cover the explicit `SystemEnumeration` rule path.

## Scope

This change is limited to DCS metadata values. It does not add YAML behavior, change fixture XML from
the source repository, or alter broader metadata orchestration rules.
