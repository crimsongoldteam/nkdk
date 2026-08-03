# Table service XML nodes and explicit XML default implementation plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Восстанавливать `Table.Period`, `Table.TopLevelParent` и `Table.RowFilter` по конечному источнику `ПутьКДанным`, включая пути через `CurrentData`, и сохранять явный `HeaderHorizontalAlign=Auto` через зарегистрированный локальный YAML-тег `!xml`.

**Architecture:** Общий resolver получает нейтральное соответствие имени табличного элемента формы его `ПутьКДанным` и разрешает `CurrentData` до обычного `ResolvedDataPathTarget`. Локальный классификатор рядом с `TableRules` преобразует этот результат в профиль `dynamicList | rowFilter | none`, а декларативные `toXML`-условия создают нужные XML-узлы без reference. Общий YAML-слой переносит локальный тег отдельно от предметного значения, а нейтральная регистрация разрешает `!xml` только для явно согласованных пар `itemType + propertyKey + value`.

**Tech Stack:** TypeScript 7, Vitest, js-yaml, pnpm, dependency-cruiser, jscpd, существующие metadata rules/resolver/indexes.

---

## Исходные условия

- Работать в worktree `/Users/nikita/git/nkdk/.worktrees/table-service-xml-nodes` на ветке `codex/table-service-xml-nodes-plan`.
- Источник договора: `docs/superpowers/specs/2026-08-03-table-service-xml-nodes-design.md`.
- Не изменять существующие XML-фикстуры.
- Не добавлять признаки в `PropertyRule` или `BasePropertyRule`.
- Не добавлять частные знания о `Table`, именах XML-узлов или `CurrentData` в общую orchestration.
- Коммиты `d511abfd1`, `c6d086a82`, `277639669` и `9d5c362b3` из `/Users/nikita/.codex/worktrees/e536/nkdk` использовать только как источник отдельных решений. Не делать `cherry-pick`: та ветка отстала от `develop`, а её безусловный пропуск `CurrentData` противоречит утверждённой спецификации.
- Stryker в этой задаче не запускать.

## Task 1: Добавить общий транспорт локальных YAML-тегов

**Files:**

- Create: `packages/core/yaml/scalarTags.ts`
- Modify: `packages/core/yaml/jsYamlParser.ts`
- Modify: `packages/core/yaml/export.ts`
- Test: `packages/core/yaml/jsYamlParser.test.ts`
- Test: `packages/core/yaml/export.test.ts`

### Step 1: Написать падающие тесты разбора тега

В `packages/core/yaml/jsYamlParser.test.ts` добавить проверки наблюдаемого договора:

```ts
it("возвращает обычное значение для локального !xml и сохраняет транспортную пометку", () => {
  const parsed = parseDataWithJsYaml("Поле: !xml Авто")

  expect(parsed.syntaxErrors).toEqual([])
  expect(parsed.data).toEqual({ Поле: "Авто" })
  expect(yamlScalarTagAt(parsed.data, "Поле")).toBe("xml")
})

it("не принимает неизвестный локальный тег", () => {
  const parsed = parseDataWithJsYaml("Поле: !unknown Авто")

  expect(parsed.data).toBeUndefined()
  expect(parsed.syntaxErrors[0]?.message).toContain("unknown tag")
})
```

Тест должен импортировать только публичные `parseDataWithJsYaml` и `yamlScalarTagAt`.

### Step 2: Запустить тест и подтвердить падение

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/yaml/jsYamlParser.test.ts --no-isolate
```

Expected: FAIL, потому что `!xml` ещё не зарегистрирован и `yamlScalarTagAt` отсутствует.

### Step 3: Реализовать нейтральную схему и хранение пометок

В `packages/core/yaml/scalarTags.ts` ввести общий договор без знания о metadata-свойствах:

```ts
import { JSON_SCHEMA, Schema, Type } from "js-yaml"

export type YAMLScalarTag = "xml"
export type YAMLScalarTagKey = string | number

const taggedScalarKind = Symbol("taggedYamlScalar")
const scalarTags = new WeakMap<object, Map<YAMLScalarTagKey, YAMLScalarTag>>()

interface TaggedYAMLScalar {
  readonly [taggedScalarKind]: true
  readonly tag: YAMLScalarTag
  readonly value: string
}

function taggedYAMLScalar(tag: YAMLScalarTag, value: string): TaggedYAMLScalar {
  return { [taggedScalarKind]: true, tag, value }
}

export function isTaggedYAMLScalar(value: unknown): value is TaggedYAMLScalar {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Partial<TaggedYAMLScalar>)[taggedScalarKind] === true
  )
}

export function markYAMLScalarTag(parent: object, key: YAMLScalarTagKey, tag: YAMLScalarTag): void {
  const marks = scalarTags.get(parent) ?? new Map<YAMLScalarTagKey, YAMLScalarTag>()
  marks.set(key, tag)
  scalarTags.set(parent, marks)
}

export function yamlScalarTagAt(parent: unknown, key: YAMLScalarTagKey): YAMLScalarTag | undefined {
  return typeof parent === "object" && parent !== null ? scalarTags.get(parent)?.get(key) : undefined
}

