# Dynamic List Table Properties Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранять канонические XML-свойства таблицы динамического списка и собственные состояния `DynamicList`, одновременно отклоняя неприменимые свойства таблиц общей валидацией core и MCP.

**Architecture:** Восемь свойств объявляются одним локальным набором рядом с `TableRules`; существующие `implicitValueYAML`, `defaultValueXML` и условие `toXML` разделяют компактный YAML и зависящий от источника XML. Вид источника определяется точным поиском `ПутьКДанным` в уже построенном `formDataPathIndex`; существующий обход YAML получает нейтральную функцию посещения элемента и выполняет локальную проверку `Table` на первом этапе без нового прохода и без передачи полей во второй этап.

**Tech Stack:** TypeScript 7, TypeBox/JSON Schema, Ajv, Vitest, metadata orchestration NKDK, MCP validation, round-trip-yaml.

## Global Constraints

- Источник определяется только из текущего `Форма.yaml` через `formDataPathIndex`; исходный XML, индекс и снимок конфигурации не читаются.
- Прямым источником считается только точный корень, у которого `tableSource.table.kind === "DynamicList"`; вложенные пути не подходят.
- Не добавлять fromXML/toXML/fromYAML/toYAML и не изменять существующие XML-фикстуры.
- В общие типы правил добавляется только явно одобренное `BasePropertyRule.description?: string`; новые параметры экспорта не вводятся.
- Компактные `implicitValueYAML` восьми свойств остаются едиными для всех `Table`; применимость явных свойств проверяется семантически.
- Проверка `Table` выполняется во время существующего обхода YAML первого этапа; текущий элемент не сохраняется в validation state и не передаётся между worker-этапами.
- `RowFilter` не входит в этот план.
- `AutoInsertNewRow`, растяжение групп и `AdditionalColumns` уже реализованы и не изменяются.
- Перед завершением выполнить `pnpm type-check`, полный `pnpm test`, mutation testing изменённых production-диапазонов и round-trip только `/Users/nikita/git/round-trip-compact/cf/doc`.

## File Structure

- Create: `packages/core/metadata/forms/elements/table/dynamicListProperties.ts` — единое объявление восьми свойств и условие прямого `DynamicList` для XML-экспорта.
- Create: `packages/core/metadata/forms/elements/table/validateDynamicListProperties.ts` — локальная семантическая проверка применимости явно указанных свойств.
- Modify: `packages/core/metadata/orchestration/property/types.ts` — общее поле описания правила.
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts` — перенос описания на схему конкретного свойства.
- Modify: `packages/core/metadata/forms/elements/table/rules.ts` — подключение единого набора свойств вместо восьми разрозненных правил.
- Modify: `packages/core/metadata/validation/dataPath/formYamlTraversal.ts` — нейтральная функция посещения текущего YAML-item в уже существующем обходе.
- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.ts` — запуск локальной проверки таблицы после построения индекса.
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts` — явный XML-default `DynamicDataRead` и удаление неявного `itemsViewMode`.
- Modify: `packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts` — наблюдаемый договор `description` для inline-схемы и `$ref`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts` — XML-экспорт восьми свойств по виду источника.
- Modify: `packages/core/metadata/validation/validateForm.test.ts` — первый этап, допустимый источник и ошибки области применения.
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts` — round-trip собственных свойств без исходного XML.
- Modify: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts` — отсутствие неявного `Normal` у `itemsViewMode`.

---

### Task 1: Описания свойств в JSON Schema

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts:99-113`
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts:90-143`
- Test: `packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts`

**Interfaces:**
- Consumes: существующий `PropertyRule` и результат `exportValidationPropertyRefSchema`.
- Produces: `BasePropertyRule.description?: string`; описание находится на схеме конкретного свойства, включая схему с `$ref`, и не загрязняет общую validation-схему типа.

- [ ] **Step 1: Написать падающую проверку inline-схемы и схемы с validation `$ref`**

Добавить в `toJSONSchemaImplicitValue.test.ts`:

```ts
it.each([false, true])("adds a property description with validation refs=%s", (validationPropertyRefs) => {
  const description = "Доступно только для таблицы динамического списка."
  const schema = exportPropertyToJSONSchema({
    context: {
      ...validationContext,
      exportToJSONSchema: {
        ...validationContext.exportToJSONSchema,
        ...(validationPropertyRefs ? { validationPropertyRefs: true as const } : {}),
      },
    },
    rule: { type: "number", description },
    value: undefined,
  })

  expect(schema).toMatchObject({ description })
  if (validationPropertyRefs) expect(schema).toHaveProperty("$ref")
  else expect(schema).toHaveProperty("type", "number")
})
```

- [ ] **Step 2: Запустить проверку и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts
```

Expected: TypeScript либо assertion сообщает, что `description` отсутствует в `BasePropertyRule` или результирующей схеме.

- [ ] **Step 3: Добавить поле правила и перенос описания после формирования `$ref`**

В `BasePropertyRule` добавить:

```ts
/** Описание YAML-свойства для JSON Schema и подсказок MCP. */
description?: string
```

В `toJSONSchema.ts` добавить локальную функцию:

```ts
function withPropertyDescription(schema: TSchema, description: string | undefined): TSchema {
  if (description === undefined) return schema
  const current = typeof schema.description === "string" ? schema.description : undefined
  return {
    ...schema,
    description: current === undefined ? description : `${current}\n\n${description}`,
  } as TSchema
}
```

Применять её к `overrideSchema`, `externalRefSchema`, значению без type-handler и к окончательному результату после `exportValidationPropertyRefSchema`:

```ts
if (overrideSchema !== undefined) return withPropertyDescription(overrideSchema, rule.description)
if (externalRefSchema !== undefined) return withPropertyDescription(externalRefSchema, rule.description)

if (!typeExportFn) {
  return value === undefined ? undefined : withPropertyDescription(value, rule.description)
}

const completed =
  exportValidationPropertyRefSchema({ context, rule, schema: completedSchema }) ?? completedSchema
return withPropertyDescription(completed, rule.description)
```

Описание добавлять после validation `$ref`, чтобы оно относилось к конкретному YAML-свойству, а не к общей схеме `number/base` или `boolean/base`.

- [ ] **Step 4: Запустить целевую проверку**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts
```

Expected: PASS.

- [ ] **Step 5: Закоммитить общий договор схемы**

```bash
git add packages/core/metadata/orchestration/property/types.ts packages/core/metadata/orchestration/property/toJSONSchema.ts packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts
git commit -m "feat: :sparkles: добавить описания свойств rules"
```

---

### Task 2: Канонический XML таблицы динамического списка

**Files:**
- Create: `packages/core/metadata/forms/elements/table/dynamicListProperties.ts`
- Modify: `packages/core/metadata/forms/elements/table/rules.ts:421-443`
- Test: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: `YAMLPropertySource.raw("dataPath")`, `ConfigurationContextWithExportToXML.importFromYAML.formDataPathIndex`, существующие `implicitValueYAML`, `defaultValueXML` и `toXML`.
- Produces: `dynamicListTableProperties` — единственный набор восьми `PropertyRule`; `isDirectDynamicListTable(source, context): boolean` — точный предикат XML-экспорта.

- [ ] **Step 1: Добавить падающую проверку отсутствующих значений для трёх видов пути**

В `fromYAMLToXML.test.ts` добавить проверку, создающую формы без исходного XML:

```ts
it("восстанавливает свойства таблицы только для прямого динамического списка", () => {
  const convert = (requisites: ClientApplicationFormYAML["Реквизиты"], dataPath: string) =>
    convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        Реквизиты: requisites,
        Элементы: { Таблица: { Вид: "ТаблицаФормы", ПутьКДанным: dataPath } },
      } as ClientApplicationFormYAML,
      name: "Форма",
    })

  const direct = firstTable(convert({ Список: { Тип: "ДинамическийСписок" } }, "Список").formXML)
  const ordinary = firstTable(convert({ Таблица: { Тип: "ТаблицаЗначений" } }, "Таблица").formXML)
  const nested = firstTable(convert({ Список: { Тип: "ДинамическийСписок" } }, "Список.Filter").formXML)

  const defaults = {
    AutoRefresh: false,
    AutoRefreshPeriod: 60,
    ChoiceFoldersAndItems: "Items",
    RestoreCurrentRow: false,
    ShowRoot: true,
    AllowRootChoice: false,
    UpdateOnDataChange: "Auto",
    AllowGettingCurrentRowURL: true,
  }
  expect(direct).toMatchObject(defaults)
  for (const xmlName of Object.keys(defaults)) {
    expect(ordinary).not.toHaveProperty(xmlName)
    expect(nested).not.toHaveProperty(xmlName)
  }
})
```

- [ ] **Step 2: Добавить падающую проверку явных отличающихся значений**

В том же файле добавить:

```ts
it("выгружает явные свойства прямой таблицы динамического списка", () => {
  const result = convertClientApplicationFormFromYAMLToXML({
    context: mockContextToXML(),
    yaml: {
      Реквизиты: { Список: { Тип: "ДинамическийСписок" } },
      Элементы: {
        Список: {
          Вид: "ТаблицаФормы",
          ПутьКДанным: "Список",
          АвтоОбновление: "Истина",
          ПериодАвтоОбновления: 30,
          ВыборГруппИЭлементов: "Группы",
          ВосстанавливатьТекущуюСтроку: "Истина",
          ОтображатьКорень: "Ложь",
          РазрешитьВыборКорня: "Истина",
          ОбновлениеПриИзмененииДанных: "НеОбновлять",
          РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки: "Ложь",
        },
      },
    } as ClientApplicationFormYAML,
    name: "ФормаСписка",
  })

  expect(firstTable(result.formXML)).toMatchObject({
    AutoRefresh: true,
    AutoRefreshPeriod: 30,
    ChoiceFoldersAndItems: "Folders",
    RestoreCurrentRow: true,
    ShowRoot: false,
    AllowRootChoice: true,
    UpdateOnDataChange: "DontUpdate",
    AllowGettingCurrentRowURL: false,
  })
})
```

- [ ] **Step 3: Запустить проверки и подтвердить отсутствие канонических XML-узлов**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

Expected: первая новая проверка падает, потому что отсутствующие YAML-ключи не создают восемь XML-узлов.

- [ ] **Step 4: Создать единый набор правил и предикат источника**

Создать `dynamicListProperties.ts`:

```ts
import type { ConfigurationContextWithExportToXML } from "../../../context/types"
import type { YAMLPropertySource } from "../../../orchestration/property/fromYAMLToXMLTypes"
import type { PropertyRule } from "../../../orchestration/property/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"

type CompactScalarRule = PropertyRule & {
  yaml: string
  implicitValueYAML: string | number | boolean
}

function dynamicListTableProperty<const Rule extends CompactScalarRule>(
  rule: Rule,
  implicitLabel: string
) {
  return {
    ...rule,
    defaultValueXML: rule.implicitValueYAML,
    toXML: isDirectDynamicListTable,
    description:
      `Доступно только для таблицы, чей ПутьКДанным напрямую указывает на реквизит DynamicList. Неявное значение — ${implicitLabel}.`,
  } as const
}

export function isDirectDynamicListTable(
  source: YAMLPropertySource,
  context?: ConfigurationContextWithExportToXML
): boolean {
  const dataPath = source.raw("dataPath")
  if (typeof dataPath !== "string") return false
  return context?.importFromYAML?.formDataPathIndex
    ?.getRoot(dataPath)
    ?.tableSource?.table.kind === "DynamicList"
}

export const dynamicListTableProperties = {
  autoRefresh: dynamicListTableProperty(
    booleanRule({ yaml: "АвтоОбновление", implicitValueYAML: false }),
    "Ложь"
  ),
  restoreCurrentRow: dynamicListTableProperty(
    booleanRule({ yaml: "ВосстанавливатьТекущуюСтроку", implicitValueYAML: false }),
    "Ложь"
  ),
  choiceFoldersAndItems: dynamicListTableProperty(
    systemEnumerationRule({
      yaml: "ВыборГруппИЭлементов",
      typeSE: "FoldersAndItemsUse",
      implicitValueYAML: "Items",
    }),
    "Элементы"
  ),
  updateOnDataChange: dynamicListTableProperty(
    systemEnumerationRule({
      yaml: "ОбновлениеПриИзмененииДанных",
      typeSE: "UpdateOnDataChange",
      implicitValueYAML: "Auto",
    }),
    "Авто"
  ),
  showRoot: dynamicListTableProperty(
    booleanRule({ yaml: "ОтображатьКорень", implicitValueYAML: true }),
    "Истина"
  ),
  autoRefreshPeriod: dynamicListTableProperty(
    numberRule({ yaml: "ПериодАвтоОбновления", implicitValueYAML: 60 }),
    "60"
  ),
  allowRootChoice: dynamicListTableProperty(
    booleanRule({ yaml: "РазрешитьВыборКорня", implicitValueYAML: false }),
    "Ложь"
  ),
  allowGettingCurrentRowURL: dynamicListTableProperty(
    booleanRule({
      yaml: "РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки",
      implicitValueYAML: true,
    }),
    "Истина"
  ),
} as const
```

Если точные builder-типы требуют более узкого ограничения, сузить только локальный `CompactScalarRule`; не расширять общие параметры builders и не применять `as any`.

- [ ] **Step 5: Подключить набор в `TableRules`**

Импортировать `dynamicListTableProperties` и заменить восемь отдельных правил одним spread на их текущем месте:

```ts
import { dynamicListTableProperties } from "./dynamicListProperties"

// внутри properties после width:
...dynamicListTableProperties,
```

Сохранить текущий `xmlOrder`; новые `order`, fromXML/toXML/fromYAML/toYAML не добавлять.

- [ ] **Step 6: Запустить целевые проверки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

Expected: PASS; прямой `DynamicList` получает восемь XML-узлов, обычный и вложенный источники их не получают, явные отличающиеся значения сохраняются.

- [ ] **Step 7: Закоммитить экспорт таблицы**

```bash
git add packages/core/metadata/forms/elements/table/dynamicListProperties.ts packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
git commit -m "fix: :bug: восстановить свойства таблицы динамического списка"
```

---

### Task 3: Семантическая проверка области применения

