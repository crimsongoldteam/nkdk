# Form round-trip: CommandInterface duplicate order and AutoCellHeight

## Context

Short round-trip for `round-trip-source/trade` still reports form XML noise after the recent
`CommandInterface` order fixes.

Two confirmed clusters remain in the first triage batch:

- `CommandInterface.NavigationPanel.Item` order changes when two auto commands have the same
  `Command` and `CommandGroup`, and differ only by `Index`.
- `AutoCellHeight` disappears from non-table `InputField` / `LabelField` XML nodes because the
  property is currently defined only in table-related form field rules.

The large `FormAttribute Settings xsi:type="...Chart"` diff is intentionally outside this spec.

## Goals

1. Preserve `CommandInterfaceItem` XML field order from reference XML when duplicate auto commands
   differ by `Index`.
2. Preserve explicit `<AutoCellHeight>true</AutoCellHeight>` on regular form fields that are not
   imported through `TableChildItems`.
3. Add narrow XML reproducers so the future fix can be verified without running the full project
   test suite first.

## Non-Goals

- Do not redesign generic form element dispatch.
- Do not change `CommandInterface` item array order.
- Do not model chart settings for form attributes.
- Do not add enterprise fixtures for `AutoCellHeight`; the driving behavior is XML round-trip
  preservation. The shared element fixture matrix still needs minimal YAML expectations for
  models that contain `autoCellHeight: true`, because `toYAML.test.ts` runs over the same fixtures.

## CommandInterface Design

`packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts` already receives
`referenceData` and uses it to preserve field order. The current matching function finds a
reference item by:

```text
command + commandGroup
```

This is not enough for auto navigation panel items. Real XML can contain two items like:

```xml
<Item>
	<Command>0</Command>
	<Type>Auto</Type>
	<CommandGroup>FormNavigationPanelGoTo</CommandGroup>
	<DefaultVisible>false</DefaultVisible>
</Item>
<Item>
	<Command>0</Command>
	<Type>Auto</Type>
	<CommandGroup>FormNavigationPanelGoTo</CommandGroup>
	<Index>1</Index>
	<DefaultVisible>false</DefaultVisible>
</Item>
```

The reference lookup must match inside the same collection (`NavigationPanel` or `CommandBar`) by:

```text
command + commandGroup + index
```

`index: undefined` is a meaningful value and must only match another `undefined`. It must not be
treated as `0`.

When exactly one reference item matches, export uses that reference item's key order. When no item
or multiple items match, export keeps the existing fallback order.

`CommandInterfaceItem.command` is a string in the model. The XML parser can read
`<Command>0</Command>` as number `0`, so `fromXML` must normalize `Command` with `String(...)`.
This keeps the model type stable and lets reference matching compare the same command value on
real auto command items.

## AutoCellHeight Design

`AutoCellHeight` currently lives in `formFieldTableRelatedProperties`:

```typescript
autoCellHeight: {
  yaml: "АвтоВысотаЯчейки",
  type: "boolean",
  implicitValueYAML: true,
}
```

That means it is available on `TableInputField`, `TableLabelField`, `TableCheckBoxField`, and
`TablePictureField`, but not on regular `InputField` or `LabelField`.

The real XML shows `AutoCellHeight` on regular child items too. In `trade/Catalogs`, the scan found
48 occurrences:

- 25 on `InputField`;
- 23 on `LabelField`.

The fix is to move `autoCellHeight` into `formFieldCommonProperties`. This makes the property part
of the common form-field model surface used by regular field elements and table field elements.
Table variants continue to inherit it through their existing spread of the base field rules.

Reference XML order remains the source of truth for export order. The reproducer fixtures should
therefore use `testExportElementToXML`, which imports the same XML as reference before exporting.
Like neighboring minimal form-field fixtures, the XML should include generated `ContextMenu` and
`ExtendedTooltip` nodes; otherwise export tests would fail on fixture calibration noise rather than
on `AutoCellHeight`. The element fixture entries should set `yaml: { АвтоВысотаЯчейки: "Истина" }`
so the shared YAML export tests stay green after `autoCellHeight` becomes a common property.

## Testing Strategy

Add focused reproducers before implementation:

- `duplicateAutoCommandOrder` in `forms/commonObjects/commandInterface`.
- `autoCellHeightInputField` in `forms/elements/inputField`.
- `autoCellHeightLabelField` in `forms/elements/labelField`.

Run narrow tests:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/fromXML.test.ts metadata/forms/commonObjects/commandInterface/toXML.test.ts -t "duplicateAutoCommandOrder"
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "autoCellHeight"
```

Expected after implementation:

- `duplicateAutoCommandOrder` imports and exports without moving `CommandGroup`.
- `autoCellHeightInputField` imports and exports with `autoCellHeight: true`.
- `autoCellHeightLabelField` imports and exports with `autoCellHeight: true`.

Full `pnpm test` remains the final regression check after the implementation is complete.

## Risks

- Moving `autoCellHeight` into common form field properties broadens the generated TypeScript model
  surface for every element that uses `formFieldCommonProperties`. This is intentional for XML
  preservation, but focused tests should confirm existing table fixtures still pass.
- The `CommandInterface` fix depends on strict `undefined` comparison for `Index`; accidentally
  normalizing `undefined` to `0` would reintroduce ambiguity.
