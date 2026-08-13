# InputByString Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Не выводить вычисляемый упорядоченный `ВводПоСтроке`, восстанавливать его при YAML → XML и проверять платформенные границы длин кода, номера и наименования.

**Architecture:** Новый предметный тип `InputByStringFields` переиспользует преобразования `MetadataFields`, а его декларация хранит стандартные поля, управляющие ими длины и неявные длины. После XML → YAML зарегистрированный finalizer видит весь YAML объекта и удаляет только точное вычисляемое значение; при YAML → XML функция `implicitValueYAML` строит отсутствующий список. Безусловные границы задаются в `NumberPropertyRule` и JSON Schema, а зависимые ограничения и запрет явного вычисляемого списка проверяются объектными validation-contributions, собранными из самих правил объектов.

**Tech Stack:** TypeScript, TypeBox JSON Schema, Vitest, pnpm, metadata rule-kit, e2e XML/YAML round-trip.

## Global Constraints

- Работать только в `/Users/nikita/git/nkdk/.worktrees/input-by-string-defaults` на ветке `codex/input-by-string-defaults`.
- Не изменять существующие XML-фикстуры в `e2e/fixtures/xml`: это пользовательский источник истины.
- Не добавлять `!xml`.
- Не добавлять частные условия в `ruleRuntime`, `diagnostics`, `validation`, `projectDefinition`, `project`, `projectState` или `resourceTopology/core`.
- Не расширять `BasePropertyRule`: границы принадлежат только `NumberPropertyRule`, параметры вычисляемого списка — только `InputByStringFieldsWidePropertyRule`.
- Порядок `ВводПоСтроке` значим; список скрывается только при полном совпадении по значениям и порядку.
- Таблица внешнего источника данных остаётся на `FieldsList`/`MetadataFields` без вычисляемого значения.
- Правила должны одинаково работать в `cf` и `cfe`.
- После каждого законченного слоя запускать `pnpm duplicates -- --base 6c524c8d0`.
- Перед завершением запустить `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules`, `pnpm test:architecture` и повторно `pnpm duplicates -- --base 6c524c8d0`.

---

### Task 1: Безусловные и зависимые границы числовых свойств

**Files:**
- Modify: `packages/rules/metadata/commonObjects/number/types.ts`
- Modify: `packages/rules/metadata/commonObjects/number/toJSONSchema.ts`
- Create: `packages/rules/metadata/commonObjects/number/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/jsonSchemaRefs.test.ts`

**Interfaces:**
- Produces: `NumberPropertyRule.minimum?: number` и `NumberPropertyRule.maximum?: number` для безусловной JSON Schema.
- Produces: `NumberPropertyRule.maximumWhen?: { propertyKey: string; equals: string; maximum: number }` для объектной проверки в Task 3.
- Produces: стабильный ключ validation schema, учитывающий `minimum`, `maximum` и исключаемое `implicitValueYAML`, но сохраняющий прежние ключи для правил без границ.
- Consumes: существующие `numberRule`, `ExportToJSONSchemaFn`, `validationSchemaRef`.

- [ ] **Step 1: Написать падающие тесты JSON Schema чисел**

Создать `packages/rules/metadata/commonObjects/number/toJSONSchema.test.ts` с проверками границ и ключа ref:

```ts
import { describe, expect, it } from "vitest"
import { exportNumberToJSONSchema, numberValidationSchemaRef } from "./toJSONSchema"
import type { NumberPropertyRule } from "./types"

describe("number JSON Schema", () => {
  it("exports unconditional minimum and maximum", () => {
    const rule = { type: "number", minimum: 1, maximum: 250 } satisfies NumberPropertyRule
    expect(exportNumberToJSONSchema({ rule } as never)).toEqual({
      type: "number",
      minimum: 1,
      maximum: 250,
    })
  })

  it("uses bounds in the reusable validation schema key", () => {
    const rule = {
      type: "number",
      minimum: 0,
      maximum: 50,
      implicitValueYAML: 9,
    } satisfies NumberPropertyRule
    expect(numberValidationSchemaRef({ rule } as never)).toBe("number/0..50/without-9")
  })
})
```

В `packages/rules/metadata/ruleRuntime/jsonSchemaRefs.test.ts` добавить случай с двумя `number`-правилами, имеющими разные максимумы, и проверить, что они создают разные `$ref` и разные зарегистрированные схемы.

- [ ] **Step 2: Запустить тесты и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/commonObjects/number/toJSONSchema.test.ts metadata/ruleRuntime/jsonSchemaRefs.test.ts
```

Expected: FAIL, потому что `minimum`, `maximum`, `maximumWhen` и `numberValidationSchemaRef` ещё не объявлены, а экспорт возвращает только `{ type: "number" }`.

- [ ] **Step 3: Расширить только NumberPropertyRule**

В `packages/rules/metadata/commonObjects/number/types.ts` добавить:

```ts
export interface NumberMaximumWhen {
  /** Модельный ключ соседнего свойства-переключателя. */
  propertyKey: string
  /** Внутреннее значение перечисления, например Number. */
  equals: string
  maximum: number
}

