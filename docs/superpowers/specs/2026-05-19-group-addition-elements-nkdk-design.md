# Group Addition Elements In NKDK

## Context

Full YAML round-trip on `/Users/nikita/git/round-trip-source/acc` stops during import with:

```text
MetadataCatalog "КонтактныеЛица": exportFunction is not a function
```

The first reproducible representative is `Catalogs/КонтактныеЛица/Forms/ФормаВыбораЛидов/Ext/Form.xml`.
Inside ordinary `UsualGroup/ChildItems`, XML contains:

- `SearchStringAddition`
- `SearchControlAddition`

The model imports these elements, but `exportChildItemsToNKDK` treats ordinary group children as `GenerateChildItem` and looks up their exporter only in `ExportToNKDKGeneratorFn`. These addition elements are currently registered only for command bar children in `ExportToNKDKCommandBarChildItemsGeneratorFn`, so lookup returns `undefined`.

The `.nkdk` grammar mirrors the same limitation: `CommandAdditionField` is allowed only inside `CommandBarChildItem`, not inside ordinary `ChildItem` or one-line group fields.

## Decision

Treat `SearchStringAddition`, `SearchControlAddition`, and `ViewStatusAddition` as valid ordinary group child elements.

This matches real XML: additions are not limited to command bars. The model types, NKDK export map, and NKDK grammar should all express that explicitly instead of relying on fallback dispatch.

## Proposed Approach

1. Extend form child item types:
   - add `SearchStringAddition`, `SearchControlAddition`, and `ViewStatusAddition` to `GroupChildItem`;
   - add the same three types to `GenerateChildItem`.

2. Extend NKDK export:
   - add the same three `itemType` entries to `ExportToNKDKGeneratorFn`;
   - use the existing `exportOtherElementToNKDK` formatter, matching their current command bar export behavior.

3. Extend NKDK syntax:
   - allow `CommandAdditionField` as an ordinary `ChildItem`;
   - allow `CommandAdditionField` inside `OneLineGroupField`, so one-line groups can round-trip the same additions.

4. Keep command bar behavior unchanged:
   - `CommandBarChildItem` continues to allow addition elements;
   - command bar export continues to use `ExportToNKDKCommandBarChildItemsGeneratorFn`.

## Tests To Add Later

1. Language/parser test:
   - a regular group can contain `?ОтображениеСтрокиПоиска ...`;
   - a regular group can contain `?УправлениеПоиском ...`;
   - a one-line group can contain the same additions.

2. NKDK import/export test:
   - importing group additions from `.nkdk` produces `SearchStringAddition` and `SearchControlAddition`;
   - exporting a `UsualGroup` with these additions does not throw and emits stable `.nkdk`.

3. Round-trip representative:
   - `КонтактныеЛица/ФормаВыбораЛидов` no longer fails with `exportFunction is not a function`.

## Non-goals

- Do not add fallback lookup across unrelated export maps.
- Do not change XML fixtures.
- Do not change table singleton additions such as `SingleSearchStringAddition`; this design only covers child elements inside group-like containers.
- Do not address the separate `Cannot read properties of undefined (reading 'ru')` form formatting failures in this change.
