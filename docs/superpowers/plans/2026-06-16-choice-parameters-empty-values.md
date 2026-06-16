# ChoiceParameters Empty Values Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать ошибки YAML Schema для пустого `Представление` и пустых ключей внутри `ПараметрыВыбора`.

**Architecture:** Пустое `Presentation` остаётся деталью XML и не записывается в YAML. `formChoiceListDesTimeValue` экспортируется в объект без `Представление`, если представление отсутствует; элементы `fixedArray` с таким значением экспортируются как простые YAML-значения. Пустой YAML-ключ параметра выбора допускается схемой как входной `null`, но в TS-модели нормализуется в отсутствие `value`.

**Tech Stack:** TypeScript, Vitest, TypeBox JSON Schema, metadata YAML/XML import/export.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts`
  - Обновляет ожидаемый YAML для `formChoiceListDesTimeValue` без `presentation`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts`
  - Фиксирует экспорт без `Представление: ""`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts`
  - Фиксирует импорт формы `{ Значение: ... }` без `Представление`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts`
  - Не пишет `Представление`, если `presentation` отсутствует.
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts`
  - Читает отсутствие `Представление` как `presentation: undefined`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/types.ts`
  - Расширяет JSON Schema для `formChoiceListDesTimeValue`: `Представление` становится необязательным.
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`
  - Распознаёт объект `{ Значение: ... }` как `formChoiceListDesTimeValue`, если это не явный объект с `Тип`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts`
  - Добавляет фикстуру `fixedArray` из `formChoiceListDesTimeValue` без представлений.
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts`
  - Фиксирует экспорт таких элементов как простых значений.
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`
  - Фиксирует импорт простых значений как обычных `ref` внутри `fixedArray`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts`
  - Разворачивает элемент `formChoiceListDesTimeValue` без `presentation` в его `value`.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`
  - Обновляет ожидаемый YAML для form choice параметров и добавляет ERP-подобную фикстуру.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`
  - Фиксирует целевой YAML для одиночного form choice и вложенного массива.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`
  - Фиксирует импорт пустого ключа из `null` в модель без `value`.
- Create: `packages/core/metadata/commonObjects/сhoiceParameters/toJSONSchema.test.ts`
  - Проверяет, что схема принимает пустой YAML-ключ и целевой ERP YAML.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/types.ts`
  - Добавляет `Type.Null()` в JSON Schema только для YAML-границы `ChoiceParameters`.
- Modify: `docs/superpowers/plans/2026-06-16-choice-parameters-empty-values.md`
  - Этот план; отмечать шаги по мере выполнения.

## Task 1: Compact FormChoiceList YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`

- [x] **Step 1: Write the failing fixture expectation**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts`, replace only `withoutPresentationYAML`:

```ts
export const withoutPresentationYAML: MetadataFormChoiceListValueYAML = {
  Значение: "Истина",
}
```

- [x] **Step 2: Update the export test name**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts`, replace the old empty-presentation test with:

```ts
it("exports formChoiceList without presentation to YAML object without presentation field", () => {
  const result = exportFormChoiceListToYAML(mockContext, withoutPresentation)
  expect(result).toEqual(withoutPresentationYAML)
})
```

- [x] **Step 3: Add an explicit import test for missing `Представление`**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts`, add this test after the existing `withoutPresentationYAML` import test:

```ts
it("imports formChoiceList without presentation field", () => {
  const yaml: MetadataFormChoiceListValueYAML = {
    Значение: "Истина",
  }

  const result = importFormChoiceListFromYAML(mockContext, yaml)

  expect(result).toEqual(withoutPresentation)
  expect(Object.prototype.hasOwnProperty.call(result, "presentation")).toBe(false)
})
```

- [x] **Step 4: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts
```

Expected: `toYAML.test.ts` fails because actual YAML still contains `Представление: ""`.

- [x] **Step 5: Change `formChoiceList` export**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts`, replace the `presentation` and `result` block with:

```ts
  const presentation = exportI8nTextToYAML({
    context,
    rule: { type: "I8nText" },
    value: data.presentation,
  })

  const result: MetadataFormChoiceListValueYAML = {}

  if (presentation !== undefined) result.Представление = presentation
  if (valueResult !== undefined) result.Значение = valueResult

  return result
