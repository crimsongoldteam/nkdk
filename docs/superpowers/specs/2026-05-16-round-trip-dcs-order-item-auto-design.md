# Round-trip: DCS OrderItemAuto

## Context

Short XML round-trip on `/Users/nikita/git/round-trip-source/acc` found a diff in:

- `DataProcessors/ПодготовкаКвартальнойОтчетностиВПФР/Forms/КвартальнаяОтчетностьВПФР/Ext/Form.xml`
- active XML directory: `/Users/nikita/git/round-trip-source/acc`

The generated XML changes an automatic order item into a field order item:

```diff
-<dcsset:item xsi:type="dcsset:OrderItemAuto"/>
+<dcsset:item xsi:type="dcsset:OrderItemField"/>
```

`/Users/nikita/git/1c_res/model.xdtodcscore_root.res` defines `Order.item` as `OrderItem`, not as only `OrderItemField`:

```xml
<objectType name="Order">
  <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/settings" name="item" type="d4p1:OrderItem" lowerBound="0" upperBound="-1"/>
</objectType>
```

Known concrete descendants are:

- `OrderItemAuto`
- `OrderItemField`

`/Users/nikita/git/1c_res/settings.xsddcscore_root.res` shows that `OrderItemAuto` supports `use` and optional `iID`.

## Current Behavior

`OrderRules.items` uses `type: "OrderItemFields"`.

`OrderItemFields` is currently typed as `OrderItemField[]` and registered through a single-item collection rule:

```ts
export type OrderItemFields = OrderItemField[]

registerMetadataItemCollectionRule({
  propertyType: "OrderItemFields",
  itemRule: OrderItemFieldRules,
  yamlAsArray: true,
})
```

This shape cannot represent `xsi:type="dcsset:OrderItemAuto"`. During round-trip the auto item is normalized into an empty `OrderItemField`, so export writes the wrong `xsi:type`.

## Decision

Represent order items as a polymorphic collection:

```ts
type OrderItem = OrderItemField | OrderItemAuto
type OrderItemFields = OrderItem[]
```

`OrderItemAuto` should be a first-class model item with:

- `itemType: "OrderItemAuto"`;
- `use?: boolean`;
- optional `iID` only if the surrounding DCS item pattern already preserves it or a future diff requires it.

The XML importer/exporter should dispatch by `_xsi:type`, like `StructureItemGroupCollection`:

- `dcsset:OrderItemAuto -> OrderItemAuto`;
- `dcsset:OrderItemField -> OrderItemField`.

For XML export, `OrderItemAuto` must produce:

```xml
<dcsset:item xsi:type="dcsset:OrderItemAuto"/>
```

and include `dcsset:use` only when the value differs from the default.

## YAML Shape

Use the same compact auto marker that already exists for DCS group items:

```yaml
Элементы:
  - "[Авто]"
  - Поле: Номенклатура
```

Disabled auto item:

```yaml
Элементы:
  - "([Авто])"
```

This keeps YAML compact and consistent with `GroupItemAutoYAML`.

## Proposed Approach

1. Add `OrderItemAutoRules` near `orderItemFields`, with `itemType: "OrderItemAuto"` and the `use` property.

2. Add explicit import/export handlers for `OrderItemAuto`:
   - XML: preserve `xsi:type="dcsset:OrderItemAuto"`;
   - YAML: `[Авто]` / `([Авто])`.

3. Replace the single-rule `OrderItemFields` collection registration with explicit polymorphic handlers:
   - inspect `_xsi:type` on XML import;
   - inspect `itemType` on XML/YAML export;
   - detect auto YAML markers before falling back to `OrderItemField`.

4. Keep `OrderRules.items` as `type: "OrderItemFields"` so the public rule name remains stable.

## Tests To Add Later

1. XML import:
   - `<dcsset:item xsi:type="dcsset:OrderItemAuto"/>` imports as `{ itemType: "OrderItemAuto" }`.

2. XML export:
   - `{ itemType: "OrderItemAuto" }` exports as `xsi:type="dcsset:OrderItemAuto"`.

3. YAML import/export:
   - `[Авто]` maps to `{ itemType: "OrderItemAuto" }`;
   - `([Авто])` maps to `{ itemType: "OrderItemAuto", use: false }`.

4. Mixed collection:
   - an order with both auto and field items preserves item order in XML and YAML.

5. Regression fixture:
   - the round-trip for `DataProcessors/ПодготовкаКвартальнойОтчетностиВПФР/Forms/КвартальнаяОтчетностьВПФР/Ext/Form.xml` keeps `OrderItemAuto`.

## Non-goals

- Do not implement this as reference-only XML preservation.
- Do not encode auto order as an empty `OrderItemField`.
- Do not change the YAML key `Элементы` for `Order.items`.
- Do not implement the fix as part of this brainstorming pass.
