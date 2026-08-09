# Form Arbitrary Type Metadata Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранять реквизиты формы и колонки без поля `Тип` в индексе метаданных как `Произвольный`, чтобы общий resolver принимал конечный `ПутьКДанным` и запрещал продолжение после него.

**Architecture:** Общий XML → YAML обход публикует нейтральное событие объявления metadata-item вместе с уже существующими событиями свойств. Форменный адаптер преобразует объявления и свойства в один `FormDataPathIndex`; validation существующего YAML вызывает тот же адаптер. Индекс метаданных хранит `kinds: ["any"]`, индекс зависимостей хранит обращения `ПутьКДанным`, а второй проход сопоставляет их общим resolver.

**Tech Stack:** TypeScript, Vitest, YAML/XML metadata rules, `FormDataPathIndex`, двоичное состояние проекта `project-state.bin`, pnpm.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` или параметры построителей правил.
- Не добавлять условия по конкретным формам, YAML-корням или `itemType` в `metadata/orchestration`, `metadata/validation` и `metadata/project`; интерпретация события принадлежит модулю формы.
- Не добавлять `Тип: Произвольный` в YAML: отсутствие `Тип` остаётся предметным представлением пустого `<Type/>`.
- Не ослаблять ошибки неизвестного корня и неизвестной колонки.
- Не менять формат и версию `project-state.bin`: `DataPathTypeInfo.kinds` уже хранится как массив строк.
- Не изменять `.agents/architecture.md`; если реализация потребует отступления от согласованной архитектуры, остановиться и сообщить разработчику.
- После каждого законченного слоя запускать `pnpm duplicates -- --base 72b6bff8b`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test`, `pnpm test:architecture` и повторную проверку дубликатов.

---

## File Map

- `packages/core/metadata/project/localIndexes.ts` — нейтральный тип факта объявления metadata-item, общий интерфейс накопителя и компактная запись item-события.
- `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.ts` — публикация объявления после определения окончательного YAML-ключа.
- `packages/core/metadata/forms/clientApplicationForm/formDataPathMetadata.ts` — форменная интерпретация item/property-событий и построение индекса из готового YAML.
- `packages/core/metadata/validation/dataPath/formYamlIndex.ts` — низкоуровневое накопление корней, колонок и их типовых проекций без знания `itemType`.
- `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts` — подключение форменного адаптера к прямому import.
- `packages/core/metadata/validation/yamlFactExtractor.ts` — использование общей форменной функции при validation вместо собственного построителя.
- `packages/core/metadata/validation/dataPath/coreResolver.ts` — отдельная диагностика продолжения после `Произвольный`.
- `packages/core/metadata/projectState/binary/readSession.test.ts` — защита сохранения `any` в двоичном состоянии.
- Узкие тесты располагаются рядом с перечисленными модулями; новые интеграционные фикстуры не создаются.

---

### Task 1: Нейтральное событие объявления metadata-item

**Files:**
- Modify: `packages/core/metadata/project/localIndexes.ts`
- Modify: `packages/core/metadata/project/localIndexes.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`

**Interfaces:**
- Produces: `LocalYamlItemFact` с `itemType`, окончательным `yamlPath`, `rulePath` и необязательным `name`.
- Produces: `LocalIndexesCollector.acceptItem(fact: LocalYamlItemFact): void`.
- Preserves: существующие `acceptProperty`, `completeValue` и содержимое YAML.

- [ ] **Step 1: Написать падающий тест компактного item-события**

В `localIndexes.test.ts` добавить проверку:

```ts
it("сохраняет объявление metadata-item без его YAML-значения", () => {
  const collector = createLocalIndexesCollector()

  collector.acceptItem({
    itemType: "TestItem",
    name: "Элемент",
    yamlPath: ["Элементы", "Элемент"],
    rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }],
  })

  expect(collector.finish().metadata.events).toEqual([{
    kind: "item",
    itemType: "TestItem",
    name: "Элемент",
    yamlPath: ["Элементы", "Элемент"],
    rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }],
  }])
})
```

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/localIndexes.test.ts --no-isolate
```

Expected: FAIL, потому что `LocalIndexesCollector` ещё не имеет `acceptItem`.

- [ ] **Step 3: Добавить нейтральный договор события**

В `localIndexes.ts` рядом с интерфейсом накопителя определить:

```ts
export interface LocalYamlItemFact {
  readonly itemType: string
  readonly name?: string
  readonly yamlPath: LocalYamlFact["yamlPath"]
  readonly rulePath: LocalYamlFact["rulePath"]
}
```

В `localIndexes.ts`:

```ts
export type LocalMetadataEvent =
  | {
      kind: "item"
      itemType: string
      name?: string
      yamlPath: readonly (string | number)[]
      rulePath: LocalYamlItemFact["rulePath"]
    }
  | {
      kind: "property" | "complete"
      yamlPath: readonly (string | number)[]
      rulePath: LocalYamlFact["rulePath"]
      propertyType: string
      source?: LocalYamlFact["source"]
    }
```

Расширить `LocalIndexesCollector` методом `acceptItem` и копировать массивы/сегменты так же, как для property-событий. Не сохранять ссылку на YAML-объект.

В составном collector формы на этом слое добавить нейтральную передачу события:

```ts
acceptItem(fact) {
  localIndexesCollector.acceptItem(fact)
},
```

Подключение события к `FormDataPathIndex` выполняется в Task 2.

- [ ] **Step 4: Проверить накопитель**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/localIndexes.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Написать падающий тест окончательного ключа коллекции**

В `metadataCollection/fromXMLToYAML.test.ts` усилить тест `uses recordYamlKeyFromYAML for record YAML keys`:

```ts
expect(result.localIndexes.metadata.events).toContainEqual({
  kind: "item",
  itemType: "TestItem",
  name: "Ключ-Первый",
  yamlPath: ["Элементы", "Ключ-Первый"],
  rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }],
})
```

Добавить аналогичное ожидание для `TestArrayCollection`, где путь равен
`["Элементы", 0]`, а `name` берётся из имени XML-элемента, если оно известно.

- [ ] **Step 6: Запустить тест и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts --no-isolate
```

Expected: FAIL, item-события ещё не публикуются коллекцией.

- [ ] **Step 7: Публиковать объявление после определения YAML-ключа**

В `metadataCollection/fromXMLToYAML.ts` после получения `itemYaml`, `yamlKey` и
окончательного пути вызвать:

```ts
params.traversal.collector.acceptItem({
  itemType: itemRule.itemType,
  ...(typeof finalName === "string" ? { name: finalName } : {}),
  yamlPath: finalYamlPath,
  rulePath: enterNestedYamlRule(params.traversal, itemRule.itemType).rulePath,
})
```

Где:

```ts
const finalYamlPath = params.yamlAsArray === true
  ? yamlPath
  : [...params.traversal.yamlPath, yamlKey!]
const finalName = typeof yamlKey === "string" ? yamlKey : itemName
```

Событие публиковать только для элемента, который действительно вошёл в YAML.
Расширить `createBufferedItemCollector`, чтобы он передавал `acceptItem`, если
публикация выполняется до окончательного ключа; предпочтительно публиковать после
ключа и не буферизовать item-событие.

- [ ] **Step 8: Запустить узкие тесты и проверку типов**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/project/localIndexes.test.ts \
  metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts \
  --no-isolate
pnpm --filter @nkdk/core exec tsc --noEmit
pnpm duplicates -- --base 72b6bff8b
```

Expected: все команды завершаются успешно, новых дубликатов нет.

- [ ] **Step 9: Зафиксировать слой**

```bash
git add \
  packages/core/metadata/project/localIndexes.ts \
  packages/core/metadata/project/localIndexes.test.ts \
  packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.ts \
  packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts \
  packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts
git commit -m "refactor: :recycle: передавать объявления metadata-item в индексы"
```

---

### Task 2: Форменная проекция произвольных реквизитов и колонок

**Files:**
- Create: `packages/core/metadata/forms/clientApplicationForm/formDataPathMetadata.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/formDataPathMetadata.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/formYamlIndex.ts`
- Modify: `packages/core/metadata/validation/dataPath/formYamlIndex.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify imports of `createFormDataPathIndexFromYAML` in:
  - `packages/core/metadata/operations/dataPathReferences.ts`
  - `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
  - `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`

**Interfaces:**
- Consumes: `LocalYamlItemFact` и `LocalYamlFact` из Task 1.
- Produces: `arbitraryDataPathTypeInfo` с `kinds: ["any"]`.
- Produces: `createFormDataPathMetadataCollector({ filePath })` с методами `acceptItem`, `acceptProperty`, `completeValue`, `acceptTableDataPath`, `finish`.
- Produces: `createFormDataPathIndexFromYAML(yaml, tableDataPathByElementName?)` в форменном модуле.

- [ ] **Step 1: Написать падающие тесты объявлений без `Тип`**

В новом `formDataPathMetadata.test.ts` добавить один тест двух самостоятельных границ:

```ts
it("индексирует произвольный реквизит и произвольную колонку", () => {
  const index = createFormDataPathIndexFromYAML({
    Реквизиты: {
      ПроизвольныйРеквизит: {},
      Таблица: {
        Тип: "ТаблицаЗначений",
        Колонки: { Значение: {} },
      },
    },
  })

  expect(index.getRoot("ПроизвольныйРеквизит")?.typeInfo).toEqual({
    kinds: ["any"], nextTypes: [], sourceText: "Произвольный",
  })
  expect(index.getRoot("Таблица")?.tableSource).toMatchObject({
    hasColumns: true,
    columns: new Map([["Значение", {
      name: "Значение",
      typeInfo: { kinds: ["any"], nextTypes: [], sourceText: "Произвольный" },
    }]]),
  })
})
```

- [ ] **Step 2: Запустить тест и подтвердить текущий дефект**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/formDataPathMetadata.test.ts --no-isolate
```

Expected: FAIL — корень отсутствует, колонка не записана.

- [ ] **Step 3: Отделить низкоуровневое накопление от форменного договора**

В `formYamlIndex.ts` оставить только низкоуровневые операции:

```ts
declareAttribute(name: string): void
setAttributeType(name: string, type: TypeDescription | undefined): void
setDynamicList(name: string): void
declareColumn(attributeName: string, columnName: string): void
setColumnType(attributeName: string, columnName: string, type: TypeDescription | undefined): void
setAdditionalColumns(value: unknown): void
acceptTableDataPath(params: { name: string; dataPath: string }): void
finish(): FormDataPathIndex
```

`declareAttribute` и `declareColumn` создают запись с общей константой:

```ts
export const arbitraryDataPathTypeInfo: DataPathTypeInfo = {
  kinds: ["any"],
  nextTypes: [],
  sourceText: "Произвольный",
}
```

Явный тип заменяет `arbitraryDataPathTypeInfo`; объявление, пришедшее после типа,
не перезаписывает уточнённое значение. `hasColumns` вычисляется по числу всех
объявленных колонок, включая произвольные.

- [ ] **Step 4: Создать форменный адаптер событий**

В `forms/clientApplicationForm/formDataPathMetadata.ts` реализовать:

```ts
export function createFormDataPathMetadataCollector(params: { filePath: string }) {
  const index = createFormDataPathIndexCollector(params)
  return {
    acceptItem(fact: LocalYamlItemFact): void,
    acceptProperty(fact: LocalYamlFact): void,
    completeValue(fact: LocalYamlFact): void,
    acceptTableDataPath(params: { name: string; dataPath: string }): void,
    finish(): FormDataPathIndex,
  }
}
```

Только этот форменный модуль интерпретирует:

```text
FormAttribute       → Реквизиты.<имя>
FormAttributeColumn → Реквизиты.<реквизит>.Колонки.<имя>
```

`acceptProperty` обрабатывает `Тип`, `ДинамическийСписок` и
`ДополнительныеКолонки` существующим преобразователем
`indexValueFromYAML("TypeDescription", value)`.

В этом же файле разместить `createFormDataPathIndexFromYAML`. Функция сначала
передаёт `acceptItem` для каждого реквизита/колонки, затем передаёт присутствующие
свойства тому же адаптеру. Удалить дублирующее построение из
`yamlFactExtractor.ts` и вызывать эту функцию напрямую.

- [ ] **Step 5: Подключить item-события прямого import**

В `clientApplicationForm/fromXMLToYAML.ts` расширить составной collector:

```ts
acceptItem(fact) {
  localIndexesCollector.acceptItem(fact)
  formDataPathMetadataCollector.acceptItem(fact)
},
acceptProperty(fact) {
  localIndexesCollector.acceptProperty(fact)
  formDataPathMetadataCollector.acceptProperty(fact)
},
completeValue(fact) {
  localIndexesCollector.completeValue(fact)
  formDataPathMetadataCollector.completeValue(fact)
},
```

После import сохранить `finish()` в уже существующее поле
`localIndexes.metadata.formDataPathIndex`.

- [ ] **Step 6: Обновить импорты общей функции**

Все потребители `createFormDataPathIndexFromYAML` должны импортировать её из
`forms/clientApplicationForm/formDataPathMetadata`. Не создавать совместимую
копию или переадресующий модуль в `validation`.

- [ ] **Step 7: Запустить тест накопителя**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/forms/clientApplicationForm/formDataPathMetadata.test.ts \
  metadata/validation/dataPath/formYamlIndex.test.ts \
  --no-isolate
```

Expected: PASS.

- [ ] **Step 8: Добавить интеграционный тест прямого XML import**

В `clientApplicationForm/fromXMLToYAML.test.ts` создать форму непосредственно в
тесте, не изменяя XML-фикстуры:

```ts
const result = importClientApplicationFormFromXMLToYAML({
  context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
  formName: "Форма",
  formXML: {
    Attributes: {
      Attribute: [
        { _name: "ПроизвольныйРеквизит", _id: "1", Type: {} },
        {
          _name: "Таблица", _id: "2",
          Type: { "v8:Type": "v8:ValueTable" },
          Columns: { Column: { _name: "Значение", _id: "1", Type: {} } },
        },
      ],
    },
  },
  metadataXML: { Form: { Properties: { FormType: "Managed" } } },
})

expect(result.localIndexes.metadata.formDataPathIndex
  ?.getRoot("ПроизвольныйРеквизит")?.typeInfo.kinds).toEqual(["any"])
expect(result.localIndexes.metadata.formDataPathIndex
  ?.getRoot("Таблица")?.tableSource?.columns.get("Значение")?.typeInfo.kinds)
  .toEqual(["any"])
```

Expected before wiring: FAIL; after Step 5: PASS.

- [ ] **Step 9: Защитить вклад validation в состояние проекта**

В `projectValidationPasses.test.ts` расширить тест `keeps a form index
contribution without pending DataPath checks` данными:

```yaml
Реквизиты:
  ПроизвольныйРеквизит: {}
  Таблица:
    Тип: ТаблицаЗначений
    Колонки:
      Значение: {}
Элементы: {}
```

Проверить, что `update.forms` содержит:

```ts
expect.objectContaining({
  kind: "root",
  name: "ПроизвольныйРеквизит",
  source: expect.objectContaining({ typeInfo: expect.objectContaining({ kinds: ["any"] }) }),
})
expect.objectContaining({
  kind: "additionalColumn",
  tablePath: "Таблица",
  name: "Значение",
  source: expect.objectContaining({ typeInfo: expect.objectContaining({ kinds: ["any"] }) }),
})
```

- [ ] **Step 10: Запустить тесты слоя и проверки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/dataPath/formYamlIndex.test.ts \
  metadata/forms/clientApplicationForm/formDataPathMetadata.test.ts \
  metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts \
  metadata/validation/projectValidationPasses.test.ts \
  --no-isolate
pnpm --filter @nkdk/core exec tsc --noEmit
pnpm duplicates -- --base 72b6bff8b
```

Expected: PASS, новых дубликатов нет.

- [ ] **Step 11: Зафиксировать слой**

```bash
git add packages/core/metadata
git commit -m "fix: :bug: индексировать произвольные реквизиты формы"
```

---

