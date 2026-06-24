# Button Parameter TypeDescription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve button command parameters that are XML `v8:TypeDescription`.

**Architecture:** Replace the single `MetadataItemLink` parameter shape with a polymorphic `ButtonParameter` value. Keep string parameters for `xr:MDObjectRef`; use an object for `v8:TypeDescription`.

**Tech Stack:** TypeScript, Vitest, form button rules.

---

### Task 1: Add Failing Button Fixture

**Files:**
- Create: `packages/core/metadata/forms/elements/button/__fixtures__/parameterTypeDescription.xml`
- Modify: `packages/core/metadata/forms/elements/button/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`

- [ ] **Step 1: Add XML fixture**

Create:

```xml
<Button name="СоздатьПриемНаРаботу" id="1">
	<CommandName>Form.Item.Список.StandardCommand.CreateByParameter</CommandName>
	<Parameter xsi:type="v8:TypeDescription">
		<v8:Type>cfg:DocumentRef.ПриемНаРаботу</v8:Type>
	</Parameter>
</Button>
```

- [ ] **Step 2: Add model fixture**

Add:

```ts
export const commandButtonWithTypeDescriptionParameter = {
  itemType: "Button",
  name: "СоздатьПриемНаРаботу",
  commandName: "Form.Item.Список.StandardCommand.CreateByParameter",
  parameter: {
    typeDescription: { type: ["DocumentRef.ПриемНаРаботу"] },
  },
} satisfies Button
```

- [ ] **Step 3: Register fixture**

Add an `ElementFixtures` entry named `with TypeDescription Parameter`.

- [ ] **Step 4: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "TypeDescription Parameter"`

Expected: FAIL because parameter is imported/exported as `xr:MDObjectRef`.

### Task 2: Implement ButtonParameter Type

**Files:**
- Create: `packages/core/metadata/forms/elements/button/parameter.ts`
- Modify: `packages/core/metadata/forms/elements/button/rules.ts`
- Modify: `packages/core/metadata/forms/elements/button/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/index.ts`

- [ ] **Step 1: Add custom property type**

In `button/parameter.ts`, register `ButtonParameter` import/export:

```ts
export type ButtonParameter =
  | string
  | {
      typeDescription: TypeDescription
    }
```

- [ ] **Step 2: XML import**

Map `Parameter xsi:type="xr:MDObjectRef"` to string and `Parameter xsi:type="v8:TypeDescription"` to:

```ts
{ typeDescription: importTypeDescriptionFromXML(context, rule, xml) }
```

- [ ] **Step 3: XML export**

String exports:

```ts
{ "_xsi:type": "xr:MDObjectRef", "#text": value }
```

Object exports:

```ts
{ "_xsi:type": "v8:TypeDescription", ...exportedTypeDescription }
```

- [ ] **Step 4: Update rule**

Change button parameter rule to:

```ts
parameter: { yaml: "Параметр", xml: "Parameter", type: "ButtonParameter", toEnterprise: false }
```

- [ ] **Step 5: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/forms/elements/button packages/core/metadata/forms/commonObjects/index.ts
git commit -m "fix: :bug: сохранить TypeDescription параметра кнопки"
```