export interface NumberPropertyRule extends BasePropertyRule {
  type: "number"
  minimum?: number
  maximum?: number
  maximumWhen?: NumberMaximumWhen
  typedXML?: true | "xs:decimal" | "xs:string"
}
```

Не добавлять эти поля в `BasePropertyRule` и не менять параметры других построителей.

- [ ] **Step 4: Экспортировать границы и уникальный validation ref**

В `packages/rules/metadata/commonObjects/number/toJSONSchema.ts` заменить статический возврат на:

```ts
import { Type } from "typebox"

export const exportNumberToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema =>
  Type.Number({
    ...(typeof rule.minimum === "number" ? { minimum: rule.minimum } : {}),
    ...(typeof rule.maximum === "number" ? { maximum: rule.maximum } : {}),
  })

export const numberValidationSchemaRef: ValidationSchemaRefFn = ({ rule }) => {
  const implicit = typeof rule.implicitValueYAML === "number"
    ? `without-${rule.implicitValueYAML}`
    : "base"
  if (typeof rule.minimum !== "number" && typeof rule.maximum !== "number") {
    return `number/${implicit}`
  }
  const range = `${typeof rule.minimum === "number" ? rule.minimum : "min"}..${
    typeof rule.maximum === "number" ? rule.maximum : "max"
  }`
  return `number/${range}/${implicit}`
}
```

Зарегистрировать `numberValidationSchemaRef` вместо текущей функции, чтобы разные границы не разделяли ошибочно одну схему.

- [ ] **Step 5: Запустить целевые тесты**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/commonObjects/number/toJSONSchema.test.ts metadata/ruleRuntime/jsonSchemaRefs.test.ts
```

Expected: PASS; схема содержит `minimum`/`maximum`, а ref различает диапазоны и `implicitValueYAML`.

- [ ] **Step 6: Проверить типы и дубли слоя**

Run:

```bash
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 6c524c8d0
```

Expected: обе команды завершаются с кодом `0`.

- [ ] **Step 7: Закоммитить слой**

```bash
git add packages/rules/metadata/commonObjects/number/types.ts packages/rules/metadata/commonObjects/number/toJSONSchema.ts packages/rules/metadata/commonObjects/number/toJSONSchema.test.ts packages/rules/metadata/ruleRuntime/jsonSchemaRefs.test.ts
git commit -m "feat: :sparkles: добавить границы числовых свойств"
```

---

### Task 2: Тип вычисляемого InputByStringFields

**Files:**
- Create: `packages/rules/metadata/commonObjects/inputByStringFields/types.ts`
- Create: `packages/rules/metadata/commonObjects/inputByStringFields/defaultValue.ts`
- Create: `packages/rules/metadata/commonObjects/inputByStringFields/propertyRules.ts`
- Create: `packages/rules/metadata/commonObjects/inputByStringFields/defaultValue.test.ts`
- Create: `packages/rules/metadata/commonObjects/inputByStringFields/propertyRules.test.ts`
- Modify: `packages/rules/metadata/composition/staticPropertyRules.ts`

**Interfaces:**
- Produces: `InputByStringStandardField = { yaml: MetadataFieldYAML; length: { propertyKey: string; yaml: string; implicitValue: number } }`.
- Produces: `inputByStringFieldsRule(params)`, всегда устанавливающий `type: "InputByStringFields"`, `evaluateWhenYAMLMissing: true` и вычисляемый `implicitValueYAML`.
- Produces: `inputByStringDefaultYAML(rule, yaml): MetadataFieldsYAML`, `effectiveNumberPropertyValue(itemRule, yaml, propertyKey): number` и `orderedEqual(left, right): boolean` для finalizer/validator Task 3.
- Produces: операции `InputByStringFields` через существующие функции `MetadataFields` для XML, YAML и JSON Schema.
- Consumes: `metadataFields` converters и metadata-target владельца `this`.

- [ ] **Step 1: Написать падающие тесты вычисления**

В `defaultValue.test.ts` описать все классы поведения одним `it.each`:

```ts
it.each([
  [{}, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"]],
  [{ ДлинаКода: 0 }, ["СтандартныйРеквизит.Наименование"]],
  [{ ДлинаНаименования: 0 }, ["СтандартныйРеквизит.Код"]],
  [{ ДлинаКода: 0, ДлинаНаименования: 0 }, []],
])("computes ordered standard fields from effective lengths", (yaml, expected) => {
  expect(inputByStringDefaultYAML(catalogRule, yaml)).toEqual(expected)
})

it("treats order as part of equality", () => {
  expect(orderedEqual(["Наименование", "Код"], ["Код", "Наименование"])).toBe(false)
})
```