export function taggedScalarForDump(parent: object, key: YAMLScalarTagKey, value: unknown): unknown {
  const tag = yamlScalarTagAt(parent, key)
  return tag === undefined || typeof value !== "string" ? value : taggedYAMLScalar(tag, value)
}

const explicitXmlType = new Type("!xml", {
  kind: "scalar",
  construct(value) {
    return taggedYAMLScalar("xml", value ?? "")
  },
  instanceOf: Object,
  predicate(value) {
    return isTaggedYAMLScalar(value) && value.tag === "xml"
  },
  represent(value) {
    return (value as TaggedYAMLScalar).value
  },
})

export const NKDK_YAML_SCHEMA: Schema = JSON_SCHEMA.extend([explicitXmlType])
```

Если типы `js-yaml` не принимают `instanceOf: Object` вместе с `predicate`, оставить только `predicate`; не использовать `as any`.

### Step 4: Подключить схему при разборе и снять обёртку

В `packages/core/yaml/jsYamlParser.ts` заменить `JSON_SCHEMA` на `NKDK_YAML_SCHEMA`. В начале `visitYamlData`, до обработки `null`, строк и контейнеров, снять внутреннюю обёртку и записать пометку на родителя:

```ts
if (isTaggedYAMLScalar(value)) {
  if (parent !== undefined && key !== undefined) markYAMLScalarTag(parent, key, value.tag)
  return value.value
}
```

И `parseWithJsYaml`, и `parseDataWithJsYaml` должны использовать одну схему. После разбора наружу выходит обычная строка, поэтому JSON Schema и semantic validation не получают нового типа.

### Step 5: Написать падающие тесты экспорта

В `packages/core/yaml/export.test.ts` добавить:

```ts
it("выводит сохранённую пометку как локальный !xml", () => {
  const yaml = { Поле: "Авто" }
  markYAMLScalarTag(yaml, "Поле", "xml")

  expect(exportToYAML(yaml)).toBe("Поле: !xml Авто")
})

it("сохраняет !xml при полном разборе и повторном экспорте", () => {
  const parsed = parseDataWithJsYaml("Поле: !xml Авто")

  expect(exportToYAML(parsed.data)).toBe("Поле: !xml Авто")
})
```

### Step 6: Запустить тесты и подтвердить второе падение

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/yaml/jsYamlParser.test.ts packages/core/yaml/export.test.ts --no-isolate
```

Expected: тест разбора проходит, тест экспорта FAIL — пометка пока не возвращается в dumper.

### Step 7: Сохранить пометку при экспорте

В `packages/core/yaml/export.ts`:

- использовать `NKDK_YAML_SCHEMA` вместо `JSON_SCHEMA`;
- перед рекурсивной обработкой каждого свойства и элемента передавать исходный контейнер и ключ в `taggedScalarForDump`;
- применять существующую логику явных строк к смысловому значению до оборачивания тегом.

Форма рекурсивного участка:

```ts
function prepareChildForDump(
  parent: object,
  key: string | number,
  value: unknown,
  explicitStrings: Map<string, string>
): unknown {
  const prepared = value === undefined ? null : prepareForDump(value, explicitStrings)
  return taggedScalarForDump(parent, key, prepared)
}

if (Array.isArray(value)) {
  return value.map((item, index) => prepareChildForDump(value, index, item, explicitStrings))
}
if (value !== null && typeof value === "object") {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      prepareChildForDump(value, key, item, explicitStrings),
    ])
  )
}
```

Не заменять тег строковым post-processing: dumper должен выводить его через зарегистрированный `Type`.

### Step 8: Запустить тесты YAML-слоя

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/yaml/jsYamlParser.test.ts packages/core/yaml/export.test.ts --no-isolate
```

Expected: PASS.

### Step 9: Зафиксировать транспорт тега

```bash
git add packages/core/yaml/scalarTags.ts packages/core/yaml/jsYamlParser.ts packages/core/yaml/jsYamlParser.test.ts packages/core/yaml/export.ts packages/core/yaml/export.test.ts
git commit -m "feat: :sparkles: добавить транспорт локальных YAML-тегов"
```

## Task 2: Ограничить `!xml` явной регистрацией свойства

**Files:**

- Create: `packages/core/metadata/orchestration/property/explicitXMLPropertyRegistry.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Test: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Test: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`

### Step 1: Написать тесты регистрации на границах XML ↔ YAML

В существующих тестах orchestration зарегистрировать уникальный тестовый `itemType`, чтобы глобальный registry не конфликтовал с production-регистрацией:

```ts
const TaggedDefaultRules = {
  itemType: "TestTaggedDefault",
  properties: {
    mode: {
      yaml: "Режим",
      xml: "Mode",
      type: "string",
      implicitValueYAML: "Auto",
    },
  },
} satisfies MetadataItemRule

