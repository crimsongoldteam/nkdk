# Configuration Extension Property States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать каноническое YAML-представление режимов свойств расширения конфигурации, их XML round-trip, закрытые схемы заимствованных объектов и полную валидацию по основной конфигурации и режиму совместимости расширения.

**Architecture:** Локальные теги остаются общей возможностью YAML runtime, а матрица режимов и ограничений живёт в декларативных contributions пакета `@nkdk/rules`. Разрешённые режимы не добавляются в `BasePropertyRule`: отдельный реестр соединяет общие профили, отличия конкретных metadata-item и подтверждённые дельты совместимости. Импорт, экспорт, JSON Schema и полная проверка проекта используют один собранный реестр; снимок конфигурации не хранит PropertyState.

**Tech Stack:** TypeScript, `js-yaml`, TypeBox, Vitest, существующие metadata rules/operation registries, project state и XML/YAML import/sync.

## Global Constraints

- Реализация выполняется в worktree `configuration-extension-property-states-design`, созданном от актуального `origin/develop`.
- Существующие XML-фикстуры не изменяются; новые узкие случаи задаются строками XML/YAML внутри тестов или новыми отдельными тестовыми файлами.
- Формат снимка и используемое им хранилище не меняются; PropertyState в снимок не записывается.
- Публичного поля `Контроль` больше нет: оно не читается, не записывается и не мигрируется.
- `!проверять` соответствует `Notify`; `!изменять` используется только для явного выбора `Extended` у многорежимного свойства.
- Обычное значение заимствованного свойства означает контроль; обычное значение свойства, допускающего только изменение, означает `Extended`.
- `!xml` остаётся исключительным зарегистрированным механизмом; неизвестный `xr:State` является ошибкой импорта.
- Дочерний `Template.xml` остаётся непрозрачным внешним XML; его смысловое преобразование и отдельная поддержка PropertyState не входят в эту реализацию.
- При отсутствии `РежимСовместимостиРасширенияКонфигурации` используется матрица `Версия8_3_27`.
- Заимствованность корневого объекта определяется связью с основной конфигурацией, дочернего — совпадением вида и имени у соответствующего владельца.
- Валидация расширения выполняется по полному состоянию проекта и требует актуальную основную конфигурацию.
- Закрытая матрица 8.3.27 включает все строки спецификации; совпадение имени свойства само по себе не переносит capability между видами объектов.
- Реализуются только подтверждённые дельты `РежимСовместимостиРасширенияКонфигурации`; номер выпуска платформы не является входом валидации.
- Ограничения истории данных, РИБ и назначения расширения проверяются отдельно от PropertyState и доступности metadata-объекта.
- Существующая политика произвольной ссылки сохраняется: до `Версия8_3_22` включительно — `AnyRef`, начиная с `Версия8_3_23` и для `НеИспользовать` — `AnyIBRef`.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` или параметры построителей property rules.
- Не добавлять частные проверки по `itemType`, XML-корням или именам каталогов в нейтральные слои runtime/projectState.
- После каждого законченного слоя запускать `pnpm duplicates -- --base 0d7164c17877172e3e05440bfbc42759e31703d5`.
- Перед завершением запустить `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules`, `pnpm test:architecture` и итоговую проверку дублей.

---

## Карта файлов

| Файл | Ответственность |
|---|---|
| `packages/runtime/yaml/scalarTags.ts` | Общий разбор, хранение и сериализация тегов `!xml`, `!проверять`, `!изменять` без изменения смыслового типа значения |
| `packages/runtime/yaml/jsYamlParser.test.ts` | Разбор кириллических тегов, пустых значений и тегов элементов массива |
| `packages/runtime/yaml/export.test.ts` | Каноническая сериализация и повторный разбор тегов |
| `packages/runtime/metadata/ruleRuntime/definition/contracts.ts` | Нейтральный контракт contributions для возможностей property state и версионных дельт |
| `packages/runtime/metadata/ruleRuntime/definition/composeMetadataRules.ts` | Объединение contributions без знания конкретных видов 1С |
| `packages/runtime/metadata/ruleRuntime/definition/testSupport.ts` | Пустые наборы новых contributions для тестов |
| `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateCapabilities.ts` | Типы предметного реестра, общие профили и вычисление итоговой матрицы по режиму совместимости |
| `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateCapabilities.test.ts` | Профили, наложение отличий и подтверждённые исторические границы |
| `packages/rules/metadata/appliedObjects/configurationExtension/typeDescriptionPolicy.test.ts` | Граница `AnyRef`/`AnyIBRef`, зависящая только от режима совместимости расширения |
| `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateRules.ts` | Сбор sidecar-регистраций конкретных metadata-item в один слой rules.ts |
| `packages/rules/metadata/appliedObjects/configurationExtension/structureCapabilities.ts` | Декларативный реестр допустимых собственных видов и дочерних коллекций расширения |
| `packages/rules/metadata/appliedObjects/*/propertyStates.ts` и `packages/rules/metadata/commonObjects/*/propertyStates.ts` | Возможности конкретных объектов рядом с их обычными `rules.ts` |
| `packages/rules/metadata/operations/operationRegistrySet.ts` | Собранный lookup возможностей для импорта, экспорта и схемы |
| `packages/rules/metadata/validation/validationRegistrySet.ts` | Доступ того же lookup при проверке проекта |
| `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts` | XML → YAML для `Notify`, `Extended`, вынесенных свойств и известных недопустимых состояний |
| `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts` | YAML → XML, порядок `xr:PropertyState`, служебные поля заимствования |
| `packages/rules/metadata/appliedObjects/configurationExtension/multiState.ts` | Разбор и сборка `xr:ExtendedProperty` для составного типа |
| `packages/rules/metadata/appliedObjects/configurationExtension/sections.ts` | Разделы `Проверять`/`Изменять` для вынесенного содержимого |
| `packages/rules/metadata/appliedObjects/configurationExtension/explicitXMLState.ts` | Зарегистрированное точное сохранение известного, но недопустимого PropertyState через `!xml` |
| `packages/rules/metadata/appliedObjects/configurationExtension/schema.ts` | Схема корня расширения и подключение контекстной overlay-схемы |
| `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.ts` | Закрытая JSON Schema заимствованного объекта, теги режимов и разделы вынесенных свойств |
| `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateFacts.ts` | Извлечение компактных фактов режимов и значений из YAML для project state |
| `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateValidation.ts` | Полная межкомпонентная проверка значений, режимов, ссылок и внешних файлов |
| `packages/rules/metadata/appliedObjects/configurationExtension/structureValidation.ts` | Ограничения собственных/заимствованных объектов, дочерних коллекций и совместимости |
| `packages/rules/metadata/appliedObjects/configurationExtension/historyValidation.ts` | Отдельная матрица допустимости объектов и полей расширения в истории данных |
| Sidecar `extensionStructure.ts` и `extensionHistory.ts` рядом с соответствующими `rules.ts` | Декларации структурных и исторических ограничений конкретного metadata-item без частных условий в нейтральных слоях |
| `packages/rules/metadata/composition/metadataRules.ts` | Подключение деклараций возможностей и проверок в runtime |
| `packages/rules/metadata/composition/projectState.ts` | Подключение предметных межкомпонентных валидаторов без частных условий в projectState |
| `packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts` | Публичный импорт расширения без `Контроль`, со всеми тремя YAML-режимами |
| `packages/rules/metadata/fullSyncToXml/worker.integration.test.ts` | Публичный экспорт тегов, секций, MultiState и пустого изменяемого значения |
| `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts` | Ошибки/предупреждения относительно основной конфигурации и структурные запреты |
| `packages/rules/metadata/validation/schemaRegistry.integration.test.ts` | Закрытая overlay-схема и подсказки допустимых полей/режимов |
| `e2e/metadata-project.test.ts` | Итоговый XML → YAML → XML договор для расширения |

---

### Task 1: Локальные YAML-теги режимов

**Files:**
- Modify: `packages/runtime/yaml/scalarTags.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.test.ts`
- Modify: `packages/runtime/yaml/export.test.ts`

**Interfaces:**
- Produces: `YAMLScalarTag = "xml" | "проверять" | "изменять"`.
- Produces: `propertyStateScalarTagValue(tag, payload)` и `propertyStateScalarTagPayload(tag, value)` для пустых и непустых скаляров.
- Preserves: `yamlScalarTagAt(parent, key)` для свойств и элементов массивов.

- [ ] **Step 1: Добавить падающие проверки разбора**

Добавить в `jsYamlParser.test.ts` таблицу:

```ts
it.each([
  ["Поле: !проверять Значение", "проверять", "Значение"],
  ["Поле: !изменять 12", "изменять", 12],
  ["Поле: !изменять", "изменять", {}],
] as const)("разбирает режим свойства: %s", (source, tag, value) => {
  const parsed = parseWithJsYaml(source)
  expect(parsed.syntaxErrors).toEqual([])
  expect((parsed.data as Record<string, unknown>).Поле).toEqual(value)
  expect(yamlScalarTagAt(parsed.data, "Поле")).toBe(tag)
})
```

Добавить отдельную проверку `Тип:\n  - !проверять Дата\n  - !изменять Булево`, чтобы метки сохранялись на индексах `0` и `1`.

- [ ] **Step 2: Запустить тесты и подтвердить падение**

Run: `pnpm --filter @nkdk/runtime test -- yaml/jsYamlParser.test.ts`

Expected: FAIL — `js-yaml` отклоняет неизвестные кириллические теги либо `yamlScalarTagAt` возвращает `undefined`.

- [ ] **Step 3: Обобщить реестр скалярных тегов**

В `scalarTags.ts` зарегистрировать три `defineScalarTag`, не преобразовывая смысловой тип payload. Для `!проверять` и `!изменять` resolver должен возвращать обёртку с исходным скаляром; пустой payload после `prepareJsYamlData` должен стать `{}`, как обычное пустое YAML-значение. Существующие функции `xmlScalarTagValue/xmlScalarTagPayload` оставить совместимыми.

Канонические имена:

```ts
export type YAMLScalarTag = "xml" | "проверять" | "изменять"
export const PROPERTY_STATE_YAML_TAGS = ["проверять", "изменять"] as const
```

- [ ] **Step 4: Добавить и выполнить проверки сериализации**

В `export.test.ts` проверить:

```ts
const source = { Нумератор: {} }
markYAMLScalarTag(source, "Нумератор", "изменять")
expect(exportToYAML(source)).toBe("Нумератор: !изменять")
```

Также проверить непустые строку, число и элементы массива, затем выполнить:

Run: `pnpm --filter @nkdk/runtime test -- yaml/jsYamlParser.test.ts yaml/export.test.ts`

Expected: PASS.

- [ ] **Step 5: Проверить типы и дубли**

Run: `pnpm --filter @nkdk/runtime type-check`

Run: `pnpm duplicates -- --base 0d7164c17877172e3e05440bfbc42759e31703d5`

Expected: обе команды завершаются успешно.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/runtime/yaml/scalarTags.ts packages/runtime/yaml/jsYamlParser.test.ts packages/runtime/yaml/export.test.ts
git commit -m "feat: :sparkles: добавить YAML-теги режимов свойств" -m "Режим свойства хранится меткой скаляра и не меняет смысловой тип значения. Кириллические теги сериализуются в канонической форме NKDK."
```

