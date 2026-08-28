# Extension Collection States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать лаконичный и точный XML ↔ YAML round-trip режимов элементов `Состав` плана обмена и заимствованных предопределённых элементов без крупных `!xml/raw`.

**Architecture:** Существующие `!проверять` и `!изменять` становятся метаданными любого YAML-значения, включая mapping и sequence, но не меняют его смысловой тип. Верхний `PropertyState` вынесенной смысловой коллекции выводится из присутствия YAML-поля через существующий реестр возможностей. Предметные проекторы `Predefined` и `ExchangePlanContent` переводят служебный XML в эти общие метки, а существующий слой structured documents сравнивает элементы с основной конфигурацией.

**Tech Stack:** TypeScript, `js-yaml`, TypeBox, Vitest, metadata rules, configuration-extension augmenters, project state structured documents, e2e XML/YAML fixtures.

**Spec:** `docs/superpowers/specs/2026-08-12-configuration-extension-property-states-design.md`

## Global Constraints

- Работать в `codex/extension-collection-states-spec`, уже слитой с актуальным `origin/develop`.
- XML-фикстуры из `e2e/fixtures/xml` являются источником истины и не изменяются реализацией.
- `!проверять` означает `Notify`/`AdoptedNotify`; отсутствие тега означает строгий контроль; `!изменять` означает `Extended`/`Modify` только там, где это разрешено.
- Тег mapping или sequence ставится после двоеточия и не меняет JSON Schema смыслового значения.
- `Предопределенные` и `Состав` не дублируются в разделе `Изменять`; само присутствие поля восстанавливает верхний `PropertyState(..., Extended)`.
- `Предопределенные: {}` и `Состав: []` сохраняют верхний PropertyState без создания непустого внешнего файла.
- У предопределённого элемента допустимы `AdoptedCheck` и `AdoptedNotify`; `!изменять` запрещён.
- В составе плана обмена обычная ссылка означает `State=Check`, `!изменять` — `State=Modify`, `Использовать: Ложь` — отсутствие `ExchangePlanContent/Item`.
- `Использовать: Истина` запрещено; `Авторегистрация` запрещена вместе с `Использовать: Ложь`.
- `State=Modify` с `Использовать: Ложь` допустим только как `Использовать: !xml/invalid Ложь`.
- `State=Check` и `State=Modify` допустимы для базовых и собственных объектов расширения; строгая сверка с базовым составом выполняется только когда цель существует в основной конфигурации.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры существующих построителей property rules.
- Нейтральные runtime/projectState слои не содержат условий по `itemType`, XML-корням или именам `Предопределенные`/`Состав`.
- После каждого слоя выполнять `pnpm duplicates -- --base origin/develop`.
- Перед завершением выполнить `pnpm test`, `pnpm test:e2e`, `pnpm test:architecture:rules`, `pnpm test:architecture` и итоговую проверку дублей.

---

## Карта файлов

