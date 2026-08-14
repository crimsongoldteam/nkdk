# Classified XML Anomaly Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Выполнять без субагентов.

**Goal:** Полностью заменить общий `!xml` шестью согласованными тегами причин, перенести все действующие XML-аномалии и исправить round-trip `Popup.ExtendedTooltip` в Storekeeper.

**Architecture:** YAML runtime распознаёт закрытое семейство `!xml/present`, `!xml/absent`, `!xml/name`, `!xml/type`, `!xml/value`, `!xml/reference`; старый `!xml` удаляется. Общий property runtime различает категории существующими регистрациями и переносчиками без новых полей в `BasePropertyRule`/`PropertyRule`; предметные модули задают только согласованную категорию и строгую грамматику payload. Popup получает отдельный property type поверх существующего `ExtendedTooltip`, чтобы сохранить индексный `id`, скрыть каноническую пустую подсказку и представить исключения скалярами.

**Tech Stack:** TypeScript, js-yaml, TypeBox, Vitest, metadata rules/runtime, LMDB project state, round-trip-yaml.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не добавлять namespace-теги: случай `xmlns:dcssch` отложен отдельным решением.
- Не добавлять `!xml/order` и другие категории вне утверждённого словаря.
- Не поддерживать старый `!xml` после завершения миграции.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей rules.ts.
- Сохранить внутренний двоичный признак `tagged: "xml"` в project state как технический факт наличия согласованной XML-аномалии; пользовательскую категорию проверять до построения этого факта.
- Исторические спеки массово не переписывать.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base 08bbdedb4`.
- `pnpm --filter @nkdk/rules test:native`, `pnpm test:e2e`, `pnpm test` и round-trip запускать вне песочницы; при `SIGABRT` сначала повторить вне песочницы.
- Перед PR выполнить `pnpm test:architecture:rules` и `pnpm test:architecture`.

---

### Task 1: Закрытое семейство YAML-тегов

**Files:**
- Modify: `packages/runtime/yaml/scalarTags.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.test.ts`
- Modify: `packages/runtime/yaml/export.test.ts`

**Interfaces:**
- Produces: `XML_ANOMALY_TAGS`, `XMLAnomalyTag`, `isXMLAnomalyTag`, `xmlAnomalyTagValue`, `xmlAnomalyTagPayload`, `XML_PRESENT_TAG_VALUE`, `XML_ABSENT_TAG_VALUE`.
- Preserves: `markYAMLScalarTag`, `yamlScalarTagAt`, `copyYAMLScalarTags`, property-state tags `!проверять` и `!изменять`.

- [ ] **Step 1: Добавить RED-тесты шести тегов**

В `jsYamlParser.test.ts` проверить разбор:

```yaml
Присутствует: !xml/present
Отсутствует: !xml/absent
Имя: !xml/name ФункцииExtendedTooltip
Тип: !xml/type d7p1:Диаграмма
Значение: !xml/value Nil
Ссылка: !xml/reference 00000000-0000-0000-0000-000000000000
```

Ожидать точную категорию в `yamlScalarTagAt`. Отдельно проверить, что `parseMetadataYaml("Поле: !xml значение\n")` бросает ошибку неизвестного тега.

- [ ] **Step 2: Запустить runtime-тесты и подтвердить RED**

```bash
pnpm --filter @nkdk/runtime exec vitest run yaml/jsYamlParser.test.ts yaml/export.test.ts
```

Expected: новые теги не зарегистрированы.

- [ ] **Step 3: Реализовать общий контракт тегов**

В `scalarTags.ts` заменить вариант `"xml"` шестью точными вариантами:

```ts
export const XML_ANOMALY_TAGS = [
  "xml/present",
  "xml/absent",
  "xml/name",
  "xml/type",
  "xml/value",
  "xml/reference",
] as const

export type XMLAnomalyTag = (typeof XML_ANOMALY_TAGS)[number]
export type YAMLScalarTag = XMLAnomalyTag | "xml" | "проверять" | "изменять"

export const XML_PRESENT_TAG_VALUE = "!xml/present" as const
export const XML_ABSENT_TAG_VALUE = "!xml/absent" as const

