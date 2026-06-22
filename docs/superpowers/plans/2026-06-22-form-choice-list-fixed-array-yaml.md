# ЗначениеСпискаВыбора в FixedArray YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать YAML для `FormChoiceListDesTimeValue` внутри `FixedArray` обратимым через явный `Тип: ЗначениеСпискаВыбора`.

**Architecture:** Обычные элементы `FixedArray` остаются краткими. Только элементы модели `formChoiceListDesTimeValue` экспортируются в объектную форму с `Тип: ЗначениеСпискаВыбора`, а импорт `FixedArray` распознает эту форму и вызывает существующий импорт `FormChoiceListDesTimeValue`.

**Tech Stack:** TypeScript, Vitest, существующие metadata import/export helpers, `round-trip-yaml`.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/metadataValue/types.ts`
  - Добавить YAML-тип и JSON schema для явного элемента `FixedArray`: `{ Тип: "ЗначениеСпискаВыбора"; Представление?; Значение? }`.
  - Расширить `MetadataFixedArrayValueYAML` и `MetadataFixedArrayValueYAMLInput`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts`
  - Обновить `formChoiceRefsFixedArrayYAML` на явную форму.
  - Добавить фикстуру с `Представление`, чтобы проверить, что поле не теряется.
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts`
  - Убрать сокращение `formChoiceListDesTimeValue` до внутреннего значения.
  - Добавить `Тип: ЗначениеСпискаВыбора` к объекту, возвращаемому `exportFormChoiceListToYAML`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.ts`
  - Распознавать `Тип: ЗначениеСпискаВыбора`.
  - Передавать оставшиеся поля в `importFormChoiceListFromYAML`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`
  - Обновить тест компактной формы: теперь компактная форма остается обычными ссылками, а явная форма импортируется как `formChoiceListDesTimeValue`.
  - Добавить тест с `Представление`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts`
  - Обновить ожидание для `formChoiceRefsFixedArray`.
  - Добавить тест с `Представление`.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`
  - Обновить вложенный сценарий `FormChoiceListDesTimeValue -> FixedArray -> FormChoiceListDesTimeValue[]`.
- Test: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`

## Task 1: Add Explicit FixedArray YAML Type

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/types.ts`

- [ ] **Step 1: Extend YAML types**

In `packages/core/metadata/commonObjects/metadataValue/types.ts`, replace the current fixed array YAML declarations:

```ts
export const MetadataFixedArrayValueJSONSchema = Type.Array(
  Type.Union([MetadataSingleValueJSONSchema, Type.Undefined(), Type.Null()])
)
export type MetadataFixedArrayValueYAML = Array<MetadataSingleValueYAML | null | undefined>
export type MetadataFixedArrayValueYAMLInput = MetadataFixedArrayValueYAML
```

with:

```ts
export const MetadataExplicitFormChoiceListValueYAMLJSONSchema = Type.Object(
  {
    Тип: Type.Literal("ЗначениеСпискаВыбора"),
    Представление: Type.Optional(I8nTextJSONSchema),
    Значение: Type.Optional(Type.Any()),
  },
  { additionalProperties: false }
)

export type MetadataExplicitFormChoiceListValueYAML = {
  Тип: "ЗначениеСпискаВыбора"
  Представление?: I8nTextYAML
  Значение?: MetadataFormChoiceListValueValueYAML
}

export const MetadataFixedArrayValueJSONSchema = Type.Array(
  Type.Union([
    MetadataSingleValueJSONSchema,
    MetadataExplicitFormChoiceListValueYAMLJSONSchema,
    Type.Undefined(),
    Type.Null(),
  ])
)
export type MetadataFixedArrayValueYAML = Array<
  MetadataSingleValueYAML | MetadataExplicitFormChoiceListValueYAML | null | undefined
>
export type MetadataFixedArrayValueYAMLInput = MetadataFixedArrayValueYAML
```

Keep `MetadataExplicitFormChoiceListValueYAML` before `MetadataFixedArrayValueYAML`.

- [ ] **Step 2: Run typecheck through focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts
```

Expected: tests compile. If TypeScript reports `MetadataFormChoiceListValueValueYAML` is used before declaration, move only the new `MetadataExplicitFormChoiceListValueYAML` type alias below `MetadataFormChoiceListValueValueYAML` and keep the JSON schema above the fixed array schema.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataValue/types.ts
git commit -m "feat: :sparkles: добавить YAML-тип значения списка выбора"
```

## Task 2: Update FixedArray Fixtures And Failing Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts`

