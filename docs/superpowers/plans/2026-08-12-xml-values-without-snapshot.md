# XML Values Without Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перестать сохранять несмысловые XML-сведения в действующем снимке конфигурации, восстанавливая канонические формы из rules.ts, а согласованные исключения — из явных значений `!xml` в YAML.

**Architecture:** Формат, кодек и физическое хранение текущего снимка не меняются. Предметные преобразователи сначала получают самостоятельный round-trip без reference XML и снимка; после этого общий сборщик перестаёт записывать `xmlName`, `present`, `xsiNil`, `explicitEmpty`, `xsiType`, `xmlText` и `xmlPrefix` для обычной конфигурации. UUID, XML `_id`, порядок вынесенных детей и состояние расширений остаются без изменений; переход на LMDB выполняется по отдельной спецификации и отдельному плану.

**Tech Stack:** TypeScript 7, Vitest 4, TypeBox, `fast-xml-parser`, YAML-теги NKDK, metadata rules, действующий двоичный configuration index.

## Global Constraints

- Реализовывать только `docs/superpowers/specs/2026-08-12-xml-values-without-snapshot-design.md`; переход на LMDB из `2026-08-11-lmdb-configuration-index-design.md` не входит в этот план.
- Работать в `/Users/nikita/git/nkdk/.worktrees/lmdb-configuration-index-design` на ветке `codex/lmdb-configuration-index-design`; не изменять `develop` или `main`.
- Перед началом выполнения обновить отдельный рабочий каталог от актуального `origin/develop` по `superpowers:using-git-worktrees`; не переносить план в основной checkout.
- Не менять структуру, версию, кодек и физическое хранение действующего снимка; старые поля остаются читаемыми, но перечисленные правила их игнорируют.
- Не изменять существующие XML-фикстуры: добавлять отдельные минимальные XML-фикстуры либо строить XML непосредственно в тесте.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и общие параметры построителей; использовать существующие type rules, dependent items и `explicitXMLProperties`.
- Каждое применение `!xml` ограничить согласованными в спецификации парами владельца и свойства; не превращать `!xml` в общий запасной путь.
- Обычное поле `Имя` одиночного встроенного элемента формы недопустимо: разрешена только тегированная форма, а внешняя схема подсказок поле скрывает.
- Существующие битые ссылки, `СтандартныеРеквизиты: !xml`, отсутствующие поля `CharacteristicsDescription`, `HeaderHorizontalAlign`, `RowFilter`, `ПустоеОпределение` и несовместимый `ПутьКДанным` не переписывать: лишь подтвердить, что они не зависят от снимка.
- Состояние расширений не менять; его удаление из снимка выполняется в другой ветке.
- В рабочем каталоге уже есть незавершённые изменения `typeDescription` и тестов `metadataEventSubscription`; перед Task 8 проверить их по спецификации, сохранить полезную часть и не включать несвязанные изменения в другие коммиты.
- После каждого законченного слоя запускать `pnpm duplicates -- --base d1b37ff50`.
- Перед завершением обязательны `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules`, `pnpm test:architecture` и финальная проверка дублей.

---

## Карта файлов и обязанностей

| Область | Файлы | Ответственность |
|---|---|---|
| Контекстные маркеры `FillValue` | `packages/rules/metadata/commonObjects/fillValue/{analyzeItem,register}.ts`, `packages/rules/metadata/commonObjects/metadataValue/{fromXML,toXML}.ts` | Определить владельца и эффективный тип, выбрать каноническую форму или точный транспортный маркер |
| Точные числовые формы | `packages/rules/metadata/commonObjects/minMaxValue/{fromXML,fromYAML,toYAML,toXML,toJSONSchema,types}.ts` | Разобрать и проверить `String`, `Decimal`, `Raw`, сохранить точный XML-текст без reference XML |
| Значения СКД | `dcsLocalStringType/*`, `settingsParameterValueCollection/*`, `dcsMetadataValue/*` | Перенести `xs:string`, `Nil` и `Undefined` в YAML и убрать зависимость от XML-полей снимка |
| Пустые коллекции и элементы | `indexField/*`, `clientApplicationForm/*`, `formattedI8nText/*`, predefined rules, `formAttribute/*` | Различить отсутствие и явный пустой XML через зарегистрированный пустой `!xml` |
| Имена и типы формы | `runtime/.../formElement/fromXMLToYAML.ts`, `rules/.../clientApplicationForm/*`, `typeDescription/*` | Перенести нестандартное `_name` и namespace-префикс в допустимые контекстные маркеры |
| Канонические defaults | предметные `rules.ts`, `systemEnumerations/*` | Восстановить обязательные и выводимые значения через существующие `implicitValueYAML`/`defaultValueXML` |
| Граница снимка | `packages/runtime/metadata/configurationIndex/collector/collectProperty.ts`, тесты `configurationIndex` и import/full sync | Оставить сбор только идентификаторов и порядка; доказать отсутствие чтения XML-состояния |

---

### Task 1: Зафиксировать наблюдаемый договор «без снимка»

**Files:**
- Modify: `packages/rules/metadata/configurationIndex/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/snapshotBuilder.test.ts`
- Create: `packages/rules/metadata/configurationIndex/xmlStateInventory.test.ts`

**Interfaces:**
- Consumes: `ConfigurationIndex`, `ConfigurationIndexCollector`, производственные XML → YAML и YAML → XML entrypoints.
- Produces: общий тестовый предикат `expectNoOrdinaryXMLState(index)` и перечень разрешённых полей: `uuid`, `xmlId`, `omittedChildren`, плюс отдельно исключённое extension-state.

- [ ] **Step 1: Добавить проверку тонкого содержимого записи**

В `xmlStateInventory.test.ts` определить локальный помощник, который не меняет production API:

```ts
function expectNoOrdinaryXMLState(index: ConfigurationIndex): void {
  for (const entity of index.entities) {
    expect(entity.identities?.xmlName).toBeUndefined()
    expect(entity.xml?.present).toBeUndefined()
    expect(entity.xml?.xsiNil).toBeUndefined()
    expect(entity.xml?.explicitEmpty).toBeUndefined()
    expect(entity.xml?.xsiType).toBeUndefined()
    expect(entity.xml?.xmlText).toBeUndefined()
    expect(entity.xml?.xmlPrefix).toBeUndefined()
  }
}
```

