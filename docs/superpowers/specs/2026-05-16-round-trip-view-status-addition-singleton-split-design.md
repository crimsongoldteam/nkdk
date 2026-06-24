# Round-trip: ViewStatusAddition Singleton Split

## Context

Short XML round-trip found a form diff where `ViewStatusAddition` loses its own identity and source:

```xml
<ViewStatusAddition name="СписокСостояниеПросмотра" id="10">
  <AdditionSource>
    <Item>Список</Item>
    <Type>ViewStatusRepresentation</Type>
  </AdditionSource>
  <HorizontalLocation>Left</HorizontalLocation>
  <ContextMenu name="СписокСостояниеПросмотраКонтекстноеМеню" id="11"/>
  <ExtendedTooltip name="СписокСостояниеПросмотраРасширеннаяПодсказка" id="12"/>
</ViewStatusAddition>
```

The generated XML derives the view status name and `AdditionSource.Item` from the current parent.
That is valid for a generated single element, but it is not enough for XML imported from a reference:
the element can have its own `name`, `id`, non-canonical `AdditionSource.Item`, and nested singleton
names/ids.

Current `ViewStatusAdditionRules` uses one rule for both cases:

```ts
additionSource: {
  type: "TableAdditionalSource",
  additionalSourceType: "ViewStatusRepresentation",
  fromXML: false,
  forSingleElement: true,
}
```

This makes every `ViewStatusAddition` behave like a single element and prevents importing
`AdditionSource.Item` into the model.

## Existing Pattern

Neighboring addition elements already split these two modes:

- `SearchStringAddition` is the ordinary XML/model element. It has `name` and YAML `Источник`.
- `SingleSearchStringAddition` is the generated table property. It has `fromXML: false` and
  `forSingleElement: true`.
- `SearchControlAddition` and `SingleSearchControlAddition` use the same pattern.

Table properties use the single variants:

```ts
searchControl: {
  type: "SingleSearchControlAddition",
  xml: "SearchControlAddition",
}

searchStringRepresentation: {
  type: "SingleSearchStringAddition",
  xml: "SearchStringAddition",
}
```

`viewStatusRepresentation` currently points directly to `ViewStatusAddition`, so it has no separate
ordinary and single modes.

## Decision

Mirror the existing search addition pattern for `ViewStatusAddition`.

Introduce a dedicated single variant:

```ts
SingleViewStatusAddition
```

Keep `ViewStatusAddition` as the ordinary XML/model element:

- it has required `name`;
- it imports and exports `additionSource` as YAML `Источник`;
- it preserves reference metadata for `name`, `id`, `ContextMenu`, and `ExtendedTooltip`.

Use `SingleViewStatusAddition` only where the element is a generated property of `Table` or
`PDFDocumentField`:

```ts
viewStatusRepresentation: {
  yaml: "ОтображениеСостоянияПросмотра",
  type: "SingleViewStatusAddition",
  xml: "ViewStatusAddition",
  toEnterprise: false,
}
```

## YAML Shape

For the single property under `Table` or `PDFDocumentField`, YAML remains compact and does not expose
`Источник`, matching `SingleSearchStringAddition` and `SingleSearchControlAddition`.

For an ordinary `ViewStatusAddition`, YAML may explicitly contain the source:

```yaml
Имя: СписокСостояниеПросмотра
Источник: Список
ГоризонтальноеПоложение: Left
```

This keeps non-canonical imported XML representable without forcing every generated single property
to carry redundant source data.

## Proposed Approach

1. Split common `ViewStatusAddition` properties into a shared block, as search additions do.

2. Add `SingleViewStatusAdditionRules`:
   - `itemType: "SingleViewStatusAddition"`;
   - `additionSource` keeps `fromXML: false` and `forSingleElement: true`;
   - `registerElementAsType` moves to `propertyType: "SingleViewStatusAddition"`.

3. Change `ViewStatusAdditionRules`:
   - add `name` from XML `_name`;
   - make `additionSource` a normal `TableAdditionalSource` with `yaml: "Источник"`;
   - remove `fromXML: false` and `forSingleElement: true` from the ordinary rule.

4. Update table and PDF document field properties to use `SingleViewStatusAddition` while keeping
   `xml: "ViewStatusAddition"`.

5. Register a singleton graph handler for `SingleViewStatusAddition` instead of
   `ViewStatusAddition`.

6. Update TypeScript and YAML types to expose both ordinary and single variants, following
   `SearchStringAddition` and `SearchControlAddition`.

## Tests To Add Later

1. Existing generated table/PDF cases still export `AdditionSource.Item` from the parent name.

2. Reference round-trip keeps non-canonical `ViewStatusAddition` name and nested singleton names:
   - `ContextMenu`;
   - `ExtendedTooltip`.

3. XML import/export preserves `AdditionSource.Item` for ordinary `ViewStatusAddition`.

4. YAML tests, if the module has suitable coverage:
   - ordinary `ViewStatusAddition` supports `Источник`;
   - `SingleViewStatusAddition` keeps the compact shape without `Источник`.

## Non-goals

- Do not change `TableAdditionalSource` semantics globally.
- Do not change `SearchStringAddition` or `SearchControlAddition` behavior.
- Do not implement this fix as part of the brainstorming pass.
- Do not merge this with the earlier `Visible` property fix; that is a separate narrow issue.