| Файл | Ответственность |
|---|---|
| `packages/runtime/yaml/scalarTags.ts` | Общая регистрация и runtime-метаданные `!проверять`/`!изменять` для scalar, mapping и sequence |
| `packages/runtime/yaml/jsYamlParser.ts` | Разбор тегов значения и перенос метки на соответствующий узел данных |
| `packages/runtime/yaml/export.ts` | Каноническая сериализация тега после двоеточия для составного значения |
| `packages/runtime/yaml/runtimeMetadata.ts` | Перенос метки составного значения при проекциях и копировании YAML |
| `packages/runtime/yaml/jsYamlParser.test.ts`, `packages/runtime/yaml/export.test.ts`, `packages/runtime/yaml/runtimeMetadata.test.ts` | Договор разбора, сериализации и переноса составных тегов |
| `packages/runtime/metadata/ruleRuntime/definition/contracts.ts` | Новый вариант `representation: "semantic"` в существующем PropertyState capability |
| `packages/rules/metadata/ruleRuntime/definition/propertyStateDeclarations.ts` | Декларация смыслового вынесенного свойства без раздела `Изменять` |
| `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts` | XML PropertyState → присутствующее смысловое YAML-поле |
| `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts` | Присутствующее смысловое YAML-поле → XML PropertyState Extended |
| `packages/rules/metadata/ruleRuntime/property/propertyStateSchema.ts` | Закрытая схема без лишних имён в `Изменять` |
| `packages/rules/metadata/commonObjects/predefinedItem/rules.ts` | Claim служебного `ExtensionState` предопределённого элемента |
| `packages/rules/metadata/commonObjects/predefinedItem/extensionState.ts` | Чистая проекция `AdoptedCheck`/`AdoptedNotify` ↔ YAML-tag |
| `packages/rules/metadata/commonObjects/exchangePlanContent/rules.ts` | Смысловой элемент состава и служебная коллекция `ExtensionProperty` |
| `packages/rules/metadata/commonObjects/exchangePlanContent/extensionState.ts` | Join/split `Item` и `ExtensionProperty/Item` по `Metadata` |
| `packages/rules/metadata/commonObjects/exchangePlanContent/toJSONSchema.ts` | `Использовать` только `Ложь` и запрет `Авторегистрация` у выключенного элемента |
| `packages/rules/metadata/appliedObjects/configurationExtension/collectionStates.ts` | Вызов предметных проекторов из существующих import/export augmenters расширения |
| `packages/rules/metadata/validation/configurationExtensionPropertyStateFacts.ts` | Снимок вложенных режимов коллекции в существующем PropertyState fact |
| `packages/rules/metadata/appliedObjects/configurationExtension/collectionStateValidation.ts` | Сравнение предопределённых элементов и состава плана обмена; вызывается существующим PropertyState validator |
| `e2e/metadata-project.test.ts` | Канонический YAML и отсутствие широкого raw на новых фикстурах |

---

### Task 1: Составные значения `!проверять` и `!изменять`

**Files:**
- Modify: `packages/runtime/yaml/scalarTags.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.ts`
- Modify: `packages/runtime/yaml/export.ts`
- Modify: `packages/runtime/yaml/runtimeMetadata.ts`
- Test: `packages/runtime/yaml/jsYamlParser.test.ts`
- Test: `packages/runtime/yaml/export.test.ts`
- Test: `packages/runtime/yaml/runtimeMetadata.test.ts`

**Interfaces:**
- Preserves: `markYAMLScalarTag(parent, key, tag)` и `yamlScalarTagAt(parent, key)` как публичный API для всех видов значения.
- Produces: три js-yaml определения одного property-state tag: scalar, mapping и sequence.
- Produces: внутренние `markYAMLValueTag(value, tag)` и `yamlValueTag(value)` для augmenter, которому доступен сам mapping до включения в родительскую коллекцию.
- Guarantees: после parse/dump значение остаётся строкой, объектом или массивом; tag хранится в runtime-метаданных связи `родитель → ключ`, а временная метка самого объекта используется только до включения в родительскую коллекцию.

- [ ] **Step 1: Добавить падающие тесты разбора mapping и sequence**

```ts
it.each([
  ["Объект: !проверять\n  Поле: Значение", "проверять", { Поле: "Значение" }],
  ["Список: !изменять\n  - Первый\n  - Второй", "изменять", ["Первый", "Второй"]],
] as const)("разбирает составной режим: %s", (source, tag, expected) => {
  const parsed = parseWithJsYaml(source)
  expect(parsed.syntaxErrors).toEqual([])
  expect((parsed.data as Record<string, unknown>)[source.startsWith("Объект") ? "Объект" : "Список"]).toEqual(expected)
  expect(yamlScalarTagAt(parsed.data, source.startsWith("Объект") ? "Объект" : "Список")).toBe(tag)
})
```

