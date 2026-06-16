# String Object metadataTarget YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable YAML import/export for string properties whose `metadataTarget` is an object reference, so `DocumentNumerator.X` in the model becomes `НумераторДокументов.X` in YAML.

**Architecture:** Keep the model format unchanged and extend the existing string metadataTarget bridge. The implementation should reuse `parseMetadataTargetFromYAML` and `formatMetadataTargetToYAML`; do not add special cases to `MetadataDocument` rules.

**Tech Stack:** TypeScript, Vitest, pnpm, existing metadata orchestration rules.

---

## File Structure

- Modify `packages/core/metadata/orchestration/property/metadataTargetString.ts`
  - Responsibility: decide which string `metadataTarget` constraints are passed through the common metadataTarget parser/formatter.
- Modify `packages/core/metadata/orchestration/property/metadataTargetString.test.ts`
  - Responsibility: cover generic string metadataTarget YAML behavior for `member` and `object`.
- Modify `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/withNumerator.ts`
  - Responsibility: document the expected YAML representation for a document numerator reference.
- Existing tests used by fixture update:
  - `packages/core/metadata/appliedObjects/metadataDocument/fromYAML.test.ts`
  - `packages/core/metadata/appliedObjects/metadataDocument/toYAML.test.ts`

Do not modify XML fixtures. Do not change `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`; the current `metadataTarget: { kind: "object", roots: ["DocumentNumerator"] }` is the intended rule.

---

### Task 1: Add Generic Failing Tests For String Object metadataTarget

**Files:**
- Modify: `packages/core/metadata/orchestration/property/metadataTargetString.test.ts`

- [ ] **Step 1: Add an object-target test rule**

Add this rule after `documentRuleWithCommonForms`:

```ts
const documentRuleWithNumerator = {
  ...documentRule,
  properties: {
    ...documentRule.properties,
    numerator: {
      yaml: "Нумератор",
      type: "string",
      metadataTarget: { kind: "object", roots: ["DocumentNumerator"] },
    },
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 2: Add export/import tests for object targets**

Add these tests inside `describe("string metadataTarget YAML", () => { ... })`, before the ordinary string test:

```ts
  it("exports canonical object strings to YAML roots", () => {
    expect(
      exportPropertiesToYAML({
        context: mockContext,
        rule: documentRuleWithNumerator,
        data: {
          itemType: "MetadataDocument",
          name: "СчетФактура",
          numerator: "DocumentNumerator.СчетаФактуры",
        },
      })
    ).toEqual({
      Нумератор: "НумераторДокументов.СчетаФактуры",
    })
  })

  it("imports YAML object strings to canonical model roots", () => {
    expect(
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRuleWithNumerator,
        name: "СчетФактура",
        yaml: { Нумератор: "НумераторДокументов.СчетаФактуры" },
      })
    ).toMatchObject({
      numerator: "DocumentNumerator.СчетаФактуры",
    })
  })
```

- [ ] **Step 3: Add object-target rejection tests**

Add these tests after the import/export object tests:

```ts
  it("rejects YAML object strings with unknown YAML roots", () => {
    expect(() =>
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRuleWithNumerator,
        name: "СчетФактура",
        yaml: { Нумератор: "DocumentNumerator.СчетаФактуры" },
      })
    ).toThrow('Неизвестный корень "DocumentNumerator"')
  })

  it("rejects YAML object strings outside allowed roots", () => {
    expect(() =>
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRuleWithNumerator,
        name: "СчетФактура",
        yaml: { Нумератор: "Документ.СчетФактура" },
      })
    ).toThrow('Корень "Document" не разрешён для цели метаданных')
  })
```

- [ ] **Step 4: Run the generic tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' test -- metadataTargetString.test.ts
```

Expected: the new export/import object tests fail because `metadataTargetString.ts` still ignores `kind: "object"`. Existing `member` tests should keep passing.

---

### Task 2: Implement String Object metadataTarget Support

**Files:**
- Modify: `packages/core/metadata/orchestration/property/metadataTargetString.ts`

- [ ] **Step 1: Extend the supported constraint type**

Replace the current `isSupportedStringMetadataTarget` function:

```ts
function isSupportedStringMetadataTarget(
  constraint: MetadataTargetConstraint | undefined
): constraint is Extract<MetadataTargetConstraint, { kind: "member" }> {
  if (!constraint) return false
  return constraint.kind === "member"
}
```

with:

```ts
function isSupportedStringMetadataTarget(
  constraint: MetadataTargetConstraint | undefined
): constraint is Extract<MetadataTargetConstraint, { kind: "member" | "object" }> {
  if (!constraint) return false
  return constraint.kind === "member" || constraint.kind === "object"
}
```

This is the only production code change needed. It lets existing `exportStringMetadataTargetToYAML` and `importStringMetadataTargetFromYAML` call the common formatter/parser for object targets.

- [ ] **Step 2: Run the generic tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' test -- metadataTargetString.test.ts
```

Expected: all tests in `metadataTargetString.test.ts` pass.

- [ ] **Step 3: Commit generic support**

Run:

```bash
git add packages/core/metadata/orchestration/property/metadataTargetString.ts packages/core/metadata/orchestration/property/metadataTargetString.test.ts
git commit -m "fix: :bug: поддержать object metadataTarget в строках"
```

---

### Task 3: Update Document Numerator YAML Fixture

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/withNumerator.ts`
- Test: `packages/core/metadata/appliedObjects/metadataDocument/fromYAML.test.ts`
- Test: `packages/core/metadata/appliedObjects/metadataDocument/toYAML.test.ts`

- [ ] **Step 1: Update the YAML fixture**

In `withNumeratorYAML`, replace:

```ts
  Нумератор: "DocumentNumerator.НумераторПоУмолчанию",
```

with:

```ts
  Нумератор: "НумераторДокументов.НумераторПоУмолчанию",
```

Do not change `withNumerator.numerator`; the model value must remain:

```ts
  numerator: "DocumentNumerator.НумераторПоУмолчанию" as MetadataDocument["numerator"],
```

- [ ] **Step 2: Run document YAML tests**

Run:

```bash
pnpm --filter '@nakidka/core' test -- metadataDocument/fromYAML.test.ts metadataDocument/toYAML.test.ts
```

Expected: `withNumerator` import and export tests pass. The export test proves `DocumentNumerator.*` is no longer emitted to YAML for this fixture.

- [ ] **Step 3: Commit fixture update**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/withNumerator.ts
git commit -m "test: :white_check_mark: обновить YAML нумератора документа"
```

---

### Task 4: Verification

**Files:**
- No additional file changes expected.

- [ ] **Step 1: Run focused core tests**

Run:

```bash
pnpm --filter '@nakidka/core' test -- metadataTargetString.test.ts metadataDocument/fromYAML.test.ts metadataDocument/toYAML.test.ts
```

Expected: all focused tests pass.

- [ ] **Step 2: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: all packages pass.

- [ ] **Step 3: Re-import ERP and validate YAML**

Run:

```bash
pnpm --filter @nakidka/cli dev import /home/nikita/git/round-trip/erp /home/nikita/git/temp-yaml
pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml > /tmp/nkdk-validate-string-object-metadata-target.log 2>&1
rg -c "Нумератор: DocumentNumerator" /tmp/nkdk-validate-string-object-metadata-target.log
```

The important assertion is that the previous 28 validation errors of this form are gone:

```text
Нумератор: DocumentNumerator.*
```

Expected: the final `rg -c` command prints `0`. The `Нумератор` subgroup no longer appears in the `строка не соответствует шаблону` validation results. Other known groups such as `ПутьКДанным` may remain.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git status --short
git diff --stat
git log --oneline -3
```

Expected: working tree is clean after commits; the latest commits are the generic support commit and the fixture/test commit.

---

## Self-Review

- Spec coverage: covered generic `kind: "object"` support, model/YAML conversion, rejection of bad roots, document numerator fixture, focused tests, full tests, and ERP validation check.
- Plan text scan: no unfinished markers or open-ended implementation steps.
- Type consistency: plan uses existing `MetadataItemRule`, `exportPropertiesToYAML`, `importPropertiesFromYAML`, `MetadataDocument`, and current fixture/test file names.