registerExplicitXMLProperty({
  itemType: TaggedDefaultRules.itemType,
  propertyKey: "mode",
  xmlValue: "Auto",
  yamlValue: "Auto",
})
```

Проверить четыре договора:

1. Явный `<Mode>Auto</Mode>` не отбрасывается как implicit YAML-default, результат равен `{ Режим: "Auto" }` и помечен `xml`.
2. Помеченный `{ Режим: "Auto" }` создаёт явный `Mode: "Auto"` без reference.
3. `!xml` у незарегистрированного свойства выбрасывает `YAMLImportError` с `itemType`, YAML-ключом и значением.
4. Зарегистрированное свойство с помеченным значением, отличным от `yamlValue`, отклоняется.

### Step 2: Запустить тесты и подтвердить падение

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts --no-isolate
```

Expected: FAIL — registry и интеграция отсутствуют.

### Step 3: Реализовать нейтральный registry

В `explicitXMLPropertyRegistry.ts` хранить регистрации по `itemType + propertyKey`, не меняя типы rules:

```ts
export interface ExplicitXMLPropertyRegistration {
  readonly itemType: string
  readonly propertyKey: string
  readonly xmlValue: unknown
  readonly yamlValue: unknown
}

export function registerExplicitXMLProperty(registration: ExplicitXMLPropertyRegistration): void

export function matchExplicitXMLPropertyFromXML(params: {
  readonly itemType: string
  readonly propertyKey: string
  readonly presentInXML: boolean
  readonly xmlValue: unknown
}): ExplicitXMLPropertyRegistration | undefined

export function assertAllowedExplicitXMLTags(params: {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
}): void
```

Требования к реализации:

- повторная идентичная регистрация идемпотентна;
- конфликтующая регистрация той же пары бросает ошибку при загрузке модуля;
- сравнение допустимых скалярных значений строгое через `Object.is`;
- `assertAllowedExplicitXMLTags` перебирает только реальные ключи текущего YAML-объекта и сопоставляет YAML-ключ с `rule.properties`;
- пометка `xml` без свойства rules, без регистрации или с другим значением даёт `toYAMLImportError`;
- вложенные item/collection проверяются естественно при рекурсивном вызове `convertPropertiesFromYAMLToXML`, без общего знания их структуры.

### Step 4: Интегрировать XML → YAML

В `importPropertiesFromXMLToYAML` до применения YAML-default найти регистрацию, а после обычного преобразования выбрать экспортируемое значение:

```ts
const explicitXML = matchExplicitXMLPropertyFromXML({
  itemType: rule.itemType,
  propertyKey: key,
  presentInXML,
  xmlValue: sourceXMLValue,
})
const exportedYamlValue = explicitXML?.yamlValue ?? yamlValue
```

Если `explicitXML` найден, значение нельзя удалить проверкой implicit/default. Поэтому участок формирования результата должен иметь точную развилку:

```ts
const exportedValues =
  explicitXML === undefined
    ? getExportToYAMLResult(propertyRule, propertyRule.yaml!, yamlValue, value)
    : { [propertyRule.yaml!]: exportedYamlValue }
if (exportedValues === undefined) return
Object.assign(result, exportedValues)
if (explicitXML !== undefined) {
  markYAMLScalarTag(result, propertyRule.yaml!, "xml")
}
```

В collector передать `exportedYamlValue`, а не отброшенный implicit-default:

```ts
collector.acceptProperty({
  yamlPath: propertyYamlPath,
  rulePath: propertyRulePath,
  rule: propertyRule,
  value: exportedYamlValue,
  ...(owner === undefined ? {} : { metadataTargetOwner: owner }),
})
```

Collector получает обычное `exportedYamlValue`; транспортная пометка не входит в `LocalYamlFact` и не меняет validation.

### Step 5: Интегрировать YAML → XML

В начале `convertPropertiesFromYAMLToXML`, до построения плана и обхода свойств, вызвать:

```ts
assertAllowedExplicitXMLTags({ yaml, rule: params.rule })
```

Пометка не подменяет значение и не добавляет отдельный путь экспорта: после проверки обычный механизм видит явно присутствующий YAML-ключ и записывает XML. Это сохраняет правила типов, enum-преобразование и диагностику.

