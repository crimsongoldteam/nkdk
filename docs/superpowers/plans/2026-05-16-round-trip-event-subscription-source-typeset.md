# EventSubscription Source TypeSet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve whether event subscription `Source` was encoded as `v8:Type` or `v8:TypeSet`.

**Architecture:** Keep YAML/model source semantics stable, but store reference XML container kind. Export should reuse the reference kind when the semantic source matches.

**Tech Stack:** TypeScript, Vitest, applied object metadata rules.

---

### Task 1: Add Source TypeSet Regression

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataEventSubscription/__fixtures__/sync/xml/Ext/Properties.xml`
- Modify: `packages/core/metadata/appliedObjects/metadataEventSubscription/__fixtures__/sync/data.ts`
- Test: `packages/core/metadata/appliedObjects/metadataEventSubscription/fromXML.test.ts`
- Test: `packages/core/metadata/appliedObjects/metadataEventSubscription/toXML.test.ts`

- [ ] **Step 1: Add XML source case**

Use:

```xml
<Source xsi:type="v8:TypeSet">
	<v8:Type>cfg:DocumentObject.ЗаказКлиента</v8:Type>
</Source>
```

- [ ] **Step 2: Add model expectation**

Keep the existing source string/list model shape:

```ts
source: ["DocumentObject.ЗаказКлиента"]
```

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEventSubscription -t "Source"`

Expected: FAIL because export changes `v8:TypeSet` to `v8:Type`.

### Task 2: Preserve Source Container Kind

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataEventSubscription/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEventSubscription/types.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toXML.ts`

- [ ] **Step 1: Store source XML kind during reference import**

Record:

```ts
{ sourceXmlKind: "TypeSet" }
```

as reference-only metadata for the `source` property.

- [ ] **Step 2: Export using matching reference kind**

If current source matches reference source and `sourceXmlKind === "TypeSet"`, export:

```xml
<Source xsi:type="v8:TypeSet">
	<v8:Type>cfg:DocumentObject.ЗаказКлиента</v8:Type>
</Source>
```

- [ ] **Step 3: Keep new models canonical**

Without reference metadata, keep the current canonical export for single source values.

- [ ] **Step 4: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataEventSubscription packages/core/metadata/commonObjects/typeDescription
git commit -m "fix: :bug: сохранить TypeSet источника подписки"
```

