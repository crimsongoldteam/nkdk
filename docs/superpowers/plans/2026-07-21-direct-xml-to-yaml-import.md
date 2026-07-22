# Direct XML-to-YAML Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести импорт XML в YAML на прямой обход `rules.ts`, чтобы worker между проходами хранил YAML и отложенные пути, но не XML и не полную metadata-модель.

**Architecture:** Общий преобразователь читает XML-представление свойства, для атомарного значения немедленно выполняет `fromXML` и `toYAML`, а составные значения рекурсивно строит через зарегистрированные правила. Import и validation во время своего единственного обхода `rules.ts` передают окончательные YAML-значения общему накопителю локального индекса метаданных и индекса зависимостей. Первый проход сохраняет YAML и координаты только глобальных зависимостей; второй проход уточняет их через полный индекс метаданных и затем записывает файлы.

**Tech Stack:** TypeScript 6, Node.js, Vitest, TypeBox, Piscina, `yaml`, существующие реестры `rules.ts` и профилировщик `NKDK_PROFILE=1`.

## Global Constraints

- Не менять внешний договор `nkdk.import_from_xml`.
- Не менять формат XML-выгрузки, YAML-проекта или файла индекса конфигурации.
- Не переводить в этой задаче синхронизацию YAML → XML, переименование и поиск ссылок на безмодельную обработку.
- Не добавлять частные условия по `itemType`, именам XML-корней или конкретным типам свойств в общие metadata-слои.
- Не сохранять совместимый запасной путь импорта через полную metadata-модель.
- Не объединять два worker-прохода.
- Состояние между проходами содержит YAML, `yamlPath`, `rulePath` и служебные сведения задания; XML, временные типизированные значения и metadata-модели в нём отсутствуют.
- Первый проход формирует два результата общего накопителя: локальный индекс метаданных и локальный индекс зависимостей.
- Import и validation не запускают отдельный повторный обход готового YAML ради локальных индексов.
- Validation читает и обрабатывает файлы последовательно внутри каждого worker, удерживает не более одного разобранного YAML-файла и удаляет все ссылки на него перед переходом к следующему файлу.
- Импорт пока сохраняет предварительный YAML всех заданий до второго прохода, включая задания без зависимостей от глобального индекса. Досрочная запись и освобождение таких YAML не входят в эту задачу.
- Для атомарного свойства `fromXML` и `toYAML` выполняются последовательно в одном вызове; временное типизированное значение живёт только в стеке этого вызова.
- Составные свойства, формы и особые коллекции строят YAML напрямую и не создают промежуточные модельные объекты.
- Существующие XML-фикстуры не изменять; результат импорта на них должен остаться прежним.
- Общие слои `metadata/orchestration`, `metadata/validation` и `metadata/project` работают только через нейтральные договоры и регистрации типов.
- Перед завершением выполнить `pnpm test` из корня рабочего дерева.

---

## File Map

- `packages/core/metadata/orchestration/property/fromXMLToYAML.ts` — единый обход свойств XML → YAML и регистрация отложенных путей.
- `packages/core/metadata/orchestration/property/importYamlTypes.ts` — нейтральные типы результата, пути правила и контекста обхода.
- `packages/core/metadata/orchestration/property/finalizeImportedYAML.ts` — чтение и замена YAML по пути, восстановление `PropertyRule` по `rulePath`.
- `packages/core/metadata/orchestration/property/fn.ts` и `typeRuleRegistry.ts` — операции `importFromXMLToYAML`, `nestedItemRule` и `finalizeImportedYAML`.
- `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts` — прямое построение YAML-объекта по `MetadataItemRule`.
- `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.ts` — прямое построение YAML-массива или YAML-записи коллекции.
- `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts` и `metadataCollection/ruleFactory.ts` — стандартные регистрации прямого преобразования и вложенного правила.
- Пять файлов особых коллекций — явные прямые преобразователи без последовательности «коллекционная модель → YAML».
- `packages/core/metadata/forms/elements/orchestration/fromXMLToYAML.ts` и `forms/commonObjects/childItems/fromXMLToYAML.ts` — прямое построение существующего YAML-дерева элементов формы при плоских логических адресах файла индекса.
- `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts` — объединение `Form.xml` и metadata XML в один YAML формы.
- `packages/core/metadata/orchestration/property/yamlRuleCursor.ts` — общий для validation и import механизм построения согласованных `yamlPath` и `rulePath` без повторного обхода YAML при импорте.
- `packages/core/metadata/project/localIndexes.ts` — общий накопитель локального индекса метаданных и индекса зависимостей.
- `packages/core/metadata/validation/dataPath/formYamlIndex.ts` — повторно используемый локальный индекс формы из YAML.
- `packages/core/metadata/validation/dataPath/ownerFacts.ts` — нейтральные типизированные сведения владельца и полей, принимаемые общим накопителем.
- `packages/core/metadata/project/preparedYamlProjectWorker.ts`, `preparedYamlProjectWorkerPool.ts` и `metadata/validation/validateProject.ts` — последовательная обработка YAML-файлов validation без хранения всего проекта в разобранном виде.
- `packages/core/metadata/importFromXml/prepareYaml.ts` — чтение XML задания и подготовка безмодельного состояния первого прохода.
- `packages/core/metadata/importFromXml/worker.ts` — хранение YAML, отложенное уточнение и запись результата.

---

### Task 1: Нейтральный договор прямого преобразования и общего сбора локальных индексов

**Files:**
- Create: `packages/core/metadata/orchestration/property/importYamlTypes.ts`
- Create: `packages/core/metadata/orchestration/property/yamlRuleCursor.ts`
- Create: `packages/core/metadata/orchestration/property/yamlRuleCursor.test.ts`
- Create: `packages/core/metadata/project/localIndexes.ts`
- Create: `packages/core/metadata/project/localIndexes.test.ts`
- Create: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Create: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/orchestration/property/toYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/index.ts`

**Interfaces:**
- Consumes: `importPropertyFromXML(params)` из `property/fromXML.ts`, `exportPropertyToYAML(params)` из `property/toYAML.ts`, `YamlPath`, `MetadataItemRule`, `PropertyRule`.
- Produces: `LocalIndexesCollector`, `LocalMetadataIndex`, `LocalDependencyIndex`, `DeferredImportedYamlValue`, `YamlRuleCursor`, `enterYamlProperty`, `enterNestedYamlRule`, `ImportFromXMLToYAMLFunction`, `FinalizeImportedYAMLFunction`, `NestedItemRule`, `importPropertiesFromXMLToYAML(params)` и операции реестра типов.

- [ ] **Step 1: Добавить падающий тест атомарного преобразования**

В `fromXMLToYAML.test.ts` зарегистрировать тестовый тип и проверить порядок вызовов, отсутствие промежуточного значения в результате и YAML-имя:

```ts
it("immediately converts one atomic XML value to YAML", () => {
  const calls: string[] = []
  registerTypeRule("TestDirectAtomic" as PropertyRuleType, "importFromXML", (_context, _rule, xml) => {
    calls.push("fromXML")
    return { parsed: String(xml) }
  })
  registerTypeRule("TestDirectAtomic" as PropertyRuleType, "exportToYAML", (_context, _rule, value) => {
    calls.push("toYAML")
    return (value as { parsed: string }).parsed.toUpperCase()
  })
  const collector = createLocalIndexesCollector()
  const yaml = importPropertiesFromXMLToYAML({
    context: mockContextFromXML({ exportToYAML: { toTyped: true } }),
    rule: {
      itemType: "TestDirectItem",
      properties: {
        value: { type: "TestDirectAtomic", xml: "Value", yaml: "Значение" },
      },
    } as MetadataItemRule,
    xml: { Value: "abc" },
    yamlPath: [],
    rulePath: [],
    collector,
  })

  expect(calls).toEqual(["fromXML", "toYAML"])
  expect(yaml).toEqual({ Значение: "ABC" })
  expect(yaml).not.toHaveProperty("value")
  expect(collector.finish()).toEqual({ metadata: expect.anything(), dependencies: [] })
})
```

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run: `pnpm --filter @nkdk/core test -- metadata/orchestration/property/fromXMLToYAML.test.ts`

Expected: FAIL с ошибкой импорта `./fromXMLToYAML` или отсутствующим `importPropertiesFromXMLToYAML`.

- [ ] **Step 3: Ввести типы прямого обхода и новые операции реестра**

В `importYamlTypes.ts` определить единый договор:

```ts
import type { ConfigurationContext, ConfigurationContextFromXML, ExternalFileEntry } from "../../context/types"
import type { FormDataPathIndex } from "../../validation/dataPath/formIndex"
import type { YamlPath } from "../../validation/yamlLocations"
import type { MetadataItemRule, PropertyRule } from "./types"