### Step 6: Запустить целевые тесты

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts --no-isolate
```

Expected: PASS.

### Step 7: Зафиксировать registry

```bash
git add packages/core/metadata/orchestration/property/explicitXMLPropertyRegistry.ts packages/core/metadata/orchestration/property/fromXMLToYAML.ts packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts packages/core/metadata/orchestration/property/fromYAMLToXML.ts packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts
git commit -m "feat: :sparkles: ограничить явные XML-значения регистрацией"
```

## Task 3: Зарегистрировать явный `HeaderHorizontalAlign=Auto`

**Files:**

- Create: `packages/core/metadata/forms/elements/formField/explicitHeaderHorizontalAlign.ts`
- Modify: `packages/core/metadata/forms/elements/inputField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/labelField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/pictureField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/checkBoxField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts`

### Step 1: Заменить старую проверку канонизации явного `Auto`

Найти существующий `it.each`, который ожидает удаление явного `HeaderHorizontalAlign=Auto`, и заменить его матрицей для четырёх табличных itemType:

```ts
it.each([
  [TableInputFieldRules, "InputField"],
  [TableLabelFieldRules, "LabelField"],
  [TablePictureFieldRules, "PictureField"],
  [TableCheckBoxFieldRules, "CheckBoxField"],
])("сохраняет явный HeaderHorizontalAlign=Auto для %s через !xml", (rule, xmlType) => {
  const yaml = importTableField({ rule, xmlType, HeaderHorizontalAlign: "Auto" })

  expect(exportToYAML(yaml)).toContain("ГоризонтальноеПоложениеВШапке: !xml Авто")
  expect(exportTableField({ rule, yaml }).HeaderHorizontalAlign).toBe("Auto")
})
```

В той же матрице проверить:

- отсутствующий XML-узел остаётся отсутствующим в YAML и обратном XML;
- `Left`, `Center` и `Right` остаются обычными YAML-значениями без `!xml`;
- `Period`, `TopLevelParent` и `RowFilter` не принимают `!xml`.

### Step 2: Добавить проверку JSON Schema

В `toJSONSchema.test.ts` подтвердить, что схема `ГоризонтальноеПоложениеВШапке` по-прежнему содержит обычное перечисление и нигде не содержит строки `!xml`:

```ts
expect(JSON.stringify(schema)).not.toContain("!xml")
expect(headerAlignSchema.enum).toContain("Авто")
```

### Step 3: Запустить тесты и подтвердить падение

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts --no-isolate
```

Expected: FAIL — production-свойства ещё не зарегистрированы.

### Step 4: Добавить локальный помощник регистрации

В `explicitHeaderHorizontalAlign.ts` сосредоточить согласованный исключительный случай:

```ts
import { registerExplicitXMLProperty } from "../../../orchestration/property/explicitXMLPropertyRegistry"

export function registerExplicitHeaderHorizontalAlign(itemType: string): void {
  registerExplicitXMLProperty({
    itemType,
    propertyKey: "headerHorizontalAlign",
    xmlValue: "Auto",
    yamlValue: "Авто",
  })
}
```

После объявления каждого из четырёх табличных rules вызвать помощник с его `itemType`. Не регистрировать обычные, не табличные варианты полей и не расширять регистрацию на другие свойства.

### Step 5: Запустить тесты формы

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts --no-isolate
```

Expected: PASS.

### Step 6: Зафиксировать согласованное применение `!xml`

```bash
git add packages/core/metadata/forms/elements/formField/explicitHeaderHorizontalAlign.ts packages/core/metadata/forms/elements/inputField/rules.ts packages/core/metadata/forms/elements/labelField/rules.ts packages/core/metadata/forms/elements/pictureField/rules.ts packages/core/metadata/forms/elements/checkBoxField/rules.ts packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts
git commit -m "fix: :bug: сохранять явное Auto заголовка колонки"
```

## Task 4: Разрешать `Items.<Таблица>.CurrentData.<Поле>` по конечному полю

**Files:**

- Modify: `packages/core/metadata/validation/dataPath/formIndex.ts`
- Modify: `packages/core/metadata/validation/dataPath/formYamlIndex.ts`
- Modify: `packages/core/metadata/validation/dataPath/coreResolver.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.ts`
- Modify: `packages/core/metadata/operations/dataPathReferences.ts`
- Test: `packages/core/metadata/validation/dataPath/formIndex.test.ts`
- Test: `packages/core/metadata/validation/dataPath/formYamlIndex.test.ts`
- Test: `packages/core/metadata/validation/dataPath/resolver.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/validateForm.test.ts`
- Test: `packages/core/metadata/validation/yamlFactExtractor.test.ts`

### Step 1: Написать падающие тесты индекса элементов формы

Расширить `FormDataPathIndex` нейтральным полем:

```ts
readonly tableDataPathByElementName: ReadonlyMap<string, string>
```

До реализации добавить тесты:

- `buildFormDataPathIndex` извлекает имя `Товары` и `dataPath: "Объект.Товары"` из элемента формы `Table`;
- YAML-collector извлекает то же соответствие из `LocalYamlFact`, когда в `rulePath` родительский сегмент имеет `nestedItemType: "Table"`;
- не-Table item с полем `dataPath` не попадает в соответствие;
- пустой `dataPath` не индексируется;
- повтор имени таблицы получает существующую структурную диагностику или первый однозначный путь; не выбирать путь молча по последнему значению.

### Step 2: Запустить тесты индекса и подтвердить падение

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/formIndex.test.ts packages/core/metadata/validation/dataPath/formYamlIndex.test.ts packages/core/metadata/validation/yamlFactExtractor.test.ts --no-isolate
```

Expected: FAIL — индекс не знает элементы формы.

### Step 3: Расширить индекс без знания служебных XML-узлов

В `formIndex.ts` собрать соответствие из `getAllElements(form)`:

```ts
const tableDataPathByElementName = new Map<string, string>()
for (const element of getAllElements(form)) {
  if (element.itemType !== "Table") continue
  if (typeof element.name !== "string" || typeof element.dataPath !== "string") continue
  if (element.dataPath.trim() === "") continue
  if (!tableDataPathByElementName.has(element.name)) {
    tableDataPathByElementName.set(element.name, element.dataPath)
  }
}
```