---

### Task 2: Декларативный реестр возможностей PropertyState

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/definition/contracts.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/definition/composeMetadataRules.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/definition/testSupport.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateCapabilities.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateCapabilities.test.ts`
- Modify: `packages/rules/metadata/operations/operationRegistrySet.ts`
- Modify: `packages/rules/metadata/operations/operationRegistrySet.test.ts`
- Modify: `packages/rules/metadata/validation/validationRegistrySet.ts`
- Modify: `packages/rules/metadata/validation/validationRegistrySet.test.ts`

**Interfaces:**
- Produces: `PropertyStateMode = "control" | "notify" | "extend" | "multi"`.
- Produces: `PropertyStateCapabilityContribution` с профилем, регистрацией item-type или дельтой совместимости.
- Produces: `PropertyStateCapabilityRegistry.resolve({ itemType, propertyKey, compatibilityMode })`.
- Produces: результат `{ availability, modes, representation, xmlName, externalName? }`.

- [ ] **Step 1: Описать контракт contributions и падающий тест композиции**

Добавить в `contracts.ts` нейтральные строки и структуры без имён объектов 1С:

```ts
export interface PropertyStateCapabilityContribution {
  readonly kind: "propertyStateCapability"
  readonly id: string
  readonly profile?: { readonly properties: Readonly<Record<string, PropertyStatePropertyCapability>> }
  readonly item?: { readonly itemType: string; readonly profiles: readonly string[]; readonly properties?: Readonly<Record<string, PropertyStatePropertyCapability>> }
  readonly delta?: { readonly mode: string; readonly items: readonly PropertyStateItemCapabilityPatch[] }
}
```

Добавить `propertyStateCapabilities` в `MetadataRulesDefinition`, `composeMetadataRules` и `emptyMetadataRules`. Тест должен доказать сохранение порядка слоёв и ошибку повторного `id` при сборке реестра.

- [ ] **Step 2: Запустить тесты и подтвердить падение**

Run: `pnpm --filter @nkdk/rules test -- metadata/operations/operationRegistrySet.test.ts metadata/validation/validationRegistrySet.test.ts`

Expected: FAIL — contributions и lookup ещё отсутствуют.

- [ ] **Step 3: Реализовать вычисление итоговой возможности**

В `propertyStateCapabilities.ts` реализовать:

```ts
export interface PropertyStateCapabilityRegistry {
  resolve(params: {
    itemType: string
    propertyKey: string
    compatibilityMode: string
  }): PropertyStatePropertyCapability | undefined
  item(itemType: string, compatibilityMode: string): ResolvedPropertyStateItemCapability | undefined
}
```

Алгоритм: подключить профили в объявленном порядке, наложить локальные отличия item-type, затем дельты с версией не выше выбранного режима. `DontUse`, отсутствие YAML-поля режима и `Версия8_3_27` дают одну матрицу. Неизвестный режим возвращает предметную ошибку с именем свойства `РежимСовместимостиРасширенияКонфигурации`.

- [ ] **Step 4: Подключить один экземпляр реестра к операциям и валидации**

`OperationRegistrySet` и `ValidationRegistrySet` получают read-only `propertyStates` lookup, построенный из тех же contributions. Нейтральные registry-файлы только группируют contributions и не содержат `itemType`/YAML-имён.

- [ ] **Step 5: Проверить профили и версионные дельты**

В `propertyStateCapabilities.test.ts` проверить:

- обычное значение `control`;
- только `extend` без обязательного `!изменять`;
- набор `control + notify + extend`;
- `DontUse === Version8_3_27`;
- точные подтверждённые границы: сервисы/XDTO с 8.3.7; переопределение свойств и общие дочерние объекты с 8.3.8; общие модули, роли и собственные каналы сервиса интеграции с 8.3.9; справочники, документы и регистры сведений с 8.3.11; перечисления с 8.3.12; планы и остальные регистры с 8.3.13; параметры сеанса и исследованное свойство корня с 8.3.14; действие `Предупреждать` с 8.3.15; константы, функциональные опции, их параметры и критерии отбора с 8.3.16; изменение типа заимствованного реквизита с 8.3.18; наборы типов и определяемые типы с 8.3.20;
- отдельные границы истории данных: справочники/документы/бизнес-процессы/задачи/регистры сведений с 8.3.11, планы видов характеристик/счетов с 8.3.12, константы/планы обмена/планы видов расчёта с 8.3.13;
- ограничение длины номера строки собственных табличных частей по 8.3.26 включительно;
- отсутствие неподтверждённых дельт 8.3.20–8.3.26.

Тест обязан также доказать, что версия выпуска платформы не передаётся в `resolve`, а `РежимСовместимости` основной конфигурации не влияет на выбранную матрицу.

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/propertyStateCapabilities.test.ts metadata/operations/operationRegistrySet.test.ts metadata/validation/validationRegistrySet.test.ts`

