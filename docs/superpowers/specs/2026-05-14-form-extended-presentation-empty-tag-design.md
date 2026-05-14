# Form ExtendedPresentation Empty Tag Design

## Context

Short round-trip XML found that forms can lose an explicit empty metadata property:

```xml
<ExtendedPresentation/>
```

The same kind of empty property is already predicted by applied-object fixtures, for example `metadataDataProcessor/__fixtures__/minimal.xml`. Applied-object rules usually preserve such empty XML tags with `defaultValueXMLRaw: ""`.

For client application forms, `extendedPresentation` exists in `ClientApplicationFormRules`, but the rule does not currently describe how to preserve an explicit empty XML node. As a result, `I8nText` import returns `undefined` for `<ExtendedPresentation/>`, the model does not keep the property, and XML export omits the tag.

## Decision

Preserve an explicit empty `ExtendedPresentation` only when it exists in the source/reference XML.

For this task:

- Add `defaultValueXMLEmpty: { items: {} }` to `ClientApplicationFormRules.extendedPresentation`.
- Add `defaultValueXMLRaw: ""` to the same rule.
- Do not make `ExtendedPresentation` mandatory for all forms.
- Do not add the empty tag when it is absent from the reference form XML.

This uses the existing property import/export behavior:

- `defaultValueXMLEmpty` lets XML import keep the fact that the empty tag was present.
- `defaultValueXMLRaw: ""` lets XML export write the empty tag when the reference/model carries that empty value.

## Components

- `packages/core/metadata/forms/clientApplicationForm/rules.ts`
  - Extend the `extendedPresentation` rule with empty XML defaults.

## Testing

Add focused coverage for `ClientApplicationForm`:

- A form metadata XML with `<ExtendedPresentation/>` round-trips and keeps the empty tag.
- A form metadata XML without `ExtendedPresentation` still exports without adding the tag.

Existing XML fixtures should not be rewritten. Prefer adding a narrow test case or small new fixture for this behavior.

## Out Of Scope

- Changing common `I8nText` empty-node semantics.
- Adding `ExtendedPresentation` to all forms unconditionally.
- Changing applied-object `ExtendedPresentation` rules.