export function xmlAnomalyTagValue(tag: XMLAnomalyTag, payload = ""): string {
  const marker = `!${tag}`
  return payload === "" ? marker : `${marker} ${payload}`
}

export function xmlAnomalyTagPayload(tag: XMLAnomalyTag, value: string): string {
  const marker = `!${tag}`
  if (value === marker) return ""
  if (value.startsWith(`${marker} `)) return value.slice(marker.length + 1)
  throw new Error(`Значение не соответствует тегу ${marker}`)
}
```

Создать `defineScalarTag` для каждого элемента `XML_ANOMALY_TAGS`. Не включать `!xml` в `NKDK_YAML_SCHEMA`. `identify` обязан сравнивать точную категорию.

Вариант `"xml"` временно остаётся только в TypeScript union, чтобы последующие
задачи могли мигрировать consumers по слоям. Для него нет parser/dumper tag,
поэтому это не пользовательская совместимость. Удалить вариант в Task 7 после
последнего production-consumer.

- [ ] **Step 4: Добавить проверки сериализации и sidecar**

В `export.test.ts` проверить round-trip всех шести тегов, пустые `present`/`absent`, payload с пробелами и копирование точной категории через `copyYAMLScalarTags`.

- [ ] **Step 5: Проверить слой и новые дубли**

```bash
pnpm --filter @nkdk/runtime exec vitest run yaml/jsYamlParser.test.ts yaml/export.test.ts
pnpm type-check
pnpm duplicates -- --base 08bbdedb4
```

Expected: PASS, старый `!xml` отклоняется.

- [ ] **Step 6: Закоммитить основу**

```bash
git add packages/runtime/yaml/scalarTags.ts packages/runtime/yaml/jsYamlParser.test.ts packages/runtime/yaml/export.test.ts
git commit -m "feat: :sparkles: добавить категории XML-аномалий"
```

---

### Task 2: `present`, `absent` и `value` в общем property runtime

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/toJSONSchema.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/propertyRuleRegistrySet.ts`
- Modify: `packages/rules/metadata/importFromXml/dependentItems.ts`
- Modify: `packages/rules/metadata/commonObjects/characteristicsDescription/explicitXMLDefaults.ts`
- Modify: `packages/rules/metadata/commonObjects/indexField/explicitAdditionalFields.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/explicitPanelDefinition.ts`
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/register.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/explicitEmptyAttributes.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/explicitEmptyTitle.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formAttribute/valueListSettings.ts`
- Modify: `packages/rules/metadata/forms/elements/formField/explicitHeaderHorizontalAlign.ts`
- Modify: `packages/rules/metadata/forms/elements/table/explicitRowFilter.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataChartOfAccounts/predefined/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsParameter/explicitUndefined.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/{fromYAML.ts,toYAML.ts,toJSONSchema.ts}`
- Modify: `packages/rules/metadata/commonObjects/fillValue/register.ts`
- Test: соответствующие существующие `*.test.ts` рядом с перечисленными модулями
- Test: `packages/runtime/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts`

**Interfaces:**
- Consumes: Task 1 tag helpers.
- Produces: `explicitXMLPropertyValidationTag(...) => XMLAnomalyTag | undefined`; fixed registrations use `XML_PRESENT_TAG_VALUE` or `XML_ABSENT_TAG_VALUE`; `transportScalar` accepts only `xml/value`.

- [ ] **Step 1: Перевести ожидания реестра в RED**

В существующих тестах реестра заменить договоры:

```yaml
Реквизиты: !xml/present
ТипЗначения: !xml/absent
ЗначениеЗаполнения: !xml/value Nil
```

Добавить отрицательные границы: `!xml/absent` вместо `present`, payload после `present`, пустой payload у `value`, обычный scalar без тега.

- [ ] **Step 2: Подтвердить RED узкими runtime-тестами**

```bash
pnpm --filter @nkdk/runtime exec vitest run metadata/ruleRuntime/property
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts
```

Expected: реестр всё ещё ищет категорию `xml` и общий маркер.

- [ ] **Step 3: Классифицировать существующие действия без нового поля rules.ts**

В `ExplicitXMLPropertyRegistration` сохранить текущие варианты union и заменить только типы значений:

- `action: "omit"` требует `XML_ABSENT_TAG_VALUE`;
- обычный `emit` и `materializeCollection` требуют `XML_PRESENT_TAG_VALUE`;
- `action: "transportScalar"` принимает только `xml/value` и непустой payload;
- `action: "carrier"` не обрабатывается этим слоем и остаётся предметному augmenter.

Переименовать `explicitXMLPropertyValidationMode` в `explicitXMLPropertyValidationTag` и вернуть точную категорию. В `toJSONSchema.ts` строить `const`/`pattern` только для этой категории.

- [ ] **Step 4: Передавать точную категорию при XML → YAML**

В `fromXMLToYAML.ts` маркировать:

```ts
const tag = explicitXML.action === "omit"
  ? "xml/absent"
  : explicitXMLTransport === undefined
    ? "xml/present"
    : "xml/value"