- [ ] **Step 2: Подтвердить падение**

Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/jsYamlParser.test.ts`

Expected: FAIL с сообщением, что локальный тег ожидает scalar.

- [ ] **Step 3: Зарегистрировать mapping/sequence варианты без нового публичного тега**

В `scalarTags.ts` вынести фабрику:

```ts
function propertyStateTags(tag: PropertyStateYAMLTag) {
  const yamlTag = `!${propertyStateTagAliases[tag]}`
  return [
    defineScalarTag(yamlTag, scalarDefinition(tag)),
    defineMappingTag(yamlTag, mappingDefinition(tag)),
    defineSequenceTag(yamlTag, sequenceDefinition(tag)),
  ]
}
```

Mapping/sequence resolver возвращает существующую `TaggedYAMLScalar`-обёртку с исходным контейнером. `prepareJsYamlData` снимает обёртку и вызывает `markYAMLScalarTag(parent, key, tag)`, как для scalar. Не вводить отдельный смысловой класс значения.

Для программного импорта mapping добавить WeakMap-метку самого значения:

```ts
export function markYAMLValueTag(value: object, tag: PropertyStateYAMLTag): void
export function yamlValueTag(value: unknown): PropertyStateYAMLTag | undefined
```

`taggedScalarForDump(parent, key, value)` сначала читает метку родителя, затем метку самого mapping/sequence. `copyYAMLRuntimeMetadata` переносит её вместе с контейнером.

- [ ] **Step 4: Добавить проверку канонического dump**

```ts
const data = { Объект: { Поле: "Значение" }, Список: ["Первый"] }
markYAMLScalarTag(data, "Объект", "проверять")
markYAMLScalarTag(data, "Список", "изменять")
expect(exportToYAML(data)).toBe([
  "Объект: !проверять",
  "  Поле: Значение",
  "Список: !изменять",
  "  - Первый",
].join("\n"))
```

Повторный parse обязан вернуть те же контейнеры и метки. Дополнительно проверить `copyYAMLRuntimeMetadata` и сортировку mapping: метка переносится только вместе с соответствующим значением.

- [ ] **Step 5: Выполнить тесты слоя**

Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/jsYamlParser.test.ts yaml/export.test.ts yaml/runtimeMetadata.test.ts`

Run: `pnpm --filter @nkdk/runtime type-check`

Run: `pnpm duplicates -- --base origin/develop`

Expected: PASS.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/runtime/yaml
git commit -m "feat: :sparkles: поддержать теги режимов на составных YAML"
```

---

### Task 2: Выводить PropertyState смысловой коллекции из её присутствия

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/definition/contracts.ts`
- Modify: `packages/rules/metadata/ruleRuntime/definition/propertyStateDeclarations.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/propertyStateSchema.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCatalog/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataChartOfAccounts/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataChartOfCharacteristicTypes/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataChartOfCalculationTypes/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataExchangePlan/propertyStates.ts`
- Test: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Test: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`
- Test: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts`

**Interfaces:**
- Produces: `representation: "semantic"` в существующем `PropertyStatePropertyCapability`.
- Produces: `semanticExternalProperty(propertyKey)`; capability допускает только `extend` и не имеет `externalName`.
- Guarantees: присутствие YAML-поля создаёт `Extended`; отсутствие не создаёт состояния; имя не появляется в `Изменять`.

- [ ] **Step 1: Добавить падающие тесты импорта, экспорта и схемы**

Проверить три формы:

```ts
expect(imported).toEqual({ Предопределенные: {} })
expect(exportedStates).toContainEqual({ "xr:Property": "Predefined", "xr:State": "Extended" })
expect(() => validate({ Изменять: ["Предопределенные"] })).toThrow("неизвестное или недопустимое имя")
```

Аналогично проверить `Состав: []` ↔ `Content/Extended` и отсутствие состояния при отсутствии поля.

- [ ] **Step 2: Подтвердить падение на текущем section-представлении**

Run: `pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts`

Expected: FAIL: импорт создаёт `Изменять`, а экспорт без раздела не создаёт PropertyState.

- [ ] **Step 3: Добавить декларацию semantic без новых полей property rule**

```ts
export const semanticExternalProperty = (propertyKey: string) => ({
  [propertyKey]: {
    availability: "borrowed",
    modes: ["extend"],
    representation: "semantic",
  },
}) satisfies Readonly<Record<string, PropertyStatePropertyCapability>>
```

Заменить только регистрации `predefined` четырёх владельцев и `content` плана обмена. Остальные модули/внешние файлы продолжают использовать section.

- [ ] **Step 4: Реализовать общий import/export договор semantic**

В import augmenter при `Extended + semantic`:

```ts
if (!Object.hasOwn(yaml, yamlName)) {
  yaml[yamlName] = propertyRule.type === "Predefined" ? {} : []
}
continue
```

Эта развилка находится в concrete-модуле `configurationExtension`, не в runtime. Она закрыта двумя зарегистрированными property types и выбрасывает ошибку для неизвестного semantic-типа.

В export augmenter до чтения scalar tag:

```ts
if (capability.representation === "semantic" && Object.hasOwn(params.yaml, yamlName)) {
  addState(propertyKey, "Extended")
  continue
}
```

`propertyStateSchema` разрешает само YAML-поле, но не добавляет его имя в `Проверять`/`Изменять`.

- [ ] **Step 5: Выполнить проверки слоя**

Run: `pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts`

Run: `pnpm --filter @nkdk/rules type-check`

Run: `pnpm duplicates -- --base origin/develop`

Expected: PASS.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/runtime/metadata/ruleRuntime/definition/contracts.ts packages/rules/metadata
git commit -m "feat: :sparkles: выводить состояния смысловых коллекций"
```

---

### Task 3: Режимы заимствованных предопределённых элементов

**Files:**
- Create: `packages/rules/metadata/commonObjects/predefinedItem/extensionState.ts`
- Create: `packages/rules/metadata/commonObjects/predefinedItem/extensionState.test.ts`
- Modify: `packages/rules/metadata/commonObjects/predefinedItem/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/collectionStates.ts`
- Modify: `packages/rules/metadata/validation/configurationExtensionPropertyStateFacts.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateValidation.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/collectionStateValidation.ts`
- Test: `packages/rules/metadata/commonObjects/predefinedItem/fromXMLToYAML.integration.test.ts`
- Test: `packages/rules/metadata/commonObjects/predefinedItem/fromYAMLToXML.integration.test.ts`
- Test: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateValidation.test.ts`

**Interfaces:**
- Produces: `importPredefinedExtensionState(source, yaml): void`.
- Produces: `exportPredefinedExtensionState({ yaml, borrowed }): "AdoptedCheck" | "AdoptedNotify" | undefined`.
- Extends: versioned PropertyState fact value сохраняет вложенные tag modes без изменения публичного YAML.

- [ ] **Step 1: Добавить падающий прямой round-trip по актуальной XML-фикстуре**

Ожидаемый YAML:

```yaml
Предопределенные:
  Группа: !проверять
    Код: "000000003"
    Наименование: Наименование
    ЭтоГруппа: Истина
  Предопределенный2:
    Код: "000000002"
    Наименование: Наименование
```

Тест отдельно проверяет независимые режимы группы и вложенного элемента, отсутствие невыбранного элемента и отсутствие `ExtensionState` в публичных полях.

