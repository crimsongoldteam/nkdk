# Fill Value XML Exceptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранять несовместимые исходные XML-значения `ЗначениеЗаполнения` через явно зарегистрированный `!xml`, не предлагать исключение в схеме подсказок и не терять проверку либо переименование ссылок.

**Architecture:** Реестр explicit XML получает второй, скалярно-транспортный вид регистрации для точной пары `itemType + propertyKey`; он разворачивает помеченный scalar перед штатным fromYAML/toXML, но не знает предметных политик. Модуль `commonObjects/fillValue` решает, когда import ставит тег и когда validation его допускает; структурные ссылки работают с распакованным payload и восстанавливают тег после переименования.

**Tech Stack:** TypeScript 7, js-yaml 5, TypeBox, Vitest 4, metadata ruleRuntime, MCP import.

## Global Constraints

- Перед выполнением завершить план `docs/superpowers/plans/2026-08-09-fill-value-date-time.md`.
- `!xml` регистрируется только для `MetadataAttribute.fillValue` и `StandardAttributeDescription.fillValue`.
- При `policy: forbidden` любой scalar с `!xml`, включая пустой, проходит validation; без тега любое значение остаётся ошибкой.
- При других политиках `!xml` допустим только при классификации `invalid`; `valid`, `implicit`, `unresolved`, `notSpecified` дают ошибку применения тега.
- Схема validation принимает зарегистрированный scalar; схема подсказок не предлагает `!xml` и не предлагает `ЗначениеЗаполнения` известному forbidden-реквизиту.
- Тег не подавляет dependency diagnostics распознаваемой ссылки и сохраняется при переименовании.
- YAML-комментарий не является машиночитаемым признаком.
- Не изменять XML-фикстуры и не добавлять поля в общие типы rules.ts.
- После каждого слоя выполнять `pnpm duplicates -- --base 86fc64d5b`.

---

## File Structure

- `.agents/architecture.md` — расширенный договор явно зарегистрированного скалярного транспорта.
- `packages/core/yaml/scalarTags.ts` — публичные упаковка и распаковка payload `!xml`.
- `packages/core/yaml/{jsYamlParser,export}.test.ts` — пустой и непустой scalar.
- `packages/core/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts` — регистрация `transportScalar` и действие `useYamlValue`.
- `packages/core/metadata/ruleRuntime/property/fromYAMLToXML.ts` — подстановка payload перед штатным преобразованием типа.
- `packages/core/metadata/ruleRuntime/property/toJSONSchema.ts` — pattern только во внутренней validation schema.
- `packages/core/metadata/ruleRuntime/property/{fromYAMLToXML,toJSONSchemaExplicitXML}.test.ts` — границы реестра.
- `packages/core/metadata/ruleRuntime/property/dependentItemRegistry.ts` — необязательное решение `shouldTagXML` зарегистрированного import-handler.
- `packages/core/metadata/importFromXml/dependentItems.ts` — установка scalar и маркера после полной классификации.
- `packages/core/metadata/commonObjects/fillValue/{analyzeItem,register}.ts` — предметная политика тега.
- `packages/core/metadata/commonObjects/standardAttributeDescription/toJSONSchema.ts` — отдельная форма известных forbidden-реквизитов в подсказках.
- Существующие fillValue/import/validation/reference тесты — сквозные договоры без новых XML-фикстур.

---

### Task 1: Зарегистрированный скалярный транспорт `!xml`

**Files:**
- Modify: `.agents/architecture.md`
- Modify: `packages/core/yaml/scalarTags.ts`
- Modify: `packages/core/yaml/jsYamlParser.test.ts`
- Modify: `packages/core/yaml/export.test.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/toJSONSchema.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts`

**Interfaces:**
- Produces: `xmlScalarTagValue(payload: string): string`, `xmlScalarTagPayload(value: string): string`.
- Produces: регистрация `{ action: "transportScalar"; itemType; propertyKey }`.
- Produces: действие `{ kind: "useYamlValue"; yamlValue: string }`, которое штатный property source использует вместо sentinel-строки.
- Produces: `explicitXMLPropertyValidationMode(itemType, propertyKey): "empty" | "scalar" | undefined`.