```

- [x] **Step 6: Make `formChoiceList` schema accept missing `Представление`**

In `packages/core/metadata/commonObjects/metadataValue/types.ts`, replace `MetadataFormChoiceListComplexValueJSONSchema` with:

```ts
export const MetadataFormChoiceListComplexValueJSONSchema = Type.Object({
  Представление: Type.Optional(I8nTextJSONSchema),
  Значение: Type.Optional(
    Type.Union([
      MetadataValueJSONSchema,
      MetadataExplicitDataCompositionComparisonTypeYAMLJSONSchema,
      MetadataExplicitAccountTypeYAMLJSONSchema,
    ])
  ),
})
```

- [x] **Step 7: Make generic MetadataValue import recognise `{ Значение: ... }`**

In `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`, replace:

```ts
  if (typeof data === "object" && !Array.isArray(data) && "Представление" in data) {
    const result = importFormChoiceListFromYAML(context, data as MetadataFormChoiceListValueYAML)
    assertValueType(ruleTyped?.valueType, result.type, "fromYAML")
    return result
  }
```

with:

```ts
  if (
    typeof data === "object" &&
    !Array.isArray(data) &&
    ("Представление" in data || ("Значение" in data && !("Тип" in data)))
  ) {
    const result = importFormChoiceListFromYAML(context, data as MetadataFormChoiceListValueYAML)
    assertValueType(ruleTyped?.valueType, result.type, "fromYAML")
    return result
  }
```

- [x] **Step 8: Keep backward compatibility for old YAML**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts`, add:

```ts
it("imports legacy empty presentation string as missing presentation", () => {
  const yaml: MetadataFormChoiceListValueYAML = {
    Представление: "",
    Значение: "Истина",
  }

  const result = importFormChoiceListFromYAML(mockContext, yaml)

  expect(result).toEqual(withoutPresentation)
  expect(Object.prototype.hasOwnProperty.call(result, "presentation")).toBe(false)
})
```

- [x] **Step 9: Run focused tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts metadata/commonObjects/metadataValue/fromYAML.test.ts
```

Expected: all selected tests pass.

- [x] **Step 10: Commit Task 1**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts packages/core/metadata/commonObjects/metadataValue/types.ts packages/core/metadata/commonObjects/metadataValue/fromYAML.ts docs/superpowers/plans/2026-06-16-choice-parameters-empty-values.md
git commit -m "fix: :bug: убрать пустое представление formChoiceList из YAML"
```

## Task 2: FixedArray FormChoiceList Elements

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts`

- [x] **Step 1: Add fixedArray fixture with form choice values**

In `packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts`, add these exports after existing ref fixtures:

```ts
export const formChoiceRefsFixedArray = {
  type: "fixedArray",
  value: [
    {
      type: "formChoiceListDesTimeValue",
      value: {
        type: "ref",
        value: "Enum.ТипыДоговоров.EnumValue.СПоставщиком",
      },
    },
    {
      type: "formChoiceListDesTimeValue",
      value: {
        type: "ref",
        value: "Enum.ТипыДоговоров.EnumValue.СКомитентом",
      },
    },
  ],
} satisfies MetadataFixedArrayValue

export const formChoiceRefsFixedArrayYAML: MetadataFixedArrayValueYAML = [
  "Перечисление.ТипыДоговоров.СПоставщиком",
  "Перечисление.ТипыДоговоров.СКомитентом",
]
```

- [x] **Step 2: Add failing export test**

In `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts`, import the two new fixtures and add:

```ts
it("exports formChoiceList elements without presentation as simple values", () => {
  const result = exportFixedArrayToYAML(mockContext, formChoiceRefsFixedArray)
  expect(result).toEqual(formChoiceRefsFixedArrayYAML)
})
```

- [x] **Step 3: Add import contract test for compact array**

In `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`, import `formChoiceRefsFixedArrayYAML` and add:

```ts
it("imports compact formChoiceList YAML elements as ordinary refs", () => {
  const result = importFixedArrayFromYAML(mockContext, formChoiceRefsFixedArrayYAML)

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

- [x] **Step 4: Run tests and verify export fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts
```

Expected: export test fails because items are still objects with `Значение`.

- [x] **Step 5: Add local unwrapping helper**

In `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts`, replace the file with:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataValueToYAML } from "../toYAML"
import { MetadataFixedArrayValue, MetadataFixedArrayValueYAML, MetadataTypedValue } from "../types"

const exportFixedArrayElementToYAML = (
  context: ConfigurationContext,
  value: MetadataTypedValue | undefined
): MetadataFixedArrayValueYAML[number] => {
  if (value === undefined) return undefined

  if (value.type === "formChoiceListDesTimeValue" && value.presentation === undefined) {
    return exportMetadataValueToYAML(context, undefined, value.value) as MetadataFixedArrayValueYAML[number]
  }

  return exportMetadataValueToYAML(context, undefined, value) as MetadataFixedArrayValueYAML[number]
}

export const exportFixedArrayToYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValue
): MetadataFixedArrayValueYAML => data.value.map((v) => exportFixedArrayElementToYAML(context, v)) as MetadataFixedArrayValueYAML
```

- [x] **Step 6: Run focused tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts
```

Expected: all selected tests pass.

- [x] **Step 7: Commit Task 2**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts docs/superpowers/plans/2026-06-16-choice-parameters-empty-values.md
git commit -m "fix: :bug: упростить YAML элементов formChoiceList в fixedArray"
```

## Task 3: ChoiceParameters Empty Keys And ERP Shape

**Files:**
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/сhoiceParameters/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/types.ts`

- [x] **Step 1: Update expected YAML for existing form choice fixtures**

In `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`, replace `formBooleanChoiceParametersYAML` with:

```ts
export const formBooleanChoiceParametersYAML: ChoiceParametersYAML = {
  БезПроизводныхЗначений: {
    Значение: "Истина",
  },
}
```

Then replace `formEnumChoiceParametersYAML` with:

```ts
export const formEnumChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипСчета": {
    Значение: "Перечисление.ТипыСчетов.НераспределеннаяПрибыль",
  },
}
```

- [x] **Step 2: Add ERP-like fixture**

In the same file, add after `formEnumChoiceParametersYAML`:

```ts
export const formChoiceFixedArrayChoiceParameter: ChoiceParameters = [
  {
    name: "Отбор.ТипДоговора",
    value: {
      type: "formChoiceListDesTimeValue",
      value: {
        type: "fixedArray",
        value: [
          {
            type: "formChoiceListDesTimeValue",
            value: {
              type: "ref",
              value: "Enum.ТипыДоговоров.EnumValue.СПоставщиком",
            },
          },
          {
            type: "formChoiceListDesTimeValue",
            value: {
              type: "ref",
              value: "Enum.ТипыДоговоров.EnumValue.СКомитентом",
            },
          },
        ],
      },
    },
  },
]

