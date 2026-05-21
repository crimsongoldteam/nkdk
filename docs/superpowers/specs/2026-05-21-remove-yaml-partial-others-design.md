# Remove yamlPartialOthers

## Problem

YAML round-trip for forms is no longer source-backed partial YAML. `Форма.yaml` must contain the values required to reconstruct XML.

The old `yamlPartialOthers` flag still removes the default language from `I8nText` and `FormattedI8nText` during YAML export. This makes YAML non-self-sufficient:

```xml
<Title formatted="false">
  <v8:item>
    <v8:lang>ru</v8:lang>
    <v8:content>Вам нравится приложение?</v8:content>
  </v8:item>
  <v8:item>
    <v8:lang>en</v8:lang>
    <v8:content>Do you like the app?</v8:content>
  </v8:item>
</Title>
```

becomes YAML with only the non-default language:

```yaml
Заголовок:
  en: Do you like the app?
```

After YAML import, the missing `ru` item cannot be reconstructed without the XML source and is lost in XML sync.

A related issue appears with `excludeIfEqualNameYAML`: when YAML explicitly contains only `en`, import currently reconstructs default-language `ru` from the object name. That changes the source XML by adding a new `ru` item.

## Decision

Remove `yamlPartialOthers` as a supported YAML feature.

Full YAML export must keep all languages. The short string form still exists through normal `I8nText` behavior when there is exactly one default-language item. If a value has `{ ru, en }`, YAML must keep both languages.

`excludeIfEqualNameYAML` remains, but only for its intended case: hiding/restoring a title equal to the object name when the YAML value is absent or intentionally empty. It must not add a default-language item when YAML explicitly provides a non-empty language map without that default language.

## Alternatives Considered

### A. Remove `yamlPartialOthers` completely

Recommended. It matches the current self-sufficient `Форма.yaml` direction and prevents this class of data loss across all form elements.

### B. Remove the flag only from affected form rules

Rejected because the same loss can happen for other titles that still use `yamlPartialOthers`.

### C. Preserve partial semantics by reading the original XML during YAML import

Rejected because it keeps YAML dependent on external source state and conflicts with the unified form YAML direction.

## Implementation Shape

Remove the feature in layers:

- delete `yamlPartialOthers` from `I8nTextPropertyRule` and `FormattedI8nTextPropertyRule`;
- remove `exportI8nTextOtherToYAML` and `exportFormattedI8nTextOtherToYAML` behavior if it has no remaining callers;
- remove `yamlPartialOthers: true` from form element rules and any tests/fixtures that expect default-language titles to disappear;
- update `excludeIfEqualNameYAML` import behavior so explicit non-empty language maps are respected as-is.

No XML fixtures should change.

## Expected YAML

For a multilingual label title:

```yaml
Заголовок:
  ru: Вам нравится приложение?
  en: Do you like the app?
```

For a Russian-only title, the existing compact shape remains:

```yaml
Заголовок: Вам нравится приложение?
```

For an attribute title with only English in source XML:

```yaml
Заголовок:
  en: Оценка отправлена
```

YAML import must preserve only `en`; it must not synthesize `ru` from the attribute name.

## Tests

Add focused coverage for:

- `FormattedI8nText` export keeps both `ru` and `en` after removing `yamlPartialOthers`;
- form element YAML export keeps multilingual titles;
- `I8nText` import with `excludeIfEqualNameYAML` does not synthesize default language when YAML explicitly contains a non-empty language map without it;
- existing empty/absent title cases still restore the default name where this is the documented behavior.

Verification should include targeted tests for `i8nText`, `formattedI8nText`, and affected form YAML tests, followed by YAML round-trip triage for the current batch.

## Scope

This task addresses the third diff from the current YAML round-trip batch:

- `CommonForms/ОценитьПриложение/Ext/Form.xml`.

It does not address:

- DCS explicit value type preservation;
- single non-default-language `FormChoiceListDesTimeValue/Presentation`;
- missing common template external text files.