Знание `Table` здесь относится к построению индекса конкретной формы. Общий resolver видит только готовое отображение.

В `formYamlIndex.ts` не разбирать русские YAML-ключи вручную для вложенных элементов. Collector уже получает `LocalYamlFact`; определить принадлежность `dataPath` таблице по последнему сегменту `rulePath` перед свойством:

```ts
function tableElementName(fact: LocalYamlFact): string | undefined {
  const parentRule = fact.rulePath.at(-2)
  const yamlName = fact.yamlPath.at(-2)
  return parentRule?.nestedItemType === "Table" && typeof yamlName === "string" ? yamlName : undefined
}
```

Сопоставление собирать при `propertyKey === "dataPath"`, непустом строковом значении и передавать из `finish()` вместе с корнями.

Прямой построитель получает правило формы явно и использует уже существующий visitor `collectFormDataPathOccurrencesFromYAML`:

```ts
export function createFormDataPathIndexFromYAML(
  yaml: unknown,
  rule: MetadataItemRule
): FormDataPathIndex {
  const collector = createFormDataPathIndexCollector({ filePath: "" })
  collectFormAttributesFromYAML({ yaml, collector })
  collectFormDataPathOccurrencesFromYAML({
    yaml,
    rule,
    visitItem({ yaml: itemYaml, rule: itemRule, yamlPath }) {
      if (itemRule.itemType !== "Table") return
      const name = yamlPath.at(-1)
      const dataPathKey = itemRule.properties.dataPath?.yaml
      const dataPath = typeof dataPathKey === "string" ? itemYaml[dataPathKey] : undefined
      if (typeof name !== "string" || typeof dataPath !== "string" || dataPath.trim() === "") return
      collector.acceptTableDataPath({ name, dataPath })
    },
  })
  return collector.finish()
}
```

Для этого добавить в возвращаемый тип collector нейтральный метод `acceptTableDataPath({ name, dataPath })`; XML → YAML продолжает заполнять его из `LocalYamlFact`, а прямой YAML-обход — через visitor. Все вызовы `createFormDataPathIndexFromYAML` в `fromYAMLToXML.ts`, `validate.ts`, `dataPathReferences.ts` и тестовых помощниках передают фактическое правило формы (`params.rule` либо `ClientApplicationFormRules`). Так общий индекс не импортирует конкретный form rules и не получает циклическую зависимость.

Все ручные литералы `FormDataPathIndex` в тестах и `baseFormProjection.ts` дополнить пустым `new Map()`.

### Step 4: Написать тесты resolver для `CurrentData`

Заменить старый тест «пропускает `Items.*.CurrentData.*`» матрицей:

```ts
it.each([
  ["Items.ТаблицаЗначений.CurrentData.ВложеннаяТаблица", "ValueTable"],
  ["Items.Дерево.CurrentData.ВложенноеДерево", "ValueTree"],
  ["Items.Товары.CurrentData.Серии", "TabularSection"],
])("разрешает конечное поле %s", (path, expectedTableKind) => {
  const result = resolveDataPathCore({ value: path, nameMode: "yaml", index, ownerCache })

  expect(result.error).toBeUndefined()
  expect(result.target?.typeInfo.table?.kind).toBe(expectedTableKind)
})
```

Дополнительно проверить:

- конечный скаляр возвращает скалярный `typeInfo`;
- внутренняя коллекция `SettingsComposer` возвращается как известный platform source без ошибки;
- отсутствующий элемент таблицы даёт общий unresolved-result;
- `Items.A.CurrentData.Items.B.CurrentData.Поле` разрешается тем же алгоритмом;
- цикл `A -> Items.B.CurrentData`, `B -> Items.A.CurrentData` завершается контролируемой ошибкой;
- diagnostics и `replacementRecords` используют исходный путь, а не внутренний развёрнутый `dataPath` таблицы.