- [ ] **Step 1: Написать падающие тесты упаковки scalar**

Расширить существующие YAML-тесты:

```ts
it.each([
  ["Поле: !xml", "!xml", ""],
  ["Поле: !xml Справочник.Товары.ПустаяСсылка", "!xml Справочник.Товары.ПустаяСсылка", "Справочник.Товары.ПустаяСсылка"],
] as const)("round-trips %s", (text, stored, payload) => {
  const parsed = parseWithJsYaml(text)
  expect(parsed.data).toEqual({ Поле: stored })
  expect(yamlScalarTagAt(parsed.data as object, "Поле")).toBe("xml")
  expect(xmlScalarTagPayload(stored)).toBe(payload)
  expect(serializeYAMLDocument(parsed.data).text).toBe(text)
})
```

- [ ] **Step 2: Написать падающий тест динамической регистрации**

В `fromYAMLToXML.test.ts` зарегистрировать probe:

```ts
registerExplicitXMLProperty({
  action: "transportScalar",
  itemType: "ExplicitXMLScalarProbe",
  propertyKey: "fillValue",
})
```

Правило probe использует `MetadataValue`, YAML `ЗначениеЗаполнения`, XML `FillValue`. Для `ЗначениеЗаполнения: !xml Справочник.Роли.ПустаяСсылка` ожидать штатный XML:

```ts
{ FillValue: { "_xsi:type": "xr:DesignTimeRef", "#text": "Catalog.Роли.EmptyRef" } }
```

Добавить соседний тест: тот же тег у незарегистрированного itemType остаётся обычным значением и не разворачивается.

- [ ] **Step 3: Написать падающий тест разделения схем**

В `toJSONSchemaExplicitXML.test.ts` проверить:

```ts
expect(validation.Check({ ЗначениеЗаполнения: "!xml" })).toBe(true)
expect(validation.Check({ ЗначениеЗаполнения: "!xml Ложь" })).toBe(true)
expect(unregisteredBooleanValidation.Check({ Флаг: "!xml" })).toBe(false)
expect(JSON.stringify(hintProperties)).not.toContain("!xml")
```

Для validation использовать `validationPropertyRefs: true`; для подсказок — `mode: "externalRefs"` без этого признака.

- [ ] **Step 4: Подтвердить красный результат**

```bash
pnpm --filter @nkdk/core exec vitest run yaml/jsYamlParser.test.ts yaml/export.test.ts metadata/ruleRuntime/property/fromYAMLToXML.test.ts metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts --no-isolate
```

Expected: FAIL — helpers и `transportScalar` ещё отсутствуют.

- [ ] **Step 5: Экспортировать канонические helpers scalar**

В `scalarTags.ts` переименовать приватные функции без изменения их формата:

```ts
export function xmlScalarTagValue(payload: string): string {
  return payload === "" ? EMPTY_XML_TAG_VALUE : `${EMPTY_XML_TAG_VALUE} ${payload}`
}

export function xmlScalarTagPayload(value: string): string {
  if (value === EMPTY_XML_TAG_VALUE) return ""
  return value.startsWith(`${EMPTY_XML_TAG_VALUE} `)
    ? value.slice(EMPTY_XML_TAG_VALUE.length + 1)
    : value
}
```

`defineScalarTag` должен вызывать эти функции; формат существующих тестов не меняется.

- [ ] **Step 6: Расширить реестр без знания fillValue**

В `explicitXMLPropertyRegistry.ts` добавить union-варианты:

```ts
| {
    readonly action: "transportScalar"
    readonly itemType: string
    readonly propertyKey: string
  }
```

```ts
| { readonly kind: "useYamlValue"; readonly yamlValue: string }
```

Для `transportScalar` `collectExplicitXMLPropertyActions(...)` проверяет одновременно `yamlScalarTagAt(yaml, yamlKey) === "xml"` и `typeof rawValue === "string"`, затем возвращает распакованный payload. `matchExplicitXMLPropertyFromXML(...)` игнорирует эту регистрацию: решение поставить тег принимается после предметной классификации import.

Добавить:

