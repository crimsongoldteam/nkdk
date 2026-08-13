# Extension Exact XML Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Обеспечить точный XML round-trip поддержанных расширений с тонким снимком: обязательная структура и вычислимые значения восстанавливаются правилами, изменённые свойства — из YAML, идентификаторы — из индекса конфигурации.

**Architecture:** Формат LMDB и общие типы `PropertyRule` не меняются. Профиль полной синхронизации назначает каждому объекту явный режим `full` или `adopted`; предметный реестр `PropertyState` остаётся единственным источником допустимых режимов и порядка. Импорт и экспорт расширений используют один реестр симметрично, а неподдержанное состояние завершается ошибкой.

**Tech Stack:** TypeScript, Vitest, `@sinclair/typebox`, YAML-теги NKDK, LMDB configuration index.

## Global Constraints

- Не изменять XML-фикстуры и не добавлять двоичные снимки в репозиторий.
- Не менять формат LMDB, `BasePropertyRule`, `PropertyRule` и параметры построителей правил.
- Не добавлять новые применения `!xml`; сохранить только уже согласованные предметные случаи, включая пустой `RowFilter` и `AdditionalFields`.
- Не переносить обычное XML-состояние обратно в снимок.
- Не менять договор `BaseForm`: существующая базовая форма сохраняется, отсутствующая не создаётся.
- Сохранять точное побайтовое равенство XML для поддержанного входа; неизвестные `PropertyState` и запрещённые режимы считать ошибкой импорта.
- Выполнять задачи в указанном порядке. После каждого слоя запускать указанные тесты и `pnpm duplicates -- --base a523b93ef`.
- Существующие незакоммиченные изменения в worktree не относятся к плану; не включать их в коммиты задач.

---

## Карта файлов и обязанностей

| Область | Основные файлы | Обязанность |
| --- | --- | --- |
| Профиль расширения | `packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.ts` | Выбрать `full` для собственных и `adopted` для заимствованных объектов; получить UUID основной конфигурации. |
| Импорт состояний | `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts` | Проверить состояние по реестру, сохранить режим и явное значение в YAML. |
| Экспорт состояний | `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts` | Восстановить служебные свойства, значения и упорядоченный `PropertyState`. |
| Реестр | `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateRules.ts`, `propertyStateCapabilities.ts` и предметные `propertyStates.ts` | Описать допустимые свойства, режимы, представление и порядок. |
| Схема YAML | `packages/rules/metadata/ruleRuntime/property/propertyStateSchema.ts` | Разрешить только предметные значения и теги, включая очищенные ссылки. |
| Обязательные XML-default | файлы из приложения А, `packages/rules/metadata/commonObjects/internalInfo/toXML.ts` | Восстановить только явно подтверждённые значения профиля `adopted`. |
| Формы | `packages/rules/metadata/forms/clientApplicationForm/rules.ts` | Всегда вывести `Attributes` у существующих `Form` и `BaseForm`. |
| MultiState | `packages/rules/metadata/appliedObjects/configurationExtension/multiState.ts` | Сохранить порядок групп по первому появлению в YAML. |
| Регистр бухгалтерии | `packages/rules/metadata/appliedObjects/metadataAccountingRegister/rules.ts`, `packages/rules/metadata/commonObjects/metadataRegisterField/accountingProperties.ts` | Канонический состав стандартных реквизитов и обязательный `Balance`. |

---

### Task 1: Явно разделить собственные и заимствованные объекты

**Files:**
- Modify: `packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.test.ts`

- [ ] **Step 1: Добавить RED-тесты профиля**

Добавить два объекта под корнем расширения: адрес, присутствующий в индексе основной конфигурации, должен получить `adopted`; отсутствующий в основной конфигурации — `full`. Отдельно проверить заимствованную форму.

```ts
expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toMatchObject({
  Конфигурация: "adopted",
  "Документ.Заимствованный": "adopted",
  "КаналСервисаИнтеграции.Собственный": "full",
})
```