Expected: PASS.

- [ ] **Step 6: Проверить типы и дубли**

Run: `pnpm --filter @nkdk/runtime type-check`

Run: `pnpm --filter @nkdk/rules type-check`

Run: `pnpm duplicates -- --base 0d7164c17877172e3e05440bfbc42759e31703d5`

Expected: PASS.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/runtime/metadata/ruleRuntime/definition packages/rules/metadata/appliedObjects/configurationExtension/propertyStateCapabilities.ts packages/rules/metadata/appliedObjects/configurationExtension/propertyStateCapabilities.test.ts packages/rules/metadata/operations packages/rules/metadata/validation/validationRegistrySet.ts packages/rules/metadata/validation/validationRegistrySet.test.ts
git commit -m "feat: :sparkles: добавить реестр возможностей PropertyState" -m "Матрица режимов собирается отдельными contributions и не расширяет BasePropertyRule. Один lookup используется операциями, схемой и валидацией."
```

---

### Task 3: Зарегистрировать подтверждённую матрицу объектов и свойств

**Files:**
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateProfiles.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateRules.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateRules.test.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/structureCapabilities.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/structureCapabilities.test.ts`
- Create: sidecar `propertyStates.ts` рядом с соответствующими `rules.ts` в каталогах из таблиц ниже.
- Create: sidecar `extensionStructure.ts` рядом с `rules.ts` видов, имеющих специальные ограничения собственных/заимствованных объектов и дочерних коллекций.
- Modify: `packages/rules/metadata/composition/metadataRules.ts`

**Interfaces:**
- Consumes: `PropertyStateCapabilityContribution` из Task 2.
- Produces: `configurationExtensionPropertyStateRules` — слой `defineMetadataRules({ propertyStateCapabilities })`.
- Produces: локальные exports `<metadataObject>PropertyStateCapabilities` из sidecar-файлов.
- Produces: `ConfigurationExtensionStructureContribution = { itemType, ownObject, borrowedChildren, contextRules }` и `ConfigurationExtensionStructureRegistry.resolve(itemType, compatibilityMode)` для схемы Task 7 и валидации Task 8.

**Sidecar groups:**

| Каталог | Покрываемые виды |
|---|---|
| `packages/rules/metadata/appliedObjects/configurationExtension` | Корень расширения и базовый профиль заимствованного объекта |
| `packages/rules/metadata/commonObjects/metadataAttribute`, `metadataRegisterAttribute`, `metadataRegisterDimension`, `metadataRegisterResource`, `metadataTabularSection`, `metadataCommand`, `metadataDocumentJournalColumn` | Повторяющиеся дочерние объекты |
| `packages/rules/metadata/appliedObjects/metadataCatalog`, `metadataExchangePlan`, `metadataDocument`, `metadataDocumentNumerator`, `metadataChartOfCharacteristicTypes`, `metadataChartOfAccounts`, `metadataChartOfCalculationTypes` | Код, номер, состав, формы и представления |
| `packages/rules/metadata/appliedObjects/metadataBusinessProcess`, `metadataTask`, `metadataSequence`, `metadataEnumeration`, `metadataDocumentJournal` | Прикладные объекты и их специальные свойства |
| `packages/rules/metadata/appliedObjects/metadataInformationRegister`, `metadataAccumulationRegister`, `metadataAccountingRegister`, `metadataCalculationRegister` | Регистры и перерасчёты |
| `packages/rules/metadata/appliedObjects/metadataSubsystem`, `metadataCommonModule`, `metadataRole`, `metadataCommonAttribute`, `metadataFunctionalOption`, `metadataFunctionalOptionsParameter`, `metadataDefinedType`, `metadataFilterCriterion`, `metadataCommonCommand` | Общие объекты, критерий отбора и общая команда |
| `packages/rules/metadata/appliedObjects/metadataConstant`, `metadataSessionParameter`, `metadataEventSubscription`, `metadataScheduledJob`, `metadataBot`, `metadataSettingsStorage` | Остальные общие объекты и задания |
| `packages/rules/metadata/appliedObjects/metadataDataProcessor`, `metadataReport`, `metadataCommonForm`, `metadataCommonPicture`, `metadataCommonTemplate`, `metadataCommandGroup` | Обработки, отчёты, формы, картинки, макеты и группы команд |
| `packages/rules/metadata/appliedObjects/metadataStyle`, `metadataStyleItem`, `metadataLanguage` | Стили, элементы стиля и языки |
| `packages/rules/metadata/appliedObjects/metadataWebService`, `metadataHTTPService`, `metadataIntegrationService`, `metadataWebSocketClient`, `metadataWSReference`, `metadataXDTOPackage` | Сервисы и XDTO |
| `packages/rules/metadata/appliedObjects/metadataExternalDataSource` и `packages/rules/metadata/commonObjects/metadataExternalDataSource*` | Внешние источники данных |