Построить индекс из XML, содержащего `_uuid`, `_id`, нестандартное `_name`, пустой `FillValue`, пустую коллекцию и тип с префиксом. Проверить, что `uuid` и `xmlId` остаются, а помощник пока падает на старых XML-полях.

- [ ] **Step 2: Добавить экспортный тест с пустым снимком**

В `fromYAMLToXML.test.ts` объединить по таблице представителей первой спецификации и для каждого сравнить результат экспорта с `configurationIndex: undefined` и с пустым индексом:

```ts
it.each([
  ["канонический default", yamlWithImplicitDefault],
  ["явный !xml", yamlWithExplicitXML],
])("экспортирует %s без XML-состояния снимка", (_name, yaml) => {
  expect(exportProbe(yaml, undefined)).toEqual(exportProbe(yaml, emptyConfigurationIndex()))
})
```

- [ ] **Step 3: Подтвердить RED только на XML-состоянии**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/configurationIndex/xmlStateInventory.test.ts metadata/configurationIndex/fromYAMLToXML.test.ts
```

Expected: новый инвентаризационный тест падает на `xmlName`/`xml.*`; существующие идентификаторы продолжают проходить.

- [ ] **Step 4: Зафиксировать тестовый каркас**

```bash
git add packages/rules/metadata/configurationIndex/fromYAMLToXML.test.ts packages/rules/metadata/configurationIndex/xmlStateInventory.test.ts packages/rules/metadata/importFromXml/importConfiguration.test.ts packages/rules/metadata/fullSyncToXml/snapshotBuilder.test.ts
git commit -m "test: :white_check_mark: зафиксировать снимок без XML-состояния"
```

---

### Task 2: Перенести пустые формы `FillValue` в контекстные маркеры

**Files:**
- Modify: `packages/rules/metadata/commonObjects/fillValue/analyzeItem.ts`
- Modify: `packages/rules/metadata/commonObjects/fillValue/register.ts`
- Modify: `packages/rules/metadata/commonObjects/fillValue/types.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataValue/toXML.ts`
- Modify: `packages/rules/metadata/commonObjects/characteristicsDescription/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/characteristicsDescription/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/characteristicsDescription/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/importFromXml/fillValueImport.test.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.fillValue.test.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPendingChecks.test.ts`

**Interfaces:**
- Consumes: `effectiveFillValueType`, `classifyMetadataAttributeFillValue`, `classifyStandardAttributeFillValue`, `ExplicitXMLPropertyRegistration.action = "transportScalar"`.
- Produces: `FillValueTransport = "Nil" | "String" | "DesignTimeRef" | "TypeDescription" | "Null"`; `parseFillValueItem()` возвращает этот транспорт отдельно от смыслового значения.

- [ ] **Step 1: Расширить падающие табличные тесты импорта**

Добавить случаи:

```ts
it.each([
  [ordinaryStringRule, '<FillValue xsi:type="xs:string"/>', undefined],
  [ordinaryStringRule, '<FillValue xsi:nil="true"/>', "!xml Nil"],
  [ordinaryCompositeRule, '<FillValue xsi:type="xs:string"/>', ""],
  [standardCodeRule, '<xr:FillValue xsi:type="xs:string"/>', "!xml String"],
  [standardValueTypeRule, '<xr:FillValue xsi:type="v8:TypeDescription"/>', "!xml TypeDescription"],
  [externalFieldRule, '<FillValue xsi:type="v8:Null"/>', "!xml Null"],
])("imports contextual empty FillValue", (rule, xml, expected) => {
  expect(importFillValue(rule, xml)).toBe(expected)
})
```

- [ ] **Step 2: Запустить тесты и подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/importFromXml/fillValueImport.test.ts metadata/validation/yamlFactExtractor.fillValue.test.ts
```

Expected: `DesignTimeRef` проходит, новые `Nil`, `String`, `TypeDescription`, `Null` отсутствуют либо неверно проверяются.

- [ ] **Step 3: Ввести закрытый тип транспортных значений**

В `fillValue/types.ts` определить:

```ts
export type FillValueTransport =
  | "Nil"
  | "String"
  | "DesignTimeRef"
  | "TypeDescription"
  | "Null"
```

В `parseFillValueItem` сначала разобрать зарегистрированные маркеры и вернуть `{ tagged: true, transport, value }`; неизвестный payload не считать транспортом и передать действующей смысловой/несовместимой обработке.

- [ ] **Step 4: Ограничить транспорт контекстом владельца**

В анализаторах вернуть точные ошибки из спецификации. Проверка должна быть эквивалентна:

```ts
switch (parsed.transport) {
  case "Nil":
    return ordinarySingleStringType(params) ? emptyAnalysis() : invalid("Nil допустим только для обычного строкового реквизита")
  case "String":
    return standardStringMember(params) ? emptyAnalysis() : invalid("String допустим только для строкового стандартного реквизита")
  case "TypeDescription":
    return standardValueTypeMember(params) ? emptyAnalysis() : invalid("TypeDescription допустим только для стандартного реквизита ТипЗначения")
  case "Null":
    return externalDataSourceField(params) ? emptyAnalysis() : invalid("Null допустим только для поля внешнего источника данных")
}
```

Предикаты разместить в предметном модуле `fillValue`, не добавлять `itemType`-условия в runtime.

- [ ] **Step 5: Добавить точные XML-overrides**

Расширить обе регистрации `transportScalar` только допустимыми формами, а контекстную проверку оставить dependent item:

```ts
overrides: {
  Nil: { "_xsi:nil": true },
  String: { "_xsi:type": "xs:string" },
  DesignTimeRef: { "_xsi:type": "xr:DesignTimeRef" },
  TypeDescription: { "_xsi:type": "v8:TypeDescription" },
  Null: { "_xsi:type": "v8:Null" },
}
```

Каноническое отсутствие обычного `FillValue` строить в предметном финализаторе по эффективному типу: единственная строка → `xs:string`, остальные → `xsi:nil`; стандартный реквизит без маркера → `xsi:nil`.