```ts
export function explicitXMLPropertyValidationMode(
  itemType: string,
  propertyKey: string,
): "empty" | "scalar" | undefined
```

Фиксированные регистрации возвращают `empty`, `transportScalar` — `scalar`.

- [ ] **Step 7: Подставить payload в штатный fromYAML/toXML**

В `convertPropertiesFromYAMLToXML(...)` до `createYAMLPropertySource(...)` собрать новый `Map` из `params.propertyValues`; для каждого `useYamlValue` записать payload по `propertyKey`. Передать этот Map как `propertyValues`, чтобы существующие `importMetadataValueFromYAML` и `exportMetadataValueToXML` определили boolean, decimal, dateTime или ref штатно. Ветка `emit/omit` остаётся без изменений.

- [ ] **Step 8: Развести внутреннюю и внешнюю схемы**

В `withExplicitXMLValidationValue(...)` использовать mode:

```ts
if (mode === "empty") return Type.Union([schema, Type.Literal(EMPTY_XML_TAG_VALUE)])
if (mode === "scalar") return Type.Union([schema, Type.String({ pattern: "^!xml(?: .*)?$" })])
return schema
```

Функция по-прежнему вызывается только при `validationPropertyRefs === true`, поэтому подсказки не получают служебный вариант.

- [ ] **Step 9: Актуализировать архитектурный договор**

В разделе `.agents/architecture.md` «Транспортные YAML-теги» разделить:

- фиксированную регистрацию `itemType + propertyKey + value` для `emit/omit`;
- отдельно согласованную `transportScalar`-регистрацию `itemType + propertyKey`, где предметный модуль проверяет допустимость payload, а ruleRuntime только снимает и восстанавливает тег.

Сохранить требования явного согласования каждого применения и отсутствия `!xml` во внешней схеме подсказок.

- [ ] **Step 10: Получить зелёный слой и создать коммит**

```bash
pnpm --filter @nkdk/core exec vitest run yaml/jsYamlParser.test.ts yaml/export.test.ts metadata/ruleRuntime/property/fromYAMLToXML.test.ts metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts --no-isolate
pnpm type-check
pnpm test:architecture
pnpm duplicates -- --base 86fc64d5b
git add .agents/architecture.md packages/core/yaml/scalarTags.ts packages/core/yaml/jsYamlParser.test.ts packages/core/yaml/export.test.ts packages/core/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts packages/core/metadata/ruleRuntime/property/fromYAMLToXML.ts packages/core/metadata/ruleRuntime/property/toJSONSchema.ts packages/core/metadata/ruleRuntime/property/fromYAMLToXML.test.ts packages/core/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts
git commit -m "feat: :sparkles: поддержать скалярный транспорт !xml"
```

Expected: PASS; реестр по-прежнему требует точную регистрацию пары.

---

### Task 2: Предметная политика import и validation fillValue

**Files:**
- Modify: `packages/core/metadata/ruleRuntime/property/dependentItemRegistry.ts`
- Modify: `packages/core/metadata/importFromXml/dependentItems.ts`
- Modify: `packages/core/metadata/importFromXml/dependentItems.test.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/analyzeItem.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/register.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts`
- Modify: `packages/core/metadata/standardMembers/declarations.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts`

**Interfaces:**
- Produces: `DependentImportItemHandler.shouldTagXML?(params): boolean`.
- Produces: fillValue parser, который возвращает `{ tagged, value }` и классифицирует распакованный payload.
- Produces: `commonStandardMemberFillValuePolicy(internalName)` для построения известных forbidden-схем без условий в общих metadata-слоях.

- [ ] **Step 1: Написать падающие тесты import-маркировки**

В `dependentItems.test.ts` заменить ожидание для представителя `invalid`: несовместимое число строкового реквизита после normalization должно сериализоваться как `ЗначениеЗаполнения: !xml 1`, а `yamlScalarTagAt(attribute, "ЗначениеЗаполнения")` — вернуть `xml`.

Добавить standard attribute `Предопределенный` со значением `Ложь`: import ставит `!xml`. `valid`, `implicit`, `unresolved` и `notSpecified` не получают тег автоматически.

- [ ] **Step 2: Написать таблицу semantic validation тега**

