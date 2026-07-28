# Extension Exact XML Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Довести полную XML-синхронизацию расширений до точного round-trip на подтверждённых примерах `cfe/all-extension`, `cfe/control` и `cfe/default`, сохранив компактный YAML и общие механизмы синхронизации `cf`/`cfe`.

**Architecture:** Корень расширения выбирает собственный `rules.ts` через нейтральное описание компонента, а заимствованные прикладные объекты получают отдельный вариант XML-default `defaultValueAdoptedXML`. Формы используют переданные готовые индексы `DataPath`; потребность в базовой форме объявляется XML-ресурсом `ClientApplicationForm`, поэтому одинаково работает для отдельного `Форма.yaml` и встроенного свойства `Форма` в `Свойства.yaml`.

**Tech Stack:** TypeScript 6, Vitest 4, fast-xml-parser, js-yaml, metadata resource topology, configuration index, общий full XML sync worker.

## Global Constraints

- XML-фикстуры не изменяются и остаются источником истины.
- Критерий приёмки — точное совпадение XML после обычной нормализации Git: замена исходных файлов результатом должна оставлять пустой `git diff`.
- YAML остаётся компактным; `defaultValueAdoptedXML` влияет только на XML, а исключение значения из YAML по-прежнему задаёт `implicitValueYAML`.
- Обычный `defaultValueXML` не добавляется заимствованному прикладному объекту без явно заданного `defaultValueAdoptedXML`.
- Корневой `Configuration.xml` расширения не считается заимствованным прикладным объектом и использует обычные `defaultValueXML` из `MetadataConfigurationExtensionRules`.
- Набор `defaultValueAdoptedXML` добавляется только по подтверждённым XML-примерам; полная матрица допустимых свойств заимствованных объектов остаётся отдельной задачей валидации.
- Общие metadata-слои не проверяют конкретные `itemType`, имена `cf`/`cfe`, XML-теги `ObjectBelonging`/`ExtendedConfigurationObject` или каталоги форм.
- Расширение видит только себя и `cf`; другие расширения не читаются.
- YAML расширения хранит полную итоговую форму; `BaseForm` строится заново и не сохраняется в YAML или снимке.
- Для собственной формы YAML основной конфигурации не читается.
- `Content.xml` не имеет специального правила сохранения: отсутствующий исходный файл не создаётся.
- `ConfigDumpInfo.xml` не создаётся и не изменяется NKDK.
- При ошибке уже записанные XML не откатываются, а снимок компонента не обновляется.
- Существующие незакоммиченные изменения считаются черновиком: каждый фрагмент принимается только после соответствующего теста; ошибочное общее подавление `defaultValueXML` из `fromYAMLToXML.ts` удаляется.
- Перед завершением обязательны `pnpm test`, `pnpm --filter @nkdk/core type-check` и `pnpm --filter @nkdk/mcp type-check`.

---

## File Structure

Новые файлы:

- `packages/core/metadata/components/descriptor.ts` — нейтральное описание вида компонента и его корневого `MetadataItemRule`, общее для импорта и синхронизации.
- `packages/core/metadata/components/descriptor.test.ts` — договор выбора корневого правила `cf`/`cfe`.
- `packages/core/metadata/fullSyncToXml/configurationExtensionExactRoundTrip.test.ts` — интеграционные проверки известных расхождений расширения без изменения XML-фикстур.

Основные изменяемые файлы:

