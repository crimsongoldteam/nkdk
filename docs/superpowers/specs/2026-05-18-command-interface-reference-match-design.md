# CommandInterface reference match for duplicate commands

## Context

The ERP round-trip diff for
`Catalogs/Организации/Forms/ФормаЭлемента/Ext/Form.xml` moves
`<Attribute>Объект.Ref</Attribute>` from its source position before
`<CommandGroup>` to the end of the `Item`.

The affected `CommandInterface` contains two navigation items with the same
`Command` and `CommandGroup`:

- `Type=Auto`, no `Attribute`;
- `Type=Added`, `Attribute=Объект.Ref`.

`CommandInterface` export already preserves XML node order from reference data.
The diff happens because `findReferenceCommandInterfaceItem` matches by only
`command + commandGroup + index`. With the duplicate above, it selects the
`Auto` reference item while exporting the `Added` item. The exporter therefore
uses the wrong reference order and appends `Attribute` after the reference keys.

## Goal

Preserve the source XML order for duplicate command-interface items without
changing the general fallback order for unrelated items.

## Design

Keep the existing reference-order mechanism, but make reference matching more
specific.

`findReferenceCommandInterfaceItem` should first look for a full identity match
using the fields that distinguish command-interface items:

- `command`
- `type`
- `attribute`
- `index`
- `commandGroup`

If no full match is found, it may fall back to the current coarse match
(`command + commandGroup + index`) to preserve existing behavior for older
fixtures where the reference item lacks optional fields.

Do not solve this by moving `Attribute` in the global fallback order. The
fallback order already places `Attribute` before `Index`, `DefaultVisible`, and
`CommandGroup`; the bug is choosing the wrong reference item.

## Affected Code

- `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
- `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`
- `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/*`

## Risks

- A too-strict match could stop preserving reference order for existing cases
  where optional fields are absent in the model or reference. The fallback match
  keeps those cases working.
- A too-loose match can keep the current bug for duplicate commands. The full
  match must run before the fallback.
- If there are still multiple identical items after full matching, this task
  does not introduce index-by-position matching; existing behavior remains.

## Tests

Add a fixture with two items that share `Command` and `CommandGroup`, where one
is `Type=Auto` and the other is `Type=Added` with `Attribute`.

The export test should import the XML fixture as reference data and assert that
the `Added` item preserves the source order:

```xml
<Command>...</Command>
<Type>Added</Type>
<Attribute>Объект.Ref</Attribute>
<CommandGroup>FormNavigationPanelGoTo</CommandGroup>
<DefaultVisible>false</DefaultVisible>
```

Run the focused `commandInterface` tests first, then `pnpm test` after the
implementation.