- [ ] **Step 2: Подтвердить падение**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/fullSyncToXml/profiles/configurationExtension.test.ts
```

Expected: собственный вложенный объект наследует `adopted` от `Конфигурация`.

- [ ] **Step 3: Построить полную таблицу вариантов**

В `confirmConfigurationExtensionFullXmlSync` создать запись для каждого логического адреса цели, а не только для `adoptedUuids`:

```ts
const xmlDefaultVariantByLogicalAddress = Object.fromEntries(
  [...targetAddresses].map((logicalAddress) => {
    const workerAddress = formatCanonicalMetadataTargetToYAML(logicalAddress) ?? logicalAddress
    return [workerAddress, logicalAddress === "Конфигурация" || baseAddresses.has(logicalAddress)
      ? "adopted"
      : "full"] as const
  }),
)
for (const { logicalAddress } of borrowedForms) {
  xmlDefaultVariantByLogicalAddress[logicalAddress] = "adopted"
}
```

Передать полученную таблицу в `workerProfile`. Логику `adoptedUuids` не менять: она остаётся поиском идентификатора основной конфигурации, а не признаком включённого флажка.

- [ ] **Step 4: Получить GREEN и проверить дублирование**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/fullSyncToXml/profiles/configurationExtension.test.ts
pnpm duplicates -- --base a523b93ef
```

- [ ] **Step 5: Commit**

```bash
git add packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.ts packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.test.ts
git commit -m "fix(rules): :bug: разделить профили объектов расширения"
```

---

### Task 2: Представить флажок «Объект расширяемой конфигурации»

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.test.ts`

- [ ] **Step 1: Добавить RED-тесты трёх состояний**

Проверить полный путь:

```yaml
# XML-элемент есть, Notify отсутствует
# YAML-поля нет

ОбъектРасширяемойКонфигурации: Ложь

ОбъектРасширяемойКонфигурации: !проверять
```

Ожидания: отсутствие YAML-поля выводит UUID основной конфигурации; `Ложь` не выводит `ExtendedConfigurationObject`; `!проверять` выводит UUID и `PropertyState=Notify`. Добавить отрицательные тесты для `Истина`, строкового UUID в YAML и отсутствующего UUID основной конфигурации.

- [ ] **Step 2: Подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts metadata/fullSyncToXml/profiles/configurationExtension.test.ts
```

Expected: импорт не различает снятый флажок, экспорт всегда создаёт элемент при найденном UUID, схема ожидает строку.

- [ ] **Step 3: Реализовать симметричный договор**

На импорте для заимствованного объекта записывать `false`, только когда `ObjectBelonging=Adopted`, а `ExtendedConfigurationObject` отсутствует. Существующий `Notify` оставлять пустой tagged-меткой.

На экспорте вычислять:

```ts
const extensionObject = yaml[EXTENDED_CONFIGURATION_OBJECT_YAML]
const enabled = extensionObject !== false
const notify = yamlScalarTagAt(yaml, EXTENDED_CONFIGURATION_OBJECT_YAML) === "проверять"
if (enabled) {
  if (adoptedUuid === undefined) throw new Error(`Не найден UUID основной конфигурации: ${logicalAddress}`)
  writeServiceProperty(outputs, rule, "extendedConfigurationObject", "ExtendedConfigurationObject", adoptedUuid)
}
if (notify) states.push(propertyState("ExtendedConfigurationObject", "Notify"))
```

Схема поля должна принимать только `Ложь` без тега либо пустое значение с `!проверять`. UUID остаётся только в индексе основной конфигурации.

- [ ] **Step 4: Получить GREEN и проверить дублирование**

Run те же тесты, затем:

```bash
pnpm duplicates -- --base a523b93ef
```

- [ ] **Step 5: Commit**

```bash
git add packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.test.ts
git commit -m "feat(rules): :sparkles: сохранить состояние флажка расширения"
```

---

### Task 3: Восстановить обязательную структуру и подтверждённые XML-default

**Files:**
- Modify: `packages/rules/metadata/commonObjects/internalInfo/toXML.ts`
- Modify: `packages/rules/metadata/commonObjects/internalInfo/fromXML.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseForm.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/rules.test.ts`
- Modify: файлы `rules.ts` из приложения А