- `packages/core/metadata/importFromXml/componentDescriptor.ts` — использует нейтральный реестр компонентов и оставляет у импорта только распознавание XML и разрешение адреса.
- `packages/core/metadata/appliedObjects/configuration/{register,rootIO,rules}.ts` — передаёт корневое правило задания и переиспользуемое правило `InternalInfo`.
- `packages/core/metadata/appliedObjects/configurationExtension/{register,rules,propertyStates,exportPropertyStates}.ts` — регистрирует корень расширения, сохраняет признак заимствования и восстанавливает служебные свойства.
- `packages/core/metadata/commonObjects/childTemplateNames/{fromXML,toXML}.ts` — хранит и восстанавливает имена намеренно опущенных заимствованных макетов через снимок.
- `packages/core/metadata/orchestration/property/{types,fromYAMLToXML,fromYAMLToXMLTypes}.ts` — договор `defaultValueAdoptedXML` и передача базового YAML внешнему вложенному свойству.
- `packages/core/metadata/context/types.ts` — сериализуемое нейтральное сопоставление логических адресов с вариантом XML-default.
- `packages/core/metadata/appliedObjects/metadataAccumulationRegister/rules.ts` — подтверждённый заимствованный default `RegisterType=Balance`.
- `packages/core/metadata/forms/clientApplicationForm/{rules,fromYAMLToXML,propertyRules,syncToXML,baseForm}.ts` — подтверждённый `FormType=Managed`, готовый индекс `DataPath` и построение `BaseForm`.
- `packages/core/metadata/commonObjects/metadataPath/dataPathStandardMembers.ts` — совместное использование переданного индекса формы и переданного индекса метаданных.
- `packages/core/metadata/resourceTopology/{types,compiler}.ts` — декларация базового YAML-входа для XML-документа формы.
- `packages/core/metadata/commonObjects/childFormNames/resourceTopology.ts` — объявляет базовый вход отдельной формы.
- `packages/core/metadata/fullSyncToXml/{types,selection,baseFormSource,worker,prepareAssignment}.ts` — перенос декларации базового входа в задание и ленивое чтение нужного YAML `cf`.
- `packages/core/metadata/orchestration/appliedObject/syncToXML.ts` — передаёт соответствующее свойство базового YAML обработчику встроенной формы.

---

### Task 1: Корень расширения и сохранённые структурные XML-данные

**Files:**
- Create: `packages/core/metadata/components/descriptor.ts`
- Create: `packages/core/metadata/components/descriptor.test.ts`
- Modify: `packages/core/metadata/importFromXml/componentDescriptor.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/register.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rootIO.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/register.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/rules.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/toXML.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts`
- Modify: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.test.ts`

**Interfaces:**
- Produces:

```ts
export interface MetadataComponentDescriptor {
  readonly kind: ComponentAddress["kind"]
  readonly rootRule: MetadataItemRule
}

export function registerMetadataComponentDescriptor(
  descriptor: MetadataComponentDescriptor,
): void

export function getMetadataComponentDescriptor(
  kind: ComponentAddress["kind"],
): MetadataComponentDescriptor
```

- `XmlImportComponentDescriptor` больше не владеет `rootRule`: импорт получает его из `MetadataComponentDescriptor`.
- `prepareConfigurationXML` принимает обязательный `rootRule: MetadataItemRule`.
- `configurationInternalInfoRule` экспортируется из `configuration/rules.ts` и переиспользуется корнем расширения.

- [ ] **Step 1: Write failing root-descriptor tests**

```ts
expect(getMetadataComponentDescriptor("configuration").rootRule)
  .toBe(MetadataConfigurationRules)
expect(getMetadataComponentDescriptor("configurationExtension").rootRule)
  .toBe(MetadataConfigurationExtensionRules)
```

Добавить тест `prepareFullXmlSyncAssignment`, где задание `configuration` с `componentKind: "configurationExtension"` формирует документ с `rootRule === MetadataConfigurationExtensionRules`, а обычный `cf` сохраняет `MetadataConfigurationRules`.

- [ ] **Step 2: Run the root tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/components/descriptor.test.ts \
  metadata/fullSyncToXml/prepareAssignment.test.ts \
  metadata/appliedObjects/configurationExtension/rules.test.ts
```

Expected: FAIL — нейтрального реестра нет, корневое задание использует правило основной конфигурации.

- [ ] **Step 3: Implement neutral root-rule selection**

`configuration/register.ts` и `configurationExtension/register.ts` регистрируют собственные корневые правила. `prepareAssignment.ts` заменяет правило только корневого задания:

```ts
const itemRule =
  assignment.role === "configuration"
    ? getMetadataComponentDescriptor(context.exportToXML.componentKind).rootRule
    : assignmentNode.itemRule
```

`prepareConfigurationXML` использует переданный `rootRule` для преобразования, `rulePath` и `PreparedXMLDocument.rootRule`. Не импортировать `importFromXml` из `fullSyncToXml`.

