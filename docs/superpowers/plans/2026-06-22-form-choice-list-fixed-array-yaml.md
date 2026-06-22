# FormChoiceList FixedArray YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать YAML для `formChoiceListDesTimeValue` внутри `fixedArray` обратимым: такие элементы всегда пишутся объектом через `Значение`.

**Architecture:** Исправление остается в общем слое `packages/core/metadata/commonObjects/metadataValue`. `formChoiceList/toYAML.ts` уже умеет писать объектную форму `{ Значение, Представление? }`, поэтому `fixedArray/toYAML.ts` должен перестать обходить этот экспортер для элементов без `presentation`. Импорт YAML уже распознает объект с `Значение` как `formChoiceListDesTimeValue`, поэтому основной код меняется только в экспорте.

**Tech Stack:** TypeScript, Vitest, `@nakidka/core`, metadata XML/YAML round-trip, существующие helper'ы `exportMetadataValueToYAML`, `importFixedArrayFromYAML`, `exportFixedArrayToYAML`.

---

## File Structure

- `packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts`
  - Хранит модельные и YAML-ожидания для `fixedArray`.
  - Нужно заменить компактный YAML для `formChoiceRefsFixedArrayYAML` на объектную форму `{ Значение: ... }`.
- `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`
  - Проверяет, что объектная YAML-форма внутри массива импортируется обратно как `formChoiceListDesTimeValue`.
  - Старый тест про компактную форму как ordinary refs можно оставить как совместимость входного YAML, потому что он описывает детерминистский импорт голых значений.
- `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts`
  - Проверяет новый экспорт: `formChoiceListDesTimeValue` без `presentation` больше не схлопывается в простое значение.
- `packages/core/metadata/commonObjects/metadataValue/fixedArray/toXML.test.ts`
  - Добавляет защиту XML-формы: после YAML round-trip `fixedArray` снова экспортируется в XML с оберткой `FormChoiceListDesTimeValue`.
- `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts`
  - Единственное место изменения поведения: убрать специальную ветку, которая возвращает `value.value` для `formChoiceListDesTimeValue` без `presentation`.

## Pre-Flight

- [ ] **Step 1: Confirm metadata instructions are available**

Read these files before implementation work:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,260p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,260p' .agents/knowledge/metadata/round-trip-cycle.md
sed -n '1,260p' .agents/knowledge/metadata/yaml-contract.md
```

Expected: commands print the metadata instructions. Do not edit XML fixtures.

- [ ] **Step 2: Check working tree**

Run:

```bash
git status --short --branch
```

Expected: only intentional plan/spec/doc changes or a clean tree. If unrelated files are modified, do not revert them; inspect whether they affect this task before continuing.

### Task 1: Lock the New YAML Contract in Fixtures and Import Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`

- [ ] **Step 1: Update `formChoiceRefsFixedArrayYAML` to explicit object entries**

In `packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts`, replace the current constant:

```ts
export const formChoiceRefsFixedArrayYAML: MetadataFixedArrayValueYAML = [
  "Перечисление.ТипыДоговоров.СПоставщиком",
  "Перечисление.ТипыДоговоров.СКомитентом",
]
```

with:

```ts
export const formChoiceRefsFixedArrayYAML: MetadataFixedArrayValueYAML = [
  {
    Значение: "Перечисление.ТипыДоговоров.СПоставщиком",
  },
  {
    Значение: "Перечисление.ТипыДоговоров.СКомитентом",
  },
]
```

This uses the existing `MetadataFormChoiceListValueYAML` object shape through the recursive `MetadataValueYAML` type.

- [ ] **Step 2: Add a separate compact YAML compatibility fixture inside the import test**

In `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`, keep the existing import of `formChoiceRefsFixedArrayYAML` and add `formChoiceRefsFixedArray` to the fixture imports:

```ts
import {
  formChoiceRefsFixedArray,
  formChoiceRefsFixedArrayYAML,
  refsWithNilFixedArray,
  refsWithNilFixedArrayYAML,
  singleStringFixedArray,
  singleStringFixedArrayYAML,
  twoRefsFixedArray,
  twoRefsFixedArrayYAML,
} from "./__fixtures__/data"
```

Then replace the existing test named `imports compact formChoiceList YAML elements as ordinary refs` with two tests:

```ts
  it("imports explicit formChoiceList YAML elements inside fixed array", () => {
    const result = importFixedArrayFromYAML(mockContext, formChoiceRefsFixedArrayYAML)

    expect(result).toEqual(formChoiceRefsFixedArray)
  })

  it("imports compact fixed array YAML elements as ordinary refs", () => {
    const compactFormChoiceRefsFixedArrayYAML: MetadataFixedArrayValueYAMLInput = [
      "Перечисление.ТипыДоговоров.СПоставщиком",
      "Перечисление.ТипыДоговоров.СКомитентом",
    ]

    const result = importFixedArrayFromYAML(mockContext, compactFormChoiceRefsFixedArrayYAML)

    expect(result).toEqual({
      type: "fixedArray",
      value: [
        {
          type: "ref",
          value: "Enum.ТипыДоговоров.EnumValue.СПоставщиком",
        },
        {
          type: "ref",
          value: "Enum.ТипыДоговоров.EnumValue.СКомитентом",
        },
      ],
    })
  })
```

- [ ] **Step 3: Run the import test and verify current code already accepts explicit YAML**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts
```

Expected: PASS. This confirms no importer change is required.

- [ ] **Step 4: Commit Task 1**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts
git commit -m "test: :white_check_mark: закрепить явный YAML для FormChoiceList в FixedArray"
```

Expected: commit succeeds with only the fixture and import test changes.

### Task 2: Make FixedArray Export Use the FormChoiceList YAML Shape

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts`

- [ ] **Step 1: Rename the export test to describe the new behavior**

In `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts`, replace:

```ts
  it("exports formChoiceList elements without presentation as simple values", () => {
    const result = exportFixedArrayToYAML(mockContext, formChoiceRefsFixedArray)
    expect(result).toEqual(formChoiceRefsFixedArrayYAML)
  })
```

with:

```ts
  it("exports formChoiceList elements without presentation as explicit value objects", () => {
    const result = exportFixedArrayToYAML(mockContext, formChoiceRefsFixedArray)
    expect(result).toEqual(formChoiceRefsFixedArrayYAML)
  })
```

- [ ] **Step 2: Run the export test and verify it fails before implementation**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts
```

Expected: FAIL in `exports formChoiceList elements without presentation as explicit value objects`. The received value is still compact strings, while expected value is objects with `Значение`.

- [ ] **Step 3: Remove the special compacting branch from `fixedArray/toYAML.ts`**

In `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts`, replace the file content with:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataValueToYAML } from "../toYAML"
import { MetadataFixedArrayValue, MetadataFixedArrayValueYAML, MetadataTypedValue } from "../types"

const exportFixedArrayElementToYAML = (
  context: ConfigurationContext,
  value: MetadataTypedValue | undefined
): MetadataFixedArrayValueYAML[number] => {
  if (value === undefined) return undefined

  return exportMetadataValueToYAML(context, undefined, value) as MetadataFixedArrayValueYAML[number]
}

export const exportFixedArrayToYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValue
): MetadataFixedArrayValueYAML =>
  data.value.map((v) => exportFixedArrayElementToYAML(context, v)) as MetadataFixedArrayValueYAML
```

This preserves ordinary `fixedArray` behavior and delegates `formChoiceListDesTimeValue` to `formChoiceList/toYAML.ts`.

- [ ] **Step 4: Run the export test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts
```

Expected: PASS for all tests in `toYAML.test.ts`.

- [ ] **Step 5: Run import and export tests together**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts
git commit -m "fix: :bug: сохранить FormChoiceList в FixedArray YAML"
```

Expected: commit succeeds with only `toYAML.ts` and `toYAML.test.ts` changes.

### Task 3: Prove XML Shape Survives YAML Round-Trip

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toXML.test.ts`

- [ ] **Step 1: Add imports for YAML round-trip helpers and fixtures**

In `packages/core/metadata/commonObjects/metadataValue/fixedArray/toXML.test.ts`, replace the current fixture import:

```ts
import {
  refsWithNilFixedArray,
  singleStringFixedArray,
  twoRefsFixedArray,
} from "./__fixtures__/data"
```

with:

```ts
import {
  formChoiceRefsFixedArray,
  refsWithNilFixedArray,
  singleStringFixedArray,
  twoRefsFixedArray,
} from "./__fixtures__/data"
```

Also add imports:

```ts
import { exportFixedArrayToYAML } from "./toYAML"
import { importFixedArrayFromYAML } from "./fromYAML"
```

The top of the file should include these imports:

```ts
import { describe, expect, it } from "vitest"
import { mockContext, mockContextFromXML } from "~/tests/mockContext"
import {
  formChoiceRefsFixedArray,
  refsWithNilFixedArray,
  singleStringFixedArray,
  twoRefsFixedArray,
} from "./__fixtures__/data"
import { exportFixedArrayToXML } from "./toXML"
import { importFixedArrayFromXML } from "./fromXML"
import { exportFixedArrayToYAML } from "./toYAML"
import { importFixedArrayFromYAML } from "./fromYAML"
```

- [ ] **Step 2: Add a regression test for XML shape after YAML round-trip**

