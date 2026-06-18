# Color Auto Reference Preservation Design

## Context

ERP validation still reports one `Expected union value` for a form button:

```yaml
КнопкаСформировать:
  Вид: Кнопка
  ЦветФона: auto
```

The source XML is:

```xml
<Button name="КнопкаСформировать" id="5">
  <BackColor>auto</BackColor>
</Button>
```

This is a regular form element color (`Button.BackColor`), not a DCS appearance parameter.

## Decision

`auto` is an XML/reference detail for regular `Color` properties. It must not be a model value and must not appear in YAML.

The JSON Schema for `Color` stays strict:

- accepted YAML values remain known style, Windows, Web, absolute `#RRGGBB`, project style refs, and raw XML refs already supported by the project;
- `auto` remains invalid YAML;
- arbitrary strings that do not match the schema remain invalid.

## Data Flow

### XML To Model

When importing a regular `Color` from XML:

- `undefined`, empty XML, and `auto` become `undefined` in the model;
- regular color values keep the current behavior.

This removes `auto` before YAML export, because absent model fields are not emitted.

### Model To YAML

No special YAML representation is added. If the color field is absent in the model, the YAML key is absent.

### YAML To XML

When syncing with reference XML:

- if the YAML/model omits the color field and the reference model has `auto` for the same field, XML export restores the `auto` tag;
- if there is no reference value, XML export does not invent `auto`;
- if YAML/model contains a real color, that value wins over reference `auto`.

The existing `referenceMetadata` flow in property and form-element XML export is the intended mechanism for this.

## Scope

In scope:

- regular `Color` XML import behavior for `auto`;
- tests proving `auto` is absent from model/YAML and restored only from reference XML;
- validation reduction for the ERP form button `ЦветФона: auto` after re-import.

Out of scope:

- allowing `auto` in `ColorJSONSchema`;
- adding `auto` to color enumerations or editor choices;
- changing XML fixtures;
- changing DCS color parameter semantics beyond whatever naturally follows from the shared `Color` import rule.

## Testing

Add focused tests for:

- `importColorFromXML("auto")` returns `undefined`;
- `ColorJSONSchema` rejects `"auto"`;
- a form button with reference `BackColor=auto` and missing YAML/model `ЦветФона` exports `<BackColor>auto</BackColor>`;
- the same missing YAML/model color without reference does not export `BackColor`;
- a real YAML/model color overrides reference `auto`.

Then verify the imported ERP YAML no longer contains `ЦветФона: auto` after re-import and the corresponding validation group disappears.