export interface DeferredImportedYamlValue {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
}

export interface DeferredRulePathSegment {
  propertyKey: string
  nestedItemType?: string
}

export interface DirectImportTraversal {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
  collector: LocalIndexesCollector
}

export interface DirectImportResult {
  yaml: unknown
  localIndexes: LocalIndexes
  generatedFiles: ExternalFileEntry[]
}

export interface LocalYamlFact {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
  rule: PropertyRule
  value: unknown
  source?: YamlDiagnosticLocation
}

export interface LocalIndexesCollector {
  acceptProperty(fact: LocalYamlFact): void
  completeValue(fact: LocalYamlFact): void
  finish(): LocalIndexes
}

export interface LocalIndexes {
  metadata: LocalMetadataIndex
  dependencies: DeferredImportedYamlValue[]
}

export type ImportFromXMLToYAMLFunction = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  xml: unknown
  name?: string
  ownerXmlName?: string
  traversal: DirectImportTraversal
}) => unknown

export type NestedItemRule =
  | { itemRule: MetadataItemRule }
  | { resolveItemRule(itemType: string): MetadataItemRule }

export type FinalizeImportedYAMLFunction = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
  formDataPathIndex?: FormDataPathIndex
}) => unknown

export interface YamlRuleCursor {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
}

export function enterNestedYamlRule<T extends YamlRuleCursor>(
  traversal: T,
  itemType: string
): T {
  const last = traversal.rulePath.at(-1)
  if (last === undefined) return traversal
  return {
    ...traversal,
    rulePath: [
      ...traversal.rulePath.slice(0, -1),
      { ...last, nestedItemType: itemType },
    ],
  }
}

export function enterYamlProperty<T extends YamlRuleCursor>(params: {
  cursor: T
  propertyKey: string
  yamlKey: string
}): T {
  return {
    ...params.cursor,
    yamlPath: [...params.cursor.yamlPath, params.yamlKey],
    rulePath: [...params.cursor.rulePath, { propertyKey: params.propertyKey }],
  }
}
```

В `fn.ts` добавить эти типы в `TypeRule`, `TypeRulesOperations` и условный тип `importExportFunction`. В `typeRuleRegistry.ts` добавить их в объединение значений и ветви `getTypeRule`. Точные имена операций:

```ts
"importFromXMLToYAML" | "nestedItemRule" | "finalizeImportedYAML"
```

- [ ] **Step 4: Выделить повторно используемое формирование YAML-значения свойства**

В `toYAML.ts` оставить внешний договор `exportPropertyToYAML`, но вынести вызов зарегистрированного `toYAML`, строковое форматирование и фильтры в экспортируемую функцию:

```ts
export function exportPropertyValueToYAML(params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
  name?: string
  owner?: MetadataTargetOwner
}): unknown {
  // Сюда переносится существующая ветка getTypeRule(rule.type, "exportToYAML")
  // вместе с ExportToYAMLFunctionNew, ExportToYAMLFunction и metadata-target string.
}

export const exportPropertyToYAML = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
  name?: string
  owner?: MetadataTargetOwner
}): Record<string, unknown> | undefined => {
  const exported = exportPropertyValueToYAML(params)
  return getExportToYAMLResult(params.rule, params.rule.yaml!, exported, params.value)
}
```

Существующие условия `yaml === undefined`, `toYAML === false`, `toPartialYAML`, `implicitValueYAML`, пустых массивов/объектов и много-ключевых `UserVisible`/`FormattedI8nText` должны остаться в тех же местах и продолжить проходить `toYAML.test.ts`.

- [ ] **Step 5: Реализовать атомарный путь XML → временное значение → YAML**

В `fromXMLToYAML.ts` перенести из `fromXML.ts` выбор XML-ключа, `xmlAliases`, `xmlParents`, значения по умолчанию, порядок и сбор данных индекса конфигурации в общий обход. Для каждого свойства использовать такой выбор:

```ts
const direct = getTypeRule(propertyRule.type, "importFromXMLToYAML")
const yamlValue =
  direct === undefined
    ? exportPropertyValueToYAML({
        context,
        rule: propertyRule,
        value: importPropertyFromXML({ context, rule: propertyRule, value: xmlValue, name: key, ownerXmlName }),
        name: itemName,
        owner,
      })
    : direct({
        context,
        rule: propertyRule,
        xml: xmlValue,
        name: itemName,
        ownerXmlName,
        traversal: {
          yamlPath: [...yamlPath, propertyRule.yaml ?? key],
          rulePath: [...rulePath, { propertyKey: key }],
          collector,
        },
      })
```

После формирования окончательного значения передать его общему накопителю. Накопитель сам вызывает зарегистрированные обработчики фактов и добавляет глобальную зависимость, если тип зарегистрировал `finalizeImportedYAML`:

```ts
if (yamlValue !== undefined) collector.acceptProperty({
  yamlPath: [...yamlPath, propertyRule.yaml ?? key],
  rulePath: [...rulePath, { propertyKey: key }],
  rule: propertyRule,
  value: yamlValue,
})
```

Для составного значения после обработки дочерних свойств вызвать `collector.completeValue(...)`. Накопитель не сохраняет само YAML-значение: в индекс метаданных он копирует только компактные факты, а в индекс зависимостей — значение ссылки или пути и его координаты.

Не собирать `Record<string, unknown>` исходных модельных значений. Для `derivedFrom.externalFile` достаточно `Set<string>` уже импортированных свойств; значение внешнего свойства обработать и освободить внутри текущей итерации.

Обернуть ошибку свойства точными координатами, не меняя исходную `cause`:

```ts
export class DirectImportConversionError extends Error {
  constructor(
    readonly yamlPath: YamlPath,
    readonly rulePath: readonly DeferredRulePathSegment[],
    cause: unknown
  ) {
    const yaml = `/${yamlPath.map(String).join("/")}`
    const rule = `/${rulePath.map(({ propertyKey }) => propertyKey).join("/")}`
    super(`Ошибка XML → YAML: yamlPath=${yaml}, rulePath=${rule}: ${errorMessage(cause)}`, { cause })
    this.name = "DirectImportConversionError"
  }
}
```

- [ ] **Step 6: Расширить тест таблицей существующего поведения свойств**

Добавить `it.each` для `xmlAliases`, `xmlParents`, `defaultValueXML`, `defaultValueXMLEmpty`, `fromXML: false`, `toYAML: false`, `implicitValueYAML` и внешнего файла. Для порядка и файла индекса повторно использовать `createConfigurationIndexCollector()` и ожидать прежние `aliases`, `order`, `present` после `collector.fragment("test.yaml")`.

```ts
it.each([
  ["alias", { Alias: "x" }, { xml: "Value", xmlAliases: ["Alias"], yaml: "Значение" }, "x"],
  ["parent", { Properties: { Value: "x" } }, { xml: "Value", xmlParents: ["Properties"], yaml: "Значение" }, "x"],
  ["default", {}, { xml: "Value", yaml: "Значение", defaultValueXML: "x" }, "x"],
])("preserves %s XML selection", (_name, xml, property, expected) => {
  expect(runSingleProperty(property, xml)).toEqual({ Значение: expected })
})
```

Добавить тест обработчика, который бросает `new Error("broken")`, и ожидать `DirectImportConversionError` с `yamlPath: ["Вложенный", "Значение"]`, структурным `rulePath` и `cause.message === "broken"`.

- [ ] **Step 7: Запустить проверки слоя свойств**

Run: `pnpm --filter @nkdk/core test -- metadata/orchestration/property/fromXMLToYAML.test.ts metadata/orchestration/property/fromXML.test.ts metadata/orchestration/property/toYAML.test.ts`

Expected: PASS, все выбранные файлы зелёные.

- [ ] **Step 8: Зафиксировать договор прямого преобразования**

```bash
git add packages/core/metadata/orchestration packages/core/metadata/project/localIndexes.ts packages/core/metadata/project/localIndexes.test.ts
git commit -m "feat: :sparkles: добавить договор прямого импорта XML в YAML"
```

---

### Task 2: Прямой рекурсивный обход metadata-item и обычных коллекций

**Files:**
- Create: `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts`
- Create: `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.test.ts`
- Create: `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.ts`
- Create: `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/index.ts`
- Modify: `packages/core/metadata/orchestration/index.ts`

**Interfaces:**
- Consumes: `importPropertiesFromXMLToYAML`, `ImportFromXMLToYAMLFunction`, `NestedItemRule`, `DirectImportTraversal` из Task 1.
- Produces: `importMetadataItemFromXMLToYAML(params)` и `importMetadataItemCollectionFromXMLToYAML(params)`, автоматически зарегистрированные фабриками правил.

- [ ] **Step 1: Написать падающий тест вложенного объекта**

```ts
it("builds a nested item without returning its model shape", () => {
  const childRule = {
    itemType: "TestChild",
    properties: {
      name: { type: "string", xml: "Name", yaml: "Имя" },
      enabled: { type: "boolean", xml: "Enabled", yaml: "Включено" },
    },
  } as MetadataItemRule
  registerMetadataItemRule({ propertyType: "TestChild" as PropertyRuleType, itemRule: childRule })

  const result = runDirectRule(
    { itemType: "TestOwner", properties: { child: { type: "TestChild", xml: "Child", yaml: "Дочерний" } } },
    { Child: { Name: "A", Enabled: true } }
  )

  expect(result.yaml).toEqual({ Дочерний: { Имя: "A", Включено: true } })
  expect(result.yaml).not.toHaveProperty("child")
})
```

- [ ] **Step 2: Написать падающие тесты YAML-записи и YAML-массива коллекции**

Проверить оба режима и пути отложенного свойства внутри каждого элемента:

```ts
expect(recordResult.yaml).toEqual({ Элементы: { Первый: { Значение: "a" } } })
expect(recordResult.localIndexes.dependencies).toEqual([
  {
    yamlPath: ["Элементы", "Первый", "Путь"],
    rulePath: [
      { propertyKey: "items", nestedItemType: "TestItem" },
      { propertyKey: "path" },
    ],
  },
])

