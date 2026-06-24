# DCS LocalStringType Explicit YAML String Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `v8:lang` for quoted numeric-looking `ConditionalAppearance.Текст` values with `Тип: МногоязычнаяСтрока`.

**Architecture:** Keep the fix at the DCS explicit text-value boundary. `MetadataDcsMetadataValue.fromYAML` unwraps the YAML quoting marker only for `Тип: МногоязычнаяСтрока` before delegating to `I8nText`; generic `I8nText` behavior stays unchanged.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration helpers, `~/yaml/explicitString`.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
  - Responsibility: import DCS metadata values from YAML, including explicit `DesignTimeValue` text forms.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`
  - Responsibility: focused unit coverage for DCS metadata-value YAML import.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`
  - Responsibility: verify real `AppearanceFields.Текст` YAML import reconstructs `ru`, not `value`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.test.ts`
  - Responsibility: verify XML export writes `<v8:lang>ru</v8:lang>` for the reconstructed model.

Do not modify XML fixtures.

## Task 1: Red Tests For Quoted LocalStringType

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read as directed by index: `.agents/knowledge/metadata/sources-of-truth.md`
- Read as directed by index: `.agents/knowledge/metadata/yaml-contract.md`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.test.ts`

- [ ] **Step 1: Read metadata instructions**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,220p' .agents/knowledge/metadata/yaml-contract.md
```

Expected: instructions confirm XML fixtures are source of truth and YAML behavior must be covered with tests.

- [ ] **Step 2: Add the failing DCS value import test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`, update the imports:

```ts
import { importFromYAML } from "~/yaml/import"
```

Add this test after `imports explicit DesignTimeValue LocalStringType`:

```ts
  it("imports quoted explicit DesignTimeValue LocalStringType as default language", () => {
    expect(
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: importFromYAML('Тип: МногоязычнаяСтрока\nЗначение: "1"'),
      })
    ).toEqual({
      items: { ru: "1" },
    })
  })
```

- [ ] **Step 3: Add the failing AppearanceFields import test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`, add this test after `imports explicit LocalStringType value for text appearance`:

```ts
  it("imports quoted LocalStringType text appearance as default language", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: importFromYAML(`
Текст:
  Использовать: Ложь
  Тип: МногоязычнаяСтрока
  Значение: "1"
`),
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      Текст: {
        parameter: "Текст",
        use: false,
        value: {
          items: { ru: "1" },
        },
      },
    })
  })
```

- [ ] **Step 4: Add the failing XML export guard**

In `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.test.ts`, add this test after the existing auto color tests:

```ts
  it("exports quoted LocalStringType text appearance with default language", () => {
    const { result } = testExportPropertyToXML({
      rule: fixtureAppearanceRule,
      value: {
        itemType: "AppearanceFields",
        Текст: {
          parameter: "Текст",
          use: false,
          value: {
            items: { ru: "1" },
          },
        },
      },
      xmlRootTag: "dcsset:appearance",
    })

    expect(result).toContain("<dcscor:use>false</dcscor:use>")
    expect(result).toContain("<dcscor:parameter>Текст</dcscor:parameter>")
    expect(result).toContain('<dcscor:value xsi:type="v8:LocalStringType">')
    expect(result).toContain("<v8:lang>ru</v8:lang>")
    expect(result).toContain("<v8:content>1</v8:content>")
  })
```

- [ ] **Step 5: Run targeted tests and verify the import tests fail**

Run:

```bash
pnpm --filter @nakidka/core test -- dcsMetadataValue/fromYAML.test.ts appearanceFields/fromYAML.test.ts appearanceFields/toXML.test.ts
```

Expected: at least the two YAML import tests fail because actual value contains `items: { value: "1" }`; the XML export guard may pass because it uses the correct model directly.

## Task 2: Unwrap Explicit YAML String At DCS Boundary

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`

- [ ] **Step 1: Import the unwrap helper**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`, change:

```ts
import { isExplicitYAMLString } from "~/yaml/explicitString"
```

to:

```ts
import { isExplicitYAMLString, unwrapExplicitYAMLString } from "~/yaml/explicitString"
```

- [ ] **Step 2: Unwrap only `МногоязычнаяСтрока` values**

In `importExplicitTextValueFromYAML`, replace the `МногоязычнаяСтрока` branch with:

```ts
  if (data["Тип"] === "МногоязычнаяСтрока") {
    const value = importI8nTextFromYAML({
      context,
      rule: { type: "I8nText" },
      value: unwrapExplicitYAMLString(data["Значение"]) as I8nTextYAML,
    })
    if (value !== undefined) return value
  }
```

Do not unwrap the whole explicit DCS object, and do not change `I8nText.fromYAML`.

- [ ] **Step 3: Run targeted tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core test -- dcsMetadataValue/fromYAML.test.ts appearanceFields/fromYAML.test.ts appearanceFields/toXML.test.ts
```

Expected: all selected tests pass.

## Task 3: Full Verification And Round-trip Check

**Files:**
- No source edits.

- [ ] **Step 1: Run wider DCS tests**

Run:

```bash
pnpm --filter @nakidka/core test -- dcsMetadataValue appearanceFields settingsParameterValueCollection
```

Expected: all selected tests pass.

- [ ] **Step 2: Run the full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: all packages pass.

- [ ] **Step 3: Commit the implementation**

Run:

```bash
git status --short
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.test.ts
git commit -m "fix: :bug: сохранить язык quoted LocalStringType в DCS"
```

Expected: commit contains only the implementation and tests for this fix.

- [ ] **Step 4: Run round-trip YAML on acc**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: the diff changing `<v8:lang>ru</v8:lang>` to `<v8:lang>value</v8:lang>` for `DataProcessors/СопоставлениеДанныхЕГАИС/Forms/СопоставлениеНоменклатуры/Ext/Form.xml` no longer appears. Record the remaining diff count and first remaining diff.

## Self-Review

- Spec coverage: Task 1 covers the quoted scalar and XML language guard; Task 2 implements the agreed narrow DCS-boundary unwrap; Task 3 covers full tests and round-trip verification.
- Placeholder scan: no placeholders or future work markers.
- Type consistency: all examples use existing names: `importDcsMetadataValueFromYAML`, `importFromYAML`, `unwrapExplicitYAMLString`, `MetadataDcsMetadataValue`, `AppearanceFields.Текст`.
