# Color Auto Reference Fallback Design

## Context

The current `acc` YAML round-trip still removes one form XML tag:

```xml
<Popup name="ВидВладельцаЭЦП" id="77">
  <Width>22</Width>
  <BackColor>auto</BackColor>
</Popup>
```

After `XML -> model -> YAML -> model -> XML`, the exported XML omits `<BackColor>auto</BackColor>`.

This is the same semantic problem as the earlier button auto-color case, but the previous regression test used a hand-built reference model with:

```ts
backColor: { type: "Absolute", value: "auto" }
```

That shape no longer exists after real XML import because `Color.fromXML("auto")` intentionally returns `undefined`.

## Decision

`auto` remains an XML/reference-only color marker for regular form element colors.

It must not become:

- a normal `Color` model value;
- a YAML value such as `ЦветФона: auto`;
- a JSON Schema-accepted color;
- a per-property `preserveFromReferenceXML` rule annotation.

Instead, XML export should restore `auto` for any regular `Color` property when all of these are true:

- the current model/YAML omits the color value;
- the reference XML contained the same color XML tag;
- the imported reference model has no color value because the XML value was `auto`.

If the current model has a real color, that value always wins over reference `auto`.
If there is no reference tag, XML export must not invent `auto`.

## Architecture

Keep `Color.fromXML("auto") -> undefined`.

Add the fallback at the shared property XML export boundary, where both the property rule and reference metadata are available:

```text
rule.type === "Color"
current value is undefined
reference has XML source key for this property
reference value is undefined
=> export raw XML value "auto"
```

This keeps the behavior centralized for all form element color fields, including `Button.backColor`, `Popup.backColor`, `ExtendedTooltip.backColor`, `SearchControlAddition.backColor`, and future regular `Color` properties.

The fallback must be scoped to real reference presence. A missing reference model, a missing XML source key, or an explicit current model color should keep the existing behavior.

## Data Flow

### XML To Model

`<BackColor>auto</BackColor>` imports as an absent color model value. The importer records XML source-key metadata for the property, so export can still distinguish "absent because XML had auto" from "absent because XML had no tag".

### Model To YAML

The color key is omitted. YAML remains user-facing and does not expose `auto`.

### YAML To XML

With `--reference`, XML export sees the reference source-key metadata and restores the original raw XML marker:

```xml
<BackColor>auto</BackColor>
```

Without reference, no tag is emitted.

## Testing

Add focused tests that model the real imported reference state instead of hand-building `{ type: "Absolute", value: "auto" }`.

Required coverage:

- a `Color` property with current value omitted and reference source key present exports `"auto"`;
- the same omitted color without reference source key exports nothing;
- a real current color overrides reference `auto`;
- `Popup.backColor` preserves `<BackColor>auto</BackColor>` through the element/property export path;
- existing `Color.fromXML("auto")` and JSON Schema rejection tests stay unchanged.

Then run the `round-trip-yaml` triage on `acc` and confirm the first diff no longer removes `<BackColor>auto</BackColor>`.

## Scope

In scope:

- regular `Color` property XML export fallback from reference;
- focused property/element tests;
- the `acc` round-trip diff involving `Popup.BackColor auto`.

Out of scope:

- changing XML fixtures;
- allowing `auto` in YAML or JSON Schema;
- adding `preserveFromReferenceXML` to color rules;
- changing DCS appearance color semantics, which already has its own auto-color behavior.