### Task 3: Разрешение DataPath и двоичное состояние

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/resolver.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/coreResolver.ts`
- Modify: `packages/core/metadata/validation/validateForm.test.ts`
- Modify: `packages/core/metadata/projectState/binary/readSession.test.ts`

**Interfaces:**
- Consumes: `DataPathTypeInfo.kinds = ["any"]` из Task 2.
- Produces: причина `arbitrary_intermediate` и сообщение о произвольном промежуточном типе.
- Preserves: терминальный `any` принимается `validateResolvedDataPathPolicy` как тип без ограничения.

- [ ] **Step 1: Написать падающий тест отдельной причины resolver**

В `resolver.test.ts` рядом с `reports an intermediate unknown type` добавить:

```ts
it("запрещает продолжение после произвольного типа", () => {
  const result = resolveDataPathCore({
    value: "Реквизит.Поле",
    nameMode: "yaml",
    index: indexWithTypeInfo("Реквизит", {
      kinds: ["any"], nextTypes: [], sourceText: "Произвольный",
    }),
    ownerCache: ownerCache([]),
  })

  expect(result).toMatchObject({
    status: "error",
    issues: [expect.objectContaining({
      code: "arbitrary_intermediate",
      message: 'ПутьКДанным "Реквизит.Поле": промежуточный реквизит "Реквизит" имеет произвольный тип',
    })],
  })
})
```

Использовать существующий тестовый построитель индекса или добавить узкий
`indexWithTypeInfo`, возвращающий обычный `FormDataPathIndex`; не применять
`as any`.

- [ ] **Step 2: Запустить тест и подтвердить старое сообщение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/dataPath/resolver.test.ts --no-isolate
```

Expected: FAIL — сейчас `any` попадает в `unknown_type`.

- [ ] **Step 3: Разделить `any` и `unknown` в промежуточной позиции**

В `validateIntermediateType` до ветки `unknown` добавить:

```ts
if (typeInfo.kinds.includes("any")) {
  return diagnostic(
    "error",
    `ПутьКДанным "${params.value}": промежуточный реквизит "${params.segment}" имеет произвольный тип`,
    "arbitrary_intermediate"
  )
}
```

Из последующей ветки удалить `typeInfo.kinds.includes("any")`. Терминальное
поведение `any` в policy не менять.

- [ ] **Step 4: Добавить интеграционные проверки формы**

В `validateForm.test.ts` добавить один зелёный договор конечных значений:

```yaml
Реквизиты:
  ПроизвольныйРеквизит: {}
  Таблица:
    Тип: ТаблицаЗначений
    Колонки:
      Значение: {}
Элементы:
  ПолеРеквизита:
    Вид: ПолеВвода
    ПутьКДанным: ПроизвольныйРеквизит
  ТаблицаФормы:
    Вид: ТаблицаФормы
    ПутьКДанным: Таблица
    Элементы:
      ПолеЗначения:
        Вид: ПолеВвода
        ПутьКДанным: Таблица.Значение
```

Ожидание: `runValidateForm(project)` не содержит ошибок этих двух путей.

Добавить отдельную отрицательную границу с
`ПутьКДанным: Таблица.Значение.Поле` и ожидать сообщение
`имеет произвольный тип`. Существующие тесты неизвестной колонки оставить без
изменения.

- [ ] **Step 5: Проверить сохранение `any` в двоичном состоянии**

В `binary/readSession.test.ts` создать update с корнем и колонкой:

```ts
const arbitrary = { kinds: ["any"] as const, nextTypes: [], sourceText: "Произвольный" }
const update = {
  ...source,
  forms: [
    {
      kind: "root" as const,
      owner,
      name: "Таблица",
      source: {
        kind: "formAttribute" as const,
        name: "Таблица",
        typeInfo: {
          kinds: ["tableSource"] as const,
          nextTypes: [],
          table: { kind: "ValueTable" as const },
        },
        table: { kind: "ValueTable" as const },
        tableHasColumns: true,
      },
    },
    {
      kind: "additionalColumn" as const,
      owner,
      tablePath: "Таблица",
      name: "Значение",
      source: { name: "Значение", typeInfo: arbitrary },
    },
  ],
}
```

Через `readDependencyInputs` проверить точное восстановление
`source.typeInfo.kinds`, `nextTypes` и `sourceText`. Производственный двоичный
формат не менять.

- [ ] **Step 6: Запустить тесты слоя**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/dataPath/resolver.test.ts \
  metadata/validation/validateForm.test.ts \
  metadata/projectState/binary/readSession.test.ts \
  --no-isolate
