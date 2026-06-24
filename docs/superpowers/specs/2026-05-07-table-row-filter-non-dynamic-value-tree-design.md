# Table RowFilter For Non DynamicList And Non ValueTree Tables

## Goal

Change `Table` XML export so `RowFilter` is emitted for tables whose data path points to a form attribute that is neither `DynamicList` nor `ValueTree`.

The motivating round-trip case is a table with `DataPath` like `Объект.ЦеновыеГруппы`: the source XML contains `<RowFilter xsi:nil="true"/>`, but the current `ValueTable`-only predicate does not emit it.

## Current Behavior

`TableRules.rowFilter` is an XML-only service default:

- `fromXML: false`
- `fromYAML: false`
- `toYAML: false`
- `defaultValueXMLRaw: { "_xsi:nil": "true" }`

It currently uses `valueTableFormAttributeQuery` and emits `RowFilter` only when the first segment of `dataPath` matches a `FormAttribute` whose `p_type_type` contains `ValueTable`.

`Period` and `TopLevelParent` are separate XML-only service defaults driven by `dynamicListFormAttributeQuery`.

## Desired Behavior

For `Table.rowFilter`, use positive eligibility from Cypher:

- Emit `RowFilter` when the first segment of `dataPath` matches a returned row from `rowFilterFormAttributeQuery`.
- `rowFilterFormAttributeQuery` returns `FormAttribute` rows whose `p_type_type` does not contain `DynamicList` and does not contain `ValueTree`.
- Do not emit `RowFilter` when the cache is absent, when the row set is empty, or when the first `dataPath` segment is not present in the returned rows.

The rule is intentionally not inferred from missing DynamicList/ValueTree rows. Absence of data is not a positive signal.

## Architecture

Keep the current `cypherPredicate` architecture:

- `TableRules` owns conditional XML defaults.
- `clientApplicationForm/toXML.ts` prepares the CypherCache for real form export.
- `tests/element/exportElementToXML.ts` prepares equivalent cache rows from `contextAttributes` for element-level fixture tests.
- `RowFilter`, `Period`, and `TopLevelParent` remain absent from explicit TS fixture models and YAML fixtures.

Rename the `ValueTable`-specific query to a behavior-oriented query:

```ts
export const rowFilterFormAttributeQuery =
  'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE NOT "DynamicList" IN a.p_type_type AND NOT "ValueTree" IN a.p_type_type RETURN a.name AS name'
```

If local Cypher predicate syntax requires parentheses for `NOT`, use the project-supported equivalent while preserving the meaning.

## Data Flow

1. During form XML export, `ensureTableFormAttributeCypherCache` checks whether cache rows exist for:
   - `dynamicListFormAttributeQuery`
   - `rowFilterFormAttributeQuery`
2. If rows are missing, it derives them from `form.attributes`.
3. For `rowFilterFormAttributeQuery`, derived rows include form attributes with `attr.type.type` array not containing `DynamicList` and not containing `ValueTree`.
4. `TableRules.rowFilter.toXML` checks whether any returned row name equals `table.dataPath.split(".")[0]`.
5. If yes, it emits `<RowFilter xsi:nil="true"/>`.

## Test Coverage

Update `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`:

- `ValueTable` first segment: emits `RowFilter`.
- Nested path such as `Объект.ЦеновыеГруппы`, where row name is `Объект`: emits `RowFilter`.
- `DynamicList`: does not emit `RowFilter`; still emits `Period` and `TopLevelParent`.
- `ValueTree`: does not emit `RowFilter`.
- Empty row set: does not emit `RowFilter`.
- Missing cache: does not emit `RowFilter`.

Update form-export cache tests or add equivalent coverage if a focused test already exists:

- Existing cache rows are preserved and not overwritten.
- `rowFilterFormAttributeQuery` rows are derived from `form.attributes`.
- `DynamicList` and `ValueTree` are excluded from row-filter rows.

Fixture impact:

- Existing `full.xml` ValueTable-backed table should still pass and emit `RowFilter`.
- Existing `dynamicList.xml` should still pass without `RowFilter`.
- Existing `fullTree.xml` should still pass without `RowFilter`.
- Add or adjust an element-level fixture only if predicate tests and form-export cache tests do not cover the `Объект.ЦеновыеГруппы` path shape well enough.

## Error Handling

No new runtime errors are introduced.

If `p_type_type` is missing or not an array in derived form attributes, do not include that attribute in row-filter rows. This keeps unknown data from causing extra XML.

## Out Of Scope

- Do not change `Period` or `TopLevelParent` behavior.
- Do not add `RowFilter`, `Period`, or `TopLevelParent` to TS models or YAML.
- Do not create new fromXML/toXML helper rules outside `rules.ts`.
- Do not solve unrelated round-trip diffs such as `TypeDomainEnabled` or empty form parameter `Type`.

## Verification

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/table/cypherPredicate.test.ts
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/clientApplicationForm/toXML.test.ts
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/toEnterprise.test.ts -t "Table"
```

After implementation, rerun the relevant `round-trip-xml` triage or single diff for the `ЦеновыеГруппы` case to confirm the `RowFilter` diff is gone.