- [ ] **Step 2: Подтвердить, что текущий импорт создаёт raw**

Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/predefinedItem/fromXMLToYAML.integration.test.ts metadata/commonObjects/predefinedItem/fromYAMLToXML.integration.test.ts`

Expected: FAIL: `ExtensionState` не заявлен rules.ts и mapping value не получает tag.

- [ ] **Step 3: Claim служебного XML и реализовать чистое преобразование**

В `PredefinedItemRules` добавить runtime-only свойство в XML-порядок перед `childItems`:

```ts
extensionState: stringRule({
  xml: "ExtensionState",
  runtimeOnly: true,
})
```

В `extensionState.ts`:

```ts
export function importPredefinedExtensionState(source: Record<string, unknown>, yaml: Record<string, unknown>): void {
  if (source.ExtensionState === "AdoptedNotify") markYAMLValueTag(yaml, "проверять")
  else if (source.ExtensionState !== undefined && source.ExtensionState !== "AdoptedCheck") {
    throw new Error(`Неизвестный ExtensionState предопределённого элемента: ${String(source.ExtensionState)}`)
  }
}
```

`markYAMLValueTag`/`yamlValueTag` — внутренние дополнения Task 1 для случая, когда augmenter знает сам mapping, но ещё не знает родительский ключ; serializer и collection projection переносят эту метку на значение. Публичные `markYAMLScalarTag`/`yamlScalarTagAt` остаются совместимыми.

Существующие import/export augmenters вызывают чистые функции через `collectionStates.ts`. Выбор проектора по `itemType` остаётся внутри concrete-модуля `configurationExtension`; нейтральные runtime и projectState слои не знают о предопределённых элементах.

Экспорт возвращает `AdoptedNotify` для `!проверять`, `AdoptedCheck` для элемента, logical address которого присутствует в `context.exportToXML.adoptedUuids`, и `undefined` для собственного элемента. `!изменять` выбрасывает предметную ошибку.

- [ ] **Step 4: Сохранить режимы в существующем fact и проверить относительно базы**

Расширить `normalizedValue` рекурсивным снимком:

```ts
type TaggedFactValue = {
  readonly mode: "control" | "notify" | "extend"
  readonly value: unknown
}
```

Для mapping/sequence каждый помеченный узел получает `TaggedFactValue`; обычные узлы остаются обычными JSON-значениями. `propertyStateValidation` передаёт факт в `collectionStateValidation`; для `propertyKey === "predefined"` тот сравнивает элементы по logical name:

- базовый элемент + control: различие полей → error;
- базовый элемент + notify: различие полей → warning;
- отсутствующая в базе цель с mode control/notify → error;
- отсутствующая в базе цель без служебного режима → собственный элемент, без сравнения;
- `extend` у элемента → error.

Путь диагностики указывает на ключ конкретного элемента, а не на весь раздел.

- [ ] **Step 5: Выполнить тесты слоя**

Run: `pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/appliedObjects/configurationExtension/propertyStateValidation.test.ts metadata/commonObjects/predefinedItem/extensionState.test.ts`

Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/predefinedItem/fromXMLToYAML.integration.test.ts metadata/commonObjects/predefinedItem/fromYAMLToXML.integration.test.ts`

Run: `pnpm --filter @nkdk/rules type-check`

Run: `pnpm duplicates -- --base origin/develop`

Expected: PASS.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/rules/metadata/commonObjects/predefinedItem packages/rules/metadata/appliedObjects/configurationExtension packages/rules/metadata/validation/configurationExtensionPropertyStateFacts.ts
git commit -m "feat: :sparkles: поддержать режимы предопределённых элементов"
```

---

### Task 4: Режим и использование элементов состава плана обмена

**Files:**
- Create: `packages/rules/metadata/commonObjects/exchangePlanContent/extensionState.ts`
- Create: `packages/rules/metadata/commonObjects/exchangePlanContent/extensionState.test.ts`
- Create: `packages/rules/metadata/commonObjects/exchangePlanContent/toJSONSchema.ts`
- Modify: `packages/rules/metadata/commonObjects/exchangePlanContent/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/exchangePlanContent/types.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/collectionStates.ts`
- Modify: `packages/rules/metadata/validation/configurationExtensionPropertyStateFacts.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateValidation.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/collectionStateValidation.ts`
- Test: `packages/rules/metadata/commonObjects/exchangePlanContent/fromXMLToYAML.integration.test.ts`
- Test: `packages/rules/metadata/commonObjects/exchangePlanContent/fromYAMLToXML.integration.test.ts`
- Test: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateValidation.test.ts`

**Interfaces:**
- Produces: `joinExchangePlanExtensionContent(content, extensionProperties)` → один YAML-массив.
- Produces: `splitExchangePlanExtensionContent(yaml)` → `{ items, extensionProperties }`.
- Preserves: metadata-target правила `Метаданные` и обычное перечисление `Авторегистрация`.

- [ ] **Step 1: Добавить падающий тест всех подтверждённых сочетаний**

Вход берётся из новой e2e-фикстуры и должен дать элементы:

```ts
[
  { Метаданные: "Документ.ДокументВсеСвойства", Авторегистрация: "Разрешить" },
  { Метаданные: "Справочник.СправочникВладелец", Использовать: "Ложь" },
  { Метаданные: "Документ.ДокументСНумераторомExt", Авторегистрация: "Разрешить" },
  { Метаданные: "Справочник.СправочникПолный", Авторегистрация: "Разрешить" },
]
```

