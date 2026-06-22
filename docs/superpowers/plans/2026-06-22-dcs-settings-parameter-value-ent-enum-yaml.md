# DCS SettingsParameterValue ent Enum YAML Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `dcscor:value xsi:type="ent:*"` system enumeration values through XML -> YAML -> XML for generic DCS `SettingsParameterValue` rules.

**Architecture:** Keep the existing `DcsMetadataValue` explicit YAML shape for system enumerations and make `SettingsParameterValue` stop lifting lossy DCS values into its outer `Тип` field. Values such as `{ Тип: "СистемноеПеречисление", Имя, Значение }` should stay nested under outer `Значение`, while simple explicit DCS values that contain only `Тип` and `Значение` can keep the current lifted form.

**Tech Stack:** TypeScript, Vitest, pnpm, existing `packages/core/metadata/commonObjects/dataCompositionSystem/*` property rules and test helpers.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`
  - Responsibility: decide how a `SettingsParameterValue` value is represented in YAML.
  - Change: lift only lossless explicit DCS values into outer `Тип`; keep system enumeration values nested under `Значение`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toYAML.test.ts`
  - Responsibility: prove YAML export keeps `Имя` for `ent:*` values inside `SettingsParameterValueCollection`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.test.ts`
  - Responsibility: prove YAML import restores the typed system enumeration model from the nested explicit YAML shape.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromXML.test.ts`
  - Responsibility: prove XML import reads `ent:AccumulationRecordType` under a generic `Field` rule.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toXML.test.ts`
  - Responsibility: prove XML export writes `ent:AccumulationRecordType` under a generic `Field` rule.

Do not modify XML fixtures. Use inline XML strings in tests for the new case.

---

### Task 1: Add Failing YAML Export Test

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toYAML.test.ts`

- [ ] **Step 1: Add the typed system enumeration fixture inside the test file**

Add this constant below the existing `rule` constant:

```ts
const accumulationRecordTypeCollection = {
  itemType: "SettingsParameterValueCollection",
  parameters: {
    ВидДвижения: {
      parameter: "ВидДвижения",
      use: false,
      value: {
        type: "SystemEnumeration",
        typeSE: "AccumulationRecordType",
        value: "Receipt",
      },
    },
  },
} as const
```

- [ ] **Step 2: Add the failing export assertion**

Add this test inside `describe("export SettingsParameterValueCollection to YAML", ...)`:

```ts
it("keeps ent system enumeration values nested under Значение", () => {
  const result = testExportPropertyToYAML({
    rule,
    value: accumulationRecordTypeCollection,
  })

  expect(result).toEqual({
    ПараметрыДанных: {
      ВидДвижения: {
        Использовать: "Ложь",
        Значение: {
          Тип: "СистемноеПеречисление",
          Имя: "AccumulationRecordType",
          Значение: "Приход",
        },
      },
    },
  })
})
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- settingsParameterValueCollection/toYAML.test.ts
```

Expected: FAIL. The actual YAML will show the lossy lifted shape, likely with outer `Тип: "СистемноеПеречисление"` and without nested `Имя`.

---

### Task 2: Stop Lossy `Тип` Lifting In SettingsParameterValue YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`

- [ ] **Step 1: Replace the lift predicate**

Find:

```ts
const isExplicitDcsValueYAML = (value: unknown): value is { Тип: string; Значение: unknown } =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  typeof (value as Record<string, unknown>).Тип === "string" &&
  "Значение" in value
```

Replace it with:

```ts
const isLosslessLiftableDcsValueYAML = (value: unknown): value is { Тип: string; Значение: unknown } => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false

  const record = value as Record<string, unknown>
  if (typeof record.Тип !== "string" || !("Значение" in record)) return false

  const keys = Object.keys(record)
  return keys.every((key) => key === "Тип" || key === "Значение")
}
```

- [ ] **Step 2: Use the new predicate for lifted values**

Find:

```ts
const liftedType = isExplicitDcsValueYAML(liftedValue) ? liftedValue.Тип : undefined
```

Replace it with:

```ts
const canLiftValue = isLosslessLiftableDcsValueYAML(liftedValue)
const liftedType = canLiftValue ? liftedValue.Тип : undefined
```

Find:

```ts
значение = isExplicitDcsValueYAML(liftedValue) ? liftedValue.Значение : liftedValue
```

Replace it with:

```ts
значение = canLiftValue ? liftedValue.Значение : liftedValue
```

- [ ] **Step 3: Run the focused YAML export test**

Run:

```bash
pnpm --filter @nakidka/core test -- settingsParameterValueCollection/toYAML.test.ts
```

Expected: PASS for the new export test and existing tests in the file.

- [ ] **Step 4: Commit the YAML export fix**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toYAML.test.ts
git commit -m "fix: :bug: сохранить ent enum в YAML SettingsParameterValue"
```

---

### Task 3: Add YAML Import Coverage For Nested System Enumeration

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.test.ts`

- [ ] **Step 1: Add the import assertion**

Add this test inside `describe("import SettingsParameterValueCollection from YAML", ...)`:

```ts
it("imports nested ent system enumeration values", () => {
  const result = testImportPropertyFromYAML({
    rule,
    value: {
      ВидДвижения: {
        Использовать: "Ложь",
        Значение: {
          Тип: "СистемноеПеречисление",
          Имя: "AccumulationRecordType",
          Значение: "Приход",
        },
      },
    },
  })

  expect(result).toEqual({
    itemType: "SettingsParameterValueCollection",
    parameters: {
      ВидДвижения: {
        parameter: "ВидДвижения",
        use: false,
        value: {
          type: "SystemEnumeration",
          typeSE: "AccumulationRecordType",
          value: "Receipt",
        },
      },
    },
  })
})
```

- [ ] **Step 2: Run the focused YAML import test**

Run:

```bash
pnpm --filter @nakidka/core test -- settingsParameterValueCollection/fromYAML.test.ts
```

Expected: PASS. If it fails, inspect whether `importDcsMetadataValueFromYAML` handles `СистемноеПеречисление` for `valueType: "Field"`; the intended fix belongs in `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`, not in `DynamicList` parameter rules.

- [ ] **Step 3: Commit the YAML import coverage**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.test.ts
git commit -m "test: :white_check_mark: проверить импорт ent enum в DCS YAML"
```

---

### Task 4: Add XML Import And Export Coverage

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toXML.test.ts`

- [ ] **Step 1: Add inline XML import coverage**

In `fromXML.test.ts`, add this test inside `describe("import SettingsParameterValueCollection from XML", ...)`:

```ts
it("imports ent system enumeration values under generic Field rule", () => {
  const result = testImportPropertyFromXML({
    rule,
    xmlRootTag: "dcsset:dataParameters",
    xmlString: `<dcsset:dataParameters xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise/current-config">
  <dcscor:item xsi:type="dcsset:SettingsParameterValue">
    <dcscor:use>false</dcscor:use>
    <dcscor:parameter>ВидДвижения</dcscor:parameter>
    <dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value>
  </dcscor:item>
</dcsset:dataParameters>`,
  })

  expect(result).toEqual({
    itemType: "SettingsParameterValueCollection",
    parameters: {
      ВидДвижения: {
        parameter: "ВидДвижения",
        use: false,
        value: {
          type: "SystemEnumeration",
          typeSE: "AccumulationRecordType",
          value: "Receipt",
        },
      },
    },
  })
})
```

- [ ] **Step 2: Add inline XML export coverage**

In `toXML.test.ts`, add this test inside `describe("export SettingsParameterValueCollection to XML", ...)`:

```ts
it("exports ent system enumeration values under generic Field rule", () => {
  const { result } = testExportPropertyToXML({
    rule,
    value: {
      itemType: "SettingsParameterValueCollection",
      parameters: {
        ВидДвижения: {
          parameter: "ВидДвижения",
          use: false,
          value: {
            type: "SystemEnumeration",
            typeSE: "AccumulationRecordType",
            value: "Receipt",
          },
        },
      },
    },
    xmlRootTag: "dcsset:dataParameters",
    referenceMetadata: undefined,
  })

  expect(result).toContain('<dcscor:item xsi:type="dcsset:SettingsParameterValue">')
  expect(result).toContain("<dcscor:use>false</dcscor:use>")
  expect(result).toContain("<dcscor:parameter>ВидДвижения</dcscor:parameter>")
  expect(result).toContain('<dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value>')
})
```

- [ ] **Step 3: Run the focused XML tests**

Run:

```bash
pnpm --filter @nakidka/core test -- settingsParameterValueCollection/fromXML.test.ts settingsParameterValueCollection/toXML.test.ts
```

Expected: PASS. If XML export fails with a missing `ent:` type, inspect `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`; keep the fix generic for `MetadataDcsSystemEnumerationValue`.

- [ ] **Step 4: Commit XML coverage**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toXML.test.ts
git commit -m "test: :white_check_mark: проверить XML ent enum в DCS"
```

---

### Task 5: Verify Full Test Suite And Round-Trip

**Files:**
- No source edits expected.

- [ ] **Step 1: Run focused DCS tests together**

Run:

```bash
pnpm --filter @nakidka/core test -- dcsMetadataValue settingsParameterValueCollection
```

Expected: PASS.

- [ ] **Step 2: Run the full project test suite**

Run from repository root:

```bash
pnpm test
```

Expected: all package test suites pass.

- [ ] **Step 3: Rerun round-trip-yaml on acc**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: the previously selected diff that removes:

```xml
<dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value>
```

from `DataProcessors/ПомощникРасчетаНалогаУСН/Forms/РасшифровкаУменьшенияНалогаИнтеграцияСБанком/Ext/Form.xml` no longer appears. Record the new `DIFF_COUNT` in the final report.

- [ ] **Step 4: Commit any final adjustments**

If Task 5 required source or test edits, commit them:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem
git commit -m "fix: :bug: завершить round-trip ent enum в DCS"
```

If Task 5 required no edits, do not create an empty commit.

---

## Self-Review

- Spec coverage: The plan covers the agreed generic mechanism, keeps the existing explicit `СистемноеПеречисление` YAML shape, avoids parameter-specific `ВидДвижения` rules, and verifies XML, YAML, and full round-trip.
- Placeholder scan: No placeholder work remains in the steps; each code change includes concrete snippets.
- Type consistency: The plan consistently uses `type: "SystemEnumeration"`, `typeSE: "AccumulationRecordType"`, and XML value `Receipt` / YAML value `Приход`.
