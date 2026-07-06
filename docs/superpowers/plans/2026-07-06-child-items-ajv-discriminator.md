# ChildItems AJV Discriminator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AJV discriminator metadata to externalRefs child item schemas so form validation selects element branches by `Вид`.

**Architecture:** Keep the generic `recordOfOneOfSchemaRefs` behavior unchanged and add a focused helper for discriminated records. Use it only in form child item property ref factories. Test the exported form graph directly.

**Tech Stack:** TypeScript, TypeBox JSON Schema, AJV 2020, Vitest, pnpm.

---

### Task 1: Add Discriminated Record Helper

**Files:**
- Modify: `/Users/nikita/git/nkdk/.worktrees/validation-rule-ref-graph/packages/core/metadata/orchestration/jsonSchemaRefs.ts`

- [ ] **Step 1: Add helper beside `recordOfOneOfSchemaRefs`**

Add this function after `recordOfOneOfSchemaRefs`:

```ts
export function recordOfDiscriminatedOneOfSchemaRefs(names: readonly string[], propertyName: string): TSchema {
  return rawJSONSchema({
    type: "object",
    additionalProperties: {
      oneOf: names.map((name) => schemaRef(name)),
      discriminator: { propertyName },
    },
  })
}
```

- [ ] **Step 2: Run type check for the touched file through package type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: either pass, or fail only on existing unrelated project type errors. If it fails on the new helper, fix the helper before continuing.

### Task 2: Use Helper For Form Child Items

**Files:**
- Modify: `/Users/nikita/git/nkdk/.worktrees/validation-rule-ref-graph/packages/core/metadata/forms/schemaRegister.ts`

- [ ] **Step 1: Update import**

Change the import from `jsonSchemaRefs` to include the new helper:

```ts
import {
  recordOfDiscriminatedOneOfSchemaRefs,
  recordOfOneOfSchemaRefs,
  recordOfSchemaRef,
  schemaRef,
} from "../orchestration/jsonSchemaRefs"
```

- [ ] **Step 2: Use discriminator for child items only**

Change the child item factory loop to:

```ts
for (const type of ["GroupChildItems", "CommandBarChildItems", "TableChildItems", "PagesChildItems"] as const) {
  registerProjectJSONSchemaPropertyRefFactory(type, () =>
    recordOfDiscriminatedOneOfSchemaRefs(getChildItemTypesByPropertyType(type), "Вид")
  )
}
```

### Task 3: Test Schema Graph Discriminator

**Files:**
- Modify: `/Users/nikita/git/nkdk/.worktrees/validation-rule-ref-graph/packages/core/metadata/validation/schemaRegistry.test.ts`

- [ ] **Step 1: Add test**

Add a test near the existing form graph tests:

```ts
  it("exports child item refs with AJV discriminator in form graph", () => {
    const graph = exportJSONSchemaGraph({
      context,
      roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
    })

    for (const owner of ["UsualGroup", "Page", "Table", "CommandBar", "ButtonGroup"] as const) {
      const schema = graph.schemas[`nkdk://schema/${owner}`] as
        | { properties?: { Элементы?: { additionalProperties?: { discriminator?: { propertyName?: string } } } } }
        | undefined

      expect(schema?.properties?.Элементы?.additionalProperties?.discriminator).toEqual({ propertyName: "Вид" })
    }
  })
```

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/validation/schemaRegistry.test.ts
```

Expected: pass.

### Task 4: Verify Runtime Impact

**Files:**
- No production file changes.

- [ ] **Step 1: Run type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: pass.

- [ ] **Step 2: Run quick form validation measurement**

Run the existing temporary measurement or equivalent script that validates forms from `/Users/nikita/git/nkdk-yaml` without standalone.

Expected shape:

```text
schemaSec около 4-5 с для форм
validFiles совпадают с baseline
invalidFiles совпадают с baseline
RSS заметно ниже baseline без discriminator
```

- [ ] **Step 3: Summarize result**

Report exact seconds and RSS in MB.
