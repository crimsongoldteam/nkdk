# InputField TypeDomainEnabled

## Context

Short round-trip shows that form input fields lose the XML node:

```xml
<TypeDomainEnabled>false</TypeDomainEnabled>
```

The same property is part of the YAML surface as `РазрешитьСоставнойТип`. This means it is not only a technical XML default: it should be represented in the `InputField` model and covered across XML, YAML, and enterprise conversion.

## Design

Add `typeDomainEnabled` as a normal `InputFieldRules` property:

- `yaml: "РазрешитьСоставнойТип"`
- `type: "boolean"`
- `implicitValueYAML: true`

`TableInputFieldRules` already spreads `InputFieldRules.properties`, so the same property should be available for table input fields without a separate rule entry.

## Fixtures

Use existing all-fields fixtures instead of a separate reproducer fixture:

- `packages/core/metadata/forms/elements/inputField/__fixtures__/full.xml`
- `packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml`
- `packages/core/metadata/forms/elements/inputField/__fixtures__/data.ts`

The expected value is `false`:

- XML: `<TypeDomainEnabled>false</TypeDomainEnabled>`
- YAML: `РазрешитьСоставнойТип: "Ложь"`
- enterprise: `TypeDomainEnabled: false`
- model: `typeDomainEnabled: false`

## Tests

The existing form element fixture matrix should cover the behavior:

- XML import/export through `full.xml` and `fullTable.xml`
- YAML import/export through `fullInputFieldPartialYAML`
- enterprise import/export through `fullInputFieldEnterprise`

No dedicated round-trip reproducer is needed for this field because it is a regular property already represented in the all-fields fixtures.

## Out Of Scope

This design does not cover the mixed diff in `Catalogs/ВЕТИСПрисоединенныеФайлы/Forms/ФормаОшибки/Ext/Form.xml`. That file combines at least `Table.RowFilter` loss and `FormParameter.Type` empty-node collapse, so those should be handled separately.
