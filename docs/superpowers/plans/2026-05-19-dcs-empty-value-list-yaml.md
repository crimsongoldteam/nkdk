# DCS EmptyValueList YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make DCS `EmptyValueList` round-trip through YAML as the literal `СписокЗначений`.

**Architecture:** The change stays inside the existing `DcsMetadataTypedValue` type adapter. XML import/export already supports empty `v8:ValueListType`; YAML import/export will learn the same model value without changing form rules, XML fixtures, or general `metadataValue`.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration property helpers, `round-trip-yaml` diagnostic skill.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/data.ts`: add the YAML literal for `emptyValueListTypedValue` and include it in the shared fixture table.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`: add `СписокЗначений` to the JSON schema for `DcsMetadataTypedValueYAML`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts`: detect `СписокЗначений` before generic string handling and return `{ type: "EmptyValueList" }`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`: export `{ type: "EmptyValueList" }` to YAML as `СписокЗначений`; keep non-empty XML validation unchanged.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`: add regression check for quoted string `'СписокЗначений'`.
- Existing tests in `fromXML.test.ts` and `toXML.test.ts` should continue to pass through the shared fixture table and the dedicated XML tests.

### Task 1: Add Failing YAML Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`

- [ ] **Step 1: Add `EmptyValueList` to the shared fixture table**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/data.ts`, replace the standalone `emptyValueListTypedValue` section with this exact shape:

```ts
export const emptyValueListTypedValue: DcsMetadataTypedValue = {
  type: "EmptyValueList",
}

export const emptyValueListTypedValueYAML: DcsMetadataTypedValueYAML = "СписокЗначений"

export const dcsMetadataTypedValueFixtures: DcsMetadataTypedValueFixture[] = [
  {
    name: "emptyValueList",
    model: emptyValueListTypedValue,
    YAML: emptyValueListTypedValueYAML,
    XML: `<value xsi:type="v8:ValueListType">
	<v8:valueType/>
	<v8:lastId xsi:type="xs:decimal">-1</v8:lastId>
</value>`,
  },
```

Keep the existing fixture entries after this new first entry.

- [ ] **Step 2: Add quoted-string regression test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`, append this test inside the existing `describe` block:

```ts
  it("imports quoted СписокЗначений as string", () => {
    expect(
      testImportPropertyFromYAML({
        rule,
        value: "'СписокЗначений'",
      })
    ).toEqual({ type: "string", value: "СписокЗначений" })
  })
```

- [ ] **Step 3: Run the focused tests and confirm RED**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts
```

Expected: failures for YAML handling of `EmptyValueList`, including `DcsMetadataTypedValue YAML: EmptyValueList is XML-only` or unsupported YAML schema/literal. XML-only dedicated tests may still pass.

- [ ] **Step 4: Commit failing tests**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/data.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts
git commit -m "✅ test: зафиксировать YAML для EmptyValueList"
```

### Task 2: Implement YAML Literal Support

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`

- [ ] **Step 1: Extend the YAML schema**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`, change the schema union to include the literal:

```ts
export const DcsMetadataTypedValueJSONSchema = Type.Union([
  Type.Literal("Порядок"),
  Type.Literal("СписокЗначений"),
  Type.String(),
  Type.Number(),
  BooleanJSONSchema,
  StandartBeginningDateJSONSchema,
])
```

- [ ] **Step 2: Detect the literal before generic strings**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts`, add the literal branch immediately after `Порядок`:

```ts
  if (value === "Порядок") return "Order"
  if (value === "СписокЗначений") return "EmptyValueList"
  if (typeof value === "object" && value !== null && !Array.isArray(value) && "Вариант" in value)
    return "StandardBeginningDate"
```

Do not put this branch after `DcsMetadataTypedValueRegistry.string.detect`, because then `СписокЗначений` would be imported as a plain string.

- [ ] **Step 3: Export `EmptyValueList` to YAML**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`, replace the `EmptyValueList` YAML methods with literal support:

```ts
  EmptyValueList: {
    detect: ({ yaml }) => yaml === "СписокЗначений",
    fromYAML: () => ({ type: "EmptyValueList" }),
    fromXML: ({ xml }) => {
      assertEmptyValueListXML(xml)
      return { type: "EmptyValueList" }
    },
    toYAML: () => "СписокЗначений",
    toXML: () => ({
      "_xsi:type": "v8:ValueListType",
      "v8:valueType": {},
      "v8:lastId": {
        "_xsi:type": "xs:decimal",
        "#text": "-1",
      },
    }),
  },
```

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts
```

Expected: all `DcsMetadataTypedValue` tests pass, including the new shared fixture and quoted-string regression.

- [ ] **Step 5: Commit implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts
git commit -m "🐛 fix: поддержать EmptyValueList в YAML"
```

### Task 3: Verify Round-Trip Progress

**Files:**
- No code changes expected.

- [ ] **Step 1: Check worktree status**

Run:

```bash
git status --short --branch
```

Expected: clean branch `codex/round-trip-yaml-errors`.

- [ ] **Step 2: Run the diagnostic round-trip from this worktree**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: the previous `DcsMetadataTypedValue YAML: EmptyValueList is XML-only` blocker is gone. The command may still stop on the next independent import error, such as `path.split is not a function` or `Type DataCompositionSortDirection not found in TypeDescriptionRules`.

- [ ] **Step 3: Record the result for the user**

Summarize:

```text
EmptyValueList blocker: gone / still present
Stage: import / sync / diff
Next blocker: <first remaining error or clean round-trip>
YAML directory: <YAML_DIR from script output>
```

- [ ] **Step 4: Commit nothing if no files changed**

Run:

```bash
git status --short
```

Expected: no unstaged files from verification in `nakidka-core`.

### Task 4: Final Verification Before Completion

**Files:**
- No code changes expected unless tests reveal a regression.

- [ ] **Step 1: Generate Langium files before full tests**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command succeeds and does not leave unrelated generated changes.

- [ ] **Step 2: Run the full project test suite**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Confirm final status and recent commits**

Run:

```bash
git status --short --branch
git log --oneline -6
```

Expected: branch is clean; recent commits include the test and implementation commits from this plan.

- [ ] **Step 4: Report completion**

Report the test evidence and current next `round-trip-yaml` blocker. Do not claim the whole metadata round-trip is clean unless the diagnostic script printed `=== Round-trip чистый: диффов нет ===`.