- [ ] **Step 1: Написать падающий тест покрытия матрицы**

В `propertyStateRules.test.ts` построить плоскую проекцию собранного реестра и проверить представителей каждого общего профиля, все строки «Свойства со всеми режимами», команды, формы, макеты и специальные запреты. Добавить проверку, что каждое YAML-имя из спецификации разрешается в реальный `propertyKey` соответствующего `MetadataItemRule`.

Таблица покрытия обязана отдельно содержать `MetadataFilterCriterionRules`, `MetadataCommonCommandRules`, `MetadataFunctionalOptionRules.content`, `MetadataCommonAttributeRules.content`, все поддерживающие `predefined` правила и служебные `formType`/`templateType`. Последние два ключа отмечаются как запрещённые в borrowed overlay, а не как доступные свойства.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/propertyStateRules.test.ts`

Expected: FAIL — профили и sidecar-регистрации ещё не подключены.

- [ ] **Step 3: Реализовать общие профили**

В `propertyStateProfiles.ts` объявить: базу заимствованного объекта, изменяемый синоним, модули, основные формы, представления, дочернюю форму, типизированное поле, табличную часть, команду и регистровое поле. Профиль использует `propertyKey`, а не повторяет YAML/XML-имя; имена берутся из реального item rule при разрешении.

- [ ] **Step 4: Добавить sidecar-регистрации конкретных видов**

Каждый sidecar импортирует соседний `...Rules`, подключает профили и объявляет только отличия. Свойства со всеми режимами регистрируются по ключам, уже перечисленным в спецификации, например:

```ts
export const metadataDocumentPropertyStateCapabilities = definePropertyStateItemCapabilities(
  MetadataDocumentRules,
  {
    profiles: ["borrowed-base", "mutable-synonym", "modules", "main-forms", "presentations"],
    properties: allModes("numerator", "numberType", "numberLength", "numberAllowedLength", "numberPeriodicity", "checkUnique"),
  },
)
```

Не добавлять property-state поля в сами `MetadataDocumentRules`.

Отдельно зарегистрировать предметные отличия, которые нельзя вывести из имени:

- `MetadataCommonCommandRules.group` допускает все режимы, тогда как `MetadataCommandRules.group` — только контроль/проверку;
- элементы `MetadataCommonAttributeRules.content` и состава критерия отбора допускают только обычный контроль, а список `Состав` общего реквизита изменяется целиком;
- `MetadataFunctionalOptionRules.content` доступен и изменяется целиком только при булевом типе объекта из `location`; при небулевом размещении поле запрещено;
- `predefined` является вынесенным свойством владельца, а режимы отдельных предопределённых элементов остаются внутри их смысловой структуры;
- `formType`, `templateType`, вспомогательные формы хранилища настроек и недоступные свойства общей картинки/сервисов не входят в borrowed capability даже при наличии обычного rules.ts.

- [ ] **Step 5: Собрать слой и выполнить тесты**

`propertyStateRules.ts` объединяет sidecar exports, а `metadataRules.ts` подключает получившийся слой до operation/validation consumers. `structureCapabilities.ts` тем же способом собирает отдельный registry структуры, не смешивая его записи с PropertyState.

В `structureCapabilities.test.ts` проверить точные разрешения и запреты из спецификации, принадлежность дочернего объекта по виду/имени и дельты доступности собственных видов. Coverage-проверка должна перечислять все виды из таблиц «Ограничения структуры расширения» и «Структура заимствованных сервисов».

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/propertyStateRules.test.ts metadata/appliedObjects/configurationExtension/structureCapabilities.test.ts metadata/appliedObjects/__tests__/ownerChildRules.test.ts metadata/importBoundaries.test.ts`

Expected: PASS.

- [ ] **Step 6: Проверить типы и дубли**

Run: `pnpm --filter @nkdk/rules type-check`

Run: `pnpm duplicates -- --base 0d7164c17877172e3e05440bfbc42759e31703d5`

Expected: PASS.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/rules/metadata/appliedObjects packages/rules/metadata/commonObjects packages/rules/metadata/composition/metadataRules.ts
git commit -m "feat: :sparkles: описать матрицу режимов расширения" -m "Повторяющиеся возможности вынесены в профили, а отличия видов расположены рядом с их rules.ts. Центральный слой только собирает декларации."
```

---

### Task 4: XML round-trip обычных режимов и удаление `Контроль`

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/metadataItem/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`

**Interfaces:**
- Consumes: `OperationRegistrySet.propertyStates` и YAML tag metadata.
- Produces: `Notify → !проверять`, многорежимный `Extended → !изменять`, only-extend → обычное значение.
- Produces: `NotSet/Checked` без локального тега; неизвестный state — предметная ошибка импорта.

- [ ] **Step 1: Переписать ожидаемые результаты тестов на новый формат**

Заменить ожидания `Контроль: [...]` на метки конкретных значений. Добавить случаи:

```ts
expect(yamlScalarTagAt(yaml, "Формат")).toBe("проверять")
expect(yamlScalarTagAt(yaml, "ДлинаКода")).toBe("изменять")
expect(yaml).not.toHaveProperty("Контроль")
```

Проверить пустой `Нумератор: !изменять`, ordinary control без тега и only-extend без тега.

- [ ] **Step 2: Запустить тесты и подтвердить падение**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts metadata/ruleRuntime/metadataItem/fromXMLToYAML.test.ts`

Expected: FAIL — текущая реализация продолжает создавать/читать `Контроль`.

- [ ] **Step 3: Реализовать импорт состояния на самом значении**

Для каждого `xr:PropertyState` разрешить `xmlProperty → propertyKey` через реальный item rule и capability registry. Метить уже созданное YAML-значение через `markYAMLScalarTag`; пустое XML-свойство при `Extended` создавать как пустое YAML-значение и метить `изменять`. `NotSet`/`Checked` не создают метки. `Контроль` не создавать ни при каких входах.

- [ ] **Step 4: Реализовать экспорт состояния из YAML-метки**

`exportPropertyStates.ts` обходит свойства в XML-порядке rules.ts, читает `yamlScalarTagAt`, проверяет разрешённость режима и формирует `Notify`/`Extended`. Обычное свойство only-extend получает `Extended`, если платформа требует явный state; если capability помечена `representation: "presence"`, достаточно XML-свойства. Удалить `readControl` и все ветки старого публичного раздела.

При импорте не сравнивать `!проверять` с `cf` и не создавать предупреждение: импорт только сохраняет выбранный режим. При экспорте порядок `xr:PropertyState` определяется `xmlOrder` соответствующего rules.ts, а не порядком YAML. Присутствующее ordinary control не удаляется при совпадении с `cf`; отсутствие borrowed-поля означает снятый режим.

- [ ] **Step 5: Выполнить узкие и интеграционные тесты**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts metadata/ruleRuntime/metadataItem/fromXMLToYAML.test.ts metadata/importFromXml/importConfigurationExtension.integration.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`

