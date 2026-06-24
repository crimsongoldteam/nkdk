# Round-trip: Button Parameter TypeDescription

## Context

Short XML round-trip on `/Users/nikita/git/round-trip-source/acc` found repeated diffs in:

- `DocumentJournals/КадровыеДокументы/Forms/ФормаСписка/Ext/Form.xml`
- `DocumentJournals/КадровыеДокументы/Forms/ЭлектронныеТрудовыеКнижки_ФормаСпискаПриказы/Ext/Form.xml`

The generated XML changes a button command parameter from `v8:TypeDescription` to an empty
`xr:MDObjectRef`:

```diff
-<Parameter xsi:type="v8:TypeDescription">
-  <v8:Type>cfg:DocumentRef.ПриемНаРаботу</v8:Type>
+<Parameter xsi:type="xr:MDObjectRef">
+  
 </Parameter>
```

These buttons use `CommandName`:

```xml
<CommandName>Form.Item.Список.StandardCommand.CreateByParameter</CommandName>
```

For this standard command, 1C stores the target document type as a `TypeDescription`, not as an
`MDObjectRef`.

## Current Behavior

`commonButtonProperties.parameter` is currently typed as `MetadataItemLink`:

```ts
parameter: {
  yaml: "Параметр",
  xml: "Parameter",
  type: "MetadataItemLink",
  typedXML: "xr:MDObjectRef",
  toEnterprise: false,
}
```

That handles the previously agreed case:

```xml
<Parameter xsi:type="xr:MDObjectRef">Document.Встреча</Parameter>
```

but it cannot represent:

```xml
<Parameter xsi:type="v8:TypeDescription">
  <v8:Type>cfg:DocumentRef.ПриемНаРаботу</v8:Type>
</Parameter>
```

During import/export the value is forced through `MetadataItemLink`, so `TypeDescription` content is
lost and export writes an empty `xr:MDObjectRef`.

## Decision

Represent button `Parameter` as a polymorphic value selected by XML `xsi:type`:

```ts
type ButtonParameter =
  | string
  | {
      typeDescription: TypeDescription
    }
```

Meaning:

- `string` remains the short model form for `xr:MDObjectRef`;
- object form stores `v8:TypeDescription`.

YAML keeps the existing short string for `MDObjectRef`:

```yaml
Параметр: Document.Встреча
```

YAML uses an explicit object form for `TypeDescription`:

```yaml
Параметр:
  ОписаниеТипа: ДокументСсылка.ПриемНаРаботу
```

This avoids ambiguity with plain metadata links.

## Proposed Approach

1. Add a dedicated `ButtonParameter` property type or equivalent custom rule near
   `forms/elements/button`.

2. XML import:
   - `Parameter xsi:type="xr:MDObjectRef"` -> `string`;
   - `Parameter xsi:type="v8:TypeDescription"` -> `{ typeDescription: TypeDescription }`;
   - missing or unsupported `xsi:type` stays on the current explicit/undefined path.

3. XML export:
   - `string` -> `<Parameter xsi:type="xr:MDObjectRef">...</Parameter>`;
   - `{ typeDescription }` -> `<Parameter xsi:type="v8:TypeDescription">...</Parameter>`.

4. YAML import/export:
   - string keeps the existing `Параметр: ...`;
   - object form uses `ОписаниеТипа` and reuses `TypeDescription` YAML conversion for its value.

5. Update `commonButtonProperties.parameter` to use the new polymorphic type while keeping:
   - `yaml: "Параметр"`;
   - `xml: "Parameter"`;
   - `toEnterprise: false`.

## Tests To Add Later

1. Existing `MDObjectRef` parameter fixtures keep passing:
   - XML import/export;
   - YAML import/export.

2. New `TypeDescription` parameter fixture:
   - XML import maps `v8:TypeDescription` to `{ typeDescription: { type: ["DocumentRef.ПриемНаРаботу"] } }`;
   - XML export preserves `xsi:type="v8:TypeDescription"` and `v8:Type`;
   - YAML import/export supports `Параметр: { ОписаниеТипа: "ДокументСсылка.ПриемНаРаботу" }`.

3. Regression fixtures:
   - `DocumentJournals/КадровыеДокументы/Forms/ФормаСписка/Ext/Form.xml`;
   - `DocumentJournals/КадровыеДокументы/Forms/ЭлектронныеТрудовыеКнижки_ФормаСпискаПриказы/Ext/Form.xml`.

## Non-goals

- Do not encode `TypeDescription` button parameters as strings.
- Do not remove support for `Parameter xsi:type="xr:MDObjectRef"`.
- Do not infer parameter type from `CommandName`; use XML `xsi:type` for import and model shape for export.
- Do not implement the fix as part of this brainstorming pass.