### Step 5: Запустить resolver-тесты и подтвердить падение

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/resolver.test.ts packages/core/metadata/forms/clientApplicationForm/validateForm.test.ts --no-isolate
```

Expected: FAIL — `coreResolver.ts` пока безусловно завершает любой `CurrentData` без target.

### Step 6: Заменить ранний выход на нейтральное разворачивание пути

В `coreResolver.ts` удалить:

```ts
if (isCurrentDataPath(segments)) return okWithoutTarget(...)
```

Разделить публичный вход и приватное разрешение сегментов:

```ts
export function resolveDataPathCore(params: ResolveDataPathCoreParams): ResolveDataPathCoreResult {
  return resolveDataPathSegments({
    ...params,
    originalValue: params.value,
    segments: splitDataPath(params.value),
    currentDataStack: [],
  })
}
```

При обнаружении `Items.<Имя>.CurrentData`:

1. Найти `tableDataPathByElementName.get(<Имя>)`.
2. Если элемента или пути нет — вернуть стандартную ошибку неразрешимого исходного пути.
3. Если имя уже есть в `currentDataStack` — вернуть стандартную ошибку цикла для исходного пути.
4. Разбить `ПутьКДанным` элемента и заменить первые три сегмента `Items.<Имя>.CurrentData` этими сегментами.
5. Рекурсивно вызвать `resolveDataPathSegments` с прежним `originalValue` и расширенным стеком.
6. В результате сохранить исходные `value` и `segments`; индексы `replacementRecords` для хвоста пересчитать относительно позиции после `CurrentData`.

Приватный параметр должен быть типизирован, а не передаваться через `as any`:

```ts
interface ResolveDataPathSegmentsParams extends ResolveDataPathCoreParams {
  readonly originalValue: string
  readonly segments: readonly string[]
  readonly currentDataStack: readonly string[]
}
```

Не присваивать `CurrentData` собственный тип и не классифицировать его внутри resolver. Resolver возвращает тот же `ResolvedDataPathTarget`, который вернул бы развёрнутый обычный путь.

### Step 7: Обновить validation-договор

В `validateForm.test.ts` заменить ожидание безусловного пропуска на два наблюдаемых случая:

- корректное конечное поле после `CurrentData` проходит validation;
- неизвестное поле получает обычную диагностику пути с исходным `Items.<Таблица>.CurrentData...`.

Проверить, что `dataPathReferences.ts`, `validate.ts` и `yamlFactExtractor.ts` строят индекс одним способом и передают отображение элементов таблицы. Не добавлять отдельный индекс только для служебных XML-узлов.

### Step 8: Запустить все целевые тесты `CurrentData`

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/formIndex.test.ts packages/core/metadata/validation/dataPath/formYamlIndex.test.ts packages/core/metadata/validation/dataPath/resolver.test.ts packages/core/metadata/forms/clientApplicationForm/validateForm.test.ts packages/core/metadata/validation/yamlFactExtractor.test.ts --no-isolate
```

Expected: PASS.

### Step 9: Зафиксировать разрешение `CurrentData`

```bash
git add packages/core/metadata/validation/dataPath/formIndex.ts packages/core/metadata/validation/dataPath/formYamlIndex.ts packages/core/metadata/validation/dataPath/coreResolver.ts packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts packages/core/metadata/forms/clientApplicationForm/validate.ts packages/core/metadata/operations/dataPathReferences.ts packages/core/metadata/validation/dataPath/formIndex.test.ts packages/core/metadata/validation/dataPath/formYamlIndex.test.ts packages/core/metadata/validation/dataPath/resolver.test.ts packages/core/metadata/forms/clientApplicationForm/validateForm.test.ts packages/core/metadata/validation/yamlFactExtractor.test.ts packages/core/metadata/forms/commonObjects/dataPath/baseFormProjection.ts
git commit -m "fix: :bug: разрешать конечное поле через CurrentData"
```

## Task 5: Классифицировать источник таблицы и создавать служебные XML-узлы

**Files:**

- Create: `packages/core/metadata/forms/elements/table/sourceProfile.ts`
- Modify: `packages/core/metadata/forms/elements/table/dynamicListProperties.ts`
- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/dataPathStandardMembers.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.integration.test.ts`

### Step 1: Написать матричные тесты классификатора

В `fromYAMLToXML.test.ts` покрыть таблицу спецификации через наблюдаемый XML, а не через внутренние функции:

| Вход | Ожидание |
|---|---|
| прямой реквизит `DynamicList` | `Period` + `TopLevelParent` |
| `ValueTable` | `RowFilter` |
| табличная часть объекта | `RowFilter` |
| `RegisterRecordSet` | `RowFilter` |
| `ValueTree` | ничего |
| `ValueList` | ничего |
| `GanttChart` | ничего |
| `DynamicList.Filter` | ничего |
| `SettingsComposer.Settings` | ничего |
| скаляр | ничего |
| составной конечный тип | ничего |
| отсутствующий путь | `RowFilter` |
| пустой путь | `RowFilter` |
| неразрешимый путь | `RowFilter` |
| `CurrentData` → `ValueTable` | `RowFilter` |
| `CurrentData` → `ValueTree` | ничего |
| `CurrentData` → `SettingsComposer` collection | ничего |

Каждый тест проверяет точное присутствие и отсутствие всех трёх узлов. Для `Period` проверить каноническую структуру `Custom` и обе даты, для двух остальных — `{ "_xsi:nil": "true" }`.

### Step 2: Добавить тесты XML → YAML

В `elements/__tests__/fromXMLToYAML.test.ts` подтвердить, что входные `Period`, `TopLevelParent` и `RowFilter` никогда не появляются как `Период`, `РодительВерхнегоУровня` или `ОтборСтрок` в YAML. Это правило действует и при наличии reference/profile.

### Step 3: Добавить интеграционный тест кэша владельца

В `fullSyncToXml/worker.integration.test.ts` создать минимальный YAML-проект формы, где:

- `ПутьКДанным` указывает на поле владельца типа табличной части — получается `RowFilter`;
- соседнее поле владельца скалярное — не получает служебных узлов.

Этот тест должен падать, если `ownerMetadataCache` доступен только в `exportToYAML`, но отсутствует в `importFromYAML`.

### Step 4: Запустить тесты и подтвердить падение

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts packages/core/metadata/fullSyncToXml/worker.integration.test.ts --no-isolate
```

