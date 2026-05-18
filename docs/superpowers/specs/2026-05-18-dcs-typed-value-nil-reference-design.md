# DCS typed value `xsi:nil` reference preservation

## Context

`round-trip.sh --triage --all-configs --batch-size 5` stops on
`erp/DataProcessors/СтруктураВладения/Forms/Форма/Ext/Form.xml` before it can
emit the next diff batch.

The failing XML fragment is a DCS `FilterItemComparison` with
`comparisonType=InList` and three `dcsset:right` values:

- two `dcscor:DesignTimeValue` references;
- one `<dcsset:right xsi:nil="true"/>`.

`DcsMetadataTypedValue` currently assumes every imported value has `_xsi:type`.
The nil node has only `_xsi:nil`, so import fails with
`DcsMetadataTypedValue XML: unsupported _xsi:type undefined`.

## Goal

Support XML round-trip for nil DCS typed values without adding a new semantic
YAML value. The nil value is an XML preservation detail: it must survive
XML -> model -> XML when it exists in the source/reference XML.

## Design

Treat `xsi:nil` as an empty value at the model boundary.

For a single `DcsMetadataTypedValue`, import of `<... xsi:nil="true"/>` returns
`undefined`, matching the existing pattern for absent values.

For arrays, import must preserve nil positions instead of filtering them out.
An `InList` right side such as:

```xml
<dcsset:right xsi:type="dcscor:DesignTimeValue">Документ.А.ПустаяСсылка</dcsset:right>
<dcsset:right xsi:type="dcscor:DesignTimeValue">Документ.Б.ПустаяСсылка</dcsset:right>
<dcsset:right xsi:nil="true"/>
```

becomes an array with two typed values and one `undefined` slot.

On export, `DcsMetadataTypedValue` keeps the behavior conservative:

- typed values are exported normally;
- an `undefined` array item is exported as `{ "_xsi:nil": "true" }` only when
  the corresponding reference item is also `xsi:nil`;
- without a confirming reference item, the exporter does not invent a nil XML
  node.

This keeps `xsi:nil` XML-only and avoids adding `{ type: "Nil" }` to the public
typed-value model.

## Affected Code

- `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/*` tests/fixtures as needed

## Risks

- Arrays currently filter `undefined` during import. That must change only for
  XML typed-value arrays; otherwise the nil position is lost.
- YAML export must not gain a representable nil value. If a nil item reaches a
  YAML path, it should be omitted or rejected according to existing XML-first
  constraints, not serialized as a new YAML construct.
- Reference matching for `FilterItemComparison` uses `leftValue` plus
  `comparisonType`. If two comparisons share those fields but differ only by
  right values, export may pick the wrong reference. This task does not broaden
  matching unless a test exposes that ambiguity.

## Tests

Add focused tests before implementation:

- `DcsMetadataTypedValue` imports a single `xsi:nil` value as `undefined`.
- `DcsMetadataTypedValue` imports an array containing typed values and
  `xsi:nil` while preserving array length and position.
- `DcsMetadataTypedValue` exports an `undefined` array item as
  `xsi:nil="true"` when the corresponding reference XML/model item is nil.
- `FilterItemComparison InList` round-trips two `DesignTimeValue` right values
  plus a nil right value.

Run targeted tests first, then `pnpm test` after the fix.
