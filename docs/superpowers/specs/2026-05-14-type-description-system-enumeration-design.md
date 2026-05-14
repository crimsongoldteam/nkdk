# TypeDescription System Enumeration Design

## Context

Short round-trip XML currently stops on a form attribute column:

```xml
<Column name="ПроверкаЗаполнения" id="22">
  <Type>
    <v8:Type>v8:FillChecking</v8:Type>
  </Type>
</Column>
```

XML import preserves this as `TypeDescription` with type `FillChecking`. XML export then fails because `TypeDescriptionRules` does not know that `FillChecking` is a valid `v8` type.

`FillChecking` is already present in generated system enumerations and is used by metadata rules as `typeSE: "FillChecking"`. The missing part is the bridge between `TypeDescription` and system enumerations when a system enumeration appears as a value type.

## Decision

`TypeDescription` should support known system enumerations as value types without adding every such enumeration to `TypeDescriptionRules` by hand.

The fallback is intentionally narrow:

- It applies only when the base type is a known system enumeration from `SystemEnumerationTypeMap`.
- XML export writes known system enumerations as `v8:<SystemEnumerationName>`.
- YAML export writes known system enumeration types as `СистемноеПеречисление.<РусскоеИмя>`.
- YAML import accepts the same `СистемноеПеречисление.<РусскоеИмя>` form and resolves it back to the technical system enumeration name.
- If a technical system enumeration exists but has no Russian YAML name, YAML export fails with an explicit error.
- Unknown non-enumeration types continue to fail explicitly.

For the observed case:

```yaml
Тип: СистемноеПеречисление.ПроверкаЗаполнения
```

round-trips to:

```xml
<v8:Type>v8:FillChecking</v8:Type>
```

## Components

- `packages/core/metadata/commonObjects/typeDescription/helper.ts`
  - Add helper logic that distinguishes registered `TypeDescriptionRules` from known system enumeration types.
  - Add helper logic for converting system enumeration type names to and from the `СистемноеПеречисление.*` YAML form.

- `packages/core/metadata/commonObjects/typeDescription/toXML.ts`
  - Use the helper fallback when no regular type rule exists and the type is a known system enumeration.

- `packages/core/metadata/commonObjects/typeDescription/toYAML.ts`
  - Export known system enumeration types as `СистемноеПеречисление.<РусскоеИмя>`.
  - Fail explicitly if the Russian name is missing.

- `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts`
  - Import `СистемноеПеречисление.<РусскоеИмя>` back to the technical type name.

## Testing

Add focused tests for `TypeDescription`:

- XML import/export round-trip for `v8:FillChecking`.
- YAML export from `{ type: ["FillChecking"] }` to `СистемноеПеречисление.ПроверкаЗаполнения`.
- YAML import from `СистемноеПеречисление.ПроверкаЗаполнения` to `{ type: ["FillChecking"] }`.
- Unknown ordinary type still fails during XML/YAML export.

Do not rewrite existing XML fixtures. If an integration check is needed, use a small inline XML fragment or a narrow new fixture.

## Out Of Scope

- Translating arbitrary unknown `v8:*` types.
- Adding technical English fallback values to YAML.
- Changing `SystemEnumeration` property value YAML, for example `ПроверкаЗаполнения: ВыдаватьОшибку`.
- Reworking generated system enumeration names.