Проверить runtime tag `изменять` на `Метаданные` у `СправочникПолный`, обычный Check у собственного `ДокументСНумераторомExt`, а также `Modify + Использовать: Ложь` как смысловую запись, которую последующая проверка пометит `!xml/invalid`.

- [ ] **Step 2: Подтвердить текущий широкий raw**

Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/exchangePlanContent/fromXMLToYAML.integration.test.ts metadata/commonObjects/exchangePlanContent/fromYAMLToXML.integration.test.ts`

Expected: FAIL: `ExtensionProperty` остаётся неподдержанным XML либо не восстанавливается.

- [ ] **Step 3: Описать служебную XML-коллекцию rules.ts**

Добавить непубличный item rule:

```ts
const ExchangePlanExtensionPropertyItemRules = {
  itemType: "ExchangePlanExtensionPropertyItem",
  properties: {
    metadata: metadataItemLinkRule({ xml: "Metadata", required: true }),
    state: stringRule({ xml: "State", required: true }),
  },
} as const satisfies MetadataItemRule
```

`ExchangePlanContentRules` заявляет `ExtensionProperty/Item`, чтобы XML audit считал узлы обработанными. Публичная модель остаётся одним массивом `Состав`; служебная коллекция не попадает в JSON Schema.

В смысловой item rule добавить `Использовать` как runtime-only boolean-поле, которое проектор читает и удаляет до обычного XML-преобразования.

- [ ] **Step 4: Реализовать join/split по Metadata**

```ts
export interface ExtensionPropertyItem {
  readonly metadata: string
  readonly state: "Check" | "Modify"
}

export function joinExchangePlanExtensionContent(
  items: readonly Record<string, unknown>[],
  states: readonly ExtensionPropertyItem[],
): Record<string, unknown>[]

export function splitExchangePlanExtensionContent(
  yaml: readonly Record<string, unknown>[],
): {
  readonly items: readonly Record<string, unknown>[]
  readonly states: readonly ExtensionPropertyItem[]
}
```

Join идёт в порядке `ExtensionProperty/Item`, потому что это полный список режимов расширения; `Item` без режима вызывает ошибку импорта. `Check` оставляет `Метаданные` без тега, `Modify` ставит `!изменять`; отсутствующий content item добавляет `Использовать: Ложь`. Split создаёт state для каждого YAML-элемента и исключает из `Item` только записи с `Использовать: Ложь`.

Неизвестный state, дубликат `Metadata` в любой входной коллекции и `Авторегистрация` у выключенной записи дают адресную ошибку, а не raw всего файла.

- [ ] **Step 5: Закрыть JSON Schema**

`toJSONSchema.ts` строит union:

```ts
Type.Union([
  Type.Object({
    Метаданные: metadataSchema,
    Авторегистрация: Type.Optional(autoRecordSchema),
  }, { additionalProperties: false }),
  Type.Object({
    Метаданные: metadataSchema,
    Использовать: Type.Literal("Ложь"),
  }, { additionalProperties: false }),
])
```

Таким образом `Использовать: Истина` и сочетание с `Авторегистрация` отклоняются схемой до экспорта.

- [ ] **Step 6: Добавить предметную межфайловую проверку**

Вложенный снимок PropertyState fact сохраняет для каждого элемента `metadata`, effective `autoRecord`, `used`, mode и наличие `xml/invalid` на `Использовать`.

Проверки:

- `control` и цель есть в `cf`: `used` и effective `autoRecord` должны совпадать с базовым составом;
- `control` и цель есть только в том же `cfe`: сравнение с базовым составом не выполняется;
- `extend`: сравнение с базовым составом не выполняется;
- `extend + used=false` без invalid → error на `/Состав/N/Использовать`;
- `extend + used=false` с invalid → подтверждённая XML-аномалия без ошибки;
- invalid на допустимом сочетании → ошибка лишнего `!xml/invalid`;
- отсутствующая и в `cf`, и в `cfe` цель остаётся обычной ошибкой ссылки существующего resolver.

На импорте первая ошибка `Modify + false` должна быть преобразована существующим механизмом решений в `Использовать: !xml/invalid Ложь`, без специальной записи тега в projector.

- [ ] **Step 7: Выполнить тесты слоя**

Run: `pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/commonObjects/exchangePlanContent/extensionState.test.ts metadata/appliedObjects/configurationExtension/propertyStateValidation.test.ts`

Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/exchangePlanContent/fromXMLToYAML.integration.test.ts metadata/commonObjects/exchangePlanContent/fromYAMLToXML.integration.test.ts`