**Files:**
- Create: `packages/core/metadata/forms/elements/table/validateDynamicListProperties.ts`
- Modify: `packages/core/metadata/validation/dataPath/formYamlTraversal.ts:7-108`
- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.ts:29-79`
- Test: `packages/core/metadata/validation/validateForm.test.ts`

**Interfaces:**
- Consumes: `dynamicListTableProperties`, `FormDataPathIndex.getRoot`, `MetadataItemRule`, `ParsedYaml`, `YamlPath`.
- Produces: `FormYAMLItemVisit`, необязательный `visitItem(visit): void` у `collectFormDataPathOccurrencesFromYAML`, `validateDynamicListTableProperties(params): Diagnostic[]`.

- [ ] **Step 1: Добавить падающую проверку всех восьми свойств обычной таблицы**

В `validateForm.test.ts` создать таблицу значений с восемью отличающимися от неявных значениями и проверить диагностики первого этапа:

```ts
it("отклоняет свойства динамического списка у обычной таблицы на первом этапе", () => {
  const project = createProject({
    form: [
      "Реквизиты:",
      "  Таблица:",
      "    Тип: ТаблицаЗначений",
      "Элементы:",
      "  Таблица:",
      "    Вид: ТаблицаФормы",
      "    ПутьКДанным: Таблица",
      "    АвтоОбновление: Истина",
      "    ПериодАвтоОбновления: 30",
      "    ВыборГруппИЭлементов: Группы",
      "    ВосстанавливатьТекущуюСтроку: Истина",
      "    ОтображатьКорень: Ложь",
      "    РазрешитьВыборКорня: Истина",
      "    ОбновлениеПриИзмененииДанных: НеОбновлять",
      "    РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки: Ложь",
    ],
  })
  const first = validateClientApplicationFormFirstPass({
    projectDir: project.projectDir,
    formDir: project.formDir,
    formName: project.formName,
    owner: { dir: project.ownerDir, name: project.ownerName },
    cache: createProjectYamlCache(),
    context: mockContext,
  })

  expect(first.status).toBe("ok")
  if (first.status !== "ok") return
  expect(messages(first.diagnostics)).toEqual([
    "АвтоОбновление допустимо только для таблицы динамического списка.",
    "ВосстанавливатьТекущуюСтроку допустимо только для таблицы динамического списка.",
    "ВыборГруппИЭлементов допустимо только для таблицы динамического списка.",
    "ОбновлениеПриИзмененииДанных допустимо только для таблицы динамического списка.",
    "ОтображатьКорень допустимо только для таблицы динамического списка.",
    "ПериодАвтоОбновления допустимо только для таблицы динамического списка.",
    "РазрешитьВыборКорня допустимо только для таблицы динамического списка.",
    "РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки допустимо только для таблицы динамического списка.",
  ])
})
```

Порядок ожидания должен совпасть с единым набором `dynamicListTableProperties`; не сортировать диагностики только ради теста.

- [ ] **Step 2: Добавить граничные случаи одним `it.each`**

Добавить случаи с одним `АвтоОбновление: Истина`:

```ts
it.each([
  ["принимает прямой DynamicList", ["Реквизиты:", "  Список:", "    Тип: ДинамическийСписок"], "Список", []],
  [
    "отклоняет вложенный путь",
    ["Реквизиты:", "  Список:", "    Тип: ДинамическийСписок"],
    "Список.Filter",
    ["АвтоОбновление допустимо только для таблицы динамического списка."],
  ],
  [
    "не дублирует неизвестный корень",
    ["Реквизиты:", "  Список:", "    Тип: ДинамическийСписок"],
    "НетТакого",
    ['ПутьКДанным "НетТакого": неизвестный корень "НетТакого"'],
  ],
] as const)("%s", (_name, requisites, dataPath, expected) => {
  const project = createProject({
    form: [
      ...requisites,
      "Элементы:",
      "  Таблица:",
      "    Вид: ТаблицаФормы",
      `    ПутьКДанным: ${dataPath}`,
      "    АвтоОбновление: Истина",
    ],
  })

  expect(messages(runValidateForm(project))).toEqual(expected)
})
```

Отдельно добавить таблицу без `ПутьКДанным`:

```ts
it("отклоняет свойства динамического списка у таблицы без пути", () => {
  const project = createProject({
    form: [
      "Элементы:",
      "  Таблица:",
      "    Вид: ТаблицаФормы",
      "    АвтоОбновление: Истина",
    ],
  })

  expect(runValidateForm(project)).toEqual([
    expect.objectContaining({
      path: "/Элементы/Таблица/АвтоОбновление",
      message: "АвтоОбновление допустимо только для таблицы динамического списка.",
    }),
  ])
})
```

- [ ] **Step 3: Запустить проверки и подтвердить отсутствие семантической диагностики**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/validateForm.test.ts
```

Expected: новые проверки обычной, вложенной и таблицы без пути падают; неизвестный путь пока содержит только прежнюю диагностику.

- [ ] **Step 4: Расширить существующий обход нейтральной функцией посещения**

В `formYamlTraversal.ts` определить:

```ts
export interface FormYAMLItemVisit {
  yaml: Record<string, unknown>
  rule: MetadataItemRule
  yamlPath: YamlPath
}

export type FormYAMLItemVisitor = (visit: FormYAMLItemVisit) => void
```