- [ ] **Step 1: Добавить RED-тесты обязательной структуры**

Проверить:

- правило `internalInfo` без вычисленных UUID возвращает `{}`, а не `undefined`;
- пустой внешний `Form` и существующий `BaseForm` содержат `Attributes: {}`;
- отсутствие `BaseForm` не создаёт новую базовую форму;
- объект с поддерживаемым `comment` в профиле `adopted` получает `Comment: ""`;
- обычный неподтверждённый `defaultValueXML` в `adopted` по-прежнему подавляется;
- собственный объект профиля `full` получает обычные значения по умолчанию.

- [ ] **Step 2: Подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/commonObjects/internalInfo/fromXML.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/forms/clientApplicationForm/baseForm.test.ts metadata/ruleRuntime/property/fromYAMLToXML.test.ts metadata/appliedObjects/configurationExtension/rules.test.ts
```

- [ ] **Step 3: Сделать `InternalInfo` обязательным по наличию правила**

В `internalInfo/toXML.ts` возвращать накопленный объект без удаления пустого результата:

```ts
return result
```

Не хранить признак присутствия в YAML или снимке.

- [ ] **Step 4: Объявить обязательный `Attributes`**

В правиле `attributes` добавить существующий договор:

```ts
defaultValueXMLEmpty: [],
defaultValueAdoptedXML: [],
```

Убедиться, что это применяется к существующему `BaseForm`, но не материализует отсутствующий `BaseForm`.

- [ ] **Step 5: Материализовать только предметно подтверждённые defaults**

Для `comment` скопировать существующее пустое XML-значение в `defaultValueAdoptedXML`. Для корня `MetadataConfigurationExtension` сделать то же для уже согласованных полей: `comment`, `configurationExtensionCompatibilityMode`, `usePurposes`, `scriptVariant`, `defaultRoles`, `vendor`, `version`, `briefInformation`, `detailedInformation`, `copyright`, `vendorInformationAddress`, `configurationInformationAddress`.

В общем исполнителе разрешить обычный `defaultValueXML` в `adopted` только при истинном существующем предметном условии `toXML` для отсутствующего YAML:

```ts
const subjectRequiresXML = typeof rule.toXML === "function" && rule.toXML(source, context)
if (variant === "adopted" && subjectRequiresXML) return resolveOrdinaryXMLDefault(rule, context)
```

Для этого передать существующий `YAMLPropertySource` из `convertPropertiesFromYAMLToXML` в `hasExplicitXMLDefault` и `resolveXMLDefault`; вызовы из `callAtomicToXML` используют уже имеющийся `source`. Безусловный `defaultValueXML` не переносить в `adopted`. Это восстанавливает зарегистрированные defaults формы и элементов по их виду без нового поля в `PropertyRule`.

- [ ] **Step 6: Получить GREEN и проверить дублирование**

Run тесты шага 2, затем:

```bash
pnpm duplicates -- --base a523b93ef
```

- [ ] **Step 7: Commit**

Добавить только изменённые файлы этой задачи и выполнить:

```bash
git commit -m "fix(rules): :bug: восстановить обязательный XML расширений"
```

---

### Task 4: Сохранить присутствие изменённых `plain`-свойств

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateCapabilities.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCatalog/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateRules.test.ts`

- [ ] **Step 1: Добавить RED-матрицу естественных пустых значений**

Покрыть импорт и повторный экспорт:

```yaml
Синоним: ""
ОсновнаяФормаСписка: ""
ПредставлениеОбъекта: ""
Владельцы: []
Содержимое: []
```

Для каждого случая проверить: XML-элемент присутствует — YAML-ключ присутствует; XML-элемент отсутствует — YAML-ключ отсутствует; явное пустое значение повторно создаёт элемент. Добавить непустой вариант хотя бы для ссылки на форму и списка владельцев.