- [ ] **Step 4: Write failing extension-state preservation tests**

Проверить:

```ts
expect(root.Properties.ObjectBelonging).toBe("Adopted")
expect(root.Properties.ExtendedConfigurationObject).toBeUndefined()
expect(extensionRule.properties.internalInfo)
  .toBe(configurationInternalInfoRule)
expect(extensionRule.properties.clientApplicationInterface)
  .toBe(MetadataConfigurationRules.properties.clientApplicationInterface)
```

Для заимствованной формы с правилом без служебных properties импорт должен записать:

```ts
expect(fragment.xmlNodes).toContainEqual({
  logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
  present: ["objectBelonging"],
})
```

Для существующего одноимённого объекта без `objectBelonging` в снимке `cfe` профиль не создаёт `adoptedUuids`; новый адрес, отсутствующий в старом снимке `cfe`, заимствуется при совпадении с `cf`. Адрес `Конфигурация` никогда не попадает в `adoptedUuids`.

- [ ] **Step 5: Implement root/adopted-state behavior**

`configurationExtensionPropertyStatesAugmenter` сохраняет наличие `ObjectBelonging=Adopted` в `xmlNodes` независимо от наличия этого свойства в конкретном `rules.ts`. Профиль расширения определяет старые заимствованные адреса только по этому факту снимка; для новых адресов использует совпадение текущего логического адреса с `cf`.

`configurationExtensionYamlToXmlAugmenter` записывает корню только `ObjectBelonging=Adopted`; прикладному заимствованному объекту — `ObjectBelonging` и `ExtendedConfigurationObject`.

- [ ] **Step 6: Write and implement snapshot-backed ChildTemplateNames**

Тест импортирует:

```xml
<ChildObjects>
  <Template>ЗаимствованныйМакет</Template>
</ChildObjects>
```

при пустом YAML и ожидает тот же список после экспорта. Реализация `collectConfigurationIndexFromXML` сохраняет порядок строк в XML-узле свойства, а `exportChildTemplateNamesToXML` использует приоритет:

```text
явное YAML → context.templates → порядок из configuration index → undefined
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/components/descriptor.test.ts \
  metadata/appliedObjects/configurationExtension \
  metadata/commonObjects/childTemplateNames \
  metadata/fullSyncToXml/prepareAssignment.test.ts \
  metadata/fullSyncToXml/profiles/configurationExtension.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add \
  packages/core/metadata/components \
  packages/core/metadata/importFromXml/componentDescriptor.ts \
  packages/core/metadata/appliedObjects/configuration \
  packages/core/metadata/appliedObjects/configurationExtension \
  packages/core/metadata/commonObjects/childTemplateNames \
  packages/core/metadata/fullSyncToXml/prepareAssignment.ts \
  packages/core/metadata/fullSyncToXml/prepareAssignment.test.ts \
  packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts \
  packages/core/metadata/fullSyncToXml/profiles/configurationExtension.test.ts
git commit -m "fix: :bug: восстановить структуру XML расширения"
```

---

### Task 2: Отдельные XML-default заимствованных объектов

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/componentProfile.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts`
- Modify: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataAccumulationRegister/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`

**Interfaces:**
- Produces:

```ts
export interface PropertyRule {
  readonly defaultValueXML?: unknown
  readonly defaultValueAdoptedXML?: unknown
}

export type XMLDefaultVariant = "full" | "adopted"

export interface ToXMLConfigurationContext {
  readonly xmlDefaultVariantByLogicalAddress?:
    Readonly<Record<string, XMLDefaultVariant>>
}
```

- Профиль `cfe` заполняет `xmlDefaultVariantByLogicalAddress` из подтверждённых `adoptedUuids`; корень расширения в карту не входит.
- Общий property-конвертер выбирает вариант по текущему логическому адресу configuration index и не знает, какой компонент создал карту.

- [ ] **Step 1: Replace the incorrect snapshot-presence tests**

Удалить тесты и код, которые подавляют `defaultValueXML` только потому, что свойства не было в снимке. Добавить договорный тест с тремя случаями:

```ts
const rule = {
  type: "string",
  yaml: "Режим",
  xml: "Mode",
  defaultValue: "full-default",
  defaultValueXML: "full-xml",
  defaultValueAdoptedXML: "adopted-xml",
}

expect(exportWithVariant(rule, "full")).toEqual({ Mode: "full-xml" })
expect(exportWithVariant(rule, "adopted")).toEqual({ Mode: "adopted-xml" })
expect(exportWithVariant(
  {
    type: "string",
    yaml: "Режим",
    xml: "Mode",
    defaultValue: "full-default",
    defaultValueXML: "full-xml",
  },
  "adopted",
)).toEqual({})
```

Отдельно проверить, что явное YAML-значение имеет приоритет в обоих режимах, а `implicitValueYAML` не меняется.

- [ ] **Step 2: Run the property tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/orchestration/property/fromYAMLToXML.test.ts
```

Expected: FAIL — `defaultValueAdoptedXML` отсутствует.

- [ ] **Step 3: Implement one default resolver**

Добавить рядом с `callAtomicToXML` единственную функцию:

```ts
function resolveXMLDefault(
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
): { readonly exists: boolean; readonly value: unknown } {
  if (currentXMLDefaultVariant(context) === "adopted") {
    return Object.prototype.hasOwnProperty.call(rule, "defaultValueAdoptedXML")
      ? { exists: true, value: rule.defaultValueAdoptedXML }
      : { exists: false, value: undefined }
  }
  return Object.prototype.hasOwnProperty.call(rule, "defaultValueXML")
    ? { exists: true, value: rule.defaultValueXML }
    : { exists: false, value: undefined }
}
```

Все проверки наличия и подстановка обычного XML-default внутри одного прохода свойства используют этот результат. `defaultValueXMLRaw` и `defaultValueXMLEmpty` не переопределять этим полем.

- [ ] **Step 4: Mark adopted logical addresses in the worker context**

Профиль возвращает:

```ts
xmlDefaultVariantByLogicalAddress: Object.fromEntries(
  Object.keys(adoptedUuids).map((address) => [address, "adopted"]),
)
```

Worker переносит карту в сериализуемый `exportToXML`. Для `cf`, собственных объектов `cfe` и корня расширения отсутствие записи означает `full`.

- [ ] **Step 5: Add only confirmed adopted defaults**

В правилах добавить:

```ts
// metadataAccumulationRegister/rules.ts
defaultValueXML: "Balance",
defaultValueAdoptedXML: "Balance",

// forms/clientApplicationForm/rules.ts
defaultValueXML: "Managed",
defaultValueAdoptedXML: "Managed",
implicitValueYAML: "Managed",
```

Другие `defaultValueAdoptedXML` в этом плане не добавлять. Новое поле сначала
должно быть подтверждено сравнением одноимённого объекта `cf/all` с заимствованными
объектами `cfe/all-extension`, `cfe/control` и `cfe/default` и оформлено отдельным
уточнением.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/orchestration/property/fromYAMLToXML.test.ts \
  metadata/appliedObjects/metadataAccumulationRegister \
  metadata/forms/clientApplicationForm \
  metadata/fullSyncToXml/profiles/configurationExtension.test.ts
```

Expected: PASS; существующий round-trip `cf` по-прежнему создаёт `FormType=Managed`.

- [ ] **Step 7: Commit**

```bash
git add \
  packages/core/metadata/orchestration/property \
  packages/core/metadata/context/types.ts \
  packages/core/metadata/fullSyncToXml \
  packages/core/metadata/appliedObjects/metadataAccumulationRegister/rules.ts \
  packages/core/metadata/forms/clientApplicationForm/rules.ts
git commit -m "feat: :sparkles: задать XML-default заимствованных объектов"
```

---

