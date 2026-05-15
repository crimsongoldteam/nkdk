# DCS AvailableFields Selected Item Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve selected available fields that carry `use`, `title`, `lwsTitle`, or `viewMode`.

**Architecture:** Make `AvailableFields` a mixed collection of plain field names and object field entries. Keep the string form for simple fields and use object form only when XML contains additional metadata.

**Tech Stack:** TypeScript, Vitest, DCS available fields.

---

### Task 1: Add Object Item Coverage

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/__fixtures__/full.xml`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/__fixtures__/data.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toXML.test.ts`

- [ ] **Step 1: Add XML item**

Add:

```xml
<dcsset:item>
	<dcsset:field>Документ</dcsset:field>
	<dcsset:use>true</dcsset:use>
	<dcsset:title>
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Документ</v8:content>
		</v8:item>
	</dcsset:title>
	<dcsset:viewMode>Normal</dcsset:viewMode>
</dcsset:item>
```

- [ ] **Step 2: Add model object**

Add:

```ts
{
  field: "Документ",
  use: true,
  title: { items: { ru: "Документ" } },
  viewMode: "Normal",
}
```

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/availableFields/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/availableFields/toXML.test.ts -t "available fields"`

Expected: FAIL because object entries collapse to strings.

### Task 2: Implement Mixed Item Shape

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toYAML.ts`

- [ ] **Step 1: Extend type**

Add:

```ts
export type AvailableFieldItem =
  | string
  | {
      field: string
      use?: boolean
      title?: I8nText
      lwsTitle?: I8nText
      viewMode?: DataCompositionSettingsItemViewMode
    }
```

- [ ] **Step 2: Import object only when needed**

If XML item has only field text, return `string`. If any metadata node exists, return object.

- [ ] **Step 3: Export string and object branches**

String branch exports the old compact XML. Object branch exports field plus present metadata nodes.

- [ ] **Step 4: Add YAML object shape**

Use:

```yaml
- Поле: Документ
  Использование: Истина
  Заголовок: Документ
  РежимОтображения: Обычный
```

- [ ] **Step 5: Verify green**

Run XML and YAML tests for `availableFields`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/availableFields
git commit -m "fix: :bug: сохранить выбранные доступные поля DCS"
```