Run: `pnpm --filter @nkdk/rules type-check`

Run: `pnpm duplicates -- --base origin/develop`

Expected: PASS.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/rules/metadata/commonObjects/exchangePlanContent packages/rules/metadata/appliedObjects/configurationExtension packages/rules/metadata/validation/configurationExtensionPropertyStateFacts.ts
git commit -m "feat: :sparkles: поддержать режимы состава плана обмена"
```

---

### Task 5: E2E-договор и полная проверка

**Files:**
- Modify: `e2e/metadata-project.test.ts`
- Update generated YAML only through the e2e import: `e2e/fixtures/nkdk/cfe/all-extension/**`
- Verify unchanged source XML: `e2e/fixtures/xml/cf/**`, `e2e/fixtures/xml/cfe/all-extension/**`

**Interfaces:**
- Verifies: публичный XML → YAML → XML round-trip без исключений.
- Verifies: отсутствие `!xml/raw` на `Предопределенные`, отдельных предопределённых элементах, `Состав` и элементах состава.

- [ ] **Step 1: Добавить точные проверки YAML**

```ts
expect(predefinedYaml).toContain("Группа: !проверять")
expect(predefinedYaml).not.toContain("Предопределенные: !xml/raw")
expect(exchangePlanYaml).toContain("Метаданные: !изменять Справочник.СправочникПолный")
expect(exchangePlanYaml).toContain("Использовать: !xml/invalid Ложь")
expect(exchangePlanYaml).not.toContain("Состав: !xml/raw")
expect(exchangePlanYaml).not.toContain("Изменять:\n  - Состав")
```

Также проверить `Предопределенные: {}` у `СправочникРеквизитБезСинонима` и отсутствие внешнего Predefined.xml после обратного экспорта.

- [ ] **Step 2: Запустить целевой e2e и подтвердить исходное падение**

Run: `pnpm test:e2e -- e2e/metadata-project.test.ts`

Expected до завершения Tasks 1–4: FAIL на широком raw/несовпадении XML; после реализации: PASS и точное XML-сравнение без списка исключений.

- [ ] **Step 3: Обновить только производные NKDK-фикстуры**

Run: `pnpm fixtures:e2e:nkdk`

После команды проверить:

```bash
rg -lU '\r$' e2e/fixtures | wc -l
rg -n '!xml/raw' e2e/fixtures/nkdk/cfe/all-extension
git diff -- e2e/fixtures/xml
```

Expected: CRLF `0`; новых raw на целевых границах нет; исходные XML не изменились.

- [ ] **Step 4: Выполнить полную проверку проекта**

Run outside sandbox: `pnpm test`

Run outside sandbox: `pnpm test:e2e`

Run: `pnpm type-check`

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Run: `pnpm duplicates -- --base origin/develop`

Expected: все команды PASS; e2e не содержит списков исключений.

- [ ] **Step 5: Зафиксировать итоговый слой**

```bash
git add e2e/metadata-project.test.ts e2e/fixtures/nkdk/cfe/all-extension
git commit -m "test: :white_check_mark: закрепить режимы коллекций расширения"
```

---

## Проверка соответствия спеке

- Составные теги после двоеточия: Task 1.
- Отсутствие `Изменять: [Предопределенные, Состав]`: Task 2.
- Пустые изменяемые коллекции: Tasks 2 и 5.
- `AdoptedCheck`/`AdoptedNotify`, независимость группы и ребёнка, запрет `!изменять`: Task 3.
- Независимые mode/use, `Использовать: Ложь`, Check/Modify для собственных объектов: Task 4.
- `Modify + false` через точечный `!xml/invalid`: Task 4.
- Точное восстановление XML, отсутствие широкого raw и отсутствие исключений e2e: Task 5.