### Task 3: Точное обратное преобразование `DataPath`

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataPath/dataPathStandardMembers.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseForm.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`

**Interfaces:**
- Consumes existing `importFromYAML.formDataPathIndex: FormDataPathIndex`.
- Consumes existing `exportToYAML.ownerMetadataCache: OwnerMetadataCache`; для `cfe` worker уже создаёт слоёный индекс `cfe → cf`.
- Produces no new public API.

- [ ] **Step 1: Write the failing ready-index test**

Создать готовый индекс формы с корнем `Объект`, типом `CatalogObject.СправочникПолный` и слоёный `OwnerMetadataCache`, который содержит стандартный реквизит `Code`. Проверить:

```ts
expect(importDataPathStandardMembersFromYAML(
  contextWithReadyIndexes,
  "Объект.Код",
)).toBe("Объект.Code")
```

В контексте одновременно присутствуют `formDataPathIndex` и `ownerMetadataCache`; `formAttributes` пуст.

- [ ] **Step 2: Run the DataPath tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/commonObjects/metadataPath/fromYAML.test.ts \
  metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

Expected: FAIL — текущая ветвь с переданным `ownerMetadataCache` строит пустой индекс из `formAttributes` и теряет тип корня.

- [ ] **Step 3: Pair the two supplied indexes**

Изменить выбор ресурсов:

```ts
const resources =
  directIndex !== undefined && suppliedOwnerCache !== undefined
    ? { index: directIndex, ownerCache: suppliedOwnerCache }
    : directIndex !== undefined && projectDir !== undefined
      ? getDirectFormattingResources({ context, index: directIndex, projectDir })
      : suppliedOwnerCache !== undefined && formAttributes.length > 0
        ? { index: formattingIndex(formAttributes), ownerCache: suppliedOwnerCache }
        : /* существующие холодные варианты */
```

Не строить новый индекс, если готовый `formDataPathIndex` уже передан.

- [ ] **Step 4: Verify extension and BaseForm contexts**

Добавить тест преобразования полной формы расширения:

```text
XML  Объект.Code
YAML Объект.Код
XML  Объект.Code
```

И аналогичный тест для заново построенного `BaseForm`. Оба используют индекс итоговой формы расширения; метаданные владельца разрешаются слоёным индексом `cfe → cf`.

- [ ] **Step 5: Run focused form tests**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/commonObjects/metadataPath \
  metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts \
  metadata/forms/clientApplicationForm/baseForm.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add \
  packages/core/metadata/commonObjects/metadataPath \
  packages/core/metadata/forms/clientApplicationForm \
  packages/core/metadata/fullSyncToXml/worker.ts
git commit -m "fix: :bug: использовать готовые индексы DataPath формы"
```

---

### Task 4: `BaseForm` для отдельной и встроенной формы

**Files:**
- Modify: `packages/core/metadata/resourceTopology/types.ts`
- Modify: `packages/core/metadata/resourceTopology/compiler.ts`
- Modify: `packages/core/metadata/resourceTopology/compiler.test.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/resourceTopology.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/propertyRules.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXMLTypes.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseForm.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseForm.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/selection.ts`
- Modify: `packages/core/metadata/fullSyncToXml/selection.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/baseFormSource.ts`
- Modify: `packages/core/metadata/fullSyncToXml/baseFormSource.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`

**Interfaces:**
- Produces a neutral resource declaration:

```ts
export interface MetadataXmlBaseInputDeclaration {
  readonly kind: "sameProjectPath"
  readonly value: "wholeYaml" | "sourceProperty"
}

export interface MetadataXmlDocumentDeclaration {
  readonly baseInput?: MetadataXmlBaseInputDeclaration
}

export interface FullXmlSyncPotentialOutput {
  readonly baseInput?: MetadataXmlBaseInputDeclaration
}
```

- `ChildFormNames` declares
  `{ kind: "sameProjectPath", value: "wholeYaml" }`.
- Внешнее свойство типа `ClientApplicationForm` declares:

```ts
baseInput: {
  kind: "sameProjectPath",
  value: "sourceProperty",
}
```

При построении `FullXmlSyncPotentialOutput` XML-проекция заменяет
`value: "sourceProperty"` на точное `propertyName` из `document.source.propertyName`.
Для `value: "wholeYaml"` поле `propertyName` не задаётся.

- `YAMLToXMLNestedRule` external-file converter gains:

```ts
readonly baseYAML?: unknown
```

- `BaseFormSource.read` accepts any confirmed content resource required by `baseInput`; it does not check role or path names.

- [ ] **Step 1: Write failing topology tests**

