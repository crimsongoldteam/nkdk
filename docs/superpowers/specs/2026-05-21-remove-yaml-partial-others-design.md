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

`excludeIfEqualNameYAML` is a separate feature and should continue to work for multilingual values: when the default-language title is equal to the object name, YAML may omit only that default-language item and keep the other languages.

## Decision

Remove `yamlPartialOthers` as a supported YAML feature.

Full YAML export must keep all languages. The short string form still exists through normal `I8nText` behavior when there is exactly one default-language item. If a value has `{ ru, en }`, YAML must keep both languages.

`excludeIfEqualNameYAML` remains. It must work for bilingual and multilingual values: if the default-language item is equal to the object name, export omits that item and keeps only the languages that differ from the default/name-derived value. Import then restores the omitted default-language item from the object name.

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
- keep `excludeIfEqualNameYAML` behavior for multilingual values: export only non-default languages when the default-language value equals the object name, and import restores that default-language value from the object name.

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

For an attribute title where the default-language title equals the attribute name and English differs:

```yaml
Заголовок:
  en: Rating sent
```

YAML import must restore the default-language item from the attribute name and preserve `en`.

## Tests

Add focused coverage for:

- `FormattedI8nText` export keeps both `ru` and `en` after removing `yamlPartialOthers`;
- form element YAML export keeps multilingual titles;
- `I8nText` export with `excludeIfEqualNameYAML` keeps only non-default languages when the default-language item equals the object name;
- `I8nText` import with `excludeIfEqualNameYAML` restores the omitted default-language item from the object name while preserving non-default languages;
- existing empty/absent title cases still restore the default name where this is the documented behavior.

Verification should include targeted tests for `i8nText`, `formattedI8nText`, and affected form YAML tests, followed by YAML round-trip triage for the current batch.

## Scope

This task addresses the third diff from the current YAML round-trip batch:

- `CommonForms/ОценитьПриложение/Ext/Form.xml`.

It does not address:

- DCS explicit value type preservation;
- single non-default-language `FormChoiceListDesTimeValue/Presentation`;
- missing common template external text files.