- [ ] **Step 1: Update `formChoiceRefsFixedArrayYAML` fixture**

In `packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts`, replace:

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
    Тип: "ЗначениеСпискаВыбора",
    Значение: "Перечисление.ТипыДоговоров.СПоставщиком",
  },
  {
    Тип: "ЗначениеСпискаВыбора",
    Значение: "Перечисление.ТипыДоговоров.СКомитентом",
  },
]
```

- [ ] **Step 2: Add fixture with presentation**

Append to the same fixture file:

```ts
export const formChoiceWithPresentationFixedArray = {
  type: "fixedArray",
  value: [
    {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: "С поставщиком" } },
      value: {
        type: "ref",
        value: "Enum.ТипыДоговоров.EnumValue.СПоставщиком",
      },
    },
  ],
} satisfies MetadataFixedArrayValue

export const formChoiceWithPresentationFixedArrayYAML: MetadataFixedArrayValueYAML = [
  {
    Тип: "ЗначениеСпискаВыбора",
    Представление: "С поставщиком",
    Значение: "Перечисление.ТипыДоговоров.СПоставщиком",
  },
]
```

- [ ] **Step 3: Update fromYAML imports**

In `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`, add the two new fixtures to the import list:

```ts
  formChoiceWithPresentationFixedArray,
  formChoiceWithPresentationFixedArrayYAML,
```

- [ ] **Step 4: Replace old compact-form expectation**

Replace the test named `"imports compact formChoiceList YAML elements as ordinary refs"` with two tests:

```ts
  it("imports explicit formChoiceList YAML elements", () => {
    const result = importFixedArrayFromYAML(mockContext, formChoiceRefsFixedArrayYAML)

    expect(result).toEqual(formChoiceRefsFixedArray)
  })

  it("imports explicit formChoiceList YAML elements with presentation", () => {
    const result = importFixedArrayFromYAML(mockContext, formChoiceWithPresentationFixedArrayYAML)

    expect(result).toEqual(formChoiceWithPresentationFixedArray)
  })
```

- [ ] **Step 5: Keep compatibility test for compact refs**

Add this separate test to prove ordinary compact array elements remain ordinary refs:

```ts
  it("imports compact refs as ordinary refs", () => {
    const yaml: MetadataFixedArrayValueYAMLInput = [
      "Перечисление.ТипыДоговоров.СПоставщиком",
      "Перечисление.ТипыДоговоров.СКомитентом",
    ]

    const result = importFixedArrayFromYAML(mockContext, yaml)

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

- [ ] **Step 6: Update toYAML imports**

In `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts`, add the two new fixtures to the import list:

```ts
  formChoiceWithPresentationFixedArray,
  formChoiceWithPresentationFixedArrayYAML,
```

- [ ] **Step 7: Rename and extend toYAML tests**

Rename:

```ts
  it("exports formChoiceList elements without presentation as simple values", () => {
```

to:

```ts
  it("exports formChoiceList elements as explicit values", () => {
```

Then append:

```ts
  it("exports formChoiceList elements with presentation as explicit values", () => {
    const result = exportFixedArrayToYAML(mockContext, formChoiceWithPresentationFixedArray)
    expect(result).toEqual(formChoiceWithPresentationFixedArrayYAML)
  })
```

- [ ] **Step 8: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts
```

Expected: `fromYAML` fails because `Тип: ЗначениеСпискаВыбора` is not imported as `formChoiceListDesTimeValue`; `toYAML` fails because export still omits `Тип`.

Do not commit this task yet; keep tests red for Task 3.

## Task 3: Implement FixedArray Import And Export

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.ts`

- [ ] **Step 1: Implement explicit export**

Replace `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts` with:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataValueToYAML } from "../toYAML"
import { MetadataFixedArrayValue, MetadataFixedArrayValueYAML, MetadataTypedValue } from "../types"
import { exportFormChoiceListToYAML } from "../formChoiceList/toYAML"

const exportFixedArrayElementToYAML = (
  context: ConfigurationContext,
  value: MetadataTypedValue | undefined
): MetadataFixedArrayValueYAML[number] => {
  if (value === undefined) return undefined

  if (value.type === "formChoiceListDesTimeValue") {
    return {
      Тип: "ЗначениеСпискаВыбора",
      ...exportFormChoiceListToYAML(context, value),
    }
  }

  return exportMetadataValueToYAML(context, undefined, value) as MetadataFixedArrayValueYAML[number]
}

export const exportFixedArrayToYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValue
): MetadataFixedArrayValueYAML =>
  data.value.map((v) => exportFixedArrayElementToYAML(context, v)) as MetadataFixedArrayValueYAML