В `yamlFactExtractor.fillValue.test.ts` добавить таблицу:

```ts
it.each([
  ["invalid ordinary", "Тип: Строка(10)\n    ЗначениеЗаполнения: !xml 1", false],
  ["valid ordinary", "Тип: Строка(10)\n    ЗначениеЗаполнения: !xml текст", true],
  ["implicit ordinary", "Тип: Строка(10)\n    ЗначениеЗаполнения: !xml", true],
  ["unresolved ordinary", "Тип: НеизвестныйТип\n    ЗначениеЗаполнения: !xml текст", true],
] as const)("checks %s", (_name, body, expectsTagError) => {
  const diagnostics = extractAttributeDiagnostics(body)
  expect(diagnostics.some(({ message }) => message.includes("!xml"))).toBe(expectsTagError)
})
```

Отдельно проверить `СтандартныеРеквизиты.Предопределенный`: `!xml`, `!xml Ложь` и `!xml произвольный-текст` проходят без локальной ошибки значения заполнения; то же `Ложь` без тега даёт одну ошибку.
Ещё одним standard member без объявленной политики проверить, что tagged результат `notSpecified` даёт ошибку применения `!xml`.

- [ ] **Step 3: Написать тест схемы forbidden-реквизита**

В новом `toJSONSchema.test.ts` взять `MetadataCatalogRules.properties.standardAttributes`:

- validation schema принимает `{ Предопределенный: { ЗначениеЗаполнения: "!xml Ложь" } }`;
- внешняя схема содержит ключ `Предопределенный`, но в его `properties` нет `ЗначениеЗаполнения`;
- у `ПометкаУдаления` поле остаётся в подсказках;
- JSON внешней схемы не содержит `!xml`.

- [ ] **Step 4: Подтвердить красный результат**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/dependentItems.test.ts metadata/validation/yamlFactExtractor.fillValue.test.ts metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts --no-isolate
```

Expected: FAIL — import не ставит тег, анализирует sentinel как обычную строку, schema едина для всех standard attributes.

- [ ] **Step 5: Добавить зарегистрированное решение import-handler**

В `DependentImportItemHandler` добавить необязательную функцию `shouldTagXML` с теми же params, что у `shouldRemove`. В `normalizeImportedDependentItems(...)` соблюдать порядок:

1. если `shouldRemove` — удалить и сохранить raw XML;
2. иначе, если `shouldTagXML` и текущее YAML-значение является `string | number`, преобразовать его через `xmlScalarTagValue(String(value))` и вызвать `markYAMLScalarTag(item, yamlKey, "xml")`;
3. aggregate оставить без тега для обычной diagnostic.

Возвращаемое число остаётся количеством удалённых свойств.

- [ ] **Step 6: Зарегистрировать две пары и решения классификатора**

В `registerFillValueValidation()` либо общем guard регистрации вызвать:

```ts
registerExplicitXMLProperty({ action: "transportScalar", itemType: "MetadataAttribute", propertyKey: "fillValue" })
registerExplicitXMLProperty({ action: "transportScalar", itemType: "StandardAttributeDescription", propertyKey: "fillValue" })
```

В оба import-handler добавить:

```ts
shouldTagXML: (params) => classifyMetadataAttributeFillValue(params).kind === "invalid"
```

и соответствующий standard classifier. `forbidden` уже всегда классифицирует присутствующее значение как `invalid`.

- [ ] **Step 7: Анализировать payload и допустимость тега**

В `analyzeItem.ts` читать `yamlScalarTagAt(params.item, fillValueYamlKey)`. Если тег есть, передавать в `parseFillValueYaml(...)` результат `xmlScalarTagPayload(rawString)`. После обычной классификации:

```ts
if (tagged) {
  return classification.kind === "invalid"
    ? emptyAnalysis()
    : diagnosticAnalysis(params, "!xml допустим только для несовместимого XML-значения", "error")
}
```

Затем неизменённый `withValueReference(...)` добавляет dependency diagnostics распознанного payload. Без тега сохраняется прежний договор `valid/implicit/invalid/unresolved/notSpecified`.

- [ ] **Step 8: Построить разные standard attribute schemas**

Экспортировать из `declarations.ts` чтение общей политики по internal name без изменения деклараций. В `standardAttributeDescription/toJSONSchema.ts` использовать `rule.standartAttributeNames`:

- во внутреннем validation режиме оставить общую item schema — она уже содержит scalar pattern реестра;
- во внешнем режиме построить optional `properties` для известных YAML-имён; у internal name с `policy: forbidden` клонировать item schema без `ЗначениеЗаполнения`;
- задать исходную item schema как `additionalProperties`, чтобы неизвестные platform attributes не стали запрещёнными.

- [ ] **Step 9: Получить зелёный слой и создать коммит**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/dependentItems.test.ts metadata/validation/yamlFactExtractor.fillValue.test.ts metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts --no-isolate
pnpm type-check
pnpm test:architecture
pnpm duplicates -- --base 86fc64d5b
git add packages/core/metadata/ruleRuntime/property/dependentItemRegistry.ts packages/core/metadata/importFromXml/dependentItems.ts packages/core/metadata/importFromXml/dependentItems.test.ts packages/core/metadata/commonObjects/fillValue/analyzeItem.ts packages/core/metadata/commonObjects/fillValue/register.ts packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts packages/core/metadata/standardMembers/declarations.ts packages/core/metadata/commonObjects/standardAttributeDescription/toJSONSchema.ts packages/core/metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts
git commit -m "feat: :sparkles: разрешить XML-исключения значений заполнения"
```