export const formChoiceFixedArrayChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипДоговора": {
    Значение: [
      "Перечисление.ТипыДоговоров.СПоставщиком",
      "Перечисление.ТипыДоговоров.СКомитентом",
    ],
  },
}
```

- [x] **Step 3: Add export test for ERP-like fixture**

In `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`, import `formChoiceFixedArrayChoiceParameter` and `formChoiceFixedArrayChoiceParametersYAML`, then add:

```ts
it("exports choice parameters with nested form choice fixedArray without empty presentations", () => {
  const result = exportChoiceParametersToYAML(mockContext, mockRule, formChoiceFixedArrayChoiceParameter)

  expect(result).toEqual(formChoiceFixedArrayChoiceParametersYAML)
})
```

- [x] **Step 4: Add import test for YAML parser null**

In `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`, add:

```ts
it("imports YAML null choice parameter as parameter without value", () => {
  const result = importChoiceParametersFromYAML(mockContext, mockRule, {
    ВыборСчетовГоловнойОрганизации: null,
  } as ChoiceParametersYAML)

  expect(result).toStrictEqual([
    {
      name: "ВыборСчетовГоловнойОрганизации",
    },
  ])
  expect(Object.prototype.hasOwnProperty.call(result?.[0], "value")).toBe(false)
})
```

Also add this import at the top if it is missing:

```ts
import type { ChoiceParametersYAML } from "./types"
```

- [x] **Step 5: Create JSON Schema tests**

Create `packages/core/metadata/commonObjects/сhoiceParameters/toJSONSchema.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { ChoiceParametersJSONSchema } from "./types"

const compiled = TypeCompiler.Compile(ChoiceParametersJSONSchema)

describe("ChoiceParametersJSONSchema", () => {
  it("accepts YAML parser null for an empty choice parameter key", () => {
    expect(compiled.Check({ ВыборСчетовГоловнойОрганизации: null })).toBe(true)
  })

  it("accepts compact ERP form choice parameter YAML", () => {
    expect(
      compiled.Check({
        "Отбор.ТипДоговора": {
          Значение: [
            "Перечисление.ТипыДоговоров.СПоставщиком",
            "Перечисление.ТипыДоговоров.СКомитентом",
          ],
        },
      })
    ).toBe(true)
  })

  it("keeps rejecting unrelated objects", () => {
    expect(compiled.Check({ ВыборСчетовГоловнойОрганизации: { ПроизвольноеПоле: "x" } })).toBe(false)
  })
})
```

- [x] **Step 6: Run tests and verify schema test fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/сhoiceParameters/toYAML.test.ts metadata/commonObjects/сhoiceParameters/fromYAML.test.ts metadata/commonObjects/сhoiceParameters/toJSONSchema.test.ts
```

Expected: schema test for `null` fails until `ChoiceParametersJSONSchema` includes `Type.Null()`.