Expected: PASS; ни один ожидаемый YAML не содержит `Контроль`.

- [ ] **Step 6: Проверить типы и дубли**

Run: `pnpm --filter @nkdk/rules type-check`

Run: `pnpm duplicates -- --base 0d7164c17877172e3e05440bfbc42759e31703d5`

Expected: PASS.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/rules/metadata/appliedObjects/configurationExtension packages/rules/metadata/ruleRuntime/metadataItem/fromXMLToYAML.test.ts packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts
git commit -m "feat!: :sparkles: перенести PropertyState в YAML-теги" -m "Старый раздел Контроль удалён без миграции. Notify и Extended теперь хранятся непосредственно на значении свойства." -m "BREAKING CHANGE: YAML-поле Контроль больше не поддерживается; используйте !проверять и !изменять."
```

---

### Task 5: Составной тип `MultiState`

**Files:**
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/multiState.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/multiState.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/toJSONSchema.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/toJSONSchema.test.ts`

**Interfaces:**
- Produces: `importMultiStateType(xml): TypeDescriptionYAML[]`.
- Produces: `exportMultiStateType(yaml): { state: "MultiState"; value: ExtendedPropertyXML }`.
- Preserves: пустая контролируемая часть как пустой элемент списка без тега.

- [ ] **Step 1: Добавить падающие проверки четырёх форм MultiState**

Проверить `CheckValue + ExtendValue`, `NotifyValue + ExtendValue`, единственный `ExtendValue` и пустой `CheckValue`. Ожидаемый YAML:

```ts
[
  "Справочник.СправочникПолный",
  tagged("изменять", "Справочник.СправочникРеквизит"),
]
```

Для единственного изменяемого подтипа всё равно ожидать массив из одного элемента.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/multiState.test.ts`

Expected: FAIL — `xr:ExtendedProperty` пока разбирается как обычное описание типа или не разбирается.

- [ ] **Step 3: Реализовать двустороннее преобразование**

Повторно использовать существующие TypeDescription import/export functions для каждого `xr:*Value`; локальный модуль только распределяет части по режимам и ставит/читает YAML-теги. Не добавлять специальные ветки в общий TypeDescription runtime.

- [ ] **Step 4: Расширить JSON Schema только для зарегистрированных multi-свойств**

Схема допускает массив tagged/ordinary частей только когда capability содержит `multi`; обычные `Тип` остаются прежней скалярной схемой. Пустая часть разрешается только как представитель пустого `CheckValue`.

- [ ] **Step 5: Выполнить тесты**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/multiState.test.ts metadata/commonObjects/typeDescription/toJSONSchema.test.ts metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`

Expected: PASS.

- [ ] **Step 6: Проверить типы, дубли и зафиксировать слой**

Run: `pnpm --filter @nkdk/rules type-check`

Run: `pnpm duplicates -- --base 0d7164c17877172e3e05440bfbc42759e31703d5`

```bash
git add packages/rules/metadata/appliedObjects/configurationExtension packages/rules/metadata/commonObjects/typeDescription
git commit -m "feat: :sparkles: поддержать составные режимы типа" -m "MultiState преобразуется в список смысловых подтипов с локальными тегами и восстанавливается как xr:ExtendedProperty."
```

---

### Task 6: Вынесенные свойства и разделы `Проверять`/`Изменять`

**Files:**
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/sections.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/sections.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/selection.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/selection.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/transferExternalFiles.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/transferExternalFiles.test.ts`

**Interfaces:**
- Produces: `readPropertyStateSections(yaml, capability): ReadonlyMap<string, "notify" | "extend">`.
- Produces: `writePropertyStateSection(yaml, externalName, mode)` с порядком `Проверять`, затем `Изменять`.
- Consumes: уже вычисленные `contentHash` базового и расширяемого внешнего файла.

- [ ] **Step 1: Добавить падающие проверки секций**

Проверить:

- `Проверять: [Пакет] → Notify`;
- `Изменять: [МодульОбъекта] → Extended`;
- `Изменять: [Предопределенные]` относится к целому свойству `Predefined`, не изменяя режимы его отдельных элементов;
- дубликат имени в обеих секциях — ошибка;
- одно скалярное свойство нельзя одновременно пометить `!изменять` и перечислить в `Изменять`;
- неизвестное/недопустимое имя — ошибка;
- секции на собственном объекте — ошибка;
- `Изменять: [Пакет]` без `Package.bin` — ошибка.
- наличие `Package.bin` без имени в секциях означает обычный контроль, а отсутствие файла — отсутствие свойства;
- обычный и проверяемый внешний файл без соответствующего базового файла дают ошибку;
- only-extend-вынесенные свойства запрещены в `Проверять`.

- [ ] **Step 2: Запустить тесты и подтвердить падение**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/sections.test.ts metadata/fullSyncToXml/selection.test.ts metadata/fullSyncToXml/transferExternalFiles.test.ts`

Expected: FAIL — секции не зарегистрированы и не влияют на XML/файлы.

- [ ] **Step 3: Реализовать секции на основе capability externalName**

Парсер принимает только массив уникальных строк. Имя должно существовать в capability конкретного item-type и разрешать выбранный режим. Импорт внешнего `Notify/Extended` записывает имя в соответствующую секцию; обычный контроль не создаёт секции.

- [ ] **Step 4: Проверить наличие и хэши внешних файлов**

В full-sync selection передать для контролируемого/проверяемого внешнего свойства ожидаемый hash основной конфигурации. Обычное несовпадение — ошибка; `Проверять` — предупреждение; `Изменять` не сравнивается, но требует локальный файл. Не перечитывать неизменённый базовый файл: сравнивать `contentHash` подтверждённых состояний компонента.

Для `Пакет` сравнение побайтовое по смыслу договора, но выполняется сравнением уже рассчитанных `contentHash`. Для `Изменять` наличие локального файла обязательно даже при пустом содержимом. Секции сериализуются после обычных свойств в каноническом порядке: сначала `Проверять`, затем `Изменять`; внутри сохраняется порядок external properties из capability, а не входной порядок YAML.

- [ ] **Step 5: Выполнить тесты**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/sections.test.ts metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts metadata/fullSyncToXml/selection.test.ts metadata/fullSyncToXml/transferExternalFiles.test.ts`

Expected: PASS.

- [ ] **Step 6: Проверить типы, дубли и зафиксировать слой**

Run: `pnpm --filter @nkdk/rules type-check`

Run: `pnpm duplicates -- --base 0d7164c17877172e3e05440bfbc42759e31703d5`

```bash
git add packages/rules/metadata/appliedObjects/configurationExtension packages/rules/metadata/fullSyncToXml
git commit -m "feat: :sparkles: добавить режимы вынесенных свойств" -m "Проверять и Изменять хранят режим внешнего содержимого, а совпадение контролируемых файлов проверяется по уже рассчитанным contentHash."
```

---

### Task 7: Закрытая overlay-схема заимствованного объекта

**Files:**
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/schema.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/toJSONSchema.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/rules/metadata/validation/schemaRegistry.integration.test.ts`
- Modify: `packages/rules/metadata/validation/projectFileSchema.test.ts`