Expected: PASS; любое tagged forbidden-значение проходит, но не предлагается внешней схемой.

---

### Task 3: Ссылки, переименование и точный XML

**Files:**
- Modify: `packages/core/metadata/commonObjects/fillValue/register.ts`
- Modify: `packages/core/metadata/validation/fillValueReferences.test.ts`
- Modify: `packages/core/metadata/validation/structuralReferences.fillValue.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/importFromXml/fillValueImport.test.ts`

**Interfaces:**
- Consumes: распакованный payload из Task 2 и `transportScalar` из Task 1.
- Produces: tagged ref входит в validation/project state, переименовывается и сохраняет tag; XML получает штатный `xsi:type` payload.

- [ ] **Step 1: Написать падающий тест индекса ссылки**

В `fillValueReferences.test.ts` добавить обычный реквизит с несовместимой, но распознаваемой ссылкой:

```yaml
Тип: Справочник.ПолныеРоли
ЗначениеЗаполнения: !xml Справочник.РолиИсполнителей.ПустаяСсылка
```

Ожидать pending reference с canonical `Catalog.РолиИсполнителей.EmptyRef` и отсутствие локальной ошибки несовместимого типа; отсутствующая цель всё ещё должна дать dependency diagnostic на том же YAML-пути.

- [ ] **Step 2: Написать падающий тест переименования с тегом**

В `structuralReferences.fillValue.test.ts` использовать tagged predefined/enum reference, выполнить `stageCanonical(...)` и `commitStaged()`. Проверить:

```ts
expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml")
expect(serializeYAMLDocument(parsed.data).text).toContain(
  "ЗначениеЗаполнения: !xml Справочник.РолиИсполнителей.НоваяРоль",
)
```

- [ ] **Step 3: Написать падающие YAML → XML тесты**

В `metadataAttribute/fromYAMLToXML.test.ts` проверить, что несовместимая пустая ссылка с `!xml` создаёт `FillValue` с `xsi:type="xr:DesignTimeRef"` и payload нужного справочника. В `standardAttributeDescription/fromYAMLToXML.test.ts` проверить `Предопределенный: ЗначениеЗаполнения: !xml Ложь` → `FillValue` типа `xs:boolean` с текстом `false`.