Для `CharacteristicsDescription.typesFilterValue` зарегистрировать только `DesignTimeRef`: пустой `xr:DesignTimeRef` импортируется как `ЗначениеОтбораВидов: !xml DesignTimeRef`, а отсутствующее значение остаётся каноническим `xsi:nil`. `UnfilledParentValue` внешнего источника данных проверить как канонический `xsi:nil` без маркера.

- [ ] **Step 6: Проверить GREEN и отсутствие снимка**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/importFromXml/fillValueImport.test.ts metadata/commonObjects/fillValue metadata/validation/yamlFactExtractor.fillValue.test.ts metadata/validation/projectValidationPendingChecks.test.ts
pnpm duplicates -- --base d1b37ff50
```

Expected: все формы проходят без `referenceMetadata`; неизвестные и контекстно недопустимые маркеры дают ошибку.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/rules/metadata/commonObjects/fillValue packages/rules/metadata/commonObjects/metadataValue/toXML.ts packages/rules/metadata/commonObjects/characteristicsDescription packages/rules/metadata/importFromXml/fillValueImport.test.ts packages/rules/metadata/validation/yamlFactExtractor.fillValue.test.ts packages/rules/metadata/validation/projectValidationPendingChecks.test.ts
git commit -m "feat: :sparkles: хранить пустые FillValue в YAML"
```

---

### Task 3: Перенести точную форму `MinValue` и `MaxValue` в YAML

**Files:**
- Create: `packages/rules/metadata/commonObjects/minMaxValue/fromYAML.ts`
- Create: `packages/rules/metadata/commonObjects/minMaxValue/toYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/minMaxValue/fromXML.ts`
- Modify: `packages/rules/metadata/commonObjects/minMaxValue/toXML.ts`
- Modify: `packages/rules/metadata/commonObjects/minMaxValue/toJSONSchema.ts`
- Modify: `packages/rules/metadata/commonObjects/minMaxValue/types.ts`
- Modify: `packages/rules/metadata/commonObjects/minMaxValue/fromXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/minMaxValue/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/minMaxValue/toJSONSchema.test.ts`

**Interfaces:**
- Consumes: `yamlScalarTagAt`, `xmlScalarTagPayload`, `xmlScalarTagValue`, `markYAMLScalarTag`, правило `typedXML`.
- Produces: `MinMaxValueModel = number | { kind: "xml"; xsiType?: string; text: string }`; обычный YAML остаётся числом, транспорт сериализуется как `!xml`.

- [ ] **Step 1: Заменить reference-тесты наблюдаемыми YAML-тестами**

Добавить таблицу:

```ts
it.each([
  ['<MinValue xsi:type="xs:string">1</MinValue>', 1],
  ['<MinValue xsi:type="xs:string">001.00</MinValue>', '!xml String 001.00'],
  ['<MinValue xsi:type="xs:decimal">001.00</MinValue>', '!xml Decimal 001.00'],
  ['<MinValue xsi:type="xs:dateTime">bad</MinValue>', '!xml Raw xs:dateTime bad'],
  ['<MinValue>bad</MinValue>', '!xml Raw - bad'],
])("imports exact MinMax representation", (xml, expected) => {
  expect(importAndSerialize(rule, xml)).toBe(expected)
})
```

Канонический первый случай задавать правилом с `typedXML: "xs:string"`; для `InputField` использовать `xs:decimal`, для нетипизированного правила — отсутствие `xsi:type`.

- [ ] **Step 2: Подтвердить RED без reference XML**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/commonObjects/minMaxValue
```

Expected: текущая реализация сохраняет форму только в boxed `Number` reference и теряет её в YAML.

- [ ] **Step 3: Реализовать закрытый разбор payload**

В `types.ts` определить:

```ts
export type MinMaxValueModel =
  | number
  | { readonly kind: "xml"; readonly xsiType?: string; readonly text: string }

export function parseMinMaxXMLPayload(payload: string): MinMaxValueModel {
  const [marker, ...rest] = payload.split(" ")
  if (marker === "String" || marker === "Decimal") {
    const text = rest.join(" ")
    if (text.length === 0 || !Number.isFinite(Number(text.replace(",", ".")))) throw new Error("ожидается конечное число")
    return { kind: "xml", xsiType: marker === "String" ? "xs:string" : "xs:decimal", text }
  }
  if (marker === "Raw") {
    const [qName, ...text] = rest
    if (qName === undefined) throw new Error("после Raw ожидается QName или -")
    return { kind: "xml", ...(qName === "-" ? {} : { xsiType: qName }), text: text.join(" ") }
  }
  throw new Error(`неизвестный маркер MinMaxValue: ${marker}`)
}
```

- [ ] **Step 4: Сравнивать импорт с каноническим экспортом**

`fromXML.ts` должен получить число, построить ожидаемые `xsi:type` и текст по правилу, и только при полном совпадении вернуть число. Иначе вернуть `{ kind: "xml", ... }`. `toYAML.ts` превращает эту ветку в `xmlScalarTagValue(...)` и помечает тегом `xml`; `fromYAML.ts` принимает число либо валидированный payload.

- [ ] **Step 5: Экспортировать точный транспорт без reference**

В `toXML.ts` первой веткой обработать `kind: "xml"`:

```ts
if (typeof value === "object" && value !== null && value.kind === "xml") {
  return { ...(value.xsiType === undefined ? {} : { "_xsi:type": value.xsiType }), "#text": value.text }
}
```

Удалить boxed `Number`, символы reference-метаданных и выбор XML-типа из `referenceValue`.

- [ ] **Step 6: Расширить схему и диагностики**

`toJSONSchema.ts` возвращает объединение числа и зарегистрированного `!xml`-скаляра только для внутренней validation-схемы; внешняя схема сохраняет только число. Использовать тот же механизм `explicitXMLPropertyValidationMode`, а не регулярное выражение в каждом объекте.

- [ ] **Step 7: Проверить GREEN и зафиксировать**

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/commonObjects/minMaxValue
pnpm duplicates -- --base d1b37ff50
git add packages/rules/metadata/commonObjects/minMaxValue
git commit -m "feat: :sparkles: сохранять точную XML-форму MinMaxValue"
```

---

### Task 4: Перенести одноязычную строку СКД из снимка в `!xml String`

**Files:**
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toJSONSchema.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.test.ts`
- Create: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toJSONSchema.test.ts`