expect(arrayResult.yaml).toEqual({ Элементы: [{ Имя: "Первый", Значение: "a" }] })
expect(arrayResult.localIndexes.dependencies).toEqual([
  {
    yamlPath: ["Элементы", 0, "Путь"],
    rulePath: [
      { propertyKey: "items", nestedItemType: "TestItem" },
      { propertyKey: "path" },
    ],
  },
])
```

- [ ] **Step 3: Запустить тесты и подтвердить падение на отсутствии регистраций**

Run: `pnpm --filter @nkdk/core test -- metadata/orchestration/metadataItem/fromXMLToYAML.test.ts metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts`

Expected: FAIL: для составного типа не зарегистрирован `importFromXMLToYAML`.

- [ ] **Step 4: Реализовать прямой metadata-item преобразователь**

`importMetadataItemFromXMLToYAML` должен раскрыть `XMLRoot`, если он задан, определить имя элемента до обхода остальных свойств и вызвать общий обход:

```ts
export function importMetadataItemFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: MetadataItemRule
  xml: unknown
  name?: string
  traversal: DirectImportTraversal
}): Record<string, unknown> | undefined {
  const source = params.rule.XMLRoot === undefined ? params.xml : asRecord(params.xml)?.[params.rule.XMLRoot]
  if (source === undefined) return undefined
  return importPropertiesFromXMLToYAML({
    context: params.context,
    rule: params.rule,
    xml: source,
    itemName: params.name,
    yamlPath: params.traversal.yamlPath,
    rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
    collector: params.traversal.collector,
  })
}
```

В `registerMetadataItemRule` зарегистрировать `importFromXMLToYAML` и `nestedItemRule` для `itemRule`.

- [ ] **Step 5: Реализовать прямой преобразователь обычной коллекции**

Преобразователь повторяет действующую нормализацию одиночного XML-элемента/обёртки, но каждый элемент сразу передаёт в `importMetadataItemFromXMLToYAML`. Ключ записи получить из YAML-имени, сформированного свойством `keyField`; модельный элемент не создавать:

```ts
const itemYaml = importMetadataItemFromXMLToYAML({
  context,
  rule: itemRule,
  xml: itemXml,
  name: itemName,
  traversal: enterNestedYamlRule({
    yamlPath: yamlAsArray ? [...traversal.yamlPath, index] : [...traversal.yamlPath, yamlKey],
    rulePath: traversal.rulePath,
    collector: traversal.collector,
  }, itemRule.itemType),
})
```

Для записи удалить YAML-поле ключа так же, как это делает `exportMetadataCollectionToYAMLAsRecord`; для массива оставить его. `recordYamlKeyFromItem` заменить нейтральным `recordYamlKeyFromYAML?: (params: { yaml: Record<string, unknown>; name: string }) => string`, сохранив старую функцию только для YAML → XML и иных модельных операций.

- [ ] **Step 6: Зарегистрировать стандартный прямой путь в фабрике коллекций**

Добавить в параметры фабрики:

```ts
fromXMLToYAML?: ImportFromXMLToYAMLFunction
recordYamlKeyFromYAML?: (params: { yaml: Record<string, unknown>; name: string }) => string
```

Если `fromXMLToYAML` не задан, регистрировать стандартный прямой преобразователь; одновременно всегда регистрировать `nestedItemRule: { itemRule }`.

- [ ] **Step 7: Запустить рекурсивные тесты и существующие тесты коллекций**

Run: `pnpm --filter @nkdk/core test -- metadata/orchestration/metadataItem metadata/orchestration/metadataCollection`

Expected: PASS; YAML-записи, массивы, вложенные отложенные пути и существующие модельные операции работают.

- [ ] **Step 8: Зафиксировать рекурсивный обход**

```bash
git add packages/core/metadata/orchestration
git commit -m "feat: :sparkles: строить вложенный YAML напрямую по rules.ts"
```

---

### Task 3: Особые коллекции без скрытого модельного пути

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/formCommand/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/types.ts`
- Create: `packages/core/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/types.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/types.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/types.ts`
- Test: существующие `fromXML.test.ts` и `toYAML.test.ts` в этих пяти каталогах

**Interfaces:**
- Consumes: параметр фабрики `fromXMLToYAML`, `importMetadataItemFromXMLToYAML`, `DirectImportTraversal` из Tasks 1–2.
- Produces: пять прямых обработчиков, каждый возвращает окончательный YAML коллекции и никогда не вызывает существующие `fromXML`/`toYAML` коллекции последовательно.

- [ ] **Step 1: Добавить проверки прямого обработчика в тесты пяти типов**

Для каждой коллекции получить `getTypeRule(type, "importFromXMLToYAML")`, вызвать его на существующем XML из теста и сравнить с существующим ожидаемым YAML:

```ts
const direct = getTypeRule("OrderItemFields", "importFromXMLToYAML")
if (direct === undefined) throw new Error("OrderItemFields direct converter is not registered")
expect(
  direct({
    context: mockContextFromXML({ exportToYAML: { toTyped: true } }),
    rule: { type: "OrderItemFields", yaml: "Поля" },
    xml: fixtureXML,
    traversal: { yamlPath: ["Поля"], rulePath: [{ propertyKey: "fields" }], collector: createLocalIndexesCollector() },
  })
).toEqual(fixtureYAML)
```

Повторить для `FormCommands`, `StandardAttributeDescriptions`, `CalculatedFieldOrderExpression` и `FilterItem`, используя их существующие константы фикстур.