`catalogRule` должен иметь `standardFields` в порядке Наименование, Код и для каждой длины хранить реальные модельный и YAML-ключи (`descriptionLength`/`ДлинаНаименования`, `codeLength`/`ДлинаКода`) вместе с неявным значением.

- [ ] **Step 2: Написать падающий тест делегирования преобразований**

В `propertyRules.test.ts` создать правило:

```ts
const rule = inputByStringFieldsRule({
  yaml: "ВводПоСтроке",
  xml: "InputByString",
  xmlParents: ["Properties"],
  metadataTarget: {
    kind: "member",
    owner: "this",
    memberKinds: ["Attribute", "StandardAttribute"],
    filters: [{ kind: "inputByStringField" }],
  },
  standardFields: [
    {
      yaml: "СтандартныйРеквизит.Номер",
      length: { propertyKey: "numberLength", yaml: "ДлинаНомера", implicitValue: 9 },
    },
  ],
})
```

Проверить через зарегистрированные type-rules:

- XML `{ "xr:Field": "Document.Заказ.StandardAttribute.Number" }` импортируется как массив модели;
- YAML `["СтандартныйРеквизит.Номер"]` импортируется в полный внутренний путь владельца;
- модель экспортируется обратно в сокращённый YAML и исходный XML;
- JSON Schema остаётся массивом metadata-полей с фильтром `inputByStringField`;
- отсутствующий YAML при `ДлинаНомера: 0` вычисляется как `[]`, при отсутствии длины — как `["СтандартныйРеквизит.Номер"]`.

- [ ] **Step 3: Запустить тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/commonObjects/inputByStringFields
```

Expected: FAIL, потому что каталог и тип правила ещё не существуют.

- [ ] **Step 4: Реализовать декларативный тип и вычисление**

В `types.ts` определить отдельный широкий тип, не меняя общие типы правил:

```ts
export interface InputByStringStandardField {
  yaml: MetadataFieldYAML
  length: {
    propertyKey: string
    yaml: string
    implicitValue: number
  }
}

export interface InputByStringFieldsWidePropertyRule extends MetadataFieldsWidePropertyRule {
  type: "InputByStringFields"
  standardFields: readonly InputByStringStandardField[]
}
```

Построитель должен вычислять значение по полному корневому YAML:

```ts
export function inputByStringFieldsRule(params: InputByStringFieldsRuleParams) {
  const rule = {
    ...params,
    type: "InputByStringFields" as const,
    evaluateWhenYAMLMissing: true as const,
  }
  return {
    ...rule,
    implicitValueYAML: ({ yaml }: { yaml?: unknown }) => inputByStringDefaultYAML(rule, yaml),
  }
}
```

`inputByStringDefaultYAML` обязан брать явное число из `standardField.length.yaml`, а при отсутствии — `standardField.length.implicitValue`; поле включается только при значении `> 0`. Модельный `propertyKey` нужен Task 3 для проверки согласованности декларации с реальным `numberRule` и не используется нейтральным runtime.

- [ ] **Step 5: Зарегистрировать делегирующие операции свойства**

В `propertyRules.ts` экспортировать `metadataPropertyRule000` … `metadataPropertyRule004`:

```ts
definePropertyTypeRule("InputByStringFields", "importFromXML", importMetadataFieldsFromXML)
definePropertyTypeRule("InputByStringFields", "exportToXML", exportMetadataFieldsToXML)
definePropertyTypeRule("InputByStringFields", "importFromYAML", ({ context, rule, value, owner }) =>
  importMetadataFieldsFromYAML(context, rule, value, owner))
definePropertyTypeRule("InputByStringFields", "exportToYAML", ({ context, rule, value, owner }) =>
  exportMetadataFieldsToYAML(context, rule, value, owner))
definePropertyTypeRule("InputByStringFields", "exportToJSONSchema", exportMetadataFieldsToJSONSchema)
```

Добавить новые contributions в `composition/staticPropertyRules.ts` и массив `staticPropertyTypes`; не менять runtime-регистратор.

- [ ] **Step 6: Запустить тесты типа и общих MetadataFields**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/commonObjects/inputByStringFields metadata/commonObjects/metadataField
```

Expected: PASS; существующий `MetadataFields` не изменил поведение, новый тип делегирует формат и вычисляет отсутствие ключа.

- [ ] **Step 7: Проверить типы и дубли слоя**

Run:

```bash
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 6c524c8d0
```

Expected: обе команды завершаются с кодом `0`.

- [ ] **Step 8: Закоммитить слой**

