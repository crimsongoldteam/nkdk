# FormChoiceList I8n YAML

## Problem

YAML round-trip loses `FormChoiceListDesTimeValue/Presentation` when the presentation has exactly one non-default language.

The observed XML source contains only English text:

```xml
<Presentation>
  <v8:item>
    <v8:lang>en</v8:lang>
    <v8:content>Labor compensation expenses</v8:content>
  </v8:item>
</Presentation>
```

`formChoiceList/toYAML.ts` currently exports presentation with local logic:

- if there are multiple languages, write the whole language map;
- otherwise write `context.defaultLanguage` or `ru`;
- if neither exists, write an empty string.

For a single `en` item in a Russian default context, YAML receives:

```yaml
Представление: ""
```

Then YAML import treats the empty string as absent presentation, and XML sync writes `<Presentation/>`.

## Decision

Use the shared `exportI8nTextToYAML` function for `FormChoiceListDesTimeValue/Presentation`.

This keeps the existing YAML contract for `I8nText`:

- one default-language item stays a short string;
- multiple languages stay a language map;
- one non-default-language item also stays a language map.

The resulting YAML for the observed case should be:

```yaml
Представление:
  en: Labor compensation expenses
```

`fromYAML.ts` already delegates to `importI8nTextFromYAML`, so it can import that shape without behavioral changes.

## Alternatives Considered

### A. Delegate to shared `I8nText` export

Recommended. It removes duplicated language-selection logic and aligns `FormChoiceList` with the rest of the YAML layer.

### B. Patch the local condition

Rejected because it preserves a second implementation of the same `I8nText` export rule.

### C. Always export presentation as a language map

Rejected because it would make common Russian-only YAML noisier without being required for round-trip correctness.

## Implementation Shape

Change `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts`:

- import `exportI8nTextToYAML`;
- replace local `presentationItems` and `hasMultipleLanguages` logic with the shared exporter;
- keep `Представление: ""` only when presentation is absent or empty, preserving the existing empty-presentation YAML shape.

No XML fixtures should change.

## Tests

Add fixture coverage for a `FormChoiceListDesTimeValue` with a single English presentation:

```ts
presentation: { items: { en: "Labor compensation expenses" } }
```

Expected YAML:

```yaml
Представление:
  en: Labor compensation expenses
```

Existing tests should continue to prove that Russian-only presentation remains:

```yaml
Представление: Физическое лицо
```

Verification should include the focused `formChoiceList` YAML tests and then YAML round-trip triage for the current batch.

## Scope

This task only addresses single non-default-language presentation in `FormChoiceListDesTimeValue`.

It does not address:

- DCS explicit value type preservation;
- `FormattedI8nText` partial default-language reconstruction;
- missing common template external text files.