**Interfaces:**
- Produces: `exportBorrowedPropertyStateSchema({ rule, capability, compatibilityMode })`.
- Produces: tagged scalar schemas через метаданные TypeBox, не через строковые шаблоны значений.
- Consumes: `ConfigurationExtensionStructureRegistry` из Task 3 для закрытия дочерних коллекций и контекстных подсказок.
- Preserves: обычная полная схема для собственных объектов расширения.

- [ ] **Step 1: Добавить падающие schema-проверки**

Проверить для одного файла расширения:

- разрешённое контролируемое поле;
- `!проверять` и `!изменять` только при наличии соответствующих capabilities;
- запрет произвольного свойства обычного объекта;
- запрет `Проверять`/`Изменять` у собственного объекта;
- closed schema для дочернего заимствованного объекта;
- `Состав` общего реквизита с `!изменять` только на списке;
- условный `СоставФункциональнойОпции`: доступен только при булевом типе объекта из `Размещения`;
- запрет `ТипФормы`, `ТипМакета`, вспомогательных форм хранилища настроек и свойств сервисов, которых нет на панели заимствованного объекта;
- `Предопределенные` предлагается как вынесенное свойство целиком, а не как режим каждого элемента;
- подсказки не предлагают запрещённые поля.

- [ ] **Step 2: Запустить тесты и подтвердить падение**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts metadata/validation/schemaRegistry.integration.test.ts metadata/validation/projectFileSchema.test.ts`

Expected: FAIL — `extension-overlay` сейчас только откладывает required-поля и разрешает полную схему объекта.

- [ ] **Step 3: Передать принадлежность и режим совместимости в overlay schema**

`projectValidationPasses.ts` выбирает вариант по component/file context и запрашивает у registry capability. Для корневого объекта принадлежность берётся из project state, для дочернего — из результата сопоставления вида/имени с `cf`. Если статической информации недостаточно, схема строит безопасное пересечение разрешённых полей, а окончательное решение оставляет валидации Task 8.

Контекстный слой схемы использует тот же structure registry для допустимых дочерних коллекций: предлагает собственную подсистему внутри заимствованной и собственный канал сервиса интеграции, но не предлагает запрещённые собственные операции/параметры Web-сервиса, шаблоны/методы HTTP-сервиса, графы журнала, поля планов и регистров. Если принадлежность или базовый тип `Размещения` нельзя установить статически, схема выбирает безопасное пересечение, а не расширяет список полей.

- [ ] **Step 4: Реализовать закрытую схему и схему тегов**

Схема строится из исходных property schemas, но включает только свойства capability. Вариант скаляра разрешает обычное значение, `!проверять`, `!изменять` или массив MultiState согласно mode set. `Проверять`/`Изменять` получают enum допустимых externalName. `additionalProperties: false` сохраняется на каждой границе заимствованной структуры.

- [ ] **Step 5: Выполнить тесты**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts metadata/validation/schemaRegistry.integration.test.ts metadata/validation/projectFileSchema.test.ts`

Expected: PASS.

- [ ] **Step 6: Проверить типы, дубли и зафиксировать слой**

Run: `pnpm --filter @nkdk/runtime type-check`

Run: `pnpm --filter @nkdk/rules type-check`

Run: `pnpm duplicates -- --base 0d7164c17877172e3e05440bfbc42759e31703d5`

```bash
git add packages/runtime/metadata/ruleRuntime/property/toJSONSchema.ts packages/rules/metadata/appliedObjects/configurationExtension packages/rules/metadata/validation
git commit -m "feat: :sparkles: закрыть схему заимствованных объектов" -m "Overlay-схема предлагает только подтверждённые поля и режимы для выбранной версии совместимости. Полная схема собственных объектов сохраняется."
```

---

### Task 8: Полная валидация значений и структуры расширения

**Files:**
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateFacts.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateFacts.test.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateValidation.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateValidation.test.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/structureValidation.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/structureValidation.test.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/historyValidation.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/historyValidation.test.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/rules/metadata/projectState/contracts/fileUpdate.ts`
- Modify: `packages/rules/metadata/projectState/fileUpdate.ts`
- Modify: `packages/rules/metadata/projectState/binary/fragment.ts`
- Modify: `packages/rules/metadata/projectState/binary/typedBuilder.ts`
- Modify: `packages/rules/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/rules/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.ts`
- Modify: `packages/rules/metadata/composition/projectState.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts`

**Interfaces:**
- Produces: компактный `ProjectStateStructuredDocumentEntry` вида `configurationExtensionPropertyStates` с itemType, propertyKey, mode, YAML-path и нормализованным значением.
- Produces: `validateConfigurationExtensionPropertyStates(params): Diagnostic[]`.
- Produces: `validateConfigurationExtensionStructure(params): Diagnostic[]`.
- Produces: `validateConfigurationExtensionHistory(params): Diagnostic[]`.
- Produces: `ConfigurationExtensionHistoryContribution = { itemType, propertyKey, availability: "versioned" | "alwaysForbidden" | "notApplicable", sinceMode? }`.
- Consumes: `ConfigurationExtensionStructureRegistry` из Task 3, `readStructuredDocumentEntries`, owner facts, references и base component `cf` из существующего query port.

- [ ] **Step 1: Добавить падающие проверки извлечения фактов**

Из одного YAML проверить факты для ordinary control, `!проверять`, `!изменять`, секций и MultiState. `!xml` должен помечаться как bypass предметной допустимости, но сохранять общую проверку реестра `!xml`.

- [ ] **Step 2: Добавить падающие проверки межкомпонентной семантики**

Проверить:

- несовпадение ordinary control — error;
- несовпадение `!проверять` — warning;
- `!изменять` может отличаться;
- отсутствующий базовый объект/свойство — error для любого режима;
- ordinary/notify ссылка только на собственный объект расширения — error;
- extend-ссылка на собственный объект — разрешена;
- контролируемый элемент `Состав` общего реквизита должен совпасть с базовым;
- параметры `Использование` и `УсловноеРазделение` контролируемого элемента состава должны совпасть с базовыми;
- отсутствие индекса `cf` — error.

- [ ] **Step 3: Добавить падающие проверки структуры**

Табличным тестом покрыть все запреты спецификации: собственные общие реквизиты, боты, хранилища настроек, языки, WebSocket-клиенты; операции/параметры Web-сервиса; шаблоны/методы HTTP-сервиса; графы журнала; дочерние объекты планов и регистров; перерасчёты; перемещение заимствованной подсистемы в собственную. Отдельно проверить разрешённую собственную подсистему внутри заимствованной и собственный канал сервиса интеграции.

В тех же проверках закрепить закрытые контекстные правила:

- одноимённый собственный дочерний объект не может заменить заимствованный;
- `СоставФункциональнойОпции` запрещён при небулевом типе объекта из `Размещения` и изменяется целиком при булевом;
- `ТипФормы`, `ТипМакета`, вспомогательные формы хранилища настроек и свойства сервисов, отсутствующие на панели, запрещены;
- собственный план обмена с признаком использования в РИБ запрещён;
- metadata, влияющие на структуру данных, запрещены при сочетании `НазначениеРасширенияКонфигурации` и режима работы, для которого платформа не допускает изменение структуры.

- [ ] **Step 4: Добавить падающие проверки отдельной матрицы истории данных**

В `historyValidation.test.ts` проверить границы независимо от доступности самого объекта:

- собственные справочники, документы, бизнес-процессы, задачи и регистры сведений запрещены в истории данных по `Версия8_3_10` включительно и разрешены с `Версия8_3_11`;
- собственные планы видов характеристик и планы счетов запрещены по `Версия8_3_11` включительно и разрешены с `Версия8_3_12`;
- собственные константы, планы обмена и планы видов расчёта запрещены по `Версия8_3_12` включительно и разрешены с `Версия8_3_13`;
- постоянные запреты собственных объектов и полей в истории данных применяются после версионной проверки и не превращаются в дельты PropertyState.

Реестр истории строится sidecar-декларациями `extensionHistory.ts` рядом с конкретными rules.ts, содержащими `dataHistory`: каждая такая декларация явно выбирает `versioned`, `alwaysForbidden` или `notApplicable`. Для `versioned` поле `sinceMode` обязательно, для остальных запрещено. Coverage-тест должен завершаться ошибкой, если новое поддерживаемое `dataHistory`-поле осталось без классификации; нейтральный валидатор не угадывает решение по имени поля.

- [ ] **Step 5: Запустить тесты и подтвердить падение**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/propertyStateFacts.test.ts metadata/appliedObjects/configurationExtension/propertyStateValidation.test.ts metadata/appliedObjects/configurationExtension/structureValidation.test.ts metadata/appliedObjects/configurationExtension/historyValidation.test.ts metadata/validation/projectStateDependencyValidation.test.ts`