Expected: FAIL — служебные узлы пока зависят от старого default/reference, а полный sync не предоставляет resolver кэш в направлении YAML → XML.

### Step 5: Реализовать единый локальный классификатор

В `sourceProfile.ts`:

```ts
export type TableSourceProfile = "dynamicList" | "rowFilter" | "none"

export function classifyTableSource(
  source: YAMLPropertySource,
  context?: ConfigurationContextWithExportToXML
): TableSourceProfile {
  const dataPath = source.raw("dataPath")
  if (typeof dataPath !== "string" || dataPath.trim() === "") return "rowFilter"

  const index = context?.importFromYAML?.formDataPathIndex
  const ownerCache = context?.importFromYAML?.ownerMetadataCache
  if (index === undefined || ownerCache === undefined) return "rowFilter"

  const resolved = resolveDataPathCore({
    value: dataPath,
    nameMode: "yaml",
    index,
    ownerCache,
  })
  if (resolved.error !== undefined) return "rowFilter"
  if (resolved.target === undefined) return "none"
  if (resolved.target.typeInfo.nextTypes.length > 1) return "none"

  const kind = resolved.target.typeInfo.table?.kind
  if (
    kind === "DynamicList" &&
    resolved.target.source.kind === "formAttribute" &&
    resolved.target.segments.length === 1
  ) return "dynamicList"
  if (kind === "ValueTable" || kind === "TabularSection" || kind === "RegisterRecordSet") {
    return "rowFilter"
  }
  return "none"
}

export function isDirectDynamicListTable(
  source: YAMLPropertySource,
  context?: ConfigurationContextWithExportToXML
): boolean {
  return classifyTableSource(source, context) === "dynamicList"
}

export function hasRowFilterTableSource(
  source: YAMLPropertySource,
  context?: ConfigurationContextWithExportToXML
): boolean {
  return classifyTableSource(source, context) === "rowFilter"
}
```

При необходимости адаптировать проверку составного типа к фактическому договору `DataPathTypeInfo`, но сохранить правило: любой неоднозначный конечный тип даёт `none`. `CurrentData` не проверяется текстово — после Task 4 он уже возвращает обычный target и не удовлетворяет признаку прямого корня.

`dynamicListProperties.ts` импортирует `isDirectDynamicListTable` из нового файла и удаляет локальную реализацию.

### Step 6: Подключить resolver-кэш в направлении YAML → XML

В `FormimportFromYAMLContext` добавить уже существующий нейтральный тип:

```ts
/** Готовый неизменяемый индекс владельцев DataPath для YAML → XML. */
readonly ownerMetadataCache?: OwnerMetadataCache
```

В `fullSyncToXml/worker.ts` добавить `state.ownerMetadataCache` в `importFromYAML` внутри `exportContext`:

```ts
importFromYAML: {
  ...state.context.importFromYAML,
  ownerMetadataCache: state.ownerMetadataCache,
},
```

В `dataPathStandardMembers.ts` выбирать кэш по направлению:

```ts
const suppliedOwnerCache =
  params.direction === "yaml-to-internal"
    ? params.context.importFromYAML?.ownerMetadataCache ?? params.context.exportToYAML?.ownerMetadataCache
    : params.context.exportToYAML?.ownerMetadataCache ?? params.context.importFromYAML?.ownerMetadataCache
```

Это общий инфраструктурный договор; нельзя делать в worker отдельную проверку `Table` или конкретных узлов.

### Step 7: Сделать XML-узлы декларативно вычисляемыми

В `table/rules.ts` заменить устаревший комментарий про reference и добавить существующие условия rules:

```ts
period: {
  yaml: "Период",
  type: "boolean",
  fromXML: false,
  toYAML: false,
  fromYAML: false,
  exportWithoutReferenceXML: true,
  toXML: isDirectDynamicListTable,
  defaultValueXMLRaw: PERIOD_XML_DEFAULT,
},
topLevelParent: {
  yaml: "РодительВерхнегоУровня",
  type: "boolean",
  fromXML: false,
  toYAML: false,
  fromYAML: false,
  exportWithoutReferenceXML: true,
  toXML: isDirectDynamicListTable,
  defaultValueXMLRaw: { "_xsi:nil": "true" },
},
rowFilter: {
  yaml: "ОтборСтрок",
  type: "boolean",
  fromXML: false,
  toYAML: false,
  fromYAML: false,
  exportWithoutReferenceXML: true,
  toXML: hasRowFilterTableSource,
  defaultValueXMLRaw: { "_xsi:nil": "true" },
},
```

`PERIOD_XML_DEFAULT` оставить рядом с rules как `as const`. Не писать новые `fromXML`, `toXML`, `fromYAML` или `toYAML` обработчики: используются существующие признаки rules и локальный predicate.

