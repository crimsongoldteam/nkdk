# DCS Field Typed Values YAML Design

## Problem

`round-trip-yaml` stops during XML import on forms whose dynamic list `dataParameters` contain non-field values:

- `xs:decimal` value `0` for parameter `Год`;
- `ent:AccumulationRecordType` value `Receipt` for parameter `ВидДвижения`.

The XML import already reads these values into typed model values. The XML export also supports typed model values under a `Field` rule. The failure is isolated to YAML export: `valueType: "Field"` always calls `exportMetadataFieldToYAML`, which expects a string path and crashes when it receives `{ type, value }`.

## Decision

Fix the asymmetry in the shared DCS YAML value layer, not in `DynamicListRules`.

For `MetadataDcsMetadataValue` with `valueType: "Field"`:

- keep the existing short YAML for string field paths;
- export typed primitive values through `MetadataValue` YAML;
- export inferred system enumerations through their `typeSE` mapping;
- import YAML values back with the same precedence: field path when it is a field, metadata value when it is a typed primitive, design-time value for enum metadata paths.

This keeps `DynamicListRules.dataParameters` unchanged and makes the existing XML behavior match YAML behavior.

## Scope

Change only the shared DCS value conversion and focused tests:

- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`

No XML fixtures are changed.

## Verification

Focused tests should cover:

- `valueType: "Field"` exporting `{ type: "decimal", value: 0 }` to `0`;
- `valueType: "Field"` importing `0` back to decimal typed value;
- `valueType: "Field"` exporting inferred system enumeration `AccumulationRecordType` to the YAML enum name;
- existing field-path and design-time enum path behavior remains unchanged.

After implementation, run focused DCS tests and then `round-trip-yaml` again.