Expected: FAIL — project state ещё не хранит факты режимов и не запускает предметные проверки.

- [ ] **Step 6: Сохранить компактные факты в существующей таблице structuredDocuments**

Не добавлять новую таблицу бинарного project state. Использовать существующий `ProjectStateStructuredDocumentEntry`: `documentKind` различает факты PropertyState/структуры, `logicalAddress` связывает расширение с `cf`, `yamlPath` даёт точную диагностику, `payload` содержит компактный версионированный JSON только нужных полей. Обновить бинарные тесты round-trip записи/чтения.

- [ ] **Step 7: Реализовать предметные валидаторы**

Валидаторы живут в `configurationExtension/*Validation.ts` и регистрируются в `composition/projectState.ts`. Нейтральный `projectStateDependencyValidation.ts` только вызывает переданные validators. Сопоставление дочерних объектов выполняется по виду и имени внутри уже сопоставленного владельца; одноимённый собственный объект не может затенить базовый. Матрица истории данных, запрет РИБ и ограничения назначения расширения используют локальные `ConfigurationExtensionStructureContribution`/`ConfigurationExtensionHistoryContribution` и не расширяют `PropertyStateCapabilityContribution`.

- [ ] **Step 8: Реализовать подтверждённые версионные ограничения**

Использовать только дельты Task 2. Добавить проверки всех точных границ, перечисленных в Task 2, доступности собственных видов/дочерних объектов и `ДлинаНомераСтроки === 5` для собственных табличных частей при режиме не выше `Версия8_3_26`. Неподтверждённые нижние границы 8.3.20–8.3.26 не угадывать и не включать. `DontUse` и отсутствующее поле используют 8.3.27; `РежимСовместимости` основной конфигурации игнорируется при выборе матрицы расширения.

- [ ] **Step 9: Закрепить существующую XML-политику произвольной ссылки**

Расширить тест `packages/rules/metadata/appliedObjects/configurationExtension/typeDescriptionPolicy.test.ts`: до `Версия8_3_22` включительно ожидается `AnyRef`, начиная с `Версия8_3_23`, при `НеИспользовать` и при отсутствии поля — `AnyIBRef`. Production-код меняется только если тест выявит расхождение; версия платформы и режим основной конфигурации не передаются в эту политику.

- [ ] **Step 10: Выполнить тесты**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/propertyStateFacts.test.ts metadata/appliedObjects/configurationExtension/propertyStateValidation.test.ts metadata/appliedObjects/configurationExtension/structureValidation.test.ts metadata/appliedObjects/configurationExtension/historyValidation.test.ts metadata/appliedObjects/configurationExtension/typeDescriptionPolicy.test.ts metadata/validation/projectStateDependencyValidation.test.ts metadata/projectState/binary/fragment.test.ts metadata/projectState/binary/readSession.test.ts`

Expected: PASS.

- [ ] **Step 11: Проверить типы, дубли и зафиксировать слой**

Run: `pnpm --filter @nkdk/rules type-check`

Run: `pnpm duplicates -- --base 0d7164c17877172e3e05440bfbc42759e31703d5`

```bash
git add packages/rules/metadata/appliedObjects/configurationExtension packages/rules/metadata/validation packages/rules/metadata/projectState packages/rules/metadata/composition/projectState.ts
git commit -m "feat: :sparkles: проверять режимы и структуру расширения" -m "Полная проверка проекта сопоставляет расширение с основной конфигурацией, различает ошибки контроля и предупреждения проверки и применяет подтверждённые структурные запреты."
```

---

### Task 9: Исключительный `!xml` и ошибки неизвестного состояния

**Files:**
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/explicitXMLState.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/explicitXMLState.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/operationRules.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`
- Modify: `packages/rules/metadata/validation/schemaRegistry.integration.test.ts`

**Interfaces:**
- Produces: зарегистрированный carrier `configurationExtensionPropertyStateXML`.
- Payload: каноническая строка `!xml <base64url(JSON)>`, где JSON равен `{ version: 1, propertyXML, propertyStateXML }` и содержит только исходное XML-свойство и соответствующий `xr:PropertyState`.
- Produces: неизвестный `xr:State` → ошибка импорта до записи YAML.

- [ ] **Step 1: Добавить падающие проверки исключения**

Проверить известный `Extended` у свойства, которому capability разрешает только control: импорт создаёт зарегистрированный `!xml`, экспорт побайтово восстанавливает нормализованные XML-объекты свойства и state. Ручной payload проходит тот же путь. Повреждённая версия/payload и незарегистрированное свойство дают ошибку.

Добавить отдельную проверку, что импортированный и написанный вручную carrier проходят одинаковую общую валидацию структуры `!xml`, но оба обходят только предметную проверку допустимости сохранённого PropertyState. Carrier не записывается в снимок.

- [ ] **Step 2: Добавить падающую проверку неизвестного `xr:State`**