- [ ] **Step 2: Запустить тесты и подтвердить, что фабрика пока выбирает неверный стандартный путь**

Run: `pnpm --filter @nkdk/core test -- metadata/forms/commonObjects/formCommand metadata/commonObjects/standardAttributeDescription metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression metadata/commonObjects/dataCompositionSystem/orderItemFields metadata/commonObjects/dataCompositionSystem/filterItem`

Expected: FAIL на различиях особых форм XML/YAML либо отсутствующем прямом обработчике.

- [ ] **Step 3: Реализовать прямые обработчики, объединив ветвления существующих процедур**

Каждый новый файл должен перенести только структурное ветвление из пары существующих процедур и делегировать обычный элемент общему преобразователю. Единый шаблон функции:

```ts
export const importOrderItemFieldsFromXMLToYAML: ImportFromXMLToYAMLFunction = (params) => {
  const items = normalizeOrderItemXML(params.xml)
  return items.map((item, index) => {
    if (isAutoOrderItemXML(item)) return "[Авто]"
    return importMetadataItemFromXMLToYAML({
      context: params.context,
      rule: OrderItemFieldRules,
      xml: item,
      traversal: enterNestedYamlRule({
        yamlPath: [...params.traversal.yamlPath, index],
        rulePath: params.traversal.rulePath,
        collector: params.traversal.collector,
      }, OrderItemFieldRules.itemType),
    })
  })
}
```

Остальные четыре обработчика реализовать по следующим точным правилам:

- `FilterItem` выбирает `FilterItemGroupRules` или `FilterItemComparisonRules` по XML-дискриминатору и рекурсивно передаёт путь массива.
- `FormCommands` сохраняет действующее сопоставление `_id`/имени, но сразу строит YAML-запись по имени команды.
- `StandardAttributeDescriptions` сразу вычисляет канонический YAML-ключ через `StandartAttributeNameToYAML`, не создавая `StandardAttributeDescription[]`.
- `CalculatedFieldOrderExpression` сохраняет нормализацию особой XML-обёртки и сразу строит YAML-массив.

- [ ] **Step 4: Подключить обработчики к пяти регистрациям**

В каждый вызов `registerMetadataItemCollectionRule` добавить точное поле:

```ts
fromXMLToYAML: importOrderItemFieldsFromXMLToYAML,
```

Для стандартных реквизитов также добавить:

```ts
recordYamlKeyFromYAML: ({ name }) => StandartAttributeNameToYAML[name as StandartAttributeName],
```

- [ ] **Step 5: Запустить проверки особых коллекций**

Run: команда из Step 2.

Expected: PASS; прямой результат совпадает с прежним YAML на неизменённых фикстурах.

- [ ] **Step 6: Зафиксировать особые коллекции**

```bash
git add packages/core/metadata/commonObjects packages/core/metadata/forms/commonObjects/formCommand
git commit -m "feat: :sparkles: импортировать особые коллекции напрямую в YAML"
```

---

### Task 4: Прямой импорт форм и плоских адресов элементов

**Files:**
- Create: `packages/core/metadata/forms/elements/orchestration/fromXMLToYAML.ts`
- Create: `packages/core/metadata/forms/elements/orchestration/fromXMLToYAML.test.ts`
- Create: `packages/core/metadata/forms/commonObjects/childItems/fromXMLToYAML.ts`
- Create: `packages/core/metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/forms/elements/orchestration/ruleFactory.ts`
- Modify: `packages/core/metadata/forms/commonObjects/childItems/fromXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/index.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Create: `packages/core/metadata/validation/projectValidationPendingChecks.test.ts`

**Interfaces:**
- Consumes: прямой metadata-item обход и `DeferredImportedYamlValue`.
- Produces: `importClientApplicationFormFromXMLToYAML(params): DirectImportResult`, одинаковый по форме результата с обычными объектами; import накапливает пути во время построения YAML.

- [ ] **Step 1: Добавить тест прямого элемента и single-элемента формы**

Проверить, что обычный элемент адресуется только своим именем, а single-элемент остаётся свойством родительского элемента. Его внутреннее имя вычисляется как `<имя родителя><канонический постфикс>`, а логический адрес имеет вид `Форма.Элемент.<имя родителя>.<вид single-элемента>`; числовой XML `_id` сохраняется через действующий индекс конфигурации:

```ts
expect(result.yaml).toMatchObject({
  Элементы: {
    Поле: {
      Вид: "Поле",
      ПутьКДанным: "Объект.Наименование",
      КонтекстноеМеню: {},
      РасширеннаяПодсказка: {},
    },
  },
})
expect(result.localIndexes.dependencies).toContainEqual({
  yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
  rulePath: [
    { propertyKey: "childItems", nestedItemType: "InputField" },
    { propertyKey: "dataPath" },
  ],
})
```

- [ ] **Step 2: Добавить тест формы на существующих `minimal.xml` и `minimalMetadata.xml`**

```ts
const result = importClientApplicationFormFromXMLToYAML({
  context: mockContextFromXML({ exportToYAML: { toTyped: true } }),
  formName: "Форма",
  formXML: parsedMinimalForm.Form,
  metadataXML: parsedMinimalMetadata.MetaDataObject,
})

expect(result.yaml).toEqual(minimalClientApplicationFormYAML)
expect(result).not.toHaveProperty("model")
expect(result).not.toHaveProperty("xml")
```

Импортировать `minimalClientApplicationFormYAML` из `./__fixtures__/data`, а оба XML разобрать существующим `importContentFromXML`; XML-файлы не менять.

- [ ] **Step 3: Запустить тесты и подтвердить отсутствие прямого обработчика формы**

Run: `pnpm --filter @nkdk/core test -- metadata/forms/elements/orchestration/fromXMLToYAML.test.ts metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`

Expected: FAIL с отсутствующими функциями прямого импорта.

- [ ] **Step 4: Реализовать прямой обход элемента формы**

В фабрике element rules регистрировать `importFromXMLToYAML` тем же способом, что для metadata-item. Преобразователь элемента добавляет `Вид`, затем вызывает `importPropertiesFromXMLToYAML`:

```ts
export function importFormElementFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: ElementRule & { itemType: CollectableElementType }
  xml: ElementXML
  name: string
  traversal: DirectImportTraversal
}): Record<string, unknown> {
  return {
    Вид: CollectableElementTypeToYAML[params.rule.itemType],
    ...importPropertiesFromXMLToYAML({
      context: params.context,
      rule: params.rule,
      xml: params.xml,
      itemName: params.name,
      yamlPath: params.traversal.yamlPath,
      rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
      collector: params.traversal.collector,
    }),
  }
}
```

Для каждого `registerElementAsType` дополнительно зарегистрировать `nestedItemRule: { itemRule: elementRule }`; это позволяет восстановить правило single-элемента во втором проходе без проверки его типа в общем слое.

- [ ] **Step 5: Реализовать прямое YAML-дерево child items**

Каждое свойство `ChildItems` должно сразу строить существующее YAML-дерево: запись текущей коллекции индексируется по `Name`, а вложенное свойство следующей коллекции остаётся под YAML-ключом `Элементы`. При этом логический адрес файла индекса конфигурации для любого обычного элемента строится существующим `getConfigurationIndexFormElementLogicalAddress(collection, itemName)` и имеет вид `Форма.Элемент.<имя>` без цепочки родительских групп. `ContextMenu`, `ExtendedTooltip`, `AutoCommandBar` и другие single-элементы не добавлять в карту `ChildItems`: они обрабатываются прямым обходом свойства родительского `ElementRule` и остаются вложенным YAML-свойством родителя:

```ts
export const importChildItemsFromXMLToYAML: ImportFromXMLToYAMLFunction = (params) => {
  if (params.xml === undefined) return undefined
  const items = (Array.isArray(params.xml) ? params.xml : [params.xml]) as Array<Record<string, ElementXML>>
  const result: Record<string, unknown> = {}

  for (const item of items) {
    const xmlTag = Object.keys(item)[0]
    if (xmlTag === undefined) continue
    const xmlValue = item[xmlTag]
    if (xmlValue === undefined) continue
    const itemType = resolveItemTypeFromXMLTag(params.rule, xmlTag, xmlValue) as CollectableElementType
    const itemName = requireElementName(xmlValue)
    const itemContext = withFormElementIndexContext(params.context, itemName, xmlValue._id)
    result[itemName] = importFormElementFromXMLToYAML({
      context: itemContext,
      rule: getElementRule(itemType) as ElementRule & { itemType: CollectableElementType },
      xml: xmlValue,
      name: itemName,
      traversal: enterNestedYamlRule({
        yamlPath: [...params.traversal.yamlPath, itemName],
        rulePath: params.traversal.rulePath,
        collector: params.traversal.collector,
      }, itemType),
    })
  }

  return Object.keys(result).length === 0 ? undefined : result
}