```

`markRelativeYAMLScalarTag` изменить так, чтобы он принимал `XMLAnomalyTag`, а не ставил общий `xml`.

- [ ] **Step 5: Перевести все fixed-регистрации**

Использовать только согласованную таблицу:

- пустой/явный XML-узел → `XML_PRESENT_TAG_VALUE`;
- отсутствующий вычисляемый XML-узел → `XML_ABSENT_TAG_VALUE`;
- `Nil`, `DesignTimeRef`, `String`, `TypeDescription`, `Null`, `Undefined` и ошибочный FillValue → `xml/value`.

В `fillValue/register.ts` при сохранении ссылки, которая разрешается, но несовместима с политикой реквизита, ставить `xml/value`. Битые ссылки не менять здесь: их переносит Task 4.

- [ ] **Step 6: Проверить предметные договоры**

Запустить существующие тесты модулей из списка, включая:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit \
  metadata/commonObjects/fillValue \
  metadata/commonObjects/indexField \
  metadata/commonObjects/characteristicsDescription \
  metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata \
  metadata/forms/elements/formField/explicitHeaderHorizontalAlign.test.ts \
  metadata/forms/elements/table/explicitRowFilter.test.ts
pnpm type-check
pnpm duplicates -- --base 08bbdedb4
```

Expected: PASS; wrong category fails locally.

- [ ] **Step 7: Закоммитить fixed-категории**

```bash
git add packages/runtime/metadata/ruleRuntime/property packages/rules/metadata/importFromXml/dependentItems.ts packages/rules/metadata/commonObjects packages/rules/metadata/forms packages/rules/metadata/appliedObjects/metadataChartOfAccounts/predefined/rules.ts
git commit -m "refactor: :recycle: классифицировать явные XML-значения"
```

---