```bash
git add packages/rules/metadata/commonObjects/inputByStringFields packages/rules/metadata/composition/staticPropertyRules.ts
git commit -m "feat: :sparkles: добавить вычисляемый ВводПоСтроке"
```

---

### Task 3: Свёртка импортированного YAML и объектная проверка

**Files:**
- Create: `packages/rules/metadata/appliedObjects/inputByStringRules.ts`
- Create: `packages/rules/metadata/appliedObjects/inputByStringRules.test.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`

**Interfaces:**
- Produces: `appliedObjectInputByStringRules: MetadataRulesDefinition` с finalizer и одним `localYamlValue` validator для каждого участвующего `itemType`.
- Consumes: восемь правил с `InputByStringFields` и девятое правило `MetadataDocumentNumeratorRules` с зависимым максимумом номера.
- Consumes: `inputByStringDefaultYAML`, `orderedEqual`, `NumberPropertyRule.maximumWhen`.

- [ ] **Step 1: Написать падающие тесты finalizer**

В `inputByStringRules.test.ts` создать минимальный item rule с длинами и `InputByStringFields`, затем получить contribution через экспортируемую фабрику `createInputByStringFinalizer(itemRule)`.

Проверить:

```ts
it.each([
  [
    { ВводПоСтроке: ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"] },
    {},
  ],
  [
    { ДлинаКода: 0, ВводПоСтроке: ["СтандартныйРеквизит.Наименование"] },
    { ДлинаКода: 0 },
  ],
  [
    { ДлинаКода: 0, ДлинаНаименования: 0, ВводПоСтроке: [] },
    { ДлинаКода: 0, ДлинаНаименования: 0 },
  ],
])("removes only the computed ordered value", (yaml, expected) => {
  finalizer.finalize(finalizerParams(yaml))
  expect(yaml).toEqual(expected)
})
```

Отдельно проверить, что `[Код, Наименование]`, неполный `[Наименование]` при обеих ненулевых длинах и `[Наименование, Код, Реквизит.Артикул]` не удаляются.

- [ ] **Step 2: Написать падающие тесты объектной проверки**

Через `createAppliedObjectValidator(itemRule)` проверить диагностические договоры:

- явный точный вычисляемый список — ошибка на `ВводПоСтроке`;
- обратный порядок — нет этой ошибки;
- `СтандартныйРеквизит.Код` при `ДлинаКода: 0` — ошибка на элементе списка;
- `СтандартныйРеквизит.Наименование` при `ДлинаНаименования: 0` — ошибка;
- `СтандартныйРеквизит.Номер` при `ДлинаНомера: 0` — ошибка;
- дополнительный пригодный реквизит при нулевых стандартных длинах не даёт локальной ошибки;
- `ТипНомера: Число, ДлинаНомера: 38` разрешено, `39` запрещено;
- `ТипНомера: Строка, ДлинаНомера: 50` разрешено;
- аналогичные `ТипКода: Число` случаи используют `maximumWhen` и не содержат частного switch по виду объекта.

Ожидаемые сообщения зафиксировать полностью, например:

```ts
expect(messages).toContain("ВводПоСтроке совпадает с вычисляемым значением и не должен задаваться явно")
expect(messages).toContain("СтандартныйРеквизит.Номер недоступен при ДлинаНомера: 0")
expect(messages).toContain("ДлинаНомера не должна превышать 38 при ТипНомера: Число")
```

- [ ] **Step 3: Запустить тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/appliedObjects/inputByStringRules.test.ts
```

Expected: FAIL, потому что finalizer, validator и rule-definition ещё не созданы.

- [ ] **Step 4: Реализовать finalizer без изменений нейтрального runtime**

`createInputByStringFinalizer(itemRule)` должен:

1. найти ровно одно свойство типа `InputByStringFields`;
2. вернуть `requiresFinalization: true`, только если в YAML присутствует его YAML-ключ;
3. вычислить список по итоговым длинам YAML;
4. удалить ключ только при `orderedEqual(actual, computed)`.

Не удалять обратный порядок, неполный список и список с дополнительным полем.

- [ ] **Step 5: Реализовать единый объектный validator из деклараций правил**

`createAppliedObjectValidator(itemRule)` должен обходить свойства правила:

- для `InputByStringFields` получить явный массив из корневого YAML, сравнить с вычисляемым и проверить каждое стандартное поле с эффективной длиной `0`;
- для каждого `number` с `maximumWhen` получить YAML-ключ соседнего свойства по `propertyKey`, применить его `implicitValueYAML` при отсутствии и проверить зависимый максимум;
- создавать диагностики через `diagnosticAtYamlPath`, используя `params.parsed` и точный путь до свойства/элемента.

Проверка пригодности произвольных реквизитов остаётся существующему `metadataTarget.filters: [{ kind: "inputByStringField" }]`.

- [ ] **Step 6: Собрать contributions для реальных объектов**

После Task 4 итоговый список обязан быть таким:

```ts
const validatedRules = [
  MetadataCatalogRules,
  MetadataDocumentRules,
  MetadataDocumentNumeratorRules,
  MetadataExchangePlanRules,
  MetadataChartOfCharacteristicTypesRules,
  MetadataChartOfAccountsRules,
  MetadataChartOfCalculationTypesRules,
  MetadataBusinessProcessRules,
  MetadataTaskRules,
] as const
```

Для восьми правил с `InputByStringFields` добавить `importedYamlFinalizer`; для всех правил, содержащих `InputByStringFields` или `number.maximumWhen`, добавить `localYamlValue` contribution с `propertyType: itemRule.itemType`.

Подключить `appliedObjectInputByStringRules` одним слоем в `composition/metadataRules.ts` после `staticPropertyRules` и до построения runtime.

- [ ] **Step 7: Запустить целевые и регрессионные тесты валидации**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/appliedObjects/inputByStringRules.test.ts metadata/validation/validationRegistrySet.test.ts metadata/validation/yamlFactExtractor.test.ts
```