- [x] **Step 7: Update ChoiceParameters JSON Schema**

In `packages/core/metadata/commonObjects/сhoiceParameters/types.ts`, replace `ChoiceParametersJSONSchema` with:

```ts
export const ChoiceParametersJSONSchema = Type.Record(
  Type.String(),
  Type.Union([MetadataValueJSONSchema, Type.Undefined(), Type.Null()])
)
```

- [x] **Step 8: Run focused tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/сhoiceParameters/toYAML.test.ts metadata/commonObjects/сhoiceParameters/fromYAML.test.ts metadata/commonObjects/сhoiceParameters/toJSONSchema.test.ts metadata/commonObjects/metadataValue/toJSONSchema.test.ts
```

Expected: all selected tests pass.

- [x] **Step 9: Commit Task 3**

Run:

```bash
git add packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts packages/core/metadata/commonObjects/сhoiceParameters/toJSONSchema.test.ts packages/core/metadata/commonObjects/сhoiceParameters/types.ts docs/superpowers/plans/2026-06-16-choice-parameters-empty-values.md
git commit -m "fix: :bug: разрешить пустые значения ChoiceParameters в YAML"
```

## Task 4: Verification And ERP Validation

**Files:**
- No source edits expected.

- [ ] **Step 1: Run common object test set**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/metadataValue/formChoiceList metadata/commonObjects/metadataValue/fixedArray metadata/commonObjects/сhoiceParameters
```

Expected: all selected tests pass.

- [ ] **Step 2: Run full project test suite**

Run from repository root:

```bash
pnpm test
```

Expected: all package test suites pass.

- [ ] **Step 3: Re-import ERP to YAML**

Run:

```bash
pnpm --filter @nakidka/cli dev -- import /home/nikita/git/round-trip/erp /home/nikita/git/temp-yaml
```

Expected: YAML is regenerated successfully.

- [ ] **Step 4: Run CLI validation**

Run:

```bash
pnpm --filter @nakidka/cli dev -- validate /home/nikita/git/temp-yaml > /tmp/nkdk-choice-parameters-validation.txt || true
```

Expected: the previous groups related to `Представление: ""` and empty `ПараметрыВыбора` keys are gone:

```text
134 — Представление: ""
56 — ВыборСчетовГоловнойОрганизации:
46 — ЕстьРасчетыСКлиентами:
39 — ПоОстаткам:
29 — ЕстьРасчетыСПоставщиками:
24 — ВыборКассГоловнойОрганизации:
```

- [ ] **Step 5: Summarise remaining validation errors**

Run:

```bash
node -e 'const fs=require("fs"); const text=fs.readFileSync("/tmp/nkdk-choice-parameters-validation.txt","utf8"); const lines=text.split(/\n/).filter(Boolean).filter((line)=>line.includes(" error: ")); const groups=new Map(); for (const line of lines) { const message=line.replace(/^[^ ]+ error: /,""); const match=line.match(/([^/:]+):$/); const key=match ? `${message} ${match[1]}` : message; groups.set(key,(groups.get(key)||0)+1); } for (const [key,count] of [...groups.entries()].sort((a,b)=>b[1]-a[1])) console.log(`${count} ${key}`);'
```

Expected: remaining groups do not include the fixed `ChoiceParameters` cases. If other groups remain, report them without changing unrelated code.

- [ ] **Step 6: Commit verification note only if files changed**

If executing the plan updated only generated external YAML under `/home/nikita/git/temp-yaml`, do not commit it in this repository. If task checkboxes in this plan were updated, commit them:

```bash
git add docs/superpowers/plans/2026-06-16-choice-parameters-empty-values.md
git commit -m "docs: :memo: отметить проверку ChoiceParameters"
```

## Self-Review

- Spec coverage:
  - `Представление: ""` не экспортируется: Task 1.
  - Старый YAML с `Представление: ""` продолжает импортироваться: Task 1 Step 8.
  - `{ Значение: ... }` импортируется как `formChoiceListDesTimeValue`: Task 1 Step 7.
  - `fixedArray` внутри `ПараметрыВыбора` экспортируется списком простых значений: Task 2 and Task 3.
  - Пустой ключ `ПараметрыВыбора` допускается схемой как `null`: Task 3.
  - `null` не попадает в модель: Task 3 Step 4.
  - XML-фикстуры не меняются: no task modifies `*.xml`.
- Placeholder scan:
  - No incomplete implementation placeholders are intentionally left.
- Type consistency:
  - `MetadataFormChoiceListValueYAML`, `ChoiceParametersYAML`, `MetadataFixedArrayValueYAML`, and existing import/export function names match current project files.
