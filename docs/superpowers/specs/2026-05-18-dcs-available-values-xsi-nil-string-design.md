# DCS available values `xsi:nil` string preservation

## Context

After fixing the previous ERP blockers, `round-trip.sh --triage` reaches
`erp/DataProcessors/УправлениеПродажамиНаМаркетплейсах/Forms/ВыгрузкаТоварногоКаталога/Ext/Form.xml`
and stops during form import:

```text
DCS MetadataValue: unexpected missing value
```

The failing XML fragment is a DCS available-values list:

```xml
<dcssch:availableValue>
	<dcssch:value xsi:nil="true"/>
</dcssch:availableValue>
<dcssch:availableValue>
	<dcssch:value xsi:type="xs:boolean">true</dcssch:value>
</dcssch:availableValue>
```

`packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.ts`
already treats nil available values as a supported XML case, but its
`isNilValueXML` helper recognizes only `_xsi:nil === true`.

The full form round-trip parser preserves `xsi:nil` attributes and keeps the
attribute value as the string `"true"`. Because the helper does not recognize
that shape, the importer tries to parse an empty `dcssch:value` as a normal
`DCS MetadataValue`, receives `undefined`, and the public DCS metadata-value
entrypoint throws `unexpected missing value`.

## Decision

Fix this locally in `DcsAvailableValues`.

`DcsAvailableValues` already has the correct semantic model for this case:
an available-value item may exist without a `value`. The only missing piece is
accepting both parser shapes for nil:

- `_xsi:nil === true`;
- `_xsi:nil === "true"`.

Do not broaden the public `DCS MetadataValue` importer. Its
`unexpected missing value` guard should remain in place for ordinary callers,
because a missing metadata value is usually an invalid state unless the owning
container explicitly knows how to represent absence.

Do not change the XML parser to normalize all `xsi:nil` attributes to boolean.
That would be wider than this blocker and could affect unrelated preservation
paths.

## Design

Update `availableValues/fromXML.ts`:

```ts
const isNilValueXML = (value: unknown): boolean =>
  typeof value === "object" &&
  value !== null &&
  ((value as { "_xsi:nil"?: unknown })["_xsi:nil"] === true ||
    (value as { "_xsi:nil"?: unknown })["_xsi:nil"] === "true")
```

The existing import flow stays the same:

1. `dcssch:value` with nil is recognized by the owning `DcsAvailableValues`
   importer;
2. the item is imported as `{ itemType: "DcsAvailableValue" }`;
3. non-nil values continue through `importDcsMetadataValueFromDcsXML`.

## Tests

Add a regression test that exercises the parser shape used by form round-trip:

- parse XML through `importContentFromXML(..., { preserveXsiNil: true })`;
- feed the resulting `dcssch:availableValue` array to `importPropertyFromXML`;
- expect the nil item to import without a `value`.

Keep the existing `nilAndBoolean.xml` fixture behavior. If that fixture already
uses the default parser path, either add a direct inline test for
`preserveXsiNil` or update the existing nil test to parse with that option.

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/dataCompositionSystem/availableValues
```

After implementation, repeat the ERP round-trip triage:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/erp ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5 --start-index 1
```

The expected result is that this blocker no longer stops import. Any remaining
`TRIAGE_DIFF` entries are the next actionable discrepancies, while the known
duplicate `FormAttribute` case remains under `SKIPPED_INVALID_DIFF`.

## Non-goals

- Do not add a YAML representation for nil available values.
- Do not make `importDcsMetadataValueFromDcsXML` silently return `undefined`
  through its public entrypoint.
- Do not normalize all `_xsi:nil` values in the XML parser.
