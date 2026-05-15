# Round-trip: Planner Drag Properties

## Context

XML forms contain drag-related properties on form elements:

```xml
<EnableStartDrag>true</EnableStartDrag>
<EnableDrag>true</EnableDrag>
```

For `Table`, `CalendarField`, `PictureField`, `PictureDecoration`, and `SpreadsheetDocumentField`
these properties are already normal XML/YAML properties:

```ts
enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean" }
enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean" }
```

`PlannerField` is different:

```ts
enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean", runtimeOnly: true }
enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean", runtimeOnly: true }
```

`runtimeOnly` excludes the properties from XML import, XML export, and YAML. As a result, XML
round-trip drops `EnableDrag` and `EnableStartDrag` from planner fields even though they are present
in real `Form.xml` files.

## Decision

Remove `runtimeOnly` from `PlannerField.enableDrag` and `PlannerField.enableStartDrag`.

Keep them out of enterprise output if needed:

```ts
enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean", toEnterprise: false }
enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean", toEnterprise: false }
```

This makes XML and YAML round-trip preserve the fields while avoiding accidental changes in the
enterprise export layer.

## Proposed Approach

1. Update `packages/core/metadata/forms/elements/plannerField/rules.ts`:
   - remove `runtimeOnly: true`;
   - add `toEnterprise: false` if enterprise output should keep the current omission.

2. Update `PlannerField` fixtures:
   - XML full fixture includes both nodes;
   - model fixture includes `enableDrag` and `enableStartDrag`;
   - YAML fixture includes `РазрешитьПеретаскивание` and `РазрешитьНачалоПеретаскивания`.

3. Do not change the already-correct elements where these properties are not runtime-only.

## Tests To Add Later

1. `PlannerField` XML import:
   - `<EnableDrag>true</EnableDrag>` maps to `enableDrag: true`;
   - `<EnableStartDrag>true</EnableStartDrag>` maps to `enableStartDrag: true`.

2. `PlannerField` XML export:
   - model values export back to the same XML nodes.

3. YAML import/export:
   - `РазрешитьПеретаскивание: Истина`;
   - `РазрешитьНачалоПеретаскивания: Истина`.

4. Enterprise export:
   - if `toEnterprise: false` is kept, enterprise fixture should continue not to include these
     properties.

## Non-goals

- Do not change drag properties for elements where they already round-trip correctly.
- Do not change `CommandSet` behavior.
- Do not change `SpecialTextInputMode` / `AutoFillHint`; that is a separate issue.
- Do not implement the fix as part of this brainstorming pass.