- [ ] **Step 2: Подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts metadata/appliedObjects/configurationExtension/propertyStateRules.test.ts
```

- [ ] **Step 3: Расширить предметный реестр**

В `definePropertyStateItemCapabilities` добавить предметный список ключей основных форм, обычных и расширенных представлений, `owners`, `content` и `explanation`. При построении конкретной регистрации автоматически добавлять `plain/extend` только для ключа, реально существующего в `rule.properties`; затем применять явные `options.properties`, чтобы предметные исключения продолжали иметь приоритет:

```ts
const STANDARD_PLAIN_KEYS = [
  "defaultObjectForm", "defaultFolderForm", "defaultListForm", "defaultChoiceForm",
  "defaultFolderChoiceForm", "defaultRecordForm", "defaultSettingsForm", "defaultVariantForm",
  "objectPresentation", "extendedObjectPresentation", "listPresentation",
  "extendedListPresentation", "owners", "content", "explanation",
] as const

for (const propertyKey of STANDARD_PLAIN_KEYS) {
  if (rule.properties[propertyKey] !== undefined) Object.assign(modules, extended(propertyKey))
}
Object.assign(modules, options.properties)
```

Для `MetadataCatalog` удалить `owners` из явного `controlled(...)`, чтобы сработал единый договор `plain/extend`. Явные `externalProperty(...)` для внешних разделов, например состава плана обмена, остаются приоритетнее автоматического plain-представления. Не регистрировать ключи, которых нет в правиле типа.

- [ ] **Step 4: Импортировать `plain` по факту присутствия XML**

После обработки явных `PropertyState` пройти свойства `itemCapability.properties` в порядке реестра и для каждого свойства с:

```ts
capability.availability === "borrowed" &&
capability.representation === "plain" &&
capability.modes.length === 1 &&
capability.modes[0] === "extend"
```

проверить наличие собственного XML-ключа по `xmlParents`. При наличии вызвать `ensurePropertyYamlValue(..., preserveImplicitValue: true)`. Проверять наличие ключа через `hasOwnProperty`, а не истинность значения. Резервное значение выбирать по типу предметного правила: строка `""`, коллекция `[]`, объект `{}`; `null` здесь не использовать.

- [ ] **Step 5: Получить GREEN и проверить дублирование**

Run тесты шага 2, затем:

```bash
pnpm duplicates -- --base a523b93ef
```

- [ ] **Step 6: Commit**

```bash
git add packages/rules/metadata/appliedObjects/configurationExtension/propertyStateCapabilities.ts packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts packages/rules/metadata/appliedObjects/configurationExtension/propertyStateRules.test.ts packages/rules/metadata/appliedObjects/metadataCatalog/propertyStates.ts
git commit -m "feat(rules): :sparkles: сохранить изменённые пустые свойства"
```

Перед `git commit` проверить `git diff --cached --name-only` и убрать из индекса файлы вне этой задачи.

---

### Task 5: Ввести строгий симметричный договор `PropertyState`

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateRules.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/propertyStateSchema.ts`
- Delete: `packages/rules/metadata/appliedObjects/configurationExtension/explicitXMLState.ts`
- Delete: `packages/rules/metadata/appliedObjects/configurationExtension/explicitXMLState.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateRules.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataChartOfAccounts/propertyStates.ts`

- [ ] **Step 1: Добавить RED-тесты строгой проверки**

Проверить ошибки импорта для неизвестного свойства, неизвестного состояния, `Notify`/`Extended`/`MultiState`, не разрешённого реестром, а также для прежних `Checked` и `NotSet`. Проверить, что ни один такой случай не создаёт `!xml configurationExtensionPropertyStateXML`.

Добавить положительную матрицу плана счетов:

| Ключ | Режимы |
| --- | --- |
| `codeLength` | control, notify, extend |
| `descriptionLength` | control, notify, extend |
| `extDimensionTypes` | control, notify |
| `orderLength` | control, notify |
| `maxExtDimensionCount` | control, notify |

Явные `9` и `25`, в том числе равные `implicitValueYAML`, должны сохраняться с `!проверять` и `!изменять`.

- [ ] **Step 2: Добавить RED-тест порядка**

Для таблицы внешнего источника потребовать точную последовательность:

```ts
expect(propertyNames(result)).toEqual([
  "NameInDataSource",
  "KeyFields",
  "RecordSetModule",
  "ManagerModule",
  "ReadOnly",
])
```

Для типа с модулями проверить `ObjectModule` перед `ManagerModule` независимо от порядка YAML.

- [ ] **Step 3: Подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts metadata/appliedObjects/configurationExtension/propertyStateRules.test.ts metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts
```

- [ ] **Step 4: Проверять каждую запись реестром**

В импорте сначала разрешать XML-имя в `propertyKey`, затем получать `registry.resolve({ itemType, propertyKey, compatibilityMode })`, преобразовывать XML-состояние в режим и проверять `capability.modes`. Только после успешной проверки выполнять `plain`, `tagged`, `multi` или `section`. Для неизвестного или запрещённого сочетания выбрасывать ошибку с `itemType`, XML-свойством и состоянием.

```ts
const modeByState = {
  Notify: "notify",
  Extended: "extend",
  MultiState: "multi",
} as const
```

`Checked`, `NotSet` и прочие значения не пропускать.

- [ ] **Step 5: Удалить служебный carrier**

Удалить `explicitXMLState.ts`, его тест, импорты `encode/decodeExplicitXMLPropertyState`, `confirmedUnsupportedPropertyStateXMLCarriers()` и `propertyStateXMLCarriers()`. В схеме для поддержанного предметного `!xml` использовать исходную схему свойства из `explicitXMLProperties`, а не строку carrier. Общий режим `xml` для уже согласованных предметных значений не удалять.

- [ ] **Step 6: Упорядочить единый список состояний**

Сначала собрать все состояния в `Map<propertyKey, PropertyState[]>`, включая `tagged`, `multi`, `section` и служебный флажок, затем вывести их проходом по `Object.keys(itemCapability.properties)`. Не обходить сначала `rule.properties`, а затем разделы. Отсутствие ключа состояния в реестре считать ошибкой экспорта.

- [ ] **Step 7: Обновить план счетов**

В `metadataChartOfAccounts/propertyStates.ts` объявить `allPropertyStateModes("codeLength", "descriptionLength")` и `controlled("extDimensionTypes", "orderLength", "maxExtDimensionCount")` в платформенном порядке. Новых правил числовых значений не создавать.

- [ ] **Step 8: Получить GREEN и проверить дублирование**

Run тесты шага 3, затем:

```bash
pnpm duplicates -- --base a523b93ef
```

- [ ] **Step 9: Commit**

```bash
git add packages/rules/metadata/appliedObjects/configurationExtension packages/rules/metadata/appliedObjects/metadataChartOfAccounts/propertyStates.ts packages/rules/metadata/ruleRuntime/property/propertyStateSchema.ts
git commit -m "refactor(rules): :recycle: сделать PropertyState строгим и упорядоченным"
```

---

### Task 6: Представить очищенную ссылку без `!xml`

**Files:**
- Modify: `packages/rules/metadata/commonObjects/metadataTaskAddressingAttribute/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/propertyStateSchema.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataTaskAddressingAttribute/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts`

- [ ] **Step 1: Добавить RED-тесты трёх режимов ссылки**

```yaml
ИзмерениеАдресации:
ИзмерениеАдресации: !проверять
ИзмерениеАдресации: !изменять
```

Проверить round-trip пустого `AddressingDimension`, непустой ссылки и отсутствие ключа. Добавить отрицательные тесты: `null` запрещён обычной строке, коллекции и объекту.

- [ ] **Step 2: Подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/commonObjects/metadataTaskAddressingAttribute/fromXMLToYAML.test.ts metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts
```

- [ ] **Step 3: Объявить предметный тип ссылки**

Дополнить существующее правило `addressingDimension` существующим `metadataTarget`:

```ts
metadataTarget: {
  kind: "member",
  owner: "explicit",
  roots: ["InformationRegister"],
  memberKinds: ["Dimension"],
},
```