Проверить скомпилированную topology:

```ts
expect(childFormBody.baseInput).toEqual({
  kind: "sameProjectPath",
  value: "wholeYaml",
})
expect(commonFormBody.baseInput).toEqual({
  kind: "sameProjectPath",
  value: "sourceProperty",
})
```

Задание синхронизации переносит декларацию в `FullXmlSyncPotentialOutput` без условий по `itemType` и каталогам.

- [ ] **Step 2: Run topology tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/resourceTopology \
  metadata/fullSyncToXml/selection.test.ts
```

Expected: FAIL — у XML-документа нет декларации базового входа.

- [ ] **Step 3: Compile and project base-input declarations**

Добавить `baseInput` к XML-документу topology и без преобразований переносить его в potential output. Worker определяет потребность в чтении базы так:

```ts
const baseInput = assignment.potentialOutputs
  .map(({ baseInput }) => baseInput)
  .find((value) => value !== undefined)

if (
  baseInput === undefined ||
  profile.adoptedUuids[assignment.logicalAddress] === undefined
) return undefined
```

Условие `assignment.role === "form"` удалить.

- [ ] **Step 4: Write failing child/common/own form source tests**

Проверить три случая:

```ts
await execute(adoptedChildForm)
expect(readBase).toHaveBeenCalledWith(childFormProjectPath)

await execute(adoptedCommonForm)
expect(readBase).toHaveBeenCalledWith(commonFormPropertiesProjectPath)

await execute(ownCommonForm)
expect(readBase).not.toHaveBeenCalled()
```

Изменение каждого прочитанного YAML после получения хэшей даёт `full_xml_sync_base_form_changed`.

- [ ] **Step 5: Generalize verified lazy reading**

`BaseFormSource` проверяет, что `baseProjectPath`:

1. присутствует в подтверждённой структуре `cf`;
2. классифицирован как `content`;
3. имеет подтверждённый хэш;
4. не изменился перед чтением.

Роль `fileItem` и суффикс `Форма.yaml` не проверяются. Подготовленный файл получает роль и `itemType` из классифицированного узла topology, а не из расширения пути.

- [ ] **Step 6: Pass the embedded base property**

В `externalFileProperty` создать `baseSource` из `basePreparedYamlFile` и того же `assignment.itemRule`. При `baseInput.propertyName` передать `baseSource.raw(propertyName)` как `baseYAML` в `nestedRule.convert`.

Обработчик `ClientApplicationForm` строит:

```ts
const baseFormXML =
  baseYAML === undefined
    ? undefined
    : buildClientApplicationBaseForm({
        context,
        baseYaml: baseYAML as ClientApplicationFormYAML,
        extensionYaml: yaml as ClientApplicationFormYAML,
        formName: name,
      })
```

и передаёт его в `convertClientApplicationFormFromYAMLToXML`.

- [ ] **Step 7: Verify both produced BaseForm variants**

Для отдельной и общей заимствованной формы сравнить построенный `BaseForm` с соответствующим неизменяемым XML-примером. Проверить:

- корневые namespace-атрибуты в `BaseForm` отсутствуют;
- `_version` сохранён;
- `DataPath` использует внутренние имена;
- собственная форма не содержит `BaseForm`;
- снимок `cfe` не содержит сериализованный `BaseForm`.

- [ ] **Step 8: Run focused tests**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/resourceTopology \
  metadata/fullSyncToXml/baseFormSource.test.ts \
  metadata/fullSyncToXml/selection.test.ts \
  metadata/fullSyncToXml/worker.test.ts \
  metadata/forms/clientApplicationForm
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add \
  packages/core/metadata/resourceTopology \
  packages/core/metadata/commonObjects/childFormNames \
  packages/core/metadata/forms/clientApplicationForm \
  packages/core/metadata/orchestration/property/fromYAMLToXMLTypes.ts \
  packages/core/metadata/orchestration/appliedObject/syncToXML.ts \
  packages/core/metadata/fullSyncToXml
git commit -m "fix: :bug: строить BaseForm по декларации XML-задания"
```

---

### Task 5: Точная интеграционная и приёмочная проверка всех расширений