function requireElementName(xml: ElementXML): string {
  if (typeof xml._name !== "string" || xml._name.length === 0) throw new Error("У элемента формы отсутствует name")
  return xml._name
}

function withFormElementIndexContext(
  context: ConfigurationContextFromXML,
  itemName: string,
  xmlId: string
): ConfigurationContextFromXML {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return context
  const address = getConfigurationIndexFormElementLogicalAddress(collection, itemName)
  collection.collector.setXmlId(address, xmlId)
  return withConfigurationIndexLogicalAddress(context, address)
}
```

Экспортировать существующий `resolveItemTypeFromXMLTag` из `childItems/fromXML.ts` и переиспользовать его, включая различение кнопок командной панели и табличных полей. `withFormElementIndexContext` реализовать в новом файле через существующие `getConfigurationIndexCollectionContext`, `getConfigurationIndexFormElementLogicalAddress`, `withConfigurationIndexLogicalAddress` и `collector.setXmlId`. Прямой обработчик single-свойства получает имя родителя, вычисляет внутреннее имя через зарегистрированный `canonicalSuffix` и передаёт собственный сегмент в контекст файла индекса конфигурации; условий по конкретным элементам в общий property orchestration не добавлять.

Для каждого значения `childItemsTreePropertyTypes` зарегистрировать прямой обработчик и полиморфный переход правила:

```ts
for (const propertyType of childItemsTreePropertyTypes) {
  registerTypeRule(propertyType, "importFromXMLToYAML", importChildItemsFromXMLToYAML)
  registerTypeRule(propertyType, "nestedItemRule", {
    resolveItemRule(itemType) {
      return getElementRule(itemType as ElementType)
    },
  })
}
```

- [ ] **Step 6: Реализовать объединение Form XML и metadata XML**

`importClientApplicationFormFromXMLToYAML` должен:

1. определить тип формы из metadata XML;
2. потребовать `Form.xml` только для управляемой формы;
3. прямым обходом `ClientApplicationFormRules` обработать теги `Form` и `Metadata`;
4. объединить результаты через `Object.assign` в порядке существующего `fromXML`;
5. вернуть `{ yaml, localIndexes, generatedFiles }`.

Сигнатура:

```ts
export function importClientApplicationFormFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  formName: string
  formXML?: ClientApplicationFormXML
  metadataXML: FormMetadataXML
}): DirectImportResult
```

- [ ] **Step 7: Перевести validation на общий механизм построения путей**

Не вызывать validation-обход после XML → YAML. Вместо этого использовать созданные в Task 1 `YamlRuleCursor`, `enterYamlProperty` и `enterNestedYamlRule` в существующих `collectElementTreeChecks` и `collectRuleDataPathChecks` из `yamlFactExtractor.ts`.

Import вызывает эти функции курсора в момент записи каждого YAML-свойства. Validation вызывает те же функции курсора при чтении существующего YAML. Поэтому обе операции получают одинаковые координаты, но каждая обходит свои исходные данные только один раз:

```ts
const propertyCursor = enterYamlProperty({
  cursor,
  propertyKey,
  yamlKey: rule.yaml,
})

checks.push({
  ...validationFields,
  yamlPath: propertyCursor.yamlPath,
  rule,
  value,
})
```

Для дочернего элемента формы validation сначала вызывает `enterYamlProperty` для `childItems`/`Элементы`, затем `enterNestedYamlRule` с типом, определённым действующим `elementTypeFromYaml`. Аналогично добавить обход single-свойств по зарегистрированному `nestedItemRule`; это закрывает пути `КонтекстноеМеню` и `РасширеннаяПодсказка`, не создавая отдельного import-обхода YAML.

В `yamlFactExtractor.form.test.ts` добавить отдельную validation-проверку `DataPath` внутри single-элемента. Тест должен подтвердить не только построение пути, но и создание обычного `ValidationPendingCheck`:

```ts
expect(facts.pendingChecks).toEqual(
  expect.arrayContaining([
    expect.objectContaining({
      kind: "dataPath",
      value: "Объект.Товары.LineNumber",
      yamlPath: [
        "Элементы",
        "Таблица",
        "КонтекстноеМеню",
        "Элементы",
        "Открыть",
        "Данные",
      ],
      policy: "formDataPath",
    }),
  ])
)
```

Затем в `projectValidationPendingChecks.test.ts` передать эту проверку в `validatePendingChecks` с owner cache. Для разрешимого пути ожидать отсутствие диагностики, для неразрешимого — validation-диагностику с `source: "reference"`, полным `path` и сообщением `ПутьКДанным "...": ...`. Это закрепляет, что single-элементы не просто перечисляются, а действительно валидируются тем же механизмом, что обычные элементы формы.

- [ ] **Step 8: Запустить тесты форм и существующие validation-тесты формы**

Run: `pnpm --filter @nkdk/core test -- metadata/forms/clientApplicationForm metadata/forms/elements metadata/forms/commonObjects/childItems metadata/orchestration/property/yamlRuleCursor.test.ts metadata/validation/yamlFactExtractor.form.test.ts metadata/validation/projectValidationPendingChecks.test.ts`

Expected: PASS; import и validation строят одинаковые `yamlPath`/`rulePath` через общий курсор, import не обходит сформированный YAML повторно, форма не содержит `model`, логические адреса элементов плоские, числовые `_id` остаются в файле индекса конфигурации.

- [ ] **Step 9: Зафиксировать прямой импорт форм**

```bash
git add packages/core/metadata/forms packages/core/metadata/validation/yamlFactExtractor.ts
git commit -m "feat: :sparkles: импортировать формы напрямую в YAML"
```

---

### Task 5: Отложенное уточнение YAML и однопроходный локальный индекс формы

**Files:**
- Create: `packages/core/metadata/orchestration/property/finalizeImportedYAML.ts`
- Create: `packages/core/metadata/orchestration/property/finalizeImportedYAML.test.ts`
- Create: `packages/core/metadata/validation/dataPath/formYamlIndex.ts`
- Create: `packages/core/metadata/validation/dataPath/formYamlIndex.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/dataPathStandardMembers.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/toYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`

**Interfaces:**
- Consumes: `DeferredImportedYamlValue`, `NestedItemRule`, `FinalizeImportedYAMLFunction`, `OwnerMetadataCache`.
- Produces: `finalizeImportedYamlValues(params)` и `createFormDataPathIndexCollector(params)`.

- [ ] **Step 1: Написать падающий тест чтения и замены вложенных YAML-путей**

```ts
it.each([
  [["Объект", "Путь"], { Объект: { Путь: "old" } }],
  [["Массив", 0, "Путь"], { Массив: [{ Путь: "old" }] }],
  [["Запись", "Ключ", "Путь"], { Запись: { Ключ: { Путь: "old" } } }],
])("finalizes only %j", (yamlPath, yaml) => {
  finalizeImportedYamlValues({
    yaml,
    rootRule,
    deferred: [{
      yamlPath,
      rulePath: [
        { propertyKey: "items", nestedItemType: "TestItem" },
        { propertyKey: "path" },
      ],
    }],
    context,
  })
  expect(readYamlPath(yaml, yamlPath)).toBe("new")
  expect(unchangedSibling(yaml)).toBe("keep")
})
```

Добавить отдельный тест: отсутствующий `yamlPath` и неверный `rulePath` бросают внутреннюю ошибку с обоими путями в сообщении.

- [ ] **Step 2: Написать падающий тест накопления индекса формы во время обхода**

```ts
const collector = createFormDataPathIndexCollector({ filePath: "Формы/Форма.yaml" })
collector.acceptProperty(formAttributeFact("Объект", { Тип: "СправочникОбъект.Контрагенты" }))
collector.acceptProperty(formAttributeFact("Таблица", { Тип: "ТаблицаЗначений" }))
collector.acceptProperty(formColumnFact("Таблица", "Код", { Тип: "Строка" }))
const index = collector.finish()