- [ ] **Step 4: Подтвердить красный результат**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/fillValueReferences.test.ts metadata/validation/structuralReferences.fillValue.test.ts metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts --no-isolate
```

Expected: FAIL — commit reference пока заменяет значение и теряет scalar tag.

- [ ] **Step 5: Сохранять tagged representation при commit**

В `collectFillValueStructuralReference` запомнить наличие тега до materialization. В `commitValue()`:

1. получить YAML через `exportMetadataValueToYAML(...)`;
2. для tagged scalar записать `xmlScalarTagValue(String(yamlValue))`;
3. повторно вызвать `markYAMLScalarTag(params.item, "ЗначениеЗаполнения", "xml")`;
4. для untagged оставить прежнее присваивание.

- [ ] **Step 6: Получить зелёный round-trip слой и создать коммит**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/fillValueReferences.test.ts metadata/validation/structuralReferences.fillValue.test.ts metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts metadata/importFromXml/fillValueImport.test.ts --no-isolate
pnpm type-check
pnpm duplicates -- --base 86fc64d5b
git add packages/core/metadata/commonObjects/fillValue/register.ts packages/core/metadata/validation/fillValueReferences.test.ts packages/core/metadata/validation/structuralReferences.fillValue.test.ts packages/core/metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts packages/core/metadata/importFromXml/fillValueImport.test.ts
git commit -m "fix: :bug: сохранить !xml при переименовании ссылки"
```

Expected: PASS; tag не исключает ссылку из графа и не попадает в XML.

---

### Task 4: Контрольный import SED и полная проверка

**Files:**
- Runtime output only: `/Users/nikita/git/sed_nkdk/cf`
- Runtime output only: `/Users/nikita/git/sed_nkdk/cfe/дкз`

**Interfaces:**
- Consumes: завершённые dateTime и XML-exception планы.
- Produces: чистая контрольная выгрузка и подтверждённая сводка diagnostics.

- [ ] **Step 1: Выполнить обязательные проверки репозитория**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 86fc64d5b
git diff --check
```

Expected: все команды завершаются с кодом 0; architecture baseline не перезаписывается.

- [ ] **Step 2: Очистить только согласованные каталоги загрузки**

Удалить ровно:

```text
/Users/nikita/git/sed_nkdk/cf
/Users/nikita/git/sed_nkdk/cfe
```

Перед удалением вывести эти два разрешённых пути и убедиться, что `/Users/nikita/git/sed_nkdk` не является корнем текущего репозитория NKDK. Не удалять сам `/Users/nikita/git/sed_nkdk`.

- [ ] **Step 3: Импортировать конфигурацию и расширение**

Последовательно вызвать MCP `nkdk.import_from_xml`:

```json
{"xmlDir":"/Users/nikita/git/sed_xml/cf","projectDir":"/Users/nikita/git/sed_nkdk","allowWrite":true}
```

```json
{"xmlDir":"/Users/nikita/git/sed_xml/cfe/дкз","projectDir":"/Users/nikita/git/sed_nkdk","allowWrite":true}
```

Expected: оба вызова `ok: true`; расширение определяется как `cfe/дкз` и видит актуальный индекс `cf`.

- [ ] **Step 4: Проверить YAML и diagnostics**

```bash
rg -n "ЗначениеЗаполнения: !xml" /Users/nikita/git/sed_nkdk/cf /Users/nikita/git/sed_nkdk/cfe/дкз
rg -n "ЗначениеЗаполнения: 01\.01\.0001( 00:00(:00)?)?" /Users/nikita/git/sed_nkdk/cf /Users/nikita/git/sed_nkdk/cfe/дкз
```

Expected:

- первая команда показывает пять исследованных значений: `ЗадачаИсполнителя`, `ВизыСогласования`, `НоменклатураДел`, `Сотрудники`, `дкз_СлужебнаяЗапискаГПХ`;
- вторая команда не находит начальную дату у одиночных типов;
- итоговая validation содержит 0 предупреждений `dateTime не поддержана`;
- пять прежних локальных ошибок `ЗначениеЗаполнения` отсутствуют;
- согласованные XML-исключения не скрывают dependency diagnostics;
- остальные ожидаемые 53 предупреждения остаются видимыми для отдельного анализа.

- [ ] **Step 5: Зафиксировать итог без коммита generated-проекта**

Не добавлять `/Users/nikita/git/sed_nkdk` в git-индекс NKDK. В итоговом отчёте перечислить команды, количество errors/warnings, пять tagged путей и подтвердить, что пользовательский `packages/mcp/README.md` не изменялся реализацией.