**Interfaces:**
- Consumes: `I8nText`, YAML scalar tag helpers.
- Produces: `DcsLocalStringValue = I8nText | { kind: "xmlString"; text: string }`.

- [ ] **Step 1: Добавить RED для обеих XML-форм и недопустимых контекстов**

```ts
expect(importAndSerialize('<title xsi:type="xs:string">Текст</title>'))
  .toBe('Заголовок: !xml "String Текст"')
expect(importAndSerialize(localStringXML("Текст")))
  .toBe("Заголовок: Текст")
expect(() => importFromYaml('Заголовок: !xml "String Текст"', twoLanguages))
  .toThrow("String допустим только для одноязычной строки СКД")
```

- [ ] **Step 2: Подтвердить RED**

Run: `pnpm --filter @nakidka/rules exec vitest run --project unit metadata/commonObjects/dataCompositionSystem/dcsLocalStringType`

Expected: `xs:string` сейчас определяется через reference/snapshot и сериализуется как обычный текст.

- [ ] **Step 3: Реализовать транспорт на границе типа**

`fromXML` возвращает `{ kind: "xmlString", text }` для `xs:string`; `toYAML` помечает `String ${text}` тегом; `fromYAML` требует префикс `String` и допускает в том числе пустой текст после него только для одноязычного значения; `toXML` строит `xs:string` из модели, а обычный `I8nText` всегда строит `v8:LocalStringType`.

- [ ] **Step 4: Удалить собственный сборщик `xsiType`**

Удалить `metadataPropertyRule001` с `collectConfigurationIndexFromXML` из `fromXML.ts`. Проверить, что в тестовом индексе для `DcsLocalStringType` нет `xsiType`.

- [ ] **Step 5: Проверить и зафиксировать**

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/commonObjects/dataCompositionSystem/dcsLocalStringType
pnpm duplicates -- --base d1b37ff50
git add packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType
git commit -m "feat: :sparkles: сохранять строковую форму СКД в YAML"
```

---

### Task 5: Различить пустое и неопределённое значение параметров СКД

**Files:**
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/dcscorItemsXML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/dcscorItemsXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/toXML.test.ts`

**Interfaces:**
- Consumes: действующие представления обычных DCS metadata values.
- Produces: `!xml Nil` только для `SettingsParameterValueCollection.value`; `!xml Undefined` только для `dcssch:Parameter.value`; обычный `null` остаётся `xsi:nil` параметра схемы.

- [ ] **Step 1: Добавить таблицу трёх состояний schema parameter**

```ts
it.each([
  ["<dcssch:parameter/>", undefined],
  ['<dcssch:parameter><dcssch:value xsi:nil="true"/></dcssch:parameter>', null],
  [`<dcssch:parameter><dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value></dcssch:parameter>`, "!xml Undefined"],
])("preserves schema parameter state", (xml, expected) => {
  expect(importParameterValue(xml)).toBe(expected)
})
```

- [ ] **Step 2: Добавить настройки параметра `Nil`**

Проверить, что отсутствующий `dcscor:value` не создаёт YAML-поле, `xsi:nil` создаёт `Значение: !xml Nil`, обычное значение не тегируется, а маркер у другого владельца отклоняется.

- [ ] **Step 3: Подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection metadata/commonObjects/dataCompositionSystem/dcsMetadataValue
```

- [ ] **Step 4: Реализовать два предметных транспорта**

Для collection-item добавить локальную пару функций:

```ts
const importSettingsValue = (xml: unknown) => isXsiNil(xml) ? xmlScalarTagValue("Nil") : importOrdinaryValue(xml)
const exportSettingsValue = (yaml: unknown) => isXmlPayload(yaml, "Nil") ? { "_xsi:nil": true } : exportOrdinaryValue(yaml)
```

Для schema parameter распознавать только точную комбинацию namespace `http://v8.1c.ru/8.2/data/types`, `xsi:type="v8:Type"` и текст `d6p1:Undefined`; экспорт `Undefined` формирует эту же комбинацию. Другие `v8:Type` продолжают обычную обработку.

Усилить существующие тесты двух уже смысловых форм: `{}` в `ПравоеЗначение` восстанавливает `<dcsset:right xsi:nil="true"/>`, а `{}` в `ДоступныеЗначения` — вложенный `<dcssch:value xsi:nil="true"/>`. Для них не добавлять новый `!xml` и не менять модель.

- [ ] **Step 5: Удалить снимочные дескрипторы этих двух случаев**

Убрать `xsiNilWhenNotRepresentable`/custom collector там, где они обслуживали именно эти свойства. Не удалять общий контракт `MetadataDcsMetadataValue`, пока другие его применения не пройдут Task 11.

- [ ] **Step 6: Проверить и зафиксировать**

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection metadata/commonObjects/dataCompositionSystem/dcsMetadataValue
pnpm duplicates -- --base d1b37ff50
git add packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue
git commit -m "feat: :sparkles: хранить особые значения параметров СКД в YAML"
```

---

### Task 6: Зарегистрировать пустые XML-коллекции и элементы

**Files:**
- Create: `packages/rules/metadata/commonObjects/indexField/explicitAdditionalFields.ts`
- Modify: `packages/rules/metadata/commonObjects/indexField/fromXML.ts`
- Create: `packages/rules/metadata/commonObjects/indexField/fromXMLToYAML.test.ts`
- Create: `packages/rules/metadata/commonObjects/indexField/fromYAMLToXML.test.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/explicitEmptyAttributes.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/explicitEmptyTitle.ts`
- Modify: `packages/rules/metadata/forms/elements/labelDecoration/rules.ts`
- Modify: `packages/rules/metadata/forms/elements/extendedTooltip/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataChartOfAccounts/predefined/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formAttribute/rules.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formAttribute/settings.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formAttribute/fromXMLToYAML.test.ts`

**Interfaces:**
- Consumes: `EMPTY_XML_TAG_VALUE`, `explicitXMLProperties`, `explicitXMLPropertyTypes`, `materializeCollection`, `emit`, `omit`.
- Produces: пять строго ограниченных пустых маркеров: `ДополнительныеПоля`, `Реквизиты`, `Заголовок`, `ВидыСубконто`, `ТипЗначения`.

- [ ] **Step 1: Добавить RED для каждой тройки состояний**

Для каждого свойства проверить «отсутствует / пустой XML / непустой XML». Представитель:

```ts
expect(importForm("<Form/>" ).yaml).not.toHaveProperty("Реквизиты")
expect(importForm("<Form><Attributes/></Form>").yaml.Реквизиты).toBe(EMPTY_XML_TAG_VALUE)
expect(exportForm("Реквизиты: !xml")).toContain("<Attributes/>")
```

Для `Title` проверить только `LabelDecoration` и `ExtendedTooltip`, для `ExtDimensionTypes` — только предопределённый счёт, для `Settings` — только единственный `v8:ValueListType`.

- [ ] **Step 2: Подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/commonObjects/indexField metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/forms/commonObjects/formAttribute/fromXMLToYAML.test.ts
```