Добавить `visitItem?: FormYAMLItemVisitor` в параметры публичной функции и внутренних `collectItem`/`collectNested`. Сразу после успешного `asRecord` вызвать:

```ts
params.visitItem?.({ yaml: record, rule: params.rule, yamlPath: params.yamlPath })
```

Передавать ту же функцию во все рекурсивные вызовы. Возвращаемый массив `FormDataPathOccurrence[]` и его содержимое не изменять.

- [ ] **Step 5: Реализовать локальную проверку `Table`**

Создать `validateDynamicListProperties.ts`:

```ts
import type { ParsedYaml } from "../../../../yaml/parseMetadataYaml"
import type { FormDataPathIndex } from "../../../validation/dataPath/formIndex"
import type { FormYAMLItemVisit } from "../../../validation/dataPath/formYamlTraversal"
import type { Diagnostic } from "../../../validation/types"
import { diagnosticAtYamlPath } from "../../../validation/yamlLocations"
import { dynamicListTableProperties } from "./dynamicListProperties"

export function validateDynamicListTableProperties(params: {
  filePath: string
  parsed: ParsedYaml
  index: FormDataPathIndex
  visit: FormYAMLItemVisit
}): Diagnostic[] {
  if (params.visit.rule.itemType !== "Table") return []

  const explicit = Object.values(dynamicListTableProperties).filter(
    (property) => Object.prototype.hasOwnProperty.call(params.visit.yaml, property.yaml)
  )
  if (explicit.length === 0) return []

  const dataPathRule = params.visit.rule.properties.dataPath
  const dataPath = typeof dataPathRule?.yaml === "string"
    ? params.visit.yaml[dataPathRule.yaml]
    : undefined

  let allowed = false
  let unresolvedRoot = false
  if (typeof dataPath === "string" && dataPath.length > 0) {
    const root = params.index.getRoot(dataPath)
    allowed = root?.tableSource?.table.kind === "DynamicList"
    unresolvedRoot = root === undefined && !dataPath.includes(".")
  }
  if (allowed || unresolvedRoot) return []

  return explicit.map((property) =>
    diagnosticAtYamlPath({
      filePath: params.filePath,
      parsed: params.parsed,
      path: [...params.visit.yamlPath, property.yaml],
      severity: "error",
      source: "structure",
      message: `${property.yaml} допустимо только для таблицы динамического списка.`,
    })
  )
}
```

Точный корень сначала проверять через `getRoot(dataPath)`: строка с точкой, если она когда-либо станет допустимым именем корня, не должна ошибочно считаться вложенным путём.

- [ ] **Step 6: Запустить проверку во время первого этапа без сохранения YAML-item**

В `validateClientApplicationFormFirstPass` вычислить вхождения до формирования результата:

```ts
const localDiagnostics: Diagnostic[] = []
const occurrences = collectFormDataPathOccurrencesFromYAML({
  yaml: entry.parsed.data,
  rule: ClientApplicationFormRules,
  visitItem: (visit) => {
    localDiagnostics.push(
      ...validateDynamicListTableProperties({
        filePath: entry.filePath,
        parsed: entry.parsed,
        index,
        visit,
      })
    )
  },
})
```

Добавить `...localDiagnostics` в диагностики первого этапа и сохранить в `state` только прежний `occurrences`. Не добавлять YAML-item, свойства таблиц или результаты проверки в `ClientApplicationFormValidationState`.

- [ ] **Step 7: Запустить целевые проверки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/validateForm.test.ts
```

Expected: PASS; прямой `DynamicList` принят, остальные определимые источники отклонены на ключах свойств, неизвестный корень получает только прежнюю ошибку пути.

- [ ] **Step 8: Закоммитить семантическую валидацию**

```bash
git add packages/core/metadata/forms/elements/table/validateDynamicListProperties.ts packages/core/metadata/validation/dataPath/formYamlTraversal.ts packages/core/metadata/forms/clientApplicationForm/validate.ts packages/core/metadata/validation/validateForm.test.ts
git commit -m "feat: :sparkles: проверить свойства таблицы динамического списка"
```

---

### Task 4: Собственные состояния `DynamicList`

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts:82-85,130-136`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts:36-87`
- Modify: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts:778-792`

