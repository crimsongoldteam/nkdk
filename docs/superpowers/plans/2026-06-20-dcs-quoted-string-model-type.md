# DCS Quoted String Model Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve double-quoted YAML string intent inside nested DCS settings so `"123"` imports into the model as `{ type: "string", value: "123" }` and exports back to `xsi:type="xs:string"`.

**Architecture:** Keep the YAML contract unchanged and fix the importer boundary where nested `SettingsParameterValue` values are extracted. Reuse the existing `asExplicitYAMLStringIfMarked(parent, key, value)` mechanism before delegating to `MetadataDcsMetadataValue/fromYAML`.

**Tech Stack:** TypeScript, Vitest, existing metadata property type registry, existing YAML scalar style tracking.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`
  - Add focused regressions for quoted numeric-looking strings inside expanded `Значение` and array items.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`
  - Import `asExplicitYAMLStringIfMarked`.
  - Add a small helper that restores explicit string markers for values extracted from nested YAML objects and arrays.
- No XML fixture changes.
- No YAML contract changes.

---

### Task 1: Add Failing Regression Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`

- [ ] **Step 1: Add imports for YAML round-trip parsing**

At the top of `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`, add:

```ts
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"
```

Keep the existing imports.

- [ ] **Step 2: Add helper for preserving parser style metadata**

Inside the `describe("importParameterValueFromYAML ...")` block, before the new tests, add:

```ts
const parseViaYamlText = <T>(value: T): T => importFromYAML<T>(exportToYAML(value))
```

This forces the test through the real YAML text parser, which is where double-quote style marks are recorded.

- [ ] **Step 3: Add red test for expanded `Значение: "123"`**

Append this test in the same `describe`:

```ts
it("imports double-quoted numeric-looking primitive value as string", () => {
  const yaml = parseViaYamlText({
    Значение: "123",
  })

  const result = testImportPropertyFromYAML({
    rule: { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Маска" } as PropertyRule,
    value: yaml,
  })

  expect(result).toEqual({
    parameter: "Маска",
    value: { type: "string", value: "123" },
  })
})
```

- [ ] **Step 4: Add red test for array values**

Append this test after the previous one:

```ts
it("imports double-quoted numeric-looking primitive array item as string", () => {
  const yaml = parseViaYamlText({
    Значение: ["123", 456],
  })

  const result = testImportPropertyFromYAML({
    rule: { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Список" } as PropertyRule,
    value: yaml,
  })

  expect(result).toEqual({
    parameter: "Список",
    value: [
      { type: "string", value: "123" },
      { type: "decimal", value: 456 },
    ],
  })
})
```

- [ ] **Step 5: Run focused test and confirm failure**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts --no-isolate
```

Expected now: FAIL. The first new test should show `value: { type: "decimal", value: 123 }` instead of `value: { type: "string", value: "123" }`.

- [ ] **Step 6: Commit failing tests**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts
git commit -m "test: :white_check_mark: зафиксировать строки СКД в кавычках"
```

---

### Task 2: Restore Explicit String Marker in DCS Parameter Value Import

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`

- [ ] **Step 1: Import existing marker helper**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`, replace:

```ts
import { isExplicitYAMLString } from "~/yaml/explicitString"
```

with:

```ts
import { asExplicitYAMLStringIfMarked, isExplicitYAMLString } from "~/yaml/explicitString"
```

- [ ] **Step 2: Add helper for nested raw values**

Add this helper after `normalizeRawValues`:

```ts
const restoreExplicitRawValue = (parent: unknown, key: string | number, value: unknown): unknown =>
  asExplicitYAMLStringIfMarked(parent, key, value)
```

Keep it small and local to `parameterValue/fromYAML.ts`; no new shared abstraction is needed.

- [ ] **Step 3: Restore marker for `Значение` before normalization**

Replace the `rawValue` declaration with this two-stage version:

```ts
  const rawValueBase =
    rule.valueType === "Color" && yamlToParse === null
      ? undefined
      : isExplicitDcsValueYAML(yamlToParse)
        ? yamlToParse
        : hasExplicitValue
          ? restoreExplicitRawValue(y, "Значение", y["Значение"])
          : isExpandedSpvShape
            ? undefined
            : yamlToParse
  const rawValue = unwrapped !== undefined
    ? restoreExplicitRawValue(yaml, parameterFromWrapper, rawValueBase)
    : rawValueBase
```

This preserves the existing shapes:

- Expanded form: `{ Значение: "123" }`.
- Wrapper form: `{ Маска: "123" }`.
- Explicit DCS object form: `{ Тип: "...", Значение: "..." }` remains handled by `isExplicitDcsValueYAML`.

- [ ] **Step 4: Restore marker for array items**

Replace:

```ts
  rawList.forEach((v, index) => {
```

with:

```ts
  rawList.forEach((v, index) => {
    const valueToImport = Array.isArray(rawValue) ? restoreExplicitRawValue(rawValue, index, v) : v
```

Then replace the call argument:

```ts
      importDcsMetadataValueFromYAML(context, dcsRule, v as never, sourceValues[index] ?? undefined)
```

with:

```ts
      importDcsMetadataValueFromYAML(context, dcsRule, valueToImport as never, sourceValues[index] ?? undefined)
```

- [ ] **Step 5: Run focused tests and confirm pass**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Run fast round-trip against the real repository**

Run:

```bash
pnpm -s --dir packages/cli exec tsx src/cli.ts round-trip-yaml-fast /home/nikita/git/round-trip/all
```

Expected: the previous `CommonForms/ДинамическийСписок/Ext/Form.xml` diff should disappear or shrink to unrelated DCS formatting issues. If `tsx` fails in sandbox with `listen EPERM`, rerun the same command with escalation because this is an IPC restriction, not a code failure.

- [ ] **Step 7: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 8: Commit implementation**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts
git commit -m "fix: :bug: сохранять строки СКД из кавычек"
```

---

## Self-Review

- Spec coverage: the plan keeps YAML as `"123"`, restores explicit string intent at nested DCS import boundaries, stores typed string values in the model, and verifies XML/YAML round-trip behavior.
- Placeholder scan: no TODO, TBD, or vague implementation steps remain.
- Type consistency: all helpers use existing `unknown` boundaries and existing `MetadataDcsMetadataValue` import flow; no new public type is introduced.