- [ ] **Step 3: Использовать фиксированные регистрации там, где XML однозначен**

Регистрация `AdditionalFields` имеет вид:

```ts
export const explicitAdditionalFieldsRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: {
    indexAdditionalFields: {
      itemType: "IndexField",
      propertyKey: "additionalFields",
      yamlValue: EMPTY_XML_TAG_VALUE,
      xmlValue: {},
    },
  },
})
```

Тем же способом зарегистрировать `Attributes: {}`, `Title: { _formatted: true }` и `ExtDimensionTypes: {}` с точными `itemType`/`propertyKey`. Не делать глобальную регистрацию по типу `FormattedI8nText`.

- [ ] **Step 4: Реализовать контекстное отсутствие `Settings`**

В адаптере `formAttribute/settings.ts` при единственном `v8:ValueListType`:

```ts
if (yamlTypeValue === EMPTY_XML_TAG_VALUE) return undefined
if (yamlTypeValue === undefined) return { "_xsi:type": "v8:TypeDescription" }
```

Импорт ставит пустой маркер только когда тип ровно один и `Settings` отсутствует. Составной тип без `Settings` остаётся каноническим отсутствием без маркера.

- [ ] **Step 5: Удалить старые collectors**

Удалить `collectConfigurationIndexFromXML` из `indexField/fromXML.ts` и точечные вызовы для `Attributes`, `Title`, `ExtDimensionTypes`, `Settings`. Формат снимка не трогать.

- [ ] **Step 6: Проверить схемы**

Внутренняя schema должна принимать пустой `!xml` только в пяти согласованных местах; внешняя schema не должна рекламировать транспортные поля. Для каждого другого владельца проверить `Check(...) === false`.

- [ ] **Step 7: Проверить и зафиксировать**

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/commonObjects/indexField metadata/forms/clientApplicationForm metadata/forms/commonObjects/formAttribute metadata/appliedObjects/metadataChartOfAccounts
pnpm duplicates -- --base d1b37ff50
git add packages/rules/metadata/commonObjects/indexField packages/rules/metadata/forms/clientApplicationForm packages/rules/metadata/forms/elements/labelDecoration packages/rules/metadata/forms/elements/extendedTooltip packages/rules/metadata/forms/commonObjects/formAttribute packages/rules/metadata/appliedObjects/metadataChartOfAccounts/predefined packages/rules/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts packages/rules/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts
git commit -m "feat: :sparkles: хранить явные пустые XML-элементы в YAML"
```

---

### Task 7: Перенести нестандартное имя встроенного элемента формы в поле `Имя`

**Files:**
- Create: `packages/rules/metadata/forms/clientApplicationForm/explicitElementName.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/types.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/validateElementNames.ts`

**Interfaces:**
- Consumes: каноническое имя, уже вычисляемое form-element runtime; YAML scalar tag metadata.
- Produces: `readExplicitElementXMLName(element): string | undefined`; `writeExplicitElementXMLName(yaml, value): void`; закрытый список одиночных встроенных типов.

- [ ] **Step 1: Добавить RED для канонического, нестандартного и пустого имени**

```ts
it.each([
  ["ЗаказExtendedTooltip", undefined],
  ["СтароеИмяExtendedTooltip", "!xml СтароеИмяExtendedTooltip"],
  ["", '!xml ""'],
])("imports embedded element name %j", (xmlName, expected) => {
  expect(importTooltip(xmlName).РасширеннаяПодсказка.Имя).toBe(expected)
})
```

Дополнительно проверить, что переименование владельца не меняет явно сохранённое имя.

- [ ] **Step 2: Подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/forms/clientApplicationForm/toJSONSchema.test.ts
```

- [ ] **Step 3: Ограничить транспорт закрытым списком**

В `explicitElementName.ts` определить:

```ts
const EXPLICIT_NAME_ITEM_TYPES = new Set([
  "ExtendedTooltip",
  "ContextMenu",
  "AutoCommandBar",
  "SearchStringAddition",
  "SearchControlAddition",
  "ViewStatusAddition",
  "GanttChartFieldTable",
])
```

Использовать фактическое `itemType` вложенной таблицы из реестра формы, если оно отличается; не определять тип по XML-тегу или имени YAML-папки.

- [ ] **Step 4: Импортировать только отклонение от канонического имени**

После вычисления `canonicalName` сравнить его с `_name`. При различии записать `Имя` через `xmlScalarTagValue(xmlName)` и `markYAMLScalarTag`. Не вызывать `setIdentity(..., "xmlName", ...)`.

- [ ] **Step 5: Экспортировать и проверить поле**

Если тег `xml` присутствует, использовать payload дословно; если поля нет — `canonicalName`; если `Имя` есть без тега — выдать диагностику. Внешняя схема подсказок исключает поле, внутренняя validation-схема допускает только тегированный скаляр.