В схеме добавлять `Type.Null()` только когда у правила есть `metadataTarget`. При импорте явно присутствующую пустую XML-ссылку преобразовывать в `null`; при экспорте `null` преобразовывать в пустой XML-элемент. Пустая tagged-метка продолжает храниться внутренним пустым объектом YAML-модели и сериализуется без скаляра.

- [ ] **Step 4: Получить GREEN и проверить дублирование**

Run тесты шага 2, затем:

```bash
pnpm duplicates -- --base a523b93ef
```

- [ ] **Step 5: Commit**

```bash
git add packages/rules/metadata/commonObjects/metadataTaskAddressingAttribute packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts packages/rules/metadata/ruleRuntime/property/propertyStateSchema.ts packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts
git commit -m "feat(rules): :sparkles: сохранить очищенные ссылки расширения"
```

---

### Task 7: Сохранить порядок групп `MultiState`

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/multiState.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/multiState.test.ts`

- [ ] **Step 1: Добавить RED-тесты порядка первого появления**

Проверить `ExtendValue → NotifyValue`, `CheckValue → ExtendValue` и одиночный `ExtendValue`. Внутри одной группы сохранить порядок YAML-элементов.

- [ ] **Step 2: Подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/appliedObjects/configurationExtension/multiState.test.ts
```

- [ ] **Step 3: Выводить группы в порядке `Map`**

Оставить список допустимых групп только для проверки, а экспорт заменить на проход по карте, заполненной в порядке YAML:

```ts
for (const [group, parts] of values) {
  result[group] = exportTypeDescription(parts)
}
```

- [ ] **Step 4: Получить GREEN, проверить дублирование и commit**

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/appliedObjects/configurationExtension/multiState.test.ts
pnpm duplicates -- --base a523b93ef
git add packages/rules/metadata/appliedObjects/configurationExtension/multiState.ts packages/rules/metadata/appliedObjects/configurationExtension/multiState.test.ts
git commit -m "fix(rules): :bug: сохранить порядок групп MultiState"
```

---

### Task 8: Восстановить стандартные реквизиты и `Balance` регистра бухгалтерии

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/metadataAccountingRegister/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataRegisterField/accountingProperties.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataRegisterDimension/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataRegisterResource/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts`

- [ ] **Step 1: Добавить RED-тесты стандартных реквизитов**

Проверить точные списки:

- `periodAdjustmentLength = 0`: нет `PeriodAdjustment`;
- ненулевое значение: `PeriodAdjustment` присутствует;
- `RecordType` расположен сразу после `Account`;
- явно заданные YAML-значения стандартных реквизитов не заменяются каноническими.

- [ ] **Step 2: Добавить RED-тесты `Balance`**

Для измерения и ресурса регистра бухгалтерии проверить обязательные `<Balance>true</Balance>` и `<Balance>false</Balance>` в `full` и `adopted`. Проверить `Балансовый: !проверять Истина` и `Ложь`; `!изменять` должен отклоняться.