expect(index.getRoot("Объект")?.kind).toBe("formAttribute")
expect(index.getRoot("Таблица")?.tableSource?.columns.has("Код")).toBe(true)
```

- [ ] **Step 3: Запустить тесты и подтвердить падение**

Run: `pnpm --filter @nkdk/core test -- metadata/orchestration/property/finalizeImportedYAML.test.ts metadata/validation/dataPath/formYamlIndex.test.ts`

Expected: FAIL на отсутствующих функциях.

- [ ] **Step 4: Реализовать поиск правила по декларативному пути**

В `finalizeImportedYAML.ts` не сохранять ссылку на `PropertyRule` в отложенной записи. Восстанавливать правило так:

```ts
export function resolveDeferredPropertyRule(
  rootRule: MetadataItemRule,
  rulePath: readonly DeferredRulePathSegment[]
): PropertyRule {
  let itemRule = rootRule
  for (const [index, segment] of rulePath.entries()) {
    const propertyRule = itemRule.properties[segment.propertyKey]
    const printablePath = rulePath.map(({ propertyKey, nestedItemType }) =>
      nestedItemType === undefined ? propertyKey : `${propertyKey}:${nestedItemType}`
    ).join("/")
    if (propertyRule === undefined) throw new Error(`Не найден rulePath /${printablePath}`)
    if (index === rulePath.length - 1) return propertyRule
    const nested = getTypeRule(propertyRule.type, "nestedItemRule")
    if (nested === undefined) throw new Error(`rulePath проходит через атомарное свойство ${segment.propertyKey}`)
    itemRule = "itemRule" in nested
      ? nested.itemRule
      : nested.resolveItemRule(requireNestedItemType(segment, printablePath))
  }
  throw new Error("Пустой rulePath отложенного YAML")
}

function requireNestedItemType(segment: DeferredRulePathSegment, printablePath: string): string {
  if (segment.nestedItemType === undefined) throw new Error(`В rulePath /${printablePath} отсутствует nestedItemType`)
  return segment.nestedItemType
}
```

`finalizeImportedYamlValues` читает значение, вызывает зарегистрированный обработчик ровно один раз и записывает результат по тому же пути.

- [ ] **Step 5: Перевести индекс формы на события общего обхода**

Перенести логику `buildFormDataPathIndexFromYaml`, `addAdditionalColumnsFromYaml`, `columnsFromYaml`, `normalizeIndexedPath` из `yamlFactExtractor.ts` в поэтапный накопитель `formYamlIndex.ts`. Он принимает события свойств формы в естественном порядке общего обхода и не получает корневой YAML-объект:

```ts
export function createFormDataPathIndexCollector(params: {
  filePath: string
}): Pick<LocalIndexesCollector, "acceptProperty" | "completeValue"> & {
  finish(): FormDataPathIndex
}
```

Import и validation передают одинаковые события с одним `YamlRuleCursor`. Validation дополнительно передаёт компактную исходную позицию, поэтому диагностики дублей сохраняют точные строку и колонку. Накопитель копирует только сведения о реквизитах, колонках и типах; ссылки на исходные составные YAML-объекты не сохраняет.

- [ ] **Step 6: Зарегистрировать окончательное форматирование `DataPath`**

В `toYAML.ts` для metadata path оставить текущий `exportToYAML` как предварительное форматирование и добавить:

```ts
registerTypeRule("DataPath", "finalizeImportedYAML", ({ context, value, formDataPathIndex }) => {
  if (typeof value !== "string" || formDataPathIndex === undefined) return value
  const ownerCache = context.exportToYAML?.ownerMetadataCache
  if (ownerCache === undefined) return value
  return formatDataPathStandardMembers({
    value,
    direction: "internal-to-yaml",
    index: formDataPathIndex,
    ownerCache,
    ...(context.exportToYAML?.dataPathDiagnosticSink === undefined
      ? {}
      : { diagnosticSink: context.exportToYAML.dataPathDiagnosticSink }),
  })
})
```

В `dataPathStandardMembers.ts` выделить функцию, принимающую готовые `FormDataPathIndex` и `OwnerMetadataCache`, чтобы новый обработчик не создавал модель формы из `formAttributes`.

`importClientApplicationFormFromXMLToYAML` получает индекс формы из `localIndexes.metadata.formDataPathIndex`, уже заполненного во время построения YAML. Повторный обход готовой формы запрещён тестом накопителя.

- [ ] **Step 7: Проверить разрешённый и неразрешимый `DataPath`**

Добавить тесты: разрешённый `Объект.Товары.LineNumber` становится `Объект.Товары.НомерСтроки`; неразрешимый путь остаётся без изменения и один раз поступает в `dataPathDiagnosticSink`.

Run: `pnpm --filter @nkdk/core test -- metadata/orchestration/property/finalizeImportedYAML.test.ts metadata/validation/dataPath metadata/commonObjects/metadataPath`

Expected: PASS, обработчик вызван один раз на каждый сохранённый путь.

- [ ] **Step 8: Зафиксировать отложенное уточнение**

```bash
git add packages/core/metadata/orchestration/property packages/core/metadata/validation packages/core/metadata/commonObjects/metadataPath
git commit -m "feat: :sparkles: уточнять импортированные YAML-значения по путям"
```

---

### Task 6: Общий накопитель локальных индексов и последовательная validation

**Files:**
- Modify: `packages/core/metadata/project/localIndexes.ts`
- Modify: `packages/core/metadata/project/localIndexes.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerFacts.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/validation/projectValidationPendingChecks.ts`
- Modify: `packages/core/metadata/validation/projectValidationPendingChecks.test.ts`
- Modify: `packages/core/metadata/validation/yamlLocations.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`
- Modify: `packages/core/metadata/validation/dataPath/policies.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/metadata/project/prepareYamlFiles.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Modify: `packages/core/metadata/importFromXml/ownerFacts.ts`

**Interfaces:**
- Consumes: окончательные YAML-значения свойств, `PropertyRule`, `YamlRuleCursor`, владелец и необязательная исходная позиция.
- Produces: `LocalMetadataIndex`, `LocalDependencyIndex` и компактное состояние второго прохода без ссылок на YAML.

- [ ] **Step 1: Написать падающий тест общего накопителя**

Передать двум накопителям одинаковую последовательность событий, имитирующую import и validation: тип владельца, обычный реквизит, реквизит табличной части, стандартный реквизит, владельцев и `DataPath`. Ожидать одинаковые локальные индексы. Дополнительно проверить `task`, `registerRecords`, `chartOfAccounts`, `extDimensionTypes`, `accountingFlags` и `commonAttributeOwnerLinks`.

Тест должен считать вызовы `acceptProperty` и подтверждать, что корневой YAML-объект накопителю не передаётся и повторный обход после `finish()` не выполняется.

- [ ] **Step 2: Ввести зарегистрированные обработчики фактов**

Добавить нейтральную операцию типа свойства `collectLocalFactsFromYAML`. Обработчик получает одно окончательное YAML-значение и может добавить компактные сведения в индекс метаданных или зависимость в индекс зависимостей. Если смысл зависит от свойства, `PropertyRule` задаёт `ownerFactRole`; общие слои не проверяют модельные ключи или конкретные `itemType`.

`LocalIndexesCollector.acceptProperty` вызывает зарегистрированный обработчик сразу. `completeValue` используется только для фактов, которым нужен завершённый составной фрагмент, но обработчик не должен заново обходить этот фрагмент: дочерние факты уже накоплены событиями. `finish()` только упаковывает накопленные данные.

- [ ] **Step 3: Перевести import и validation на один поток событий**

