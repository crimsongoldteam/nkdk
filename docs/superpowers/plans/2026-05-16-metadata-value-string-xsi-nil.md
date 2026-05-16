# MetadataValue String Xsi Nil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `MetadataValue` import treat string `_xsi:nil: "true"` the same as boolean `_xsi:nil: true`.

**Architecture:** Keep the change local to `packages/core/metadata/commonObjects/metadataValue/fromXML.ts`. Add a tiny predicate beside the existing XML helpers, then use it in the early nil branch before type detection. Cover the real failing shape with one focused unit test.

**Tech Stack:** TypeScript, Vitest, existing XML metadata import helpers.

---

### Task 1: Cover String `xsi:nil`

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts`

- [ ] **Step 1: Add the failing test**

Add this test immediately after `it("imports xsi:nil as undefined", ...)`:

```ts
  it("imports string xsi:nil as undefined", () => {
    const result = importMetadataValueFromXML({
      context: mockContextFromXML(),
      rule: undefined,
      value: { "_xsi:nil": "true" },
    })

    expect(result).toBeUndefined()
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts -t "imports string xsi:nil as undefined"
```

Expected: FAIL with `MetadataValue: не распознан тип: undefined`.

### Task 2: Accept String `xsi:nil`

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromXML.ts`

- [ ] **Step 1: Add a local nil predicate**

Add this helper below `isEmptyMetadataValueXML`:

```ts
const isNilMetadataValueXML = (value: Record<string, unknown>): boolean =>
  value["_xsi:nil"] === true || value["_xsi:nil"] === "true"
```

- [ ] **Step 2: Use the predicate in the early nil branch**

Replace:

```ts
  if (data["_xsi:nil"] === true) {
    return context.fromXML.forReference ? (data as any) : undefined
  }
```

with:

```ts
  if (isNilMetadataValueXML(data)) {
    return context.fromXML.forReference ? (data as any) : undefined
  }
```

- [ ] **Step 3: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts -t "imports string xsi:nil as undefined"
```

Expected: PASS.

### Task 3: Verify Existing MetadataValue Behavior

**Files:**
- Test: `packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts`

- [ ] **Step 1: Run the full MetadataValue fromXML test file**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts
```

Expected: PASS for all tests in the file.

- [ ] **Step 2: Run round-trip triage again**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --all-configs --batch-size 5
```

Expected: command no longer fails with `MetadataValue: не распознан тип: undefined` on `Catalogs/ОтветственныеЗаАктуализациюТокеновАвторизацииИСМП/ФормаЭлемента`. It should either print a triage batch or reveal the next independent blocker.

- [ ] **Step 3: Commit the implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataValue/fromXML.ts packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts
git commit -m "fix: :bug: распознавать строковый xsi:nil"
```