pnpm --filter @nkdk/core exec tsc --noEmit
pnpm duplicates -- --base 72b6bff8b
```

Expected: PASS, формат снимка остаётся прежним, новых дубликатов нет.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add \
  packages/core/metadata/validation/dataPath/coreResolver.ts \
  packages/core/metadata/validation/dataPath/resolver.test.ts \
  packages/core/metadata/validation/validateForm.test.ts \
  packages/core/metadata/projectState/binary/readSession.test.ts
git commit -m "fix: :bug: различать произвольный тип в DataPath"
```

---

### Task 4: Проверка реальной конфигурации и полный контроль

**Files:**
- Temporarily create, then delete: `packages/core/scripts/run-validation-sed.ts`
- Production files: no changes expected.

**Interfaces:**
- Consumes: публичную операцию `validateProject({ projectDir })`.
- Produces: JSON-результат для проверки конкретных диагностик без фильтрации остальных ошибок.

- [ ] **Step 1: Создать временный штатный запуск validation**

Через `apply_patch` создать `packages/core/scripts/run-validation-sed.ts`:

```ts
import { writeFile } from "node:fs/promises"
import { validateProject } from "../metadata/validation/validateProject"

const result = await validateProject({ projectDir: "/Users/nikita/git/sed_nkdk" })
const diagnostics = [...result.diagnostics]
await writeFile("/private/tmp/sed-arbitrary-form-type-validation.json", JSON.stringify(diagnostics, null, 2))
console.log(JSON.stringify({
  errors: diagnostics.filter(({ severity }) => severity === "error").length,
  warnings: diagnostics.filter(({ severity }) => severity === "warning").length,
}))
```

- [ ] **Step 2: Удалить внутренний снимок и выполнить чистую validation**

Пользователь постоянно разрешил удаление внутренних `.nkdk`-снимков.

```bash
rm -f /Users/nikita/git/sed_nkdk/.nkdk/cache/project-state.bin
pnpm --filter ./packages/core exec tsx scripts/run-validation-sed.ts
```

Expected: команда завершается; результат записан в
`/private/tmp/sed-arbitrary-form-type-validation.json`.

- [ ] **Step 3: Проверить устранение известных ложных ошибок**

```bash
jq '[.[] | select(.severity == "error") | select(
  (.filePath == "cf/Обработка/ГрупповоеИзменениеРеквизитов/Формы/Форма/Форма.yaml"
   and (.message | contains("РеквизитыОбъекта.Значение")))
  or
  (.filePath == "cf/Обработка/ДиагностикаЭДО/Формы/ДиагностикаЭДО/Форма.yaml"
   and ((.message | contains("ОшибкиСертификатов.Ошибки"))
        or (.message | contains("ОшибкиСертификатов.ОшибкиНаСервере"))))
)] | length' /private/tmp/sed-arbitrary-form-type-validation.json
```

Expected: `0`.

- [ ] **Step 4: Убедиться, что реальные ошибки не скрыты**

```bash
jq '[.[] | select(.severity == "error") | .message |
  if contains("неизвестный корень") then "unknown-root"
  elif contains("неизвестная колонка") then "unknown-column"
  elif contains("произвольный тип") then "arbitrary-intermediate"
  else "other" end] | group_by(.) | map({group: .[0], count: length})' \
  /private/tmp/sed-arbitrary-form-type-validation.json
```

Expected: ошибки неизвестных имён, не связанные с объявленными произвольными
элементами, остаются видимыми; общая фильтрация диагностик не добавлялась.

- [ ] **Step 5: Удалить временный сценарий**

Удалить `packages/core/scripts/run-validation-sed.ts` через `apply_patch` и
проверить, что он отсутствует в `git status --short`.

- [ ] **Step 6: Выполнить обязательные проверки проекта**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture
pnpm duplicates -- --base 72b6bff8b
git status --short
```

Expected:

- type-check проходит;
- все тесты проходят;
- архитектурная проверка не показывает новых нарушений;
- новых дубликатов нет;
- рабочее дерево чистое.

- [ ] **Step 7: Подготовить итог реализации**

В итоговом сообщении перечислить:

- добавленное item-событие;
- хранение произвольных реквизитов и колонок в индексе метаданных;
- различие `any` и `unknown`;
- результаты чистой validation `sed_nkdk`;
- добавленные/расширенные тесты и уникальный договор каждого;
- точные результаты `pnpm type-check`, `pnpm test`, `pnpm test:architecture` и проверки дубликатов.