Прямой XML → YAML вызывает накопитель сразу после записи окончательного YAML-значения свойства. `yamlFactExtractor.ts` во время существующего обхода YAML вызывает тот же накопитель с тем же `YamlRuleCursor`; отдельные `syntheticModelFromYaml`, `buildObjectFieldIndexFromSyntheticModel` и `createValidationOwnerFactsFromYaml` не вводить.

Validation передаёт исходную позицию свойства, import её не передаёт. На одинаковой последовательности YAML-значений локальные индексы должны совпадать байт-в-байт после кодирования.

- [ ] **Step 4: Сделать зависимости независимыми от разобранного YAML**

В `yamlLocations.ts` ввести компактный `YamlDiagnosticLocation` с `filePath`, `line`, `col` и строковым `path`, а также функции получения позиции из `ParsedYaml` и построения диагностики по готовой позиции. Убрать `ParsedYaml` из `ValidationPendingCheck`: при событии зависимости вычислять позицию один раз. `resolveDataPath` и `validateResolvedDataPathPolicy` строят отложенные диагностики по готовой позиции.

Проверить, что локальный индекс зависимостей не содержит корневой YAML, `ParsedYaml`, location index или замыкания на них.

- [ ] **Step 5: Обрабатывать по одному YAML-файлу на worker validation**

Validation больше не должна вызывать маршрут, который сначала складывает разобранные данные всех файлов в `preparedYamlFiles`. Главный процесс обнаруживает и классифицирует YAML-файлы, инициализирует validation worker, затем передаёт каждому worker его список описаний файлов.

Worker последовательно выполняет для каждого описания:

1. прочитать и разобрать YAML;
2. извлечь объявления проекта, выполнить JSON Schema и дополнительные проверки;
3. одним обходом `rules.ts` передать значения общему накопителю и получить оба локальных индекса;
4. сохранить только диагностики, индексы и отложенные проверки;
5. в `finally` удалить все ссылки на текст, `ParsedYaml` и YAML-данные до чтения следующего файла.

Выделить из `prepareYamlFiles.ts` обработку одного файла, чтобы объявления проекта и validation не требовали повторного чтения. Generic-подготовку для других операций не ломать, но validation не должна использовать её режим с сохранением `data` всех файлов.

- [ ] **Step 6: Упростить второй проход validation**

Второй проход работает только с объединённым индексом метаданных, индексом зависимостей и компактными позициями. Удалить создание `ProjectYamlCache` и параметры `cache`/`parsed` из внутреннего договора второго прохода. После первого прохода в worker не должно быть глобальной коллекции разобранных YAML.

- [ ] **Step 7: Проверить один проход и время жизни YAML**

Добавить счётчик только для тестов: число одновременно удерживаемых разобранных YAML на worker и число событий свойств. Интеграционный тест validation должен подтвердить:

- максимум один разобранный YAML на worker;
- после первого прохода сохранено ноль разобранных YAML;
- каждый YAML-файл прочитан и разобран один раз;
- каждый путь правила передан накопителю один раз;
- второй проход сохраняет прежние диагностики и точные позиции.

Run: `pnpm --filter @nkdk/core test -- metadata/project/localIndexes.test.ts metadata/validation/projectValidationPendingChecks.test.ts metadata/validation/projectValidationPasses.test.ts metadata/validation/validateProject.test.ts`

Expected: PASS; import и validation используют один накопитель, validation не хранит разобранный проект и не перечитывает файлы.

- [ ] **Step 8: Зафиксировать общий однопроходный сбор**

```bash
git add packages/core/metadata/orchestration packages/core/metadata/validation packages/core/metadata/project packages/core/metadata/importFromXml/ownerFacts.ts
git commit -m "refactor: :recycle: собирать локальные индексы за один проход"
```

---

### Task 7: Безмодельное состояние первого прохода и worker второго прохода

**Files:**
- Rename: `packages/core/metadata/importFromXml/prepareModel.ts` → `packages/core/metadata/importFromXml/prepareYaml.ts`
- Rename: `packages/core/metadata/importFromXml/prepareModel.test.ts` → `packages/core/metadata/importFromXml/prepareYaml.test.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/ownerFacts.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`

**Interfaces:**
- Consumes: `DirectImportResult`, `LocalIndexes`, `finalizeImportedYamlValues`.
- Produces: `PreparedImportYaml` и полностью безмодельный двухпроходный worker при неизменном внешнем `ImportWorkerCommand`/`ImportWorkerCommandResult`.

- [ ] **Step 1: Переписать тест подготовки задания на YAML-состояние**

Во всех тестах `prepareModel.test.ts` заменить ожидания модели на окончательный предварительный YAML и отсутствие запрещённых полей:

```ts
const prepared = await prepareImportYaml({
  assignment,
  context: mockContextFromXML({ exportToYAML: { toTyped: true } }),
  collector: createConfigurationIndexCollector(),
})

expect(prepared.yaml).toMatchObject({ Имя: "Контрагенты" })
expect(prepared.localIndexes.dependencies).toEqual(expect.any(Array))
expect(prepared).not.toHaveProperty("model")
expect(prepared).not.toHaveProperty("xml")
expect(prepared.generatedFiles).toEqual([])
expect(writeFile).not.toHaveBeenCalled()
```

Сохранить тесты кэша зарегистрированных правил, двух XML формы, обычной/управляемой формы и внешних файлов владельца.

- [ ] **Step 2: Переписать worker-тесты на хранение YAML**

Переименовать описания и добавить тестовую форму состояния без выдачи содержимого наружу:

```ts
expect(workerStateForTests()).toMatchObject({ preparedYamlIds: [assignment.id] })
expect(workerStateForTests()).not.toHaveProperty("preparedModels")
expect(workerStateForTests()).not.toHaveProperty("preparedXml")
```

В тесте профиля ожидать `Преобразование XML в YAML` и вложенное время `Сбор локальных индексов`; явно проверить отсутствие отдельного этапа обхода готового YAML, а также строк `Построение модели` и `Экспорт модели в YAML-объект`.

- [ ] **Step 3: Запустить тесты и подтвердить падение на старом состоянии**

Run: `pnpm --filter @nkdk/core test -- metadata/importFromXml/prepareYaml.test.ts metadata/importFromXml/worker.test.ts`

Expected: FAIL: старый код экспортирует `prepareImportModel`, `model` и модельные этапы профиля.

- [ ] **Step 4: Ввести `PreparedImportYaml` и прямую подготовку обычного объекта**

В `prepareYaml.ts` определить:

```ts
export interface PreparedImportYaml {
  assignment: ImportAssignment
  targetProjectPath: string
  yaml: unknown
  rule: MetadataItemRule
  ownerContext: readonly MetadataItemOwnerContextEntry[]
  localIndexes: LocalIndexes
  generatedFiles: ExternalFileEntry[]
}
```

`prepareImportYaml` сохраняет действующие `readAndParseAssignmentXml`, `mapPropertyXml`, кэш правил и сборщик файла индекса конфигурации, но вместо `prepareAppliedObjectModelFromXML` вызывает прямой metadata-item преобразователь. Для корня конфигурации объединяет metadata XML и property XML тем же нейтральным маршрутом `filePath`, не вызывая `prepareConfigurationModelFromXML`.

`prepareImportYaml` сохраняет оба локальных индекса из нейтрального результата. Worker не проверяет `itemType`, XML-корень или признак формы.

- [ ] **Step 5: Подключить прямой обработчик формы и гарантировать освобождение XML**

В ветке file item вызвать `importClientApplicationFormFromXMLToYAML`. Сохранить `try/finally`, но после возврата `PreparedImportYaml` не должно быть замыканий на `xmlInputs`:

```ts
let xmlInputs: ParsedImportXmlInput[] | undefined
try {
  xmlInputs = await readAndParseAssignmentXml(params.assignment.xmlFiles, params.profiler)
  return prepareAssignmentYaml({ ...params, xmlInputs })
} finally {
  xmlInputs = undefined
}
```