Append this test inside the existing `describe("exportFixedArrayToXML", () => { ... })` block:

```ts
  it("preserves formChoiceList element wrappers after YAML round-trip", () => {
    const yaml = exportFixedArrayToYAML(mockContext, formChoiceRefsFixedArray)
    const fromYAML = importFixedArrayFromYAML(mockContext, yaml)
    const xmlNode = exportFixedArrayToXML(mockContext, fromYAML)

    expect(xmlNode["v8:Value"]).toEqual([
      {
        "_xsi:type": "FormChoiceListDesTimeValue",
        Presentation: {},
        Value: {
          "_xsi:type": "xr:DesignTimeRef",
          "#text": "Enum.ТипыДоговоров.EnumValue.СПоставщиком",
        },
      },
      {
        "_xsi:type": "FormChoiceListDesTimeValue",
        Presentation: {},
        Value: {
          "_xsi:type": "xr:DesignTimeRef",
          "#text": "Enum.ТипыДоговоров.EnumValue.СКомитентом",
        },
      },
    ])
  })
```

- [ ] **Step 3: Run the XML regression test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle metadata/commonObjects/metadataValue/fixedArray/toXML.test.ts
```

Expected: PASS. This proves YAML round-trip no longer loses the `FormChoiceListDesTimeValue` wrapper before XML export.

- [ ] **Step 4: Run all fixedArray metadataValue tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle metadata/commonObjects/metadataValue/fixedArray
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataValue/fixedArray/toXML.test.ts
git commit -m "test: :white_check_mark: проверить FormChoiceList FixedArray XML после YAML"
```

Expected: commit succeeds with only the XML regression test change.

### Task 4: Round-Trip Diagnostics and Final Verification

**Files:**
- No source files.
- Diagnostic output affects external XML repo `/Users/nikita/git/round-trip`.

- [ ] **Step 1: Run the targeted YAML round-trip diagnostic**

Run from `/Users/nikita/git/nkdk`:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/acc ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected: command finishes with `Готово: 16022 успешно, 0 с ошибкой` for import and sync. The first triage diff should no longer be a `FormChoiceListDesTimeValue` wrapper loss. If `DIFF_COUNT` remains nonzero, classify the new first diff separately; do not broaden this fix.

- [ ] **Step 2: Verify the old first diff path no longer contains wrapper loss**

Run:

```bash
git -C /Users/nikita/git/round-trip diff -- Catalogs/КлассификаторПАТСАТУРН/Forms/ПомощникСоздания/Ext/Form.xml
```

Expected: no diff for this file, or a diff that does not replace:

```xml
<v8:Value xsi:type="FormChoiceListDesTimeValue">
```

with:

```xml
<v8:Value xsi:type="xr:DesignTimeRef">
```

- [ ] **Step 3: Run the full project test command required by `AGENTS.md`**

Run from `/Users/nikita/git/nkdk`:

```bash
pnpm test
```

Expected: all package tests pass. Existing skipped tests are acceptable if the command exits with code 0.

- [ ] **Step 4: Check repository status**

Run:

```bash
git status --short --branch
```

Expected in `/Users/nikita/git/nkdk`: only intended source/test changes are present, or the tree is clean after commits. The external `/Users/nikita/git/round-trip` repo may remain dirty with diagnostic XML diffs; do not restore it unless the user asks.

- [ ] **Step 5: Commit final verification note only if Task 4 caused tracked source changes**

If Task 4 did not require code changes, do not create an empty commit. If a small test or source adjustment was necessary after diagnostics, commit only those files:

```bash
git add packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/toXML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts
git commit -m "fix: :bug: завершить round-trip FormChoiceList FixedArray"
```

Expected: commit is created only when there are real tracked changes not already committed by Tasks 1-3.

## Self-Review

- Spec coverage:
  - Always export `formChoiceListDesTimeValue` as `Значение`: Task 2.
  - Preserve existing importer behavior and avoid new syntax: Task 1.
  - Prove XML wrapper survives round-trip: Task 3.
  - Run targeted round-trip-yaml and full `pnpm test`: Task 4.
- Placeholder scan:
  - No incomplete sections or undefined helper names remain.
  - Each code-changing step includes concrete code.
- Type consistency:
  - The plan uses existing names: `MetadataFixedArrayValueYAML`, `MetadataFixedArrayValueYAMLInput`, `formChoiceRefsFixedArray`, `formChoiceRefsFixedArrayYAML`, `exportFixedArrayToYAML`, `importFixedArrayFromYAML`, `exportFixedArrayToXML`.
  - The object shape `{ Значение: ... }` matches `MetadataFormChoiceListValueYAML` and is accepted through recursive `MetadataValueYAML`.