**Files:**
- Create: `packages/core/metadata/fullSyncToXml/configurationExtensionExactRoundTrip.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/configurationExtensionIntegration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/testHelpers.ts`

**Interfaces:**
- Consumes existing `importConfigurationFromXml` and `syncComponentToXml`.
- Produces no production API.

- [ ] **Step 1: Add regression tests for the known exact differences**

Использовать копии неизменяемых XML-примеров во временном каталоге и проверить:

```ts
expect(extensionRoot).toEqual(expectedExtensionRoot)
expect(adoptedAccumulationRegister.Properties.RegisterType).toBe("Balance")
expect(adoptedForm.MetaDataObject.Form.Properties.FormType).toBe("Managed")
expect(adoptedForm.Form.BaseForm).toEqual(expectedBaseForm)
expect(adoptedFormDataPath).toBe("Объект.Code")
expect(ownForm.Form.BaseForm).toBeUndefined()
expect(existsSync(join(outputDir, "ConfigDumpInfo.xml"))).toBe(false)
expect(existsSync(join(outputDir, "ExchangePlans", "План", "Ext", "Content.xml"))).toBe(false)
```

Добавить случаи `InternalInfo`, `ClientApplicationInterface`, заимствованного макета и порядка `xr:PropertyState`.

- [ ] **Step 2: Run the integration test and inspect every remaining diff**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/fullSyncToXml/configurationExtensionExactRoundTrip.test.ts \
  metadata/fullSyncToXml/configurationExtensionIntegration.test.ts
```

Expected: PASS. Если обнаружено новое расхождение, сначала классифицировать его как ошибку общего механизма, недостающее подтверждённое правило либо отличие построенного `BaseForm`; XML-фикстуру не менять.

- [ ] **Step 3: Run all focused extension tests**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/appliedObjects/configurationExtension \
  metadata/commonObjects/childTemplateNames \
  metadata/commonObjects/metadataPath \
  metadata/forms/clientApplicationForm \
  metadata/fullSyncToXml
```

Expected: PASS.

- [ ] **Step 4: Run repository verification**

Run:

```bash
pnpm test
pnpm --filter @nkdk/core type-check
pnpm --filter @nkdk/mcp type-check
```

Expected: все команды завершаются с кодом `0`.

- [ ] **Step 5: Prepare the real acceptance project**

Использовать:

```text
основная XML-конфигурация: /Users/nikita/git/round-trip/cf/all
XML-расширения:             /Users/nikita/git/round-trip/cfe
NKDK-проект:                /Users/nikita/git/temp-yaml
```

Очистить `/Users/nikita/git/temp-yaml`, импортировать сначала `cf/all`, затем каждое расширение из непосредственных каталогов `/Users/nikita/git/round-trip/cfe`. Не импортировать расширения друг через друга.

- [ ] **Step 6: Synchronize and compare exact bytes through Git**

Для `cf` и каждого `cfe/<Имя>` сформировать XML во временный каталог. Скопировать результат поверх отдельной рабочей копии соответствующего исходного XML-каталога и выполнить:

```bash
git diff --exit-code -- .
```

Expected: код `0` для `cf/all` и каждого непосредственного каталога в `cfe`; `ConfigDumpInfo.xml` не создаётся. Обычная Git-нормализация `eol=lf` считается частью сравнения.

- [ ] **Step 7: Investigate BaseForm differences instead of excluding them**

Если различается только `BaseForm`, сравнить:

1. YAML основной формы;
2. готовый индекс итоговой формы расширения;
3. слоёный индекс метаданных `cfe → cf`;
4. построенный XML до встраивания;
5. исходный `BaseForm`.

Не добавлять исключение `BaseForm` в приёмочную проверку. Допустимое отличие фиксировать только после отдельного согласования.

- [ ] **Step 8: Commit final regression tests**

```bash
git add \
  packages/core/metadata/fullSyncToXml/configurationExtensionExactRoundTrip.test.ts \
  packages/core/metadata/fullSyncToXml/configurationExtensionIntegration.test.ts \
  packages/core/metadata/fullSyncToXml/testHelpers.ts
git commit -m "test: :white_check_mark: проверить точный round-trip расширений"
```