Удалить импорты `prepareConfigurationModelFromXML`, `prepareAppliedObjectModelFromXML`, `prepareClientApplicationFormModelFromXML`, `buildFormDataPathIndex` и `parseMetadataYaml`.

- [ ] **Step 6: Заменить `preparedModels` на `preparedYaml` в worker**

Первый проход:

```ts
const prepared = await prepareImportYaml({ assignment, context: state.context, collector, profiler })
preparedYaml.set(assignment.id, prepared)
```

`prepared.localIndexes` уже заполнен тем же обходом, который построил `prepared.yaml`; после `prepareImportYaml` нельзя вызывать извлечение фактов из готового YAML.

Второй проход для каждого задания:

```ts
profiler.measure(
  "Подготовка импорта конфигурации",
  "Уточнение отложенных значений YAML",
  { items: prepared.localIndexes.dependencies.length },
  () => finalizeImportedYamlValues({
    yaml: prepared.yaml,
    rootRule: prepared.rule,
    deferred: prepared.localIndexes.dependencies,
    context: contextWithOwners,
    formDataPathIndex: prepared.localIndexes.metadata.formDataPathIndex,
  })
)
```

После этого выполнить только `exportToYAML(prepared.yaml)`, запись основного YAML и `prepared.generatedFiles`. Удалить `exportPreparedYaml`, `exportMetadataItemToYAML`, `exportClientApplicationFormToYAML` и тип `ClientApplicationForm` из worker.

- [ ] **Step 7: Сохранить семантику ошибок и очистки состояния**

В `finally` второго прохода удалять запись `preparedYaml.delete(id)`. При ошибке первого прохода не добавлять состояние, фрагмент индекса или owner facts. Существующие тесты продолжения после ошибки, предупреждения `unresolved_data_path`, ошибки записи и `dispose` должны остаться зелёными.

Не добавлять в этой задаче раннюю запись YAML для заданий с пустым списком глобальных зависимостей: `preparedYaml` сохраняет все задания до второго прохода. Это намеренное временное ограничение, зафиксированное в `.agents/restrictions.md`.

- [ ] **Step 8: Запустить тесты import worker**

Run: `pnpm --filter @nkdk/core test -- metadata/importFromXml`

Expected: PASS; первый проход ничего не пишет, второй пишет тот же YAML и внешние файлы, `preparedYamlIds` очищаются после ошибки и успеха.

- [ ] **Step 9: Проверить типы core**

Run: `pnpm --filter @nkdk/core type-check`

Expected: exit code 0 без ошибок TypeScript.

- [ ] **Step 10: Зафиксировать замену worker-состояния**

```bash
git add packages/core/metadata/importFromXml
git commit -m "refactor: :recycle: хранить YAML вместо модели при XML-импорте"
```

---

### Task 8: Архитектурные границы, профиль ERP и полная проверка

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `.agents/architecture.md` only if implementation names differ from the already documented direct-import stages
- Verify: `docs/superpowers/specs/2026-07-21-direct-xml-to-yaml-import-design.md`

**Interfaces:**
- Consumes: завершённый безмодельный import worker.
- Produces: автоматическая защита архитектурной границы, актуальные этапы профиля и измеренный результат импорта ERP.

- [ ] **Step 1: Добавить архитектурный тест запрета модельного импорта**

В `importBoundaries.test.ts` прочитать исходники `importFromXml/prepareYaml.ts` и `importFromXml/worker.ts` и запретить конкретные зависимости:

```ts
expect(source).not.toMatch(/prepare(?:AppliedObject|Configuration|ClientApplicationForm)ModelFromXML/)
expect(source).not.toMatch(/exportMetadataItemToYAML/)
expect(source).not.toMatch(/exportClientApplicationFormToYAML/)
expect(source).not.toMatch(/PreparedImportModel|preparedModels/)
```

Также проверить, что `importFromXml` не содержит ветвлений по конкретному `DataPath`; зависимость должна находиться только через `getTypeRule(..., "finalizeImportedYAML")`.

- [ ] **Step 2: Запустить архитектурный тест**

Run: `pnpm --filter @nkdk/core test -- metadata/importBoundaries.test.ts`

Expected: PASS; старые модельные точки входа недоступны import worker.

- [ ] **Step 3: Уточнить этапы профиля главного процесса и worker**

В тестах профиля проверить точный набор новых подэтапов:

```ts
expect(profileSubsteps).toEqual(expect.arrayContaining([
  "Чтение XML",
  "Парсинг XML",
  "Преобразование XML в YAML",
  "Сбор локальных индексов",
  "Извлечение данных для индекса конфигурации",
  "Уточнение отложенных значений YAML",
  "Сериализация YAML",
  "Запись основного YAML-файла",
  "Запись связанного файла",
]))
expect(profileSubsteps).not.toContain("Построение модели")
expect(profileSubsteps).not.toContain("Экспорт модели в YAML-объект")
```

Переименовать текущее `Запись сгенерированного файла YAML` в архитектурное `Запись связанного файла`.

- [ ] **Step 4: Запустить целевые тесты CLI и core**

Run: `pnpm --filter @nkdk/core test -- metadata/importFromXml metadata/importBoundaries.test.ts && pnpm --filter @nkdk/cli test -- src/commands/import.test.ts`

Expected: обе команды PASS; внешний CLI остаётся `nkdk import <xml-dir> <yaml-dir>`.

- [ ] **Step 5: Выполнить полный набор тестов проекта**

Run: `pnpm test`

Expected: exit code 0, все пакеты `packages/*` зелёные.

- [ ] **Step 6: Выполнить профиль ERP в новом временном каталоге**

Не очищать пользовательский `/Users/nikita/git/nkdk-yaml/cf` для измерения. Создать новый каталог и запустить существующий CLI:

```bash
PROFILE_DIR="$(mktemp -d /tmp/nkdk-erp-direct-import.XXXXXX)"
printf '%s\n' "$PROFILE_DIR" > /tmp/nkdk-erp-direct-import.path
/usr/bin/time -l env NKDK_PROFILE=1 pnpm --filter @nkdk/cli dev -- import /Users/nikita/git/round-trip/cf/erp "$PROFILE_DIR"
```

Expected:

- exit code 0;
- в сводной таблице есть первый и второй worker-проходы;
- нет этапов `Построение модели` и `Экспорт модели в YAML-объект`;
- есть `Преобразование XML в YAML`, вложенное время `Сбор локальных индексов`, `Уточнение отложенных значений YAML`, `Сериализация YAML`, `Запись основного YAML-файла`, `Запись связанного файла`;
- отсутствует отдельный этап повторного обхода готового YAML;
- сохранить в комментарии к итоговому коммиту общее время, пиковый RSS, число успешных заданий, предупреждений и ошибок для сравнения с исходными `205.6s` и `6381.5 MiB`.

- [ ] **Step 7: Проверить результат импорта ERP**

Run: `pnpm --filter @nkdk/cli dev -- validate "$(cat /tmp/nkdk-erp-direct-import.path)"`

Expected: exit code 0, ошибок validation нет. Предупреждения допустимы только те, которые уже присутствовали в исходном импорте; новые `unresolved_data_path` перечислить и исследовать до завершения.

- [ ] **Step 8: Сверить документацию с фактическими именами этапов**

Проверить разделы «Подготовка импорта конфигурации», «Импорт XML → YAML» и словарь данных в `.agents/architecture.md`. Если код использует имена из плана, файл не менять. Если имя было вынужденно уточнено, заменить его одновременно в таблице операций, потоке данных и профилировании; не добавлять новую архитектурную сущность для временного типизированного значения.

- [ ] **Step 9: Зафиксировать границы и профиль**

```bash
git add packages/core/metadata/importBoundaries.test.ts packages/core/metadata/importFromXml/importConfiguration.ts packages/core/metadata/importFromXml/importConfiguration.test.ts .agents/architecture.md
git commit -m "test: :white_check_mark: закрепить безмодельный XML-импорт"
```

- [ ] **Step 10: Проверить чистоту рабочего дерева и историю задачи**

Run: `git status --short && git log --oneline -8`

Expected: `git status --short` ничего не выводит; в последних коммитах видны отдельные завершённые этапы Tasks 1–8.