Для `FutureState` ожидать ошибку импорта с item-type, XML-именем свойства и значением state. YAML-файл при этом не должен быть опубликован как успешный.

- [ ] **Step 3: Запустить тесты и подтвердить падение**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/explicitXMLState.test.ts metadata/appliedObjects/configurationExtension/propertyStates.test.ts`

Expected: FAIL — текущий импорт молча пропускает неизвестные состояния и не переносит sibling PropertyState через `!xml`.

- [ ] **Step 4: Реализовать узкий carrier через существующий explicitXML registry**

Carrier регистрируется только для metadata properties, для которых импорт реально встретил известный недопустимый режим. Он не становится общим разрешением `!xml` для всех PropertyState. При экспорте payload восстанавливается до запуска обычной интерпретации capability; предметная проверка режима пропускается, общая проверка формата/регистрации остаётся.

- [ ] **Step 5: Выполнить тесты**

Run: `pnpm --filter @nkdk/rules test -- metadata/appliedObjects/configurationExtension/explicitXMLState.test.ts metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts metadata/validation/schemaRegistry.integration.test.ts`

Expected: PASS.

- [ ] **Step 6: Проверить типы, дубли и зафиксировать слой**

Run: `pnpm --filter @nkdk/rules type-check`

Run: `pnpm duplicates -- --base 0d7164c17877172e3e05440bfbc42759e31703d5`

```bash
git add packages/rules/metadata/appliedObjects/configurationExtension packages/rules/metadata/composition/metadataRules.ts packages/rules/metadata/validation/schemaRegistry.integration.test.ts
git commit -m "feat: :sparkles: сохранить недопустимый PropertyState через xml" -m "Известное состояние вне матрицы переносится зарегистрированным точным payload. Неизвестное значение xr:State остаётся ошибкой импорта."
```

---

### Task 10: Публичный round-trip и итоговая проверка

**Files:**
- Modify: `packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/worker.integration.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/syncConfiguration.test.ts`
- Modify: `packages/rules/metadata/validation/projectFiles.integration.test.ts`
- Modify: `e2e/metadata-project.test.ts`
- Modify: `docs/superpowers/specs/2026-08-12-configuration-extension-property-states-design.md` только если реализация выявила подтверждённое расхождение с договором; иначе не изменять.

**Interfaces:**
- Consumes: все предыдущие слои.
- Produces: публичный XML → YAML → XML договор расширения без данных PropertyState в снимке.

- [ ] **Step 1: Добавить один интеграционный сценарий полного договора**

Создать временную основную конфигурацию и расширение из строк/копий неизменяемых фикстур. Сценарий должен содержать ordinary control, `!проверять`, `!изменять`, пустой `!изменять`, only-extend, MultiState, вынесенный модуль и `Пакет`. Проверить канонический YAML и `xr:PropertyState` результата.

Дополнительно включить `Состав` общего реквизита, условный `СоставФункциональнойОпции`, `Изменять: [Предопределенные]`, общую и объектную команды, критерий отбора и служебные XML-копии формы/макета. Проверить, что служебные `ТипФормы`/`ТипМакета` не появляются в YAML, дочерний `Template.xml` остаётся непрозрачным внешним файлом, а режимы отдельных предопределённых элементов не смешиваются с режимом свойства `Predefined` целиком.

- [ ] **Step 2: Добавить сценарий полной валидации**

В одном полном запуске проверить error обычного несовпадения, warning `!проверять`, структурный запрет и успешное изменяемое значение. Отдельного режима частичной валидации не создавать.

В таблицу интеграционных диагностик включить: неизвестный локальный тег, режим на собственном свойстве, недоступное borrowed-поле, конфликт секций, конфликт `!изменять`/`Изменять`, отсутствующий базовый объект/файл, недопустимую ссылку, запрет истории данных, РИБ и `ДлинаНомераСтроки` на границе 8.3.26/8.3.27. Для warning проверить успешный код завершения полной валидации.

- [ ] **Step 3: Проверить, что снимок остаётся тонким**

В импортном тесте проверить отсутствие PropertyState-полей и старых специальных `xml.extended` для скалярных/вынесенных режимов. В снимке остаются только уже согласованные идентификаторы и прочие данные вне этой спецификации.

- [ ] **Step 4: Запустить целевые интеграционные тесты**

Run: `pnpm --filter @nkdk/rules test -- metadata/importFromXml/importConfigurationExtension.integration.test.ts metadata/fullSyncToXml/worker.integration.test.ts metadata/fullSyncToXml/syncConfiguration.test.ts metadata/validation/projectFiles.integration.test.ts`

Run: `pnpm exec vitest run e2e/metadata-project.test.ts`

Expected: PASS; итоговый YAML не содержит `Контроль`, а XML сохраняет все подтверждённые режимы.

- [ ] **Step 5: Выполнить обязательные проверки проекта**

Run: `pnpm type-check`

Run: `pnpm test`

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Run: `pnpm duplicates -- --base 0d7164c17877172e3e05440bfbc42759e31703d5`

Expected: все команды завершаются с кодом 0.

- [ ] **Step 6: Проверить границы изменений**

Run: `git diff --check`

Run: `git status --short`

Expected: нет изменений существующих XML-фикстур, созданных реализацией; пользовательские изменения в `e2e/fixtures/xml/cfe/all-extension` не включаются в коммит.

- [ ] **Step 7: Зафиксировать интеграционный слой**

```bash
git add packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts packages/rules/metadata/fullSyncToXml/worker.integration.test.ts packages/rules/metadata/fullSyncToXml/syncConfiguration.test.ts packages/rules/metadata/validation/projectFiles.integration.test.ts e2e/metadata-project.test.ts
git commit -m "test: :white_check_mark: закрепить round-trip PropertyState" -m "Интеграционные проверки покрывают канонический YAML, XML-восстановление, полную валидацию и отсутствие режимов свойств в снимке."
```

---

## Итоговый состав тестов

| Вид проверки | Уникальный договор |
|---|---|
| Runtime YAML unit | Кириллические теги и пустые/вложенные значения не меняют смысловой тип |
| Capability registry unit | Профили, отличия item-type и подтверждённые дельты дают одну итоговую матрицу |
| Matrix coverage unit | Все свойства спеки сопоставлены с реальными ключами rules.ts |
| XML augmenter unit | `Notify`, `Extended`, ordinary и presence-only корректно преобразуются в обе стороны |
| MultiState unit | Части типа и их режимы не смешиваются и восстанавливают `xr:ExtendedProperty` |
| External sections unit | `Проверять`/`Изменять` валидируют имена, конфликты, наличие и hash внешнего файла |
| Schema integration | Заимствованный overlay закрыт, собственный объект сохраняет полную схему |
| Project-state validation | Сравнение с `cf`, ссылки, предупреждения и структурные ограничения выполняются на полном проекте |
| Explicit XML unit | Только зарегистрированное известное недопустимое состояние проходит без интерпретации |
| Public import/sync/e2e | Канонический YAML и итоговый XML проходят полный пользовательский путь без PropertyState в снимке |
