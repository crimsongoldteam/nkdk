# Picture Raw Ref Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve raw picture references such as `0` and `0:uuid` instead of forcing them into known metadata links.

**Architecture:** Add a narrow raw-ref branch to picture value import/export. Known refs keep existing behavior; unknown numeric raw refs round-trip as explicit raw picture refs.

**Tech Stack:** TypeScript, Vitest, picture common object.

---

### Task 1: Add Raw Ref Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/picture/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/picture/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/picture/types.ts`

- [ ] **Step 1: Add import cases**

Use XML:

```xml
<Picture>
	<xr:Ref>0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065</xr:Ref>
</Picture>
```

Expected model:

```ts
{ rawRef: "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065" }
```

- [ ] **Step 2: Add export case**

Export the same model and expect the same `xr:Ref` text.

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/picture -t "raw ref"`

Expected: FAIL because raw refs are dropped or normalized incorrectly.

### Task 2: Implement RawPictureRef

**Files:**
- Modify: `packages/core/metadata/commonObjects/picture/types.ts`
- Modify: `packages/core/metadata/commonObjects/picture/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/picture/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/picture/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/picture/toYAML.ts`

- [ ] **Step 1: Add model type**

Add:

```ts
export type RawPictureRef = { rawRef: string }
```

Include it in the picture union.

- [ ] **Step 2: Detect raw ref**

If `xr:Ref` matches:

```ts
/^0(?::[0-9a-fA-F-]+)?$/
```

return `{ rawRef: ref }`.

- [ ] **Step 3: Export raw ref**

For `{ rawRef }`, export:

```ts
{ "xr:Ref": value.rawRef }
```

- [ ] **Step 4: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/picture
git commit -m "fix: :bug: сохранить сырой ref картинки"
```