- [ ] **Step 6: Проверить и зафиксировать**

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/forms/clientApplicationForm packages/runtime/metadata/ruleRuntime/formElement
pnpm duplicates -- --base d1b37ff50
git add packages/rules/metadata/forms/clientApplicationForm packages/runtime/metadata/ruleRuntime/formElement
git commit -m "feat: :sparkles: переносить нестандартное имя элемента формы в YAML"
```

---

### Task 8: Завершить транспорт namespace-префикса `TypeDescription`

**Files:**
- Review and modify: `packages/rules/metadata/commonObjects/typeDescription/fromXML.ts`
- Review and modify: `packages/rules/metadata/commonObjects/typeDescription/toXML.ts`
- Review and modify: `packages/rules/metadata/commonObjects/typeDescription/fromYAML.ts`
- Review and modify: `packages/rules/metadata/commonObjects/typeDescription/toYAML.ts`
- Review and modify: `packages/rules/metadata/commonObjects/typeDescription/types.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/fromXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/fromYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/toYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/toXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataEventSubscription/fromYAMLToXML.test.ts`
- Delete only after the canonical behavior is covered: artificial `source-typeset.xml` and `source-child-typeset.xml` fixtures already marked deleted in the worktree

**Interfaces:**
- Consumes: `xmlTypeNames`, реестр namespace URI ↔ тип, глубина `Predefined/Item`.
- Produces: точный маркер `Тип: !xml <prefix>:<русское имя>` только для неканонического префикса; канонический выбор `v8:Type`/`v8:TypeSet` без снимка.

- [ ] **Step 1: Проверить незавершённые изменения вместо их перезаписи**

Run:

```bash
git diff -- packages/rules/metadata/commonObjects/typeDescription packages/rules/metadata/appliedObjects/metadataEventSubscription
```

Сопоставить каждую строку со спецификацией. Оставить только: распознавание префикса, связь префикса с namespace реестра, экспорт точного payload, отказ от искусственного `<Source xsi:type="v8:TypeSet">`.

- [ ] **Step 2: Добавить полный набор RED/GREEN-проверок**

```ts
expect(importType(chartWithPrefix("d7p1"))).toBe("!xml d7p1:Диаграмма")
expect(exportType("!xml d7p1:Диаграмма")).toEqual(chartWithPrefix("d7p1"))
expect(() => exportType("!xml d7p1:Справочник.Товары")).toThrow("префикс не соответствует namespace типа")
expect(exportPredefinedRef({ depth: 4 })).toContain("d10p1:")
```

Проверить глубины 1–4 и `v8:TypeSet` для общего семейства `DocumentObject`; не сохранять сам выбор `TypeSet` в YAML.

- [ ] **Step 3: Удалить снимочное сохранение префикса**

Удалить вызов `collector.setXmlValue(..., "xmlPrefix", ...)` и связанный `xmlText` из `typeDescription/fromXML.ts`. Namespace URI и английское XML-имя восстанавливать из русского имени через существующий реестр.

- [ ] **Step 4: Проверить схему и сообщения ошибок**

Неизвестный русский тип, пустой префикс, отсутствующее имя после `:` и несовместимая пара должны отклоняться до записи XML. Обычный `Тип: Диаграмма` остаётся допустимым и экспортируется с каноническим префиксом.

- [ ] **Step 5: Проверить и зафиксировать только связанные изменения**

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/commonObjects/typeDescription metadata/appliedObjects/metadataEventSubscription/fromYAMLToXML.test.ts
pnpm duplicates -- --base d1b37ff50
git add packages/rules/metadata/commonObjects/typeDescription packages/rules/metadata/appliedObjects/metadataEventSubscription/fromYAMLToXML.test.ts packages/rules/metadata/appliedObjects/metadataEventSubscription/__fixtures__/source-typeset.xml packages/rules/metadata/appliedObjects/metadataEventSubscription/__fixtures__/source-child-typeset.xml
git commit -m "feat: :sparkles: хранить нестандартный префикс типа в YAML"
```

---

### Task 9: Закрепить канонические значения правилами, а не присутствием XML

**Files:**
- Create: `packages/rules/metadata/ruleRuntime/property/canonicalXMLDefaults.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/implicitValueYAMLContract.test.ts`
- Create: `packages/rules/metadata/systemEnumerations/xmlAliases.ts`
- Modify: `packages/rules/metadata/systemEnumerations/types.ts`
- Modify: `packages/rules/metadata/systemEnumerations/fromXML.ts`
- Modify: `packages/rules/metadata/systemEnumerations/toXML.ts`
- Modify: `packages/rules/metadata/systemEnumerations/roundTrip.test.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataWebServiceOperation/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/exchangePlanContent/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataHTTPServiceMethod/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configuration/fromXMLToYAMLToXML.test.ts`

**Interfaces:**
- Consumes: existing `implicitValueYAML`, `defaultValueXML`, `evaluateWhenYAMLMissing`, system-enumeration registries.
- Produces: обязательные XML-элементы из спецификации без `xml.present` и точное преобразование `RadioButton` ↔ YAML `Переключатель` ↔ XML `RadioButtons`.

- [ ] **Step 1: Превратить таблицы спецификации в контрактный `it.each`**

Добавить представителей всех групп:

```ts
it.each([
  [commonModuleRule, "server", true],
  [webServiceOperationRule, "nillable", false],
  [webServiceParameterRule, "transferDirection", "In"],
  [exchangePlanItemRule, "autoRecord", "Allow"],
  [chartOfAccountsPredefinedRule, "offBalance", false],
  [calculationTypePredefinedRule, "actionPeriodIsBase", false],
])("materializes %s.%s from implicitValueYAML", (rule, key, expected) => {
  expect(exportMissingProperty(rule, key)).toEqual(expected)
})
```

Отдельно покрыть свойства реквизита (`РежимПароля`, `ВыделятьОтрицательные`, `МногострочныйРежим`, `РасширенноеРедактирование`, `ЗаполнятьИзДанныхЗаполнения`, `БыстрыйВыбор`, `СозданиеПриВводе`, `ИсторияВыбораПриВводе`, `ПроверкаЗаполнения`, `ВыборГруппИЭлементов`, `Индексирование`), `ИспользоватьСтандартныеКоманды`, `ВключатьСправкуВСодержание`, все восемь свойств общего модуля, историю данных, полнотекстовый поиск, `Синоним`, `HTTPMethod` и оба режима совместимости.

Для `Синоним` проверить содержательное значение, вычисляемое из имени значение и пустой канонический элемент. Различие между отсутствующим и пустым `Synonym` не переносить в `!xml`.