### Step 8: Запустить целевые тесты служебных узлов

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts packages/core/metadata/fullSyncToXml/worker.integration.test.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts --no-isolate
```

Expected: PASS.

### Step 9: Зафиксировать классификацию

```bash
git add packages/core/metadata/forms/elements/table/sourceProfile.ts packages/core/metadata/forms/elements/table/dynamicListProperties.ts packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/context/types.ts packages/core/metadata/fullSyncToXml/worker.ts packages/core/metadata/commonObjects/metadataPath/dataPathStandardMembers.ts packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts packages/core/metadata/fullSyncToXml/worker.integration.test.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts
git commit -m "fix: :bug: вычислять служебные узлы таблицы по источнику"
```

## Task 6: Обновить ограничения и выполнить полную проверку

**Files:**

- Modify: `.agents/restrictions.md`
- Modify: `.agents/architecture.md`
- Verify: `docs/superpowers/specs/2026-08-03-table-service-xml-nodes-design.md`

### Step 1: Привести документацию к реализованному договору

В `.agents/restrictions.md` заменить временную формулировку «пока не реализовано» на фактическое состояние:

- `Period`, `TopLevelParent`, `RowFilter` вычисляются только по `ПутьКДанным` и никогда не хранятся в YAML;
- `CurrentData` разрешается по конечному полю;
- единственное зарегистрированное применение `!xml` — `ГоризонтальноеПоложениеВШапке: !xml Авто` для четырёх видов колонок;
- новые применения `!xml` требуют явного согласования разработчика.

В `.agents/architecture.md` коротко зафиксировать границу YAML-транспорта: parser возвращает обычный scalar и хранит локальную пометку вне предметной модели; registry применяется на границе metadata orchestration; JSON Schema не расширяется.

### Step 2: Запустить TypeScript-проверку

Run:

В проекте нет отдельного formatter-script; сохранять существующий стиль и проверить TypeScript:

```bash
pnpm type-check
```

Expected: PASS.

### Step 3: Проверить архитектурные границы

Run:

```bash
pnpm test:architecture
```

Expected: PASS. Если новый импорт нарушает слой, перенести регистрацию/помощник к разрешённой границе; не добавлять исключение dependency-cruiser без отдельного согласования.

### Step 4: Запустить весь проект

Run:

```bash
pnpm test
```

Expected: PASS для всех пакетов. Не запускать Stryker.

### Step 5: Зафиксировать документацию перед диагностическим round-trip

```bash
git add .agents/restrictions.md .agents/architecture.md
git commit -m "docs: :memo: зафиксировать договор служебных узлов таблицы"
git status --short
```

Expected: последний вывод пустой. Это обязательное условие skill `round-trip-yaml`.

### Step 6: Подготовить и запустить round-trip `cf/doc`

Сначала точно ограничить восстановление внешним репозиторием и каталогом `cf/doc`:

```bash
git -C /Users/nikita/git/round-trip-compact restore .
git -C /Users/nikita/git/round-trip-compact clean -fd -- cf/doc
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 20
```

Expected:

- отсутствуют расхождения по `Period`, `TopLevelParent` и `RowFilter`, включая пути через `CurrentData`;
- явные 33 случая `HeaderHorizontalAlign=Auto` сохраняются через YAML `!xml Авто` и не исчезают из XML;
- если остаются другие заранее известные несвязанные diff, перечислить их отдельно и не расширять эту реализацию без согласования.

После диагностики не откатывать `/Users/nikita/git/round-trip-compact`: diff является результатом round-trip skill.

### Step 7: Проверить только новые дубли

Run:

```bash
pnpm duplicates --base develop
```

Expected: `Новых дублирований не найдено`. Существующие дубли не блокируют завершение. Если найден новый дубль, устранить его переиспользуемым помощником и повторить `pnpm type-check`, затронутые тесты и `pnpm duplicates --base develop`.

### Step 8: Финально проверить состояние ветки

Run:

```bash
git status --short
git log --oneline --decorate -6
```

Expected: рабочее дерево чистое; в истории присутствуют отдельные коммиты транспорта, registry, `HeaderHorizontalAlign`, `CurrentData`, классификатора и документации.

## Критерии приёмки

- `Period` и `TopLevelParent` создаются только вместе и только для непосредственного реквизита формы `DynamicList`.
- `RowFilter` создаётся для `ValueTable`, табличной части, `RegisterRecordSet`, а также как резерв для отсутствующего, пустого или неразрешимого пути.
- `ValueTree`, `ValueList`, `GanttChart`, внутренние коллекции, скаляры и составные типы не получают служебных узлов.
- `CurrentData` разрешается до конечного поля через общий resolver; текст сегмента не используется классификатором.
- Три служебных узла не появляются в YAML и не зависят от reference XML.
- Явный `HeaderHorizontalAlign=Auto` проходит XML → `!xml Авто` → XML для четырёх видов колонок.
- Незарегистрированный `!xml` отклоняется при импорте, а JSON Schema видит обычное предметное значение.
- Существующие XML-фикстуры не изменены.
- Проходят целевые тесты, `pnpm type-check`, `pnpm test:architecture`, `pnpm test`, round-trip `cf/doc` и проверка новых дублей.
- Stryker не запускался.