### Task 3: `name` и `type`

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/explicitName.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/explicitName.test.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/{fromYAML.ts,toYAML.ts,toJSONSchema.ts}`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/*.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/{fromYAML.ts,toYAML.ts,toJSONSchema.ts}`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/*.test.ts`
- Modify: `packages/rules/metadata/commonObjects/minMaxValue/{fromYAML.ts,toYAML.ts,toJSONSchema.ts,types.ts}`
- Modify: `packages/rules/metadata/commonObjects/minMaxValue/*.test.ts`

**Interfaces:**
- Consumes: `xml/name`, `xml/type`, `xml/value`.
- Produces: exact element name; TypeDescription payload `<prefix>:<предметное имя>`; MinMax category chosen against `typedXML`.

- [ ] **Step 1: Перевести ожидания explicit name и TypeDescription**

```yaml
Имя: !xml/name СтароеИмяExtendedTooltip
Тип: !xml/type d7p1:Диаграмма
```

Проверить, что `d7p1:Chart` в YAML отклоняется: имя типа остаётся предметным, rules.ts преобразует его в XML `Chart`.

- [ ] **Step 2: Перевести DCS LocalString ожидания**

```yaml
Заголовок: !xml/type String Исходный текст
```

Пустой payload и `!xml/value String ...` должны отклоняться.

- [ ] **Step 3: Разделить MinMax RED-случаи по причине**

Для правила с `typedXML: "xs:decimal"` ожидать:

```yaml
МинимальноеЗначение: !xml/value 001.00
МинимальноеЗначение: !xml/type xs:string 001.00
МинимальноеЗначение: !xml/type xs:dateTime bad
МинимальноеЗначение: !xml/type - bad
```

Первый XML имеет канонический `xsi:type`; остальные — другой или отсутствующий тип. При `xml/type` payload содержит исходный тип и текст, при `xml/value` — только исходный текст.

- [ ] **Step 4: Реализовать строгие consumers**

- `explicitName.ts` принимает только `xml/name`;
- TypeDescription принимает только `xml/type` и существующую грамматику generated prefix + предметный тип;
- DCS LocalString принимает только `xml/type String ...`;
- MinMax `toYAML` сравнивает `xsiType` с `getRuleMinMaxValueXsiType(rule)` и выбирает `type` раньше `value`; `fromYAML` разбирает payload по точной категории.

- [ ] **Step 5: Проверить слой**

```bash
pnpm --filter @nkdk/runtime exec vitest run metadata/ruleRuntime/formElement/explicitName.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit \
  metadata/commonObjects/typeDescription \
  metadata/commonObjects/dataCompositionSystem/dcsLocalStringType \
  metadata/commonObjects/minMaxValue
pnpm type-check
pnpm duplicates -- --base 08bbdedb4
```

- [ ] **Step 6: Закоммитить `name` и `type`**

```bash
git add packages/runtime/metadata/ruleRuntime/formElement/explicitName.ts packages/runtime/metadata/ruleRuntime/formElement/explicitName.test.ts packages/rules/metadata/commonObjects/typeDescription packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType packages/rules/metadata/commonObjects/minMaxValue
git commit -m "refactor: :recycle: различить XML-имена типы и значения"
```

---

### Task 4: `reference` и контекстная проверка ссылок

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/brokenXMLReferenceCarrierRegistry.ts`
- Modify: `packages/runtime/metadata/validation/structuralReferences.ts`
- Modify: `packages/runtime/metadata/validation/projectReferenceIndex.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataRef/{brokenReferenceCollection.ts,fromYAML.ts}`
- Modify: `packages/rules/metadata/commonObjects/metadataValue/brokenDesignTimeRef.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.ts`
- Modify: `packages/rules/metadata/validation/{yamlFactExtractor.ts,projectStateDependencyValidation.ts,configurationExtensionPropertyStateFacts.ts}`
- Modify: `packages/rules/metadata/projectState/binary/fragment.ts`
- Modify: `packages/rules/metadata/projectState/binary/typedReader.ts`
- Test: существующие tests переносчиков, structural references, dependency validation и binary read session

**Interfaces:**
- Consumes: `xml/reference`.
- Preserves: project-state `tagged?: "xml"` и его существующий binary flag как внутреннюю деталь.
- Produces: переносчик считается tagged только для точной категории `xml/reference`.

- [ ] **Step 1: Перевести carrier-тесты в RED**

Заменить входы и ожидания:

```yaml
Состав:
  - !xml/reference <UUID>
ЗначениеЗаполнения: !xml/reference <UUID>.<UUID>
ПутьКДанным: !xml/reference 1/0:<UUID>
```

Добавить отрицательные случаи с тем же payload под `!xml/value`: переносчик не принимает их, а локальная проверка сообщает неверную категорию.

- [ ] **Step 2: Подтвердить RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit \
  metadata/commonObjects/metadataValue/brokenDesignTimeRef.test.ts \
  metadata/commonObjects/metadataRef/brokenMDObjectRef.test.ts \
  metadata/ruleRuntime/property/brokenXMLReferencePipeline.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata \
  metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts
```

- [ ] **Step 3: Сделать pipeline точным по категории**

В местах, где runtime строит `isTagged(path)`, возвращать `true` только при `yamlScalarTagAt(...) === "xml/reference"`. Импортированный переносчик маркирует каждый `taggedPath` категорией `xml/reference`.

Не добавлять поле категории в `BrokenXMLReferenceCarrierRegistration`: все регистрации этого реестра по определению относятся к `reference`.

- [ ] **Step 4: Сохранить project-state формат**

При извлечении фактов после успешной локальной проверки преобразовывать любую допустимую XML-категорию в существующий внутренний `tagged: "xml"`. Не менять binary flag и контракты `fragment.ts`/`typedReader.ts`; изменить их тесты только там, где YAML-вход теперь использует классифицированный тег.

В `projectStateDependencyValidation.ts` пропускать отсутствующую цель только после повторного совпадения контекстного переносчика. `xml/value` продолжает обычную проверку цели.

- [ ] **Step 5: Проверить все ссылочные границы**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit \
  metadata/commonObjects/metadataValue \
  metadata/commonObjects/metadataRef \
  metadata/ruleRuntime/property/brokenXMLReferencePipeline.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata \
  metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts \
  metadata/validation/structuralReferences.fillValue.test.ts \
  metadata/validation/projectStateDependencyValidation.test.ts \
  metadata/projectState/binary/readSession.test.ts
pnpm type-check
pnpm duplicates -- --base 08bbdedb4
```

- [ ] **Step 6: Закоммитить ссылки**

```bash
git add packages/runtime/metadata/ruleRuntime/property packages/runtime/metadata/validation packages/rules/metadata/commonObjects/metadataRef packages/rules/metadata/commonObjects/metadataValue packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.ts packages/rules/metadata/validation packages/rules/metadata/projectState
git commit -m "refactor: :recycle: выделить битые XML-ссылки"
```

---

### Task 5: Несовместимый `DataPath` как `value`

**Files:**
- Modify: `packages/rules/metadata/commonObjects/metadataPath/{fromYAML.ts,toJSONSchema.ts}`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/importDataPathCompatibility.ts`
- Modify: `packages/rules/metadata/validation/dataPath/formYamlTraversal.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPendingChecks.ts`
- Test: `packages/rules/metadata/commonObjects/metadataPath/fromYAML.test.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/importDataPathCompatibility.test.ts`
- Test: `packages/rules/metadata/validation/projectValidationPendingChecks.test.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: `xml/value` for resolved-but-incompatible path; `xml/reference` remains Task 4 carrier.
- Produces: exact internal DataPath payload without disabling resolver.

- [ ] **Step 1: Перевести DataPath ожидания**

```yaml
ПутьКДанным: !xml/value Объект.Description
ПутьКДанным: !xml/reference 1/0:<UUID>
```

Проверить четыре границы: resolved+incompatible принимается; resolved+compatible с `value` отклоняется; unknown с `value` сохраняет resolver diagnostic; UUID carrier не принимается под `value`.

- [ ] **Step 2: Подтвердить RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata \
  metadata/commonObjects/metadataPath/fromYAML.test.ts \
  metadata/forms/clientApplicationForm/importDataPathCompatibility.test.ts \
  metadata/validation/projectValidationPendingChecks.test.ts
```

- [ ] **Step 3: Реализовать точную категорию**

`metadataPath/fromYAML.ts` пропускает внутреннюю строку без перевода только для `xml/value`. `formYamlTraversal.ts` извлекает payload через `xmlAnomalyTagPayload("xml/value", ...)`; совместимость проверяется прежним resolver и прежними allowedKinds.

Не использовать тег для неизвестного пути, недостатка данных владельца или отсутствующего правила элемента.

- [ ] **Step 4: Проверить слой**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata \
  metadata/commonObjects/metadataPath \
  metadata/forms/clientApplicationForm/importDataPathCompatibility.test.ts \
  metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts \
  metadata/validation/projectValidationPendingChecks.test.ts
pnpm type-check
pnpm duplicates -- --base 08bbdedb4
```

- [ ] **Step 5: Закоммитить DataPath**

```bash
git add packages/rules/metadata/commonObjects/metadataPath packages/rules/metadata/forms/clientApplicationForm/importDataPathCompatibility.ts packages/rules/metadata/forms/clientApplicationForm/importDataPathCompatibility.test.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts packages/rules/metadata/validation
git commit -m "refactor: :recycle: классифицировать несовместимый DataPath"
```

---

### Task 6: Скалярный договор `Popup.ExtendedTooltip`

**Files:**
- Create: `packages/rules/metadata/forms/elements/popup/extendedTooltip.ts`
- Create: `packages/rules/metadata/forms/elements/popup/extendedTooltip.test.ts`
- Modify: `packages/rules/metadata/forms/elements/popup/rules.ts`
- Modify: `packages/rules/metadata/composition/staticPropertyRules.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: existing `ExtendedTooltipRules`, `explicitElementNameStyle`, configuration-index singleton identity, `xml/absent`, `xml/name`.
- Produces: property type `PopupExtendedTooltip`; no new `PropertyRule` fields.

- [ ] **Step 1: Добавить три RED-договора**

Покрыть прямой XML → YAML и YAML → XML:

1. канонический пустой `<ExtendedTooltip name="ФункцииРасширеннаяПодсказка" id="75"/>` не создаёт YAML-поле, но отсутствие YAML-поля восстанавливает узел и индексный `id`;
2. отсутствующий XML-узел даёт `РасширеннаяПодсказка: !xml/absent` и не создаётся при экспорте;
3. `<ExtendedTooltip name="ФункцииExtendedTooltip" id="75"/>` даёт `РасширеннаяПодсказка: !xml/name ФункцииExtendedTooltip` и восстанавливает точное имя.

Добавить отрицательные случаи: обычная строка, `!xml/value`, пустой payload `name`, каноническое имя под `name`.

- [ ] **Step 2: Подтвердить RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata \
  metadata/forms/elements/popup/extendedTooltip.test.ts \
  metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration \
  metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts
```

- [ ] **Step 3: Создать focused property type**

В `popup/extendedTooltip.ts` собрать `PopupExtendedTooltip` из существующих form-element primitives:

- XML → YAML делегирует `importSingleFormElementFromXMLToYAML` с `ExtendedTooltipRules` и существующим name style;
- `{}` сворачивается в отсутствие свойства;
- единственное `{ Имя: !xml/name <имя> }` сворачивается в tagged scalar на внешнем свойстве;
- XML absence оформляется существующей explicit-регистрацией `action: "omit"` с `XML_ABSENT_TAG_VALUE`;
- `yamlToXMLNestedRule` создаётся через `createSingletonElementYAMLToXMLNestedRule`; `normalizeYAML` разворачивает внешний `!xml/name` обратно в `{ Имя: !xml/name <имя> }`;
- отсутствие YAML-поля оставляет reserveWhenAbsent и создаёт канонический пустой singleton;
- `!xml/absent` перехватывается explicit action до nested conversion;
- JSON Schema разрешает только отсутствие поля, `!xml/absent` и `!xml/name <неканоническое имя>` во внутреннем validation graph.

Не добавлять transform-параметры в `defineElementAsType` и не менять поведение `ExtendedTooltip` у других владельцев.

- [ ] **Step 4: Подключить Popup rules**

В `popup/rules.ts` заменить скрытое свойство:

```ts
extendedTooltip: {
  yaml: "РасширеннаяПодсказка",
  type: "PopupExtendedTooltip",
  toEnterprise: false,
}
```

Удалить только popup-override `toYAML: false/fromYAML: false`. Зарегистрировать contributions через обычную composition-сборку.

- [ ] **Step 5: Проверить Popup и форму**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata \
  metadata/forms/elements/popup/extendedTooltip.test.ts \
  metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration \
  metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts
pnpm type-check
pnpm duplicates -- --base 08bbdedb4
```

- [ ] **Step 6: Закоммитить Popup**

```bash
git add packages/rules/metadata/forms/elements/popup packages/rules/metadata/forms/clientApplicationForm packages/rules/metadata/composition/staticPropertyRules.ts
git commit -m "fix: :bug: сохранить подсказку подменю"
```

---

### Task 7: Удаление старого `!xml`, документация и полная проверка

**Files:**
- Modify: все оставшиеся актуальные production/test-файлы под `packages/`, найденные точным поиском старых helpers и категории `"xml"` в YAML sidecar
- Modify: `.agents/architecture.md`
- Modify: `.agents/xml-anomalies.md`
- Modify: `.agents/restrictions.md`
- Modify: `docs/superpowers/plans/2026-08-14-round-trip-known-discrepancies.md`
- Preserve: исторические `docs/superpowers/specs/*`, кроме текущей утверждённой спеки

**Interfaces:**
- Consumes: Tasks 1–6.
- Produces: только классифицированный публичный YAML; старые `EMPTY_XML_TAG_VALUE`, `xmlScalarTagValue`, `xmlScalarTagPayload` удалены.

- [ ] **Step 1: Найти остатки старого runtime API**

```bash
rg -n "EMPTY_XML_TAG_VALUE|xmlScalarTagValue|xmlScalarTagPayload|tag === \"xml\"|=== \"xml\"" packages
```

Для каждого совпадения определить точную согласованную категорию. Внутренний project-state literal `tagged: "xml"` оставить; пользовательские parser/sidecar сравнения общего `xml` удалить.

- [ ] **Step 2: Перевести оставшиеся тестовые YAML-входы**

```bash
rg -n "!xml(?:[[:space:]]|$)" packages e2e .agents
```

Оставить старый тег только в одном отрицательном parser-тесте. Не заменять исторические тексты автоматически.

- [ ] **Step 3: Обновить согласованную документацию**

- `.agents/architecture.md`: заменить формулировку общего `!xml` на ссылку на классифицированные теги из реестра аномалий;
- `.agents/xml-anomalies.md`: у каждой действующей строки указать `present`, `absent`, `name`, `type`, `value` или `reference`; добавить Popup;
- `.agents/restrictions.md`: удалить договор пустого `!xml`, зафиксировать закрытый словарь и отсутствие совместимости;
- текущий план известных расхождений исправить только там, где он остаётся исполняемым.

- [ ] **Step 4: Выполнить узкую совокупную проверку rules**

```bash
pnpm --filter @nkdk/runtime test
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration
pnpm type-check
pnpm duplicates -- --base 08bbdedb4
```

Expected: PASS; поиск старого публичного тега пуст, кроме отрицательного теста и исторических документов.

- [ ] **Step 5: Проверить round-trip Storekeeper адресно**

Не копировать весь XML-репозиторий. Сначала восстановить только конфигурацию:

```bash
git -C /Users/nikita/git/round-trip-compact restore --source=HEAD -- cf/StorekeeperDevelopers_2_0_108_1_setup1c
git -C /Users/nikita/git/round-trip-compact clean -fd -- cf/StorekeeperDevelopers_2_0_108_1_setup1c
```

Затем вне песочницы:

```bash
NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/StorekeeperDevelopers_2_0_108_1_setup1c \
./.agents/skills/round-trip-yaml/round-trip.sh --triage
```

Expected: расхождение `ФункцииExtendedTooltip` отсутствует. Если появляется следующее расхождение, остановиться и исследовать его, не расширяя текущую спеку.

- [ ] **Step 6: Выполнить обязательные полные проверки вне песочницы**

```bash
pnpm test
pnpm test:e2e
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 08bbdedb4
```

Expected: все команды завершаются кодом 0.

- [ ] **Step 7: Закоммитить несовместимую миграцию и документацию**

```bash
git add packages .agents/architecture.md .agents/xml-anomalies.md .agents/restrictions.md docs/superpowers/plans/2026-08-14-round-trip-known-discrepancies.md docs/superpowers/plans/2026-08-14-classified-xml-anomaly-tags.md
git commit -m "feat!: :sparkles: заменить общий тег XML-аномалий" -m "BREAKING CHANGE: YAML-тег !xml удалён. Используйте !xml/present, !xml/absent, !xml/name, !xml/type, !xml/value или !xml/reference согласно реестру XML-аномалий."
```

---

## Self-review

- Spec coverage: шесть активных категорий, отсутствие совместимости, все строки действующего реестра, Popup, документация и round-trip покрыты Tasks 1–7.
- Excluded by design: namespace и `order` не имеют runtime-регистраций и тестов.
- Type consistency: публичные helpers и категории определяются один раз в Task 1; subsequent tasks используют те же имена.
- Rule constraints: план не добавляет поля в `BasePropertyRule`/`PropertyRule` и не расширяет параметры существующих builders.
- Snapshot compatibility: внутренний project-state `tagged: "xml"` и binary flag не меняются.
- Placeholder scan: план не содержит TBD/TODO и не ссылается на неопределённые будущие функции, кроме явно создаваемых в Task 1.