- [ ] **Step 2: Подтвердить RED только для отсутствующих договоров**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/ruleRuntime/property/implicitValueYAMLContract.test.ts metadata/systemEnumerations/roundTrip.test.ts metadata/commonObjects/metadataWebServiceOperation metadata/commonObjects/exchangePlanContent
```

- [ ] **Step 3: Проверить уже объявленные предметные defaults**

Контрактный тест читает существующие правила и требует уже согласованные параметры:

```ts
nillable: booleanRule({
  yaml: "МожетБытьНеопределено",
  xml: "Nillable",
  implicitValueYAML: false,
  defaultValueXML: false,
})
```

В тест явно включить XML-элементы `AutoRecord`, `OffBalance`, `ActionPeriodIsBase`, `Nillable`, `Transactioned`, `DataLockControlMode` и `TransferDirection`. Если какое-либо правило не соответствует таблице спецификации, исправить именно показанное тестом существующее `rules.ts` в том же коммите; не вводить общий флаг «всегда писать XML». Для исполнения отсутствующего YAML использовать только уже существующий `evaluateWhenYAMLMissing`.

- [ ] **Step 4: Исправить только XML-псевдоним RadioButton**

В системном перечислении оставить внутреннее `RadioButton`, удалить двусмысленную ветку `RadioButtons` из `RadioButtonTypeToYAML` и задать XML-преобразование в предметной таблице `xmlAliases.ts`:

```ts
export const systemEnumerationXMLAliases = {
  RadioButtonType: {
    toXML: { RadioButton: "RadioButtons" },
    fromXML: { RadioButtons: "RadioButton" },
  },
} as const
```

XML `RadioButton` не принимать как каноническую форму.

- [ ] **Step 5: Проверить отсутствие `present`**

Для каждой группы построить import index и проверить, что XML-элемент есть в round-trip результате, но запись свойства не содержит `xml.present`.

- [ ] **Step 6: Проверить и зафиксировать**

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/ruleRuntime/property/implicitValueYAMLContract.test.ts metadata/systemEnumerations metadata/appliedObjects/metadataCommonModule metadata/commonObjects/metadataWebServiceOperation metadata/commonObjects/exchangePlanContent metadata/commonObjects/metadataHTTPServiceMethod
pnpm duplicates -- --base d1b37ff50
git add packages/rules/metadata/ruleRuntime/property/canonicalXMLDefaults.test.ts packages/rules/metadata/ruleRuntime/property/implicitValueYAMLContract.test.ts packages/rules/metadata/systemEnumerations/xmlAliases.ts packages/rules/metadata/systemEnumerations/types.ts packages/rules/metadata/systemEnumerations/fromXML.ts packages/rules/metadata/systemEnumerations/toXML.ts packages/rules/metadata/systemEnumerations/roundTrip.test.ts packages/rules/metadata/commonObjects/metadataWebServiceOperation/fromYAMLToXML.test.ts packages/rules/metadata/commonObjects/exchangePlanContent/fromYAMLToXML.test.ts packages/rules/metadata/commonObjects/metadataHTTPServiceMethod/fromYAMLToXML.test.ts packages/rules/metadata/appliedObjects/configuration/fromXMLToYAMLToXML.test.ts
git commit -m "fix: :bug: восстанавливать канонические XML-свойства из правил"
```

---

### Task 10: Подтвердить уже реализованные `!xml`-случаи без снимка

**Files:**
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/characteristicsDescription/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/characteristicsDescription/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/forms/elements/formField/explicitHeaderHorizontalAlign.test.ts`
- Modify: `packages/rules/metadata/forms/elements/table/explicitRowFilter.test.ts`
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/dataPathCompatibility.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataValue/brokenDesignTimeRef.test.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataRef/brokenMDObjectRef.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/toXML.test.ts`

**Interfaces:**
- Consumes: действующие `explicitXMLProperties`, broken-reference carriers и YAML scalar tags.
- Produces: доказательство, что согласованные ранее случаи полностью определяются YAML и rules.ts.

- [ ] **Step 1: Усилить каждый существующий round-trip одним утверждением о пустом снимке**

Использовать существующий helper экспорта, явно не передавая reference/configuration index:

```ts
const imported = importWithoutReference(sourceXML)
const exported = exportWithoutReference(imported.yaml, { configurationIndex: undefined })
expect(exported).toEqual(sourceXML)
```

Не создавать второй тест, если существующий уже проверяет тот же договор: добавить параметр или одно ожидание.

- [ ] **Step 2: Проверить закрытые ограничения**

Проверить, что пустой маркер нельзя применить к другому свойству, битый payload проверяется по зарегистрированной форме, положение элемента списка задаётся YAML-массивом, `PустоеОпределение` требует UUID и отсутствие имени/представления, а несовместимый разрешимый `ПутьКДанным` сохраняет исходную строку только через действующий `!xml`.

- [ ] **Step 3: Запустить набор**

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/commonObjects/standardAttributeDescription metadata/commonObjects/characteristicsDescription metadata/forms/elements/formField/explicitHeaderHorizontalAlign.test.ts metadata/forms/elements/table/explicitRowFilter.test.ts metadata/commonObjects/clientApplicationInterface metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts metadata/commonObjects/metadataValue/brokenDesignTimeRef.test.ts metadata/commonObjects/metadataRef/brokenMDObjectRef.test.ts
```

Expected: PASS до production-изменений либо выявляется точечная остаточная зависимость от снимка, которая исправляется в соответствующем предметном модуле, а не в runtime.

- [ ] **Step 4: Проверить и зафиксировать тестовые уточнения**

```bash
pnpm duplicates -- --base d1b37ff50
git add packages/rules/metadata/commonObjects packages/rules/metadata/forms
git commit -m "test: :white_check_mark: подтвердить XML-аномалии без снимка"
```

Перед `git add` перечислить только реально изменённые тестовые файлы.

---

### Task 11: Отключить сбор и чтение обычного XML-состояния снимка

**Files:**
- Modify: `packages/runtime/metadata/configurationIndex/collector/collectProperty.ts`
- Modify: `packages/runtime/metadata/configurationIndex/referenceView.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/register.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataValue/fromXML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
- Modify: `packages/rules/metadata/systemEnumerations/fromXML.ts`
- Modify: `packages/runtime/metadata/configurationIndex/collector/writer.test.ts`
- Modify: `packages/rules/metadata/configurationIndex/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/snapshotBuilder.test.ts`