**Interfaces:**
- Consumes: существующий `booleanRule.defaultValueXML`, `systemEnumerationRule`, прямые round-trip helpers.
- Produces: `DynamicDataRead` явно восстанавливает XML `true`; `itemsViewMode` сохраняет различие отсутствующего XML и явного `Normal`.

- [ ] **Step 1: Расширить существующий round-trip без исходного XML**

Заменить одиночную проверку `full.xml` в `fromXMLToYAML.test.ts` на параметризованную:

```ts
it.each(["full.xml", "minimal.xml", "emptyListSettings.xml"] as const)(
  "восстанавливает %s без исходного XML",
  (fixture) => {
    const expected = fs.readFileSync(fileURLToPath(new URL(`__fixtures__/${fixture}`, import.meta.url)), "utf8")
    const parsed = importContentFromXML<Record<string, unknown>>(expected, {
      preserveEmptyElements: true,
      preserveXsiNil: true,
    })
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список",
    })
    const yaml = testPropertyFromXMLToYAML({ rule, xml: parsed, context: contexts.importContext }).yaml
    const { xml } = testPropertyFromYAMLToXML({ rule, yaml, context: contexts.exportContext() })

    expect(withoutDeclaration(xmlExport(xml, false))).toBe(expected.trim())
  }
)
```

`minimal.xml` защищает явный `itemsViewMode=Normal`, `emptyListSettings.xml` — отсутствующий `itemsViewMode`, оба файла защищают явный `DynamicDataRead=true` после компактного YAML.

- [ ] **Step 2: Изменить контракт неявных YAML-значений**

В `implicitValueYAMLContract.test.ts` заменить ожидание `itemsViewMode: "Normal"`:

```ts
it("uses only real compact YAML defaults for dynamic lists", () => {
  expect(DynamicListRules.properties.autoFillAvailableFields.implicitValueYAML).toBe(true)
  expect(DynamicListRules.properties.itemsViewMode).not.toHaveProperty("implicitValueYAML")
})
```

- [ ] **Step 3: Запустить проверки и подтвердить оба расхождения**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: `minimal.xml` теряет `Normal`, `emptyListSettings.xml` или `minimal.xml` не восстанавливает явный `DynamicDataRead=true`, а contract-тест сообщает лишний `implicitValueYAML`.

- [ ] **Step 4: Исправить правила `DynamicList`**

Изменить только два правила:

```ts
dynamicDataRead: booleanRule({
  yaml: "ДинамическоеСчитываниеДанных",
  implicitValueYAML: true,
  defaultValueXML: true,
}),

itemsViewMode: systemEnumerationRule({
  typeSE: "DataCompositionSettingsItemViewMode",
  xml: "dcsset:itemsViewMode",
  yaml: "РежимОтображенияСтруктуры",
  xmlParents: ["ListSettings"],
}),
```

- [ ] **Step 5: Запустить целевые проверки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: PASS для `full.xml`, `minimal.xml`, `emptyListSettings.xml` без исходного XML; contract-тест подтверждает отсутствие неявного `Normal`.

- [ ] **Step 6: Закоммитить собственные свойства списка**

```bash
git add packages/core/metadata/forms/commonObjects/dynamicList/rules.ts packages/core/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
git commit -m "fix: :bug: сохранить свойства динамического списка"
```

---

### Task 5: Проверка общего договора и round-trip `cf/doc`

**Files:**
- Verify: все production- и test-файлы Tasks 1–4
- External diagnostic target: `/Users/nikita/git/round-trip-compact/cf/doc`

**Interfaces:**
- Consumes: четыре завершённых коммита, чистое рабочее дерево NKDK, skill `round-trip-yaml`.
- Produces: подтверждённые целевые тесты, mutation testing без недостоверных статусов, полный зелёный набор тестов и diff `cf/doc` без исправляемых этой спецификацией свойств.