```

- [ ] **Step 2: Implement explicit import**

Replace `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.ts` with:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { asExplicitYAMLStringIfMarked } from "~/yaml/explicitString"
import { importMetadataValueFromYAML } from "../fromYAML"
import {
  MetadataExplicitFormChoiceListValueYAML,
  MetadataFixedArrayValue,
  MetadataFixedArrayValueYAMLInput,
  MetadataFormChoiceListValueYAML,
} from "../types"
import { importFormChoiceListFromYAML } from "../formChoiceList/fromYAML"

const isExplicitFormChoiceListValueYAML = (
  value: Exclude<MetadataFixedArrayValueYAMLInput[number], null | undefined>
): value is MetadataExplicitFormChoiceListValueYAML =>
  typeof value === "object" &&
  !Array.isArray(value) &&
  value !== null &&
  (value as Record<string, unknown>).Тип === "ЗначениеСпискаВыбора"

export const importFixedArrayFromYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValueYAMLInput
): MetadataFixedArrayValue => ({
  type: "fixedArray",
  value: data.map((v, index) => {
    if (v === undefined || v === null) return undefined

    const value = asExplicitYAMLStringIfMarked(
      data,
      index,
      v
    ) as Exclude<MetadataFixedArrayValueYAMLInput[number], null | undefined>

    if (isExplicitFormChoiceListValueYAML(value)) {
      const { Тип: _type, ...formChoiceListValue } = value
      return importFormChoiceListFromYAML(context, formChoiceListValue as MetadataFormChoiceListValueYAML)
    }

    return importMetadataValueFromYAML(context, undefined, value)!
  }),
})
```

- [ ] **Step 3: Run focused fixedArray tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts
```

Expected: all fixedArray tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataValue/types.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts
git commit -m "feat: :sparkles: явно сохранять значения списка выбора"
```

## Task 4: Update ChoiceParameters Nested Fixture

**Files:**
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`

- [ ] **Step 1: Update nested YAML fixture**

In `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`, replace the current `formChoiceFixedArrayChoiceParametersYAML` value:

```ts
export const formChoiceFixedArrayChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипДоговора": {
    Значение: [
      "Перечисление.ТипыДоговоров.СПоставщиком",
      "Перечисление.ТипыДоговоров.СКомитентом",
    ],
  },
}
```

with:

```ts
export const formChoiceFixedArrayChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипДоговора": {
    Значение: [
      {
        Тип: "ЗначениеСпискаВыбора",
        Значение: "Перечисление.ТипыДоговоров.СПоставщиком",
      },
      {
        Тип: "ЗначениеСпискаВыбора",
        Значение: "Перечисление.ТипыДоговоров.СКомитентом",
      },
    ],
  },
}
```

- [ ] **Step 2: Run choiceParameters tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts
```

Expected: tests pass and the nested `FormChoiceListDesTimeValue -> FixedArray -> FormChoiceListDesTimeValue[]` case remains covered.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts
git commit -m "test: :white_check_mark: обновить YAML списка выбора"
```

## Task 5: Verify Full Behavior

**Files:**
- No code changes expected.

- [ ] **Step 1: Run focused metadataValue tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/toYAML.test.ts packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts
```

Expected: all listed tests pass.

- [ ] **Step 2: Run full project tests**

Run from the worktree root:

```bash
pnpm test
```

Expected: all packages pass.

- [ ] **Step 3: Run diagnostic round-trip**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/acc ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5 --start-index 1
```

Expected:

```text
=== DIFF_COUNT ===
```

may still be non-zero, but the first triage entries must no longer show direct replacement of:

```xml
<v8:Value xsi:type="FormChoiceListDesTimeValue">
```

with:

```xml
<v8:Value xsi:type="xr:DesignTimeRef">
```

or:

```xml
<v8:Value xsi:type="xs:string">
```

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
```

Expected: clean worktree after commits. The external XML repo `/Users/nikita/git/round-trip` may remain dirty with diagnostic diff; do not restore it unless the user asks.

- [ ] **Step 5: Report results**

Report:

- Commit hashes created during implementation.
- Focused test result.
- `pnpm test` result.
- `round-trip-yaml` diff count and whether the `FormChoiceListDesTimeValue`/`FixedArray` class disappeared.