**Interfaces:**
- Consumes: все предметные договоры Tasks 2–10.
- Produces: сборщик обычной конфигурации пишет только `uuid`, `xmlId` и `omittedChildren`; действующий reader продолжает понимать старый формат, но экспорт перечисленных свойств его не запрашивает.

- [ ] **Step 1: Запустить инвентаризационный тест Task 1 и подтвердить оставшийся RED**

Run: `pnpm --filter @nakidka/rules exec vitest run --project unit metadata/configurationIndex/xmlStateInventory.test.ts`

Expected: после предметных задач остаются только общие автоматические записи `xmlName`/`xml.*`.

- [ ] **Step 2: Оставить в общем identity collector только UUID и XML `_id`**

Сузить функцию без изменения публичной сигнатуры:

```ts
if (params.sourceXmlKey === "_uuid") {
  collection.collector.setIdentity(collection.logicalAddress, "uuid", params.xmlValue)
} else if (params.sourceXmlKey === "_id") {
  collection.collector.setIdentity(
    collection.logicalAddress,
    params.descriptor?.identityKind === "uuid" ? "uuid" : "xmlId",
    params.xmlValue,
  )
}
```

Ветку `_name` удалить; transport имени уже реализован Task 7.

- [ ] **Step 3: Прекратить общий сбор XML-состояния свойства**

Сохранить вызовы функции, если они нужны профилировщику, но сделать `collectConfigurationIndexPropertyFromXML` пустой для ordinary configuration либо удалить вызовы после проверки архитектурных границ. Не удалять `extended` из extension collector. Удалить `collectConfigurationIndexImportedValue` и предметные `configurationIndexValueFromXML`-дескрипторы, которые больше не имеют потребителей.

- [ ] **Step 4: Удалить чтение XML-state из экспортных путей**

В `referenceView.ts` оставить API декодирования старого снимка для совместимости, но убрать вызовы `xmlReference()`/`identity("xmlName")` из ordinary rules. `uuid` и `xmlId` продолжают читаться. Отдельно проверить, что extension export по-прежнему читает своё состояние.

- [ ] **Step 5: Удалить дублирующие panelDef values**

В `clientApplicationInterface/register.ts` оставить `xmlId` панели, но удалить:

```ts
collector.setXmlValue(`${address}.name`, "xmlText", panelDef.name)
collector.setXmlValue(`${address}.spr`, "xmlText", panelDef.spr)
```

Экспортировать `name` из `Имя`, `spr` из `Представление`, пустую форму — из `ПустоеОпределение: !xml`.

- [ ] **Step 6: Получить GREEN для тонкого снимка**

Run:

```bash
pnpm --filter @nakidka/runtime exec vitest run metadata/configurationIndex
pnpm --filter @nakidka/rules exec vitest run --project unit metadata/configurationIndex metadata/importFromXml/importConfiguration.test.ts metadata/fullSyncToXml/snapshotBuilder.test.ts metadata/commonObjects/clientApplicationInterface
```

Expected: индекс не содержит ordinary `xmlName`/`xml.*`; UUID, XML `_id` и порядок детей остаются; старый бинарный snapshot по-прежнему декодируется.

- [ ] **Step 7: Проверить и зафиксировать**

```bash
pnpm duplicates -- --base d1b37ff50
git add packages/runtime/metadata/configurationIndex packages/runtime/metadata/ruleRuntime packages/rules/metadata/configurationIndex packages/rules/metadata/importFromXml packages/rules/metadata/fullSyncToXml packages/rules/metadata/commonObjects/clientApplicationInterface packages/rules/metadata/commonObjects/metadataValue/fromXML.ts packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts packages/rules/metadata/systemEnumerations/fromXML.ts
git commit -m "refactor: :recycle: исключить XML-состояние из снимка конфигурации"
```

---

### Task 12: Проверить полный round-trip первой спецификации

**Files:**
- Modify only if a missing cross-layer contract is found: existing integration/e2e tests
- Do not modify: `docs/superpowers/specs/2026-08-11-lmdb-configuration-index-design.md` and LMDB implementation files

**Interfaces:**
- Consumes: все предыдущие задачи.
- Produces: завершённая первая фаза, пригодная для последующего независимого перехода на LMDB.

- [ ] **Step 1: Запустить целевые тесты первой спецификации единым набором**

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit \
  metadata/commonObjects/fillValue \
  metadata/commonObjects/minMaxValue \
  metadata/commonObjects/dataCompositionSystem/dcsLocalStringType \
  metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection \
  metadata/commonObjects/dataCompositionSystem/dcsMetadataValue \
  metadata/commonObjects/indexField \
  metadata/commonObjects/typeDescription \
  metadata/forms/clientApplicationForm \
  metadata/configurationIndex
```

Expected: PASS; ни один тест точной формы не передаёт reference XML или XML-state снимка.

- [ ] **Step 2: Запустить интеграционные round-trip проверки**

```bash
pnpm --filter @nakidka/rules exec vitest run --project integration metadata/importFromXml metadata/fullSyncToXml metadata/forms/clientApplicationForm
```

Expected: PASS; import создаёт YAML-маркеры, full sync восстанавливает XML с пустым снимком XML-state.

- [ ] **Step 3: Выполнить обязательные проверки проекта**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base d1b37ff50
```

Expected: все команды завершаются с кодом 0; новых дублей и архитектурных нарушений нет.

- [ ] **Step 4: Сверить итог с границей спецификации**

Проверить `git diff --stat d1b37ff50` и подтвердить:

```text
не изменены encode/decode/version текущего снимка
не добавлен LMDB runtime
не изменено extension-state
uuid/xmlId/omittedChildren продолжают сохраняться
ordinary xmlName/present/xsiNil/explicitEmpty/xsiType/xmlText/xmlPrefix не создаются
```

- [ ] **Step 5: Зафиксировать только финальные интеграционные уточнения**

Если Step 2 потребовал изменения тестов или связующего кода:

```bash
git add packages/rules/metadata/importFromXml/importConfiguration.test.ts packages/rules/metadata/fullSyncToXml/snapshotBuilder.test.ts packages/rules/metadata/configurationIndex/fromYAMLToXML.test.ts
git commit -m "test: :white_check_mark: проверить XML round-trip без снимка"
```

Если изменений нет, отдельный пустой коммит не создавать.