Expected: PASS; contributions работают через существующие реестры, нейтральная валидация не содержит названий прикладных объектов.

- [ ] **Step 8: Проверить архитектуру и дубли слоя**

Run:

```bash
pnpm test:architecture
pnpm duplicates -- --base 6c524c8d0
```

Expected: обе команды завершаются с кодом `0`; направление `appliedObjects → commonObjects/validation API` допустимо.

- [ ] **Step 9: Закоммитить слой**

```bash
git add packages/rules/metadata/appliedObjects/inputByStringRules.ts packages/rules/metadata/appliedObjects/inputByStringRules.test.ts packages/rules/metadata/composition/metadataRules.ts
git commit -m "feat: :white_check_mark: проверять вычисляемый ВводПоСтроке"
```

---

### Task 4: Декларации восьми объектов и границы девяти объектов

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/metadataCatalog/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataDocument/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataDocumentNumerator/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataExchangePlan/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataChartOfAccounts/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataBusinessProcess/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataTask/rules.ts`
- Create: `packages/rules/metadata/appliedObjects/inputByStringDeclarations.test.ts`

**Interfaces:**
- Consumes: `inputByStringFieldsRule`, `NumberPropertyRule.minimum/maximum/maximumWhen`.
- Produces: единственный источник объектных диапазонов и вычисляемых списков для schema, XML/YAML и validate.

- [ ] **Step 1: Написать таблицу падающих контрактных тестов деклараций**

В `inputByStringDeclarations.test.ts` задать таблицу точных границ:

```ts
const lengthCases = [
  [MetadataExchangePlanRules, "codeLength", 1, 50, undefined],
  [MetadataExchangePlanRules, "descriptionLength", 1, 250, undefined],
  [MetadataCatalogRules, "codeLength", 0, 50, ["codeType", "Number", 38]],
  [MetadataCatalogRules, "descriptionLength", 0, 150, undefined],
  [MetadataDocumentRules, "numberLength", 0, 50, ["numberType", "Number", 38]],
  [MetadataDocumentNumeratorRules, "numberLength", 0, 50, ["numberType", "Number", 38]],
  [MetadataChartOfCharacteristicTypesRules, "codeLength", 0, 50, undefined],
  [MetadataChartOfCharacteristicTypesRules, "descriptionLength", 0, 150, undefined],
  [MetadataChartOfAccountsRules, "codeLength", 0, 628, undefined],
  [MetadataChartOfAccountsRules, "descriptionLength", 0, 628, undefined],
  [MetadataChartOfCalculationTypesRules, "codeLength", 0, 40, ["codeType", "Number", 38]],
  [MetadataChartOfCalculationTypesRules, "descriptionLength", 0, 100, undefined],
  [MetadataBusinessProcessRules, "numberLength", 0, 50, ["numberType", "Number", 38]],
  [MetadataTaskRules, "numberLength", 0, 50, ["numberType", "Number", 38]],
  [MetadataTaskRules, "descriptionLength", 0, 150, undefined],
] as const
```

Для каждого проверить `minimum`, `maximum`, `maximumWhen` и наличие в `description` фразы `При значении Число максимальная длина — 38.` там, где есть переключатель.

Отдельной таблицей проверить порядок:

```ts
const inputCases = [
  [MetadataCatalogRules, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"]],
  [MetadataDocumentRules, ["СтандартныйРеквизит.Номер"]],
  [MetadataExchangePlanRules, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"]],
  [MetadataChartOfCharacteristicTypesRules, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"]],
  [MetadataChartOfAccountsRules, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"]],
  [MetadataChartOfCalculationTypesRules, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"]],
  [MetadataBusinessProcessRules, ["СтандартныйРеквизит.Номер"]],
  [MetadataTaskRules, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Номер"]],
] as const
```

Также проверить, что правило таблицы внешнего источника данных не имеет тип `InputByStringFields`.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/appliedObjects/inputByStringDeclarations.test.ts
```

Expected: FAIL: реальные rules.ts ещё используют `metadataFieldsRule` и не содержат границ.

- [ ] **Step 3: Заменить восемь деклараций ВводПоСтроке**

Во всех восьми `rules.ts` заменить только построитель `metadataFieldsRule` на `inputByStringFieldsRule`, сохранив `yaml`, `metadataTarget`, `xmlParents` и `defaultValueXMLRaw`.

Для каждого стандартного поля указать реальные модельный/YAML-ключи длины и текущее неявное значение. Контрактный тест обязан проверить, что `itemRule.properties[length.propertyKey].yaml === length.yaml` и `implicitValueYAML === length.implicitValue`, чтобы декларации не разошлись:

```ts
standardFields: [
  {
    yaml: "СтандартныйРеквизит.Наименование",
    length: { propertyKey: "descriptionLength", yaml: "ДлинаНаименования", implicitValue: 25 },
  },
  {
    yaml: "СтандартныйРеквизит.Код",
    length: { propertyKey: "codeLength", yaml: "ДлинаКода", implicitValue: 9 },
  },
]
```

Для Документа и БизнесПроцесса использовать только Номер; для Задачи — Наименование, затем Номер. Для ПланаОбмена использовать существующие неявные длины его `codeLength` и `descriptionLength`, несмотря на минимум `1`.

Описание, создаваемое построителем, должно перечислять именно порядок текущего объекта и сообщать: нулевая длина исключает стандартное поле, порядок значим, полный вычисляемый список явно задавать нельзя.

- [ ] **Step 4: Установить точные безусловные границы**

Перенести значения таблицы `lengthCases` в соответствующие `numberRule({ minimum, maximum })`. Никаких иных числовых свойств в этих объектах не ограничивать.

Для шести переключателей добавить:

```ts
maximumWhen: { propertyKey: "numberType", equals: "Number", maximum: 38 },
description: "При значении Число максимальная длина — 38.",
```

или `propertyKey: "codeType"` для Справочника и ПланаВидовРасчета. НумераторДокументов обязательно получает минимум `0` и для строки, и для числа.

- [ ] **Step 5: Запустить контрактные тесты и схему**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/appliedObjects/inputByStringDeclarations.test.ts metadata/commonObjects/number/toJSONSchema.test.ts metadata/commonObjects/metadataField/toJSONSchema.test.ts
```

Expected: PASS; все точные диапазоны и восемь порядков заданы декларативно.

- [ ] **Step 6: Проверить типы и дубли слоя**

Run:

```bash
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 6c524c8d0
```

Expected: обе команды завершаются с кодом `0`.

- [ ] **Step 7: Закоммитить слой**

```bash
git add packages/rules/metadata/appliedObjects/metadataCatalog/rules.ts packages/rules/metadata/appliedObjects/metadataDocument/rules.ts packages/rules/metadata/appliedObjects/metadataDocumentNumerator/rules.ts packages/rules/metadata/appliedObjects/metadataExchangePlan/rules.ts packages/rules/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts packages/rules/metadata/appliedObjects/metadataChartOfAccounts/rules.ts packages/rules/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts packages/rules/metadata/appliedObjects/metadataBusinessProcess/rules.ts packages/rules/metadata/appliedObjects/metadataTask/rules.ts packages/rules/metadata/appliedObjects/inputByStringDeclarations.test.ts
git commit -m "feat: :triangular_ruler: задать длины прикладных объектов"
```

---

### Task 5: Интеграционные проверки schema, validate и round-trip

**Files:**
- Create: `packages/rules/metadata/appliedObjects/inputByString.integration.test.ts`
- Modify: `packages/rules/metadata/validation/schemaRegistry.integration.test.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.integration.test.ts`

**Interfaces:**
- Consumes: полностью собранный `metadataRules` и реальные applied-object rules.
- Produces: защита наблюдаемых договоров между schema, validate, XML → YAML finalizer и YAML → XML.

- [ ] **Step 1: Написать интеграционный тест прямого round-trip для восьми объектов**

В `inputByString.integration.test.ts` использовать `testAppliedObjectFromXMLToYAML`/`testPropertyFromYAMLToXML` либо узкий общий helper из `metadata/tests/directConversion`.

Для таблицы восьми правил подать XML с полными внутренними путями стандартных реквизитов и длинами по умолчанию. Проверить:

- XML → YAML не содержит `ВводПоСтроке` после запуска импортированного YAML finalizer;
- YAML → XML восстанавливает `xr:Field` в исходном порядке;
- явный обратный порядок остаётся в YAML и возвращается в XML без перестановки;
- у Задачи с `ДлинаНомера: 0` YAML содержит только `ДлинаНомера: 0`, а XML получает только `Task.<Имя>.StandardAttribute.Description`;
- у Задачи с обеими длинами `0` список XML пуст;
- у объекта с дополнительным пригодным реквизитом список остаётся явным.

Тест не должен создавать новые XML-файлы или менять e2e fixtures.

- [ ] **Step 2: Усилить интеграционный тест schema**

В `schemaRegistry.integration.test.ts` получить схемы свойств реальных объектов и проверить представителей уникальных диапазонов:

```ts
expect(exchangePlan.properties?.ДлинаКода).toMatchObject({ minimum: 1, maximum: 50 })
expect(exchangePlan.properties?.ДлинаНаименования).toMatchObject({ minimum: 1, maximum: 250 })
expect(chartOfAccounts.properties?.ДлинаКода).toMatchObject({ minimum: 0, maximum: 628 })
expect(chartOfCalculationTypes.properties?.ДлинаКода).toMatchObject({ minimum: 0, maximum: 40 })
```

Проверить, что описание `ВводПоСтроке` Задачи содержит `Наименование`, затем `Номер`, а описание числовой длины содержит максимум `38` для `Число`.

- [ ] **Step 3: Усилить проверку validate на реальном проектном проходе**

В `projectValidationPasses.integration.test.ts` добавить один параметризованный сценарий, создающий временные `Свойства.yaml` для реальных item types. Проверить:

- безусловные границы: точные минимум/максимум разрешены, соседние `-1`, `51`, `151`, `251`, `629`, `41`, `101` отклоняются соответствующей schema;
- числовой тип: `38` разрешено, `39` отклоняется объектным validator;
- строковый тип: объектный максимум (`50` или `40`) разрешён;
- явный вычисляемый список и стандартное поле с нулевой длиной отклоняются;
- `ДлинаНомера: 0` без `ВводПоСтроке` у Задачи разрешено;
- cfe-файл проходит тем же item rule и теми же contributions.

Не размножать все перестановки: точные декларации защищены Task 4, здесь нужен по одному представителю схемы, зависимой проверки, cf и cfe.

- [ ] **Step 4: Запустить интеграционные тесты на собранных слоях**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/appliedObjects/inputByString.integration.test.ts metadata/validation/schemaRegistry.integration.test.ts metadata/validation/projectValidationPasses.integration.test.ts
```

Expected: PASS. Если проверка требует расширить `BasePropertyRule`, добавить concrete-switch в нейтральный слой или применить `!xml`, остановить выполнение и вынести изменение на согласование.

- [ ] **Step 5: Проверить дубли слоя и закоммитить**

```bash
pnpm duplicates -- --base 6c524c8d0
git add packages/rules/metadata/appliedObjects/inputByString.integration.test.ts packages/rules/metadata/validation/schemaRegistry.integration.test.ts packages/rules/metadata/validation/projectValidationPasses.integration.test.ts
git commit -m "test: :white_check_mark: проверить ВводПоСтроке через runtime"
```

---

### Task 6: Обновление эталонного NKDK-проекта и полная приёмка

**Files:**
- Modify generated YAML only: `e2e/fixtures/nkdk/cf/**/Свойства.yaml`
- Modify generated YAML only: `e2e/fixtures/nkdk/cfe/**/Свойства.yaml`
- Do not modify: `e2e/fixtures/xml/**`

**Interfaces:**
- Consumes: пользовательские XML fixtures, включая нулевые и максимальные длины.
- Produces: эталонный компактный YAML и доказательство полного round-trip.

- [ ] **Step 1: Зафиксировать список пользовательских XML до генерации**

Run:

```bash
git status --short -- e2e/fixtures/xml > /private/tmp/input-by-string-xml-status.before
```

Expected: файл содержит текущие пользовательские изменения; команда ничего в репозитории не меняет.

- [ ] **Step 2: Перегенерировать только NKDK fixture из XML**

Run:

```bash
pnpm fixtures:e2e:nkdk
```

Expected: обновляются файлы под `e2e/fixtures/nkdk`; XML не перезаписываются.

- [ ] **Step 3: Проверить главный критерий для восьми cf-объектов**

Run:

```bash
for file in \
  e2e/fixtures/nkdk/cf/Справочник/ПоУмолчанию/Свойства.yaml \
  e2e/fixtures/nkdk/cf/Документ/ДокументПоУмолчанию/Свойства.yaml \
  e2e/fixtures/nkdk/cf/ПланОбмена/ПланОбменаПоУмолчанию/Свойства.yaml \
  e2e/fixtures/nkdk/cf/ПланВидовХарактеристик/ПланВидовХарактеристикПоУмолчанию/Свойства.yaml \
  e2e/fixtures/nkdk/cf/ПланСчетов/ПланСчетовПоУмолчанию/Свойства.yaml \
  e2e/fixtures/nkdk/cf/ПланВидовРасчета/ПланВидовРасчетаПоУмолчанию/Свойства.yaml \
  e2e/fixtures/nkdk/cf/БизнесПроцесс/БизнесПроцессПоУмолчанию/Свойства.yaml \
  e2e/fixtures/nkdk/cf/Задача/ЗадачаПоУмолчанию/Свойства.yaml; do
  if rg -n '^ВводПоСтроке:' "$file"; then exit 1; fi
done
```

Expected: код `0`, ни один файл не содержит ключ `ВводПоСтроке`.

- [ ] **Step 4: Проверить соответствующие cfe-объекты**

Run:

```bash
find e2e/fixtures/nkdk/cfe/Расширение_All \
  -path '*ПоУмолчаниюExt/Свойства.yaml' -print0 | \
  xargs -0 rg -l '^ВводПоСтроке:'
```

Expected: среди восьми целевых видов объектов вывода нет. Если команда находит нецелевой объект, сузить проверку до тех же восьми каталогов, не менять его правило.

- [ ] **Step 5: Проверить нулевые и максимальные fixtures**

Просмотреть сгенерированные YAML для:

- `ДокументБезНомера`, `БизнесПроцессБезНомера`;
- `ЗадачаБезНомера`, `ЗадачаБезНаименования`, `ЗадачаБезНомераИНаименования`;
- трёх планов `БезКодаИНаименования`;
- максимальных строковых и числовых длин Справочника, Документа, НумератораДокументов, ПланаВидовРасчета, БизнесПроцесса и Задачи;
- максимальных длин ПланаОбмена, ПланаВидовХарактеристик и ПланаСчетов.

Expected: нулевые длины остаются явно, вычисляемый `ВводПоСтроке` отсутствует, числовые максимумы равны `38`, строковые и безусловные максимумы совпадают со спецификацией.

- [ ] **Step 6: Убедиться, что XML status не изменился от наших команд**

Run:

```bash
git status --short -- e2e/fixtures/xml > /private/tmp/input-by-string-xml-status.after
diff -u /private/tmp/input-by-string-xml-status.before /private/tmp/input-by-string-xml-status.after
```

Expected: `diff` пуст; пользовательские XML не изменены и не удалены.

- [ ] **Step 7: Запустить e2e import и round-trip**

Run:

```bash
pnpm test:e2e
```

Expected: PASS; XML → YAML → XML сохраняет порядок и состав `InputByString`.

- [ ] **Step 8: Запустить полную обязательную проверку**

Run последовательно:

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 6c524c8d0
```

Expected: каждая команда завершается с кодом `0`; baseline dependency-cruiser не перезаписывается.

- [ ] **Step 9: Проверить состав изменений перед коммитом fixtures**

Run:

```bash
git diff --name-only -- e2e/fixtures/nkdk
git diff --name-only -- e2e/fixtures/xml
```

Expected: первый список содержит только ожидаемый сгенерированный YAML; второй показывает только исходные пользовательские XML, которые нельзя добавлять в коммит.

- [ ] **Step 10: Закоммитить только эталонный YAML**

```bash
git add e2e/fixtures/nkdk
git diff --cached --name-only
git commit -m "test: :white_check_mark: обновить эталон ВводаПоСтроке"
```

Перед `git commit` убедиться, что в `git diff --cached --name-only` нет `e2e/fixtures/xml`.

---

## Итоговая защита тестами

- `number/toJSONSchema.test.ts`: уникальный договор безусловных границ и безопасного schema ref.
- `inputByStringFields/defaultValue.test.ts`: вычисление по эффективным длинам и значимый порядок.
- `inputByStringFields/propertyRules.test.ts`: переиспользование формата MetadataFields во всех направлениях.
- `inputByStringRules.test.ts`: свёртка только полного вычисляемого списка и локальные зависимые ошибки.
- `inputByStringDeclarations.test.ts`: точные платформенные значения для всех объектов без дублирования интеграционных перестановок.
- `inputByString.integration.test.ts`: взаимодействие XML/YAML/finalizer и сохранение порядка round-trip.
- `schemaRegistry.integration.test.ts`: реальные подсказки schema.
- `projectValidationPasses.integration.test.ts`: реальный `validate`, включая cf/cfe и максимум `38`.
- `e2e/fixtures/nkdk` + `pnpm test:e2e`: пользовательские XML-примеры и главный критерий отсутствия `ВводПоСтроке` у объектов `ПоУмолчанию`.
