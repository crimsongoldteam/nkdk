# DCS Attribute Use Restriction Design

## Context

Short round-trip XML found that `dcssch:attributeUseRestriction` loses its child boolean tags:

```xml
<dcssch:attributeUseRestriction>
  <dcssch:field>true</dcssch:field>
  <dcssch:condition>true</dcssch:condition>
  <dcssch:group>true</dcssch:group>
  <dcssch:order>true</dcssch:order>
</dcssch:attributeUseRestriction>
```

The current `DataCompositionSchemaDataSetFieldRules` describes `attributeUseRestriction` as `type: "string"`. The XML node is composite, so string handling cannot preserve the nested flags.

`dcssch:useRestriction` in the same data set field already uses `CalculatedFieldUseRestriction`, whose XML structure is the same set of boolean child tags: `field`, `condition`, `group`, and `order`.

## Decision

Use the existing `CalculatedFieldUseRestriction` type for `attributeUseRestriction`.

For this task:

- `attributeUseRestriction` in `DataCompositionSchemaDataSetFieldRules` changes from `string` to `CalculatedFieldUseRestriction`.
- XML import/export preserves the nested boolean tags.
- YAML uses the existing nested YAML shape of `CalculatedFieldUseRestriction` under `ОграничениеИспользованияРеквизитов`.
- No separate `AttributeUseRestriction` type is introduced because it would duplicate the same structure.

## Components

- `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`
  - Change `attributeUseRestriction.type` to `CalculatedFieldUseRestriction`.

- `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/types.ts`
  - Ensure the existing `CalculatedFieldUseRestriction` type import remains available for rule registration.

## Testing

Add focused coverage for `DataCompositionSchemaDataSetField`:

- XML import with `dcssch:attributeUseRestriction` containing multiple flags.
- XML export keeps the same nested tags.
- YAML import/export uses `ОграничениеИспользованияРеквизитов` with the same boolean fields.

Do not change existing XML fixtures as part of this task.

## Out Of Scope

- Renaming `CalculatedFieldUseRestriction`.
- Introducing a separate attribute-specific restriction type.
- Changing DCS restriction handling outside `DataCompositionSchemaDataSetField`.