- [ ] **Step 3: Подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts metadata/commonObjects/metadataRegisterDimension/fromYAMLToXML.test.ts metadata/commonObjects/metadataRegisterResource/fromYAMLToXML.test.ts metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts
```

- [ ] **Step 4: Сделать список стандартных реквизитов зависимым от YAML**

В `MetadataAccountingRegisterStandardAttributeNamesXML(source)` исключать `PeriodAdjustment`, если `Number(source.raw("periodAdjustmentLength") ?? 0) === 0`, и включить `RecordType` непосредственно после `Account`. Существующий механизм переопределений YAML оставить источником явных значений.

- [ ] **Step 5: Сделать `Balance` обязательным в `adopted`**

В `registerFieldBalanceProperty` добавить:

```ts
defaultValueXML: true,
defaultValueAdoptedXML: true,
implicitValueYAML: true,
```

Не расширять режимы реестра: для измерения и ресурса остаются только `control` и `notify`.

- [ ] **Step 6: Получить GREEN и проверить дублирование**

Run тесты шага 3, затем:

```bash
pnpm duplicates -- --base a523b93ef
```

- [ ] **Step 7: Commit**

```bash
git add packages/rules/metadata/appliedObjects/metadataAccountingRegister packages/rules/metadata/commonObjects/standardAttributeDescription packages/rules/metadata/commonObjects/metadataRegisterField/accountingProperties.ts packages/rules/metadata/commonObjects/metadataRegisterDimension packages/rules/metadata/commonObjects/metadataRegisterResource packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts
git commit -m "fix(rules): :bug: восстановить свойства регистра бухгалтерии"
```

---

### Task 9: Подтвердить весь договор первой спецификации

**Files:**
- Modify only if a missing cross-layer contract is proven by a RED test.
- Do not modify: `e2e/fixtures/xml/**`, `e2e/fixtures/nkdk/**/.nkdk/**`, LMDB snapshot format.

- [ ] **Step 1: Запустить целевые тесты исходного плана**

Повторно проверить обязательные одиночные элементы форм, назначение ID, области уникальности, запись нового ID в снимок, `InternalInfo`, `Comment`, `Attributes`, `AdditionalFields` и неизменность `BaseForm`. В тот же прогон включить существующие проверки пустого `RowFilter: !xml`, отсутствующего `FillValue` в `adopted`, вычисляемого `TypeSet`, корневого `Synonym`, явного `SkipOnInput=false` и отсутствующих корневых `CompatibilityMode`, `ModalityUseMode`, `SynchronousPlatformExtensionAndAddInCallUseMode`.

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/forms/clientApplicationForm metadata/commonObjects/internalInfo metadata/configurationIndex metadata/importFromXml metadata/fullSyncToXml
```

Expected: PASS. Если тест падает, сначала зафиксировать минимальный RED на предметном пути; не менять XML-фикстуру.

- [ ] **Step 2: Запустить все тесты пакета rules**

```bash
pnpm --filter @nakidka/rules test
```

Expected: PASS.

- [ ] **Step 3: Запустить полный e2e round-trip**

```bash
pnpm test:e2e
```

Expected: поддержанные XML-файлы побайтово совпадают; неподдержанный `PropertyState` даёт предметную ошибку, а не скрытое преобразование.

- [ ] **Step 4: Выполнить обязательные проверки проекта**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base a523b93ef
git diff --check
```

Expected: все команды завершаются с кодом 0.

- [ ] **Step 5: Проверить границы изменения**

```bash
git diff --name-only a523b93ef...HEAD
git status --short
```

Убедиться, что:

- снимок содержит только ранее согласованные идентификаторы и списки порядка;
- удалён служебный carrier `configurationExtensionPropertyStateXML`;
- не появилось новых общих полей правил и новых применений `!xml`;
- незакоммиченные пользовательские файлы не вошли в коммиты плана;
- XML-фикстуры и двоичные `.nkdk` не изменены.

- [ ] **Step 6: Commit только при необходимости интеграционного исправления**

Если Step 1–4 потребовали дополнительной правки, выполнить отдельный TDD-коммит:

```bash
git commit -m "test(e2e): :white_check_mark: закрепить точный round-trip расширений"
```

Если все проверки прошли без изменений, отдельный пустой коммит не создавать.

---

## Самопроверка плана

- Все разделы спецификации покрыты задачами 1–9.
- Исходный договор ID, обязательных одиночных элементов и `AdditionalFields` не перепроектируется, а проверяется в Task 9.
- `BaseForm`, формат LMDB, XML-фикстуры и архитектурные границы не меняются.
- Все изменения поведения начинаются с RED-теста и заканчиваются целевой и полной проверкой.
- План не содержит `TODO`, заглушек и предложений сохранить неизвестный XML в снимок.

## Приложение А: правила обязательного `Comment` в `adopted`

В Task 3 добавить существующий `defaultValueAdoptedXML: ""` в свойство `comment` следующих правил:

```text
packages/rules/metadata/appliedObjects/configuration/rules.ts
packages/rules/metadata/appliedObjects/configurationExtension/rules.ts
packages/rules/metadata/appliedObjects/metadataAccountingRegister/rules.ts
packages/rules/metadata/appliedObjects/metadataAccumulationRegister/rules.ts
packages/rules/metadata/appliedObjects/metadataBot/rules.ts
packages/rules/metadata/appliedObjects/metadataBusinessProcess/rules.ts
packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/rules.ts
packages/rules/metadata/appliedObjects/metadataCalculationRegister/rules.ts
packages/rules/metadata/appliedObjects/metadataCatalog/rules.ts
packages/rules/metadata/appliedObjects/metadataChartOfAccounts/rules.ts
packages/rules/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts
packages/rules/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts
packages/rules/metadata/appliedObjects/metadataCommandGroup/rules.ts
packages/rules/metadata/appliedObjects/metadataCommonAttribute/rules.ts
packages/rules/metadata/appliedObjects/metadataCommonForm/rules.ts
packages/rules/metadata/appliedObjects/metadataCommonModule/rules.ts
packages/rules/metadata/appliedObjects/metadataCommonPicture/rules.ts
packages/rules/metadata/appliedObjects/metadataCommonTemplate/rules.ts
packages/rules/metadata/appliedObjects/metadataConstant/rules.ts
packages/rules/metadata/appliedObjects/metadataDataProcessor/rules.ts
packages/rules/metadata/appliedObjects/metadataDefinedType/rules.ts
packages/rules/metadata/appliedObjects/metadataDocument/rules.ts
packages/rules/metadata/appliedObjects/metadataDocumentJournal/rules.ts
packages/rules/metadata/appliedObjects/metadataDocumentNumerator/rules.ts
packages/rules/metadata/appliedObjects/metadataEnumeration/rules.ts
packages/rules/metadata/appliedObjects/metadataEventSubscription/rules.ts
packages/rules/metadata/appliedObjects/metadataExchangePlan/rules.ts
packages/rules/metadata/appliedObjects/metadataExternalDataSource/rules.ts
packages/rules/metadata/appliedObjects/metadataFilterCriterion/rules.ts
packages/rules/metadata/appliedObjects/metadataFunctionalOption/rules.ts
packages/rules/metadata/appliedObjects/metadataFunctionalOptionsParameter/rules.ts
packages/rules/metadata/appliedObjects/metadataHTTPService/rules.ts
packages/rules/metadata/appliedObjects/metadataInformationRegister/rules.ts
packages/rules/metadata/appliedObjects/metadataIntegrationService/rules.ts
packages/rules/metadata/appliedObjects/metadataLanguage/rules.ts
packages/rules/metadata/appliedObjects/metadataReport/rules.ts
packages/rules/metadata/appliedObjects/metadataRole/rules.ts
packages/rules/metadata/appliedObjects/metadataScheduledJob/rules.ts
packages/rules/metadata/appliedObjects/metadataSequence/rules.ts
packages/rules/metadata/appliedObjects/metadataSessionParameter/rules.ts
packages/rules/metadata/appliedObjects/metadataSettingsStorage/rules.ts
packages/rules/metadata/appliedObjects/metadataStyle/rules.ts
packages/rules/metadata/appliedObjects/metadataStyleItem/rules.ts
packages/rules/metadata/appliedObjects/metadataSubsystem/rules.ts
packages/rules/metadata/appliedObjects/metadataTask/rules.ts
packages/rules/metadata/appliedObjects/metadataWSReference/rules.ts
packages/rules/metadata/appliedObjects/metadataWebService/rules.ts
packages/rules/metadata/appliedObjects/metadataWebSocketClient/rules.ts
packages/rules/metadata/appliedObjects/metadataXDTOPackage/rules.ts
packages/rules/metadata/commonObjects/metadataCommand/rules.ts
packages/rules/metadata/commonObjects/metadataDocumentJournalColumn/rules.ts
packages/rules/metadata/commonObjects/metadataExternalDataSourceFunction/rules.ts
packages/rules/metadata/commonObjects/metadataSequenceDimension/rules.ts
packages/rules/metadata/commonObjects/standardAttributeDescription/rules.ts
packages/rules/metadata/commonObjects/standardTabularSectionDescription/rules.ts
```
