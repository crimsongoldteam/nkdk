# Round-trip: ViewStatusAddition Visible

## Context

Short XML round-trip on `/Users/nikita/git/round-trip-source/acc` found a diff in:

- `DataProcessors/ИнтерфейсДокументовЭДО/Forms/ПомощникФормированияДокументов/Ext/Form.xml`
- active XML directory: `/Users/nikita/git/round-trip-source/acc`

The generated XML loses the `Visible` node inside `ViewStatusAddition`:

```diff
<ViewStatusAddition name="ОшибкиПриФормированииДокументовПоФайламСостояниеПросмотра" id="353">
-  <Visible>false</Visible>
   <Enabled>false</Enabled>
   <AdditionSource>
```

`packages/core/metadata/forms/elements/viewStatusAddition/rules.ts` already has `enabled`, but does not have `visible`.

Neighboring form elements use a plain boolean visibility property:

```ts
visible: { yaml: "Видимость", type: "boolean" }
```

Examples include `Table`, `SearchStringAddition`, `SearchControlAddition`, `Button`, `FormDecoration`, and `FormGroup`.

## Decision

Use the same `visible` property pattern for `ViewStatusAddition`.

The property should be a normal XML/model/YAML property, not a reference-only preservation hack. YAML should be able to explicitly express visibility for this element.

## Proposed Approach

1. Add to `ViewStatusAdditionRules.properties`:

```ts
visible: { yaml: "Видимость", type: "boolean" }
```

2. Add `Видимость?: StringboolYAML` to `ViewStatusAdditionYAML`.

3. Keep the change local to `viewStatusAddition`. Do not introduce a shared abstraction for additions during this fix, because the neighboring elements already declare `visible` directly and the diff is narrow.

## Tests To Add Later

1. Form element XML round-trip test or fixture case:
   - `ViewStatusAddition` contains `<Visible>false</Visible>`;
   - export preserves that node.

2. YAML shape test if the module already has suitable coverage:
   - `Видимость: Ложь` maps to `visible: false` and exports back.

## Non-goals

- Do not refactor shared form element property sets.
- Do not change unrelated visibility semantics such as `UserVisible`.
- Do not implement the fix as part of this brainstorming pass.
