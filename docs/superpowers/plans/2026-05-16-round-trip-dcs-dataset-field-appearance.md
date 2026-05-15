# DCS Dataset Field Appearance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve DCS dataset field `appearance`, including `SettingsParameterValue` format values.

**Architecture:** Reuse the existing `AppearanceFields` rule for dataset fields instead of a narrow or scalar-only shape. Keep reference-aware XML type preservation for `Format` values.

**Tech Stack:** TypeScript, Vitest, DCS data composition schema field rules.

---

### Task 1: Add Appearance Fixture

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/appearance.xml`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/toXML.test.ts`

- [ ] **Step 1: Add XML fixture**

Create XML containing:

```xml
<dcssch:appearance>
	<dcsset:format>
		<dcsset:value xsi:type="xs:string">ЧЦ=15; ЧДЦ=2</dcsset:value>
	</dcsset:format>
</dcssch:appearance>
```

- [ ] **Step 2: Add model**

Expected model:

```ts
appearance: {
  format: {
    value: { type: "string", value: "ЧЦ=15; ЧДЦ=2" },
  },
}
```

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField -t "appearance"`

Expected: FAIL because appearance is not mapped as `AppearanceFields`.

### Task 2: Use AppearanceFields

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/types.ts`

- [ ] **Step 1: Update field rule**

Use:

```ts
appearance: { xml: "dcssch:appearance", yaml: "Оформление", type: "AppearanceFields" }
```

- [ ] **Step 2: Preserve format XML scalar kind**

If `SettingsParameterValue` already has reference-type preservation, reuse it. Otherwise, add a test-local fix in `parameterValue/toXML.ts` so `xs:string` stays `xs:string`.

- [ ] **Step 3: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem
git commit -m "fix: :bug: сохранить оформление поля набора DCS"
```

