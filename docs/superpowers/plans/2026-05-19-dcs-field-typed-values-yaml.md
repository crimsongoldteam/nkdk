# DCS Field Typed Values YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make DCS `MetadataDcsMetadataValue` with `valueType: "Field"` round-trip typed primitive and inferred system enumeration values through YAML.

**Architecture:** Keep `DynamicListRules.dataParameters` unchanged. Extend the shared DCS value YAML conversion so the existing XML behavior for `Field` values is mirrored by YAML import/export.

**Tech Stack:** TypeScript, Vitest, `@nakidka/core` metadata conversion, DCS metadata value rules.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`
  - Add fixtures for `valueType: "Field"` with decimal and inferred system enumeration typed model values.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`
  - Teach the `Field` branch to export typed values via existing `MetadataValue` and system enumeration exporters.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
  - Teach the `Field` branch to import non-string YAML through `MetadataValue` and preserve existing design-time enum path behavior.
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts`
  - Existing fixture-driven test should fail then pass after adding fixtures.
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`
  - Existing fixture-driven test should fail then pass after adding fixtures.

### Task 1: Add Failing DCS YAML Fixtures

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`

- [ ] **Step 1: Add decimal-under-Field fixture**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`, add this fixture object to `dcsMetadataValueFixtures` after the existing `"field"` fixture:

```ts
  {
    id: "fieldRuleDecimal",
    title: "Field rule with decimal typed value",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
    value: {
      type: "decimal",
      value: 0,
    },
    yaml: 0,
    xml: "primitive-decimal.xml",
  },
```

- [ ] **Step 2: Add inferred system enumeration-under-Field fixture**

In the same file, add this fixture object after `fieldRuleDecimal`:

```ts
  {
    id: "fieldRuleInferredSystemEnumeration",
    title: "Field rule with inferred system enumeration typed value",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
    value: fixtureAccumulationRecordType,
    yaml: "Expense",
    xml: "system-enumeration-accumulation-record-type.xml",
  },
```

- [ ] **Step 3: Run focused tests to confirm RED**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts
```

Expected: FAIL. `toYAML` should fail with `path.split is not a function` or equivalent because the `Field` branch still assumes a string path.

- [ ] **Step 4: Commit failing fixtures**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts
git commit -m "test: :white_check_mark: зафиксировать DCS Field typed values в YAML"
```

### Task 2: Implement DCS Field Typed YAML Conversion

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`

- [ ] **Step 1: Extend `toYAML.ts` imports**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`, add `MetadataDcsSystemEnumerationValue` to the existing type import:

```ts
import {
  DcsMetadataValuePropertyRule,
  MetadataDcsExplicitTextValue,
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueYAML,
  MetadataDcsSystemEnumerationValue,
} from "./types"
```

- [ ] **Step 2: Add system enumeration type guard**

In `toYAML.ts`, after `isExplicitTextValue`, add:

```ts
const isDcsSystemEnumerationValue = (
  data: MetadataDcsMetadataValue
): data is MetadataDcsSystemEnumerationValue =>
  data !== null &&
  typeof data === "object" &&
  !Array.isArray(data) &&
  "type" in data &&
  "typeSE" in data &&
  "value" in data &&
  data.type === "SystemEnumeration" &&
  typeof data.value === "string"
```

- [ ] **Step 3: Add shared typed-value YAML exporter**

In `toYAML.ts`, after the type guard, add:

```ts
const exportTypedValueToYAML = (
  context: ConfigurationContext,
  data: MetadataDcsMetadataValue
): MetadataDcsMetadataValueYAML | undefined => {
  if (isDcsSystemEnumerationValue(data)) {
    return exportSystemEnumerationToYAMLDeprecated(
      context,
      { type: "SystemEnumeration", typeSE: data.typeSE } as SystemEnumerationPropertyRule,
      data.value
    )
  }

  if (data !== null && typeof data === "object" && "type" in (data as object) && "value" in (data as object)) {
    return exportMetadataValueToYAML(context, undefined, data as any) as MetadataDcsMetadataValueYAML
  }

  return undefined
}
```

- [ ] **Step 4: Update the `Field` branch in `toYAML.ts`**

Replace this branch:

```ts
    case "Field":
      return exportMetadataFieldToYAML(context, undefined, data as any)
```

with:

```ts
    case "Field": {
      const typedValue = exportTypedValueToYAML(context, data)
      if (typedValue !== undefined) return typedValue
      return exportMetadataFieldToYAML(context, undefined, data as any)
    }
```

- [ ] **Step 5: Update the `Field` branch in `fromYAML.ts`**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`, replace the current `case "Field"` body with:

```ts
    case "Field": {
      const metadataValuePath =
        typeof data === "string" && !data.startsWith(".")
          ? importMetadataValueStringFromYAML(context, undefined, data)
          : undefined
      if (typeof data === "string" && isEnumValueMetadataPath(metadataValuePath)) {
        return { type: "DesignTimeValue", value: data }
      }
      if (typeof data !== "string") {
        return importMetadataValueFromYAML(context, undefined, data as any) as MetadataDcsMetadataValue
      }
      return importMetadataFieldFromYAML(context, undefined, data as any)!
    }
```

- [ ] **Step 6: Run focused tests to confirm GREEN**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts
```

Expected: PASS for the focused DCS metadata value tests.

- [ ] **Step 7: Run round-trip-yaml diagnostic**

Run from repository root:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: the previous `path.split is not a function` errors for `ЗапросСреднегоЗаработкаСЭДО`, `СреднийЗаработокСЭДО`, and `ПомощникРасчетаНалогаУСН` are gone. The command may stop on the next independent import error.

- [ ] **Step 8: Commit implementation**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts
git commit -m "fix: :bug: поддержать typed values в DCS Field YAML"
```

### Task 3: Final Verification

**Files:**
- No edits expected.

- [ ] **Step 1: Generate Langium files**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits successfully.

- [ ] **Step 2: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Confirm git status**

Run:

```bash
git status --short --branch
```

Expected: clean branch after all planned commits.
