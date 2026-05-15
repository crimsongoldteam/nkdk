# Round-trip: AccountingRegister StandardAttributes

## Context

Short XML round-trip on `/Users/nikita/git/round-trip-source/acc` found a diff in:

- `AccountingRegisters/Хозрасчетный.xml`
- active XML directory: `/Users/nikita/git/round-trip-source/acc`

The generated XML adds two standard attributes that were absent in the source XML:

```diff
+<xr:StandardAttribute name="ExtDimension4">
+  ...
+</xr:StandardAttribute>
+<xr:StandardAttribute name="ExtDimensionType4">
+  ...
+</xr:StandardAttribute>
```

The related chart of accounts file is `ChartsOfAccounts/Хозрасчетный.xml`. Its source XML contains:

```xml
<ExtDimensionTypes>ChartOfCharacteristicTypes.ВидыСубконтоХозрасчетные</ExtDimensionTypes>
<MaxExtDimensionCount>3</MaxExtDimensionCount>
```

The current code has a fixed `MetadataAccountingRegisterStandardAttributeNames` list with `ExtDimension1..4` and `ExtDimensionType1..4`. The common `StandardAttributeDescriptions` XML export expands the section to the full canonical list when the group has any changed item, so it creates default-only `ExtDimension4` nodes.

## Decision

Do not implement a fixed `1..4` limit. Accounting register subconto standard attributes must support up to 50 pairs:

- `ExtDimension1..50`
- `ExtDimensionType1..50`

For XML round-trip, the source of truth for how many such standard attributes should be preserved is the XML reference of the accounting register itself, not `MaxExtDimensionCount` from the linked chart of accounts. If the reference XML contains only `ExtDimension1..3` and `ExtDimensionType1..3`, export must not add `ExtDimension4+`.

For model and YAML authoring, the rules must allow explicit use of up to 50 subconto standard attributes.

## Proposed Approach

1. Generate `MetadataAccountingRegisterStandardAttributeNames` dynamically:
   - keep the base standard attributes (`PeriodAdjustment`, `Account`, `Active`, `LineNumber`, `Recorder`, `Period`);
   - append `ExtDimensionN` and `ExtDimensionTypeN` for `N = 1..50`.

2. Make `StandardAttributeDescriptions` XML export reference-aware:
   - when `referenceMetadata` is present, derive the XML canonical export list from names present in that reference;
   - also include names explicitly present in the model, so user-authored YAML/model values can add a higher subconto attribute intentionally;
   - when no `referenceMetadata` is present, keep the current canonical-list behavior.

3. Keep the change in the common standard-attributes exporter, because the bug is caused by canonical expansion there. The accounting-register rule supplies the larger allowed name list.

## Tests To Add Later

1. Common XML export test:
   - rule knows `ExtDimension1..4` and `ExtDimensionType1..4`;
   - reference contains only `1..3`;
   - exported XML must not contain `ExtDimension4` or `ExtDimensionType4`.

2. Accounting register rule test:
   - `MetadataAccountingRegisterStandardAttributeNames` contains `ExtDimension50` and `ExtDimensionType50`.

## Non-goals

- Do not read or depend on the linked `ChartOfAccounts` during accounting register export.
- Do not change existing XML fixtures from the source repository.
- Do not implement the fix as part of this brainstorming pass.