- [ ] **Step 1: Запустить все затронутые тестовые файлы вместе**

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts \
  metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts \
  metadata/validation/validateForm.test.ts \
  metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts \
  metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: PASS.

- [ ] **Step 2: Проверить типы**

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 3: Запустить mutation testing изменённых production-диапазонов**

После уточнения конечных номеров строк командой `git diff 4f5b5d2c4 --unified=0 -- packages/core/metadata` запустить:

```bash
pnpm test:mutation -- --report current \
  --tests packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts,packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts,packages/core/metadata/validation/validateForm.test.ts,packages/core/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts,packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts \
  packages/core/metadata/orchestration/property/toJSONSchema.ts:90-155 \
  packages/core/metadata/forms/elements/table/dynamicListProperties.ts \
  packages/core/metadata/forms/elements/table/validateDynamicListProperties.ts \
  packages/core/metadata/validation/dataPath/formYamlTraversal.ts:7-115 \
  packages/core/metadata/forms/clientApplicationForm/validate.ts:29-85 \
  packages/core/metadata/forms/commonObjects/dynamicList/rules.ts:82-86 \
  packages/core/metadata/forms/commonObjects/dynamicList/rules.ts:130-136
```

Expected: mutation testing завершён без `Timeout`, `RuntimeError` и `CompileError`; каждый содержательный выживший мутант устраняется усилением ближайшего существующего теста и повторным запуском той же команды.

- [ ] **Step 4: Запустить полный набор тестов**

```bash
pnpm test
```

Expected: все пакеты `packages/*` проходят.

- [ ] **Step 5: Убедиться, что дерево NKDK чистое, и подготовить внешний каталог**

```bash
git status --short
git -C /Users/nikita/git/round-trip-compact status --short -- cf/doc
git -C /Users/nikita/git/round-trip-compact restore -- cf/doc
git -C /Users/nikita/git/round-trip-compact clean -fd -- cf/doc
```

Expected: перед round-trip дерево NKDK чистое; в `cf/doc` нет старых tracked- и untracked-изменений. Удалять файлы разрешено только внутри указанного `cf/doc`.

- [ ] **Step 6: Прочитать обязательные материалы skill и запустить round-trip только `cf/doc`**

Перед запуском прочитать полностью:

```text
.agents/knowledge/metadata/INDEX.md
.agents/knowledge/metadata/sources-of-truth.md
.agents/knowledge/metadata/round-trip-cycle.md
.agents/knowledge/metadata/yaml-contract.md
```

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc \
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 20
```

Expected: прогон завершается успешно и оставляет диагностический diff только во внешнем XML-репозитории. После прогона его не откатывать до анализа.

- [ ] **Step 7: Проверить отсутствие исправляемых свойств в diff**

```bash
git -C /Users/nikita/git/round-trip-compact diff -- cf/doc | rg \
  "AutoRefresh|AutoRefreshPeriod|ChoiceFoldersAndItems|RestoreCurrentRow|ShowRoot|AllowRootChoice|UpdateOnDataChange|AllowGettingCurrentRowURL|DynamicDataRead|itemsViewMode"
```

Expected: `rg` не выводит совпадений и завершается с кодом 1. Остаточный `RowFilter` и другие не входящие в спецификацию расхождения перечислить отдельно, не исправлять в рамках этого плана.

- [ ] **Step 8: Зафиксировать итог проверки**

Если после mutation testing пришлось усиливать тесты, закоммитить только эти изменения:

```bash
git add \
  packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts \
  packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts \
  packages/core/metadata/validation/validateForm.test.ts \
  packages/core/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
git commit -m "test: :white_check_mark: усилить проверки свойств динамического списка"
```

Если дерево NKDK уже чистое, новый пустой коммит не создавать. В итоговом сообщении перечислить изменённые тесты, уникальный договор каждого нового теста, результаты mutation testing, `pnpm type-check`, `pnpm test` и round-trip `cf/doc`.
