# Table XML Service Fields Preserve From Reference

## Goal

Simplify export of three XML-only `Table` service fields:

- `Period`
- `TopLevelParent`
- `RowFilter`

These fields are not part of the user-facing form model. 1C does not require us to infer or add them during export. They are only needed to preserve source XML structure during round-trip.

## Current Behavior

The current branch emits these fields through `cypherPredicate`:

- `Period` and `TopLevelParent` are emitted when `dataPath` points to a `DynamicList` form attribute.
- `RowFilter` is emitted when `dataPath` points to a form attribute selected by `rowFilterFormAttributeQuery`.
- Form export prepares a `CypherCache` before XML export.
- Element-level tests build equivalent cache rows from `contextAttributes`.

This makes export depend on data-path classification even though the real requirement is weaker: if the field existed in the reference XML, keep it; otherwise do not add it.

## Desired Behavior

For `Table.period`, `Table.topLevelParent`, and `Table.rowFilter`:

- If the field key exists in `referenceMetadata`, export the field using its `defaultValueXMLRaw`.
- If the key is absent from `referenceMetadata`, do not export the field.
- If there is no reference metadata, do not export the field.
- Never add these fields based on `dataPath`, form attribute type, `DynamicList`, `ValueTable`, `ValueTree`, or Cypher.

The important check is key presence, not value truthiness:

```ts
Object.hasOwn(referenceMetadata, key)
```

This matters because reference import may store `undefined` for XML-only nil/default fields while still preserving the fact that the XML tag existed.

## Rule Shape

Add a declarative flag to `PropertyRule`:

```ts
preserveFromReferenceXML?: true
```

Use it in `TableRules`:

```ts
period: {
  yaml: "Период",
  type: "boolean",
  fromXML: false,
  toYAML: false,
  fromYAML: false,
  preserveFromReferenceXML: true,
  defaultValueXMLRaw: {
    "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
    "v8:startDate": "0001-01-01T00:00:00",
    "v8:endDate": "0001-01-01T00:00:00",
  },
}

topLevelParent: {
  yaml: "РодительВерхнегоУровня",
  type: "boolean",
  fromXML: false,
  toYAML: false,
  fromYAML: false,
  preserveFromReferenceXML: true,
  defaultValueXMLRaw: { "_xsi:nil": "true" },
}

rowFilter: {
  yaml: "ОтборСтрок",
  type: "boolean",
  fromXML: false,
  toYAML: false,
  fromYAML: false,
  preserveFromReferenceXML: true,
  defaultValueXMLRaw: { "_xsi:nil": "true" },
}
```

Do not model these fields in YAML or normal TS fixtures. They remain XML-only preservation markers.

## Architecture

`importPropertiesFromXML` already has the required reference behavior:

- In normal import, fields with `fromXML: false` are skipped.
- In reference import (`forReference: true`), a field with `fromXML: false` is still written to the reference model if the XML key is present.

XML export should use that reference model directly:

- `exportPropertiesToXML` passes `referenceMetadata` and the property key into `shouldProcessProperty`.
- `shouldProcessProperty` handles `preserveFromReferenceXML: true` during `exportToXML`.
- If the reference object owns the property key, the property is processed and `defaultValueXMLRaw` is emitted.
- If not, the property is skipped.

After this change, `cypherPredicate` is no longer needed for `Table` XML export.

## Cypher Cleanup

Remove the production export path for `cypherPredicate` if no production usage remains:

- Remove `cypherPredicate` usage from `TableRules`.
- Remove `dynamicListFormAttributeQuery` and `rowFilterFormAttributeQuery` if they become unused.
- Remove form-export `CypherCache` preparation for these fields.
- Remove `collectCypherPredicates` / `resolveCypherPredicates` from form `syncToXML` if they become unused.
- Remove `cypherPredicate` tests that only validate the removed export path.

Keep `cypherSet`. It is a separate mechanism used for `allowedValues`, for example in metadata attribute rules, and is not part of this simplification.

## Data Flow

1. Source XML is read as a reference with `forReference: true`.
2. Reference import sees `<RowFilter xsi:nil="true"/>`, `<TopLevelParent xsi:nil="true"/>`, or `<Period>...</Period>`.
3. Even though those rules have `fromXML: false`, reference import keeps the corresponding keys in `referenceMetadata`.
4. During export, `preserveFromReferenceXML: true` checks whether the key exists in the reference table element.
5. If yes, export emits the field's `defaultValueXMLRaw`.
6. If no, export does not create the field.

## Examples

Reference XML contains `RowFilter`:

```xml
<Table name="Таблица">
  <RowFilter xsi:nil="true"/>
</Table>
```

Reference table model owns `rowFilter`, so export preserves:

```xml
<RowFilter xsi:nil="true"/>
```

Reference XML does not contain `RowFilter`:

```xml
<Table name="Дерево"/>
```

Reference table model does not own `rowFilter`, so export does not add it.

No reference is available for a newly created table:

- `Period` is not added.
- `TopLevelParent` is not added.
- `RowFilter` is not added.

## Test Coverage

Add focused orchestration coverage:

- A property with `preserveFromReferenceXML: true` is exported when `referenceMetadata` owns the key.
- The same property is not exported when the key is absent.
- The same property is not exported without reference metadata.
- Key presence works even when the reference value is `undefined`.

Update `Table` tests:

- `full.xml` preserves `RowFilter` from reference.
- `dynamicList.xml` preserves `Period` and `TopLevelParent` from reference.
- `fullTree.xml` does not add `RowFilter`, `Period`, or `TopLevelParent`.
- A table whose `dataPath` would previously satisfy Cypher eligibility does not receive `RowFilter` unless the reference has `rowFilter`.

Update or remove tests that assert Cypher-driven export for these three fields.

## Out Of Scope

- Do not solve unrelated round-trip diffs such as `TypeDomainEnabled`, empty form parameter `Type`, command interface ordering, or DCS `MetadataValue` export errors.
- Do not add these fields to YAML.
- Do not infer these fields from `DynamicList`, `ValueTable`, `ValueTree`, or data paths.
- Do not remove `cypherSet`.

## Verification

Run focused tests:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/property/helpers.test.ts metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/toEnterprise.test.ts -t "Table|preserveFromReferenceXML"
```

Run full tests:

```bash
pnpm test
```

Run round-trip triage:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
```

Expected round-trip result:

- Existing `RowFilter`, `Period`, and `TopLevelParent` tags are preserved when present in reference XML.
- These tags are not newly added when absent from reference XML.
- Remaining unrelated diffs may still appear.
