# Topology-native metadata E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить первичные ошибки metadata E2E системными договорами topology, схем и ProjectState, после чего строго восстановить все четыре XML-компонента побайтово.

**Architecture:** Скомпилированная topology становится единственным источником фактического `itemRule`, роли и полного metadata target файла. Локальная validation проверяет форму переданных YAML-данных, а отсутствующие `required` на границе адресуемого объекта расширения сохраняет как отложенную проверку; ProjectState разрешает её по полному target в `cf`. XML-import выбирает descriptor компонента до discovery и использует эквивалентную компонентную topology в coordinator и workers.

**Tech Stack:** TypeScript, Vitest, Piscina workers, TypeBox/Ajv JSON Schema, бинарный ProjectState, pnpm.

## Global Constraints

- Не изменять XML-фикстуры: `e2e/fixtures/xml/**` остаются источником истины.
- Не добавлять служебные поля в YAML и не использовать `!xml`.
- Не добавлять частные условия по `itemType`, XML-корням или каталогам в нейтральные слои topology, validation и ProjectState.
- Не добавлять поля в общие типы правил `BasePropertyRule`, `PropertyRule` и параметры построителей правил.
- Не ослаблять byte round-trip: после успешного sync требуется точное равенство путей и байтов.
- После каждого законченного слоя запускать `pnpm duplicates -- --base origin/develop`.
- Каждый task завершать отдельным Conventional Commit с gitmoji на русском языке.

---

## Task 1: Перенести точный topology-контекст в projectDefinition и validation

**Files:**

- Modify: `packages/core/metadata/resourceTopology/core/types.ts`
- Modify: `packages/core/metadata/resourceTopology/core/projectProjection.ts`
- Modify: `packages/core/metadata/resourceTopology/core/projectProjection.test.ts`
- Modify: `packages/core/metadata/projectDefinition/resources.ts`
- Modify: `packages/core/metadata/projectDefinition/resources.test.ts`
- Modify: `packages/core/metadata/validation/projectFiles.ts`
- Modify: `packages/core/metadata/validation/projectFiles.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.test.ts`
- Modify: `packages/core/metadata/validation/rulesSnapshot.ts`
- Modify: `packages/core/metadata/validation/rulesSnapshot.test.ts`

- [ ] **Step 1: Написать падающие тесты про роль и полный target**

В `projectProjection.test.ts` собрать topology с цепочкой `ExternalDataSource → Cube` и проверить, что content match содержит фактическое правило куба и канонический target `ExternalDataSource.Источник.Cube.Куб`.

В `resources.test.ts` зафиксировать три случая:

```ts
expect(properties).toMatchObject({
  role: "properties",
  itemRule: cubeRule,
  metadataTarget: { canonical: "ExternalDataSource.Источник.Cube.Куб" },
})
expect(ordinaryFileItem.role).toBe("properties")
expect(explicitForm.role).toBe("form")
```

Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/resourceTopology/core/projectProjection.test.ts \
  metadata/projectDefinition/resources.test.ts
```

Ожидается: тесты падают, потому что match не переносит полный target, а любой `fileItem` сейчас превращается в форму.

- [ ] **Step 2: Ввести нейтральную проекцию metadata target**

В `resourceTopology/core/types.ts` добавить сериализуемый тип без зависимости core от конкретных metadata-модулей:

```ts
export interface TopologyMetadataTarget {
  readonly canonical: string
  readonly owner: TopologyMetadataTargetOwner
}
```

В `projectProjection.ts` один раз пройти цепочку assignments от корня к текущему узлу. Первый frame с собственным owner формирует `Root.Name`; дочерние assignments с `logicalAddressSegment` добавляют пары `Segment.Name`. Если цепочка неполна, бросать ошибку с `projectPath` и идентификаторами узлов, без разбора каталога.

Добавить в `MetadataProjectResourceMatch`:

```ts
readonly metadataTarget: TopologyMetadataTarget | undefined
```

- [ ] **Step 3: Исправить legacy-adapter без потери контекста**

В `resources.ts` добавить общий контекст для всех YAML-ссылок:

```ts
export interface MetadataProjectYamlContext {
  readonly itemType: string
  readonly itemRule: MetadataItemRule
  readonly metadataTarget?: TopologyMetadataTarget
}
```

`content` с ролью `fileItem` преобразовывать в `properties`, если у declaration нет `projectRole: "form"`. Только `yamlCompanion` или явно помеченный `projectRole: "form"` создаёт `MetadataProjectFormYamlRef`.

Удалить повторное восстановление владельца вложенного объекта через `legacyOwner`/`nesting` там, где доступен topology target; оставить эти поля лишь как совместимый адрес каталога до удаления старых потребителей.

- [ ] **Step 4: Передать фактическое правило в ValidationProjectFile**

Сделать `itemRule` обязательным для всех `ValidationProjectFile`, а `metadataTarget` — обязательным для всех адресуемых файлов и отсутствующим только у корня компонента:

```ts
export interface ValidationProjectFile extends ComponentFileAddress {
  readonly absolutePath: string
  readonly projectPath: string
  readonly kind: "configuration" | "properties" | "form"
  readonly itemType: string
  readonly owner: { dir: string; name: string; spec: ValidationProjectSpec }
  readonly formName?: string
  readonly itemRule: MetadataItemRule
  readonly metadataTarget?: TopologyMetadataTarget
}
```

В `projectFiles.test.ts` проверить корень, обычный объект, вложенный `fileItem` и форму.

- [ ] **Step 5: Удалить реконструкцию target из пути**

В `yamlFactExtractor.ts` заменить `objectTargetForProjectFile()` на преобразование `file.metadataTarget.canonical`. Корень остаётся единственным допустимым случаем без target. Любой адресуемый non-root файл без target должен завершаться внутренней ошибкой с путём файла.

В `rulesSnapshot.ts` включить rules всех assignments компонентной topology, а не только корневые `projectSpecs`. Снимок должен индексироваться стабильным `topologyNodeId`/`itemType`, чтобы worker выбирал правило конкретного файла без structured clone объектов с методами.

- [ ] **Step 6: Запустить тесты слоя**

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/resourceTopology/core/projectProjection.test.ts \
  metadata/projectDefinition/resources.test.ts \
  metadata/validation/projectFiles.test.ts \
  metadata/validation/yamlFactExtractor.test.ts \
  metadata/validation/rulesSnapshot.test.ts
pnpm duplicates -- --base origin/develop
```

Ожидается: все тесты зелёные; вложенный куб индексируется полным target и больше не проходит как форма.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/resourceTopology packages/core/metadata/projectDefinition packages/core/metadata/validation
git commit -m "fix: :bug: передать точный topology-контекст YAML"
```

---

## Task 2: Использовать компонентную topology на всём XML-import

**Files:**

- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/core/metadata/importFromXml/discovery.ts`
- Modify: `packages/core/metadata/importFromXml/discovery.test.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/rules.test.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/rootExternalResources.ts`

- [ ] **Step 1: Написать падающие тесты выбора topology**

В `importConfiguration.test.ts` подменить dependency `discover` и проверить, что после распознавания расширения ему передаётся `validationComponent.topology`, а не зарегистрированная topology `cf`:

```ts
expect(receivedDiscoverParams).toMatchObject({ xmlDir })
expect(receivedDiscoverParams.topology).toBe(validationComponent.topology)
```

В `worker.test.ts` проверить, что worker восстанавливает topology по `componentKind` и разрешает assignment только по существующему `topologyNodeId`; неизвестный id даёт точную внутреннюю диагностику.

- [ ] **Step 2: Передать topology в discovery coordinator**

Изменить контракт зависимости:

```ts
discover(params: {
  xmlDir: string
  topology: CompiledMetadataResourceTopology
  rootItemName: string
}): Promise<{
  assignments: ImportAssignment[]
  snapshotFiles?: ImportSnapshotFile[]
}>
```

После `resolveXmlImportComponent(root)` и `createValidationProjectComponent(...)` вызывать discovery с `validationComponent.topology`. Удалить `compileRegisteredMetadataResourceTopology()` из default dependency.

- [ ] **Step 3: Восстанавливать эквивалентную topology в worker**

Не передавать compiled path-index через Piscina. В worker initialization оставить `componentKind`; получить descriptor через `getMetadataComponentDescriptor(componentKind)` и скомпилировать topology тем же `compileMetadataResourceTopologyForRootRule`, что использует `createValidationProjectComponent`.

Assignment связывать с узлом только по `topologyNodeId`. Запрещено резервное разрешение по `itemType` или topology основной конфигурации.

- [ ] **Step 4: Вынести общие корневые внешние ресурсы**

В `rootExternalResources.ts` создать единый фрагмент правил для:

```ts
export const configurationRootExternalResources = {
  managedApplicationModule: moduleRule({
    nkdkPath: "МодульПриложения.bsl",
    xmlPath: "Ext/ManagedApplicationModule.bsl",
    syncExternalOnly: true,
  }),
  sessionModule: moduleRule({
    nkdkPath: "МодульСеанса.bsl",
    xmlPath: "Ext/SessionModule.bsl",
    syncExternalOnly: true,
  }),
  externalConnectionModule: moduleRule({
    nkdkPath: "МодульВнешнегоСоединения.bsl",
    xmlPath: "Ext/ExternalConnectionModule.bsl",
    syncExternalOnly: true,
  }),
  ordinaryApplicationModule: moduleRule({
    nkdkPath: "МодульОбычногоПриложения.bsl",
    xmlPath: "Ext/OrdinaryApplicationModule.bsl",
    syncExternalOnly: true,
  }),
  standaloneConfigurationContent: externalFileRule({
    nkdkPath: "СодержимоеАвтономнойКонфигурации.bin",
    xmlPath: "Ext/StandaloneConfigurationContent.bin",
    syncExternalOnly: true,
  }),
} as const
```

Подключить один фрагмент к `ConfigurationRules` и `ConfigurationExtensionRules`. Не переносить туда мобильную подпись, картинки и другие свойства, не согласованные в спецификации. Сохранить `syncExternalOnly` и существующие имена файлов.

- [ ] **Step 5: Проверить control extension**

В `rules.test.ts` проверить пять путей расширения, включая `МодульВнешнегоСоединения.bsl` и `StandaloneConfigurationContent.bin`. В `discovery.test.ts` проверить, что XML-файл вне выбранной topology отклоняется до worker с исходным путём.

Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/importConfiguration.test.ts \
  metadata/importFromXml/discovery.test.ts \
  metadata/importFromXml/worker.test.ts \
  metadata/importFromXml/workerPool.test.ts \
  metadata/appliedObjects/configurationExtension/rules.test.ts
pnpm duplicates -- --base origin/develop
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/importFromXml packages/core/metadata/appliedObjects/configuration packages/core/metadata/appliedObjects/configurationExtension
git commit -m "fix: :bug: выбрать topology XML-компонента"
```

---

## Task 3: Вернуть специализированные схемы Predefined

**Files:**

- Delete: `packages/core/metadata/commonObjects/predefined/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/predefined/index.ts`
- Modify: `packages/core/metadata/ruleRuntime/metadataItem/ruleFactory.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.test.ts`

- [ ] **Step 1: Зафиксировать регрессию схемы**

Добавить параметризованный тест JSON Schema:

```ts
it.each([
  [chartOfAccountsPredefinedRule, ["Порядок", "ПризнакиУчета"]],
  [chartOfCalculationTypesPredefinedRule, [
    "ПериодДействияБазовый",
    "Базовые",
    "Ведущие",
    "Вытесняющие",
  ]],
])("использует специализированный itemRule Predefined", (itemRule, fields) => {
  const schema = exportPropertySchema(predefinedRule({ itemRule }))
  for (const field of fields) expect(schema.properties).toHaveProperty(field)
})
```

Отдельно проверить, что базовый `PredefinedRules` специальные поля не разрешает.

- [ ] **Step 2: Удалить поздний override**

Удалить импорт `./toJSONSchema` из `predefined/index.ts` и сам файл. Не менять общий `registerMetadataItemRule`: его `resolvePropertyItemRule()` уже выбирает `propertyRule.itemRule` и использует базовое правило как резервное.

- [ ] **Step 3: Проверить правила и round-trip специализированных значений**

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/ruleRuntime/metadataItem/ruleFactory.test.ts \
  metadata/validation/projectValidationPasses.test.ts \
  metadata/appliedObjects/metadataChartOfAccounts \
  metadata/appliedObjects/metadataChartOfCalculationTypes
pnpm duplicates -- --base origin/develop
```

Ожидается: специальные поля разрешены только переданным `itemRule`; XML/YAML-тесты не изменились.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/commonObjects/predefined packages/core/metadata/ruleRuntime/metadataItem/ruleFactory.test.ts packages/core/metadata/validation/projectValidationPasses.test.ts
git commit -m "fix: :bug: учитывать itemRule в схеме Predefined"
```

---

## Task 4: Передать смысловое имя корня import assignment

**Files:**

- Modify: `packages/core/metadata/importFromXml/componentDescriptor.ts`
- Modify: `packages/core/metadata/importFromXml/componentDescriptor.test.ts`
- Modify: `packages/core/metadata/importFromXml/discovery.ts`
- Modify: `packages/core/metadata/importFromXml/discovery.test.ts`
- Modify: `packages/core/metadata/importFromXml/assignmentBuilder.ts`
- Modify: `packages/core/metadata/importFromXml/assignmentBuilder.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`
- Modify: descriptor registrations found by `rg -l 'registerXmlImportComponentDescriptor' packages/core/metadata`

- [ ] **Step 1: Написать падающие тесты корневого имени**

Проверить, что descriptor возвращает одновременно address и имя:

```ts
expect(descriptor.resolveRoot(root)).toEqual({
  address: { kind: "configurationExtension", name: "РасширениеКонтроль" },
  itemName: "РасширениеКонтроль",
})
```

В `assignmentBuilder.test.ts` проверить:

```ts
expect(rootAssignment.itemName).toBe("РасширениеКонтроль")
expect(rootAssignment.logicalAddress).toBe(configurationUid())
```

- [ ] **Step 2: Объединить результат распознавания корня**

Заменить `resolveAddress(root)` на:

```ts
resolveRoot(root: Record<string, unknown>): {
  readonly address: ComponentAddress
  readonly itemName: string
}
```

Обе регистрации читают `Configuration.Properties.Name` одним общим строгим helper. Пустое или нестроковое имя отклоняется при распознавании корня.

- [ ] **Step 3: Передать имя только корневой группе**

Добавить в `ImportAssignmentGroup.definition` необязательное `itemName`. `discoverXmlImport` устанавливает его только для assignment с ролью `configuration`; `createAssignment` использует:

```ts
const itemName = group.definition.itemName ?? assignmentItemName(group.targetProjectPath)
```

Не менять вычисление имён дочерних объектов и `configurationUid()`.

- [ ] **Step 4: Проверить equal-name synonym**

В integration-тесте импорта расширения проверить: синоним, равный настоящему `<Name>`, отсутствует в созданном `Конфигурация.yaml`, отличающийся синоним сохраняется.

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/componentDescriptor.test.ts \
  metadata/importFromXml/assignmentBuilder.test.ts \
  metadata/importFromXml/discovery.test.ts \
  metadata/importFromXml/importConfiguration.test.ts
pnpm duplicates -- --base origin/develop
```

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/importFromXml packages/core/metadata/appliedObjects
git commit -m "fix: :bug: использовать смысловое имя корня XML"
```

---

## Task 5: Реализовать target-aware required для расширений

**Files:**

- Create: `packages/core/metadata/validation/addressableRequired.ts`
- Create: `packages/core/metadata/validation/addressableRequired.test.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/toJSONSchema.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/toJSONSchemaRequired.test.ts`
- Modify: `packages/core/metadata/ruleRuntime/metadataItem/ruleFactory.ts`
- Modify: `packages/core/metadata/ruleRuntime/metadataCollection/ruleFactory.ts`
- Modify: `packages/core/metadata/validation/jsonSchemaRefs.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerSchemaCache.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPendingChecks.ts`
- Modify: `packages/core/metadata/projectState/contracts/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/contracts/dependencyValidation.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.test.ts`
- Modify: `packages/core/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/core/metadata/projectState/binary/fragment.ts`
- Modify: `packages/core/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/core/metadata/projectState/binary/typedBuilder.ts`
- Modify: `packages/core/metadata/projectState/binary/fragment.test.ts`
- Modify: `packages/core/metadata/projectState/binary/store.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.test.ts`

- [ ] **Step 1: Написать тесты границы required**

В `addressableRequired.test.ts` описать четыре независимых случая:

1. у файлового cfe-объекта отсутствует direct `required`;
2. у адресуемого вложенного элемента отсутствует direct `required`;
3. у обычной вложенной value-структуры отсутствует `required` — ошибка остаётся локальной;
4. у собственного вложенного элемента внутри заимствованного владельца формируется отдельный target.

Ожидаемая отложенная запись:

```ts
expect(check).toEqual({
  kind: "addressableRequired",
  yamlPath: ["Кубы", "НовыйКуб"],
  location: expect.objectContaining({ line: expect.any(Number), col: expect.any(Number) }),
  canonicalTarget: "ExternalDataSource.Источник.Cube.НовыйКуб",
  missing: ["ОбязательноеПоле"],
})
```

- [ ] **Step 2: Реализовать общий rule-driven обход**

`collectAddressableRequiredChecks()` принимает parsed YAML, фактический root `itemRule` и точный target файла. Он обходит те же nested descriptors, что `structuralReferences.ts` (`item`, `collection`, `polymorphicRecord`), но не строит metadata-модель.

Граница адресуемости определяется только договорами:

- корень файла имеет topology `metadataTarget`;
- вложенное правило имеет `externalMetadata` и имя элемента.

Для nested элемента канонический target строится добавлением `externalMetadata.segment` и имени к target владельца. Проверять только direct properties с `required: true`; рекурсивный обход самостоятельно создаёт проверки для дочерних адресуемых объектов. Для отсутствующего YAML-ключа использовать location контейнера.

- [ ] **Step 3: Создать отдельный вариант validation-схемы расширения**

Добавить внутренний нейтральный параметр JSON Schema context, не меняя типы правил:

```ts
readonly requiredPolicy?: {
  readonly currentBoundary: "full" | "defer"
  readonly cacheVariant: "full" | "extension-overlay"
}
```

`exportPropertiesToJSONSchema` делает `Type.Optional` для direct required-properties
только при `currentBoundary: "defer"`. Файловый объект cfe начинает экспорт с
`defer`. При переходе `metadataItem/ruleFactory.ts` и
`metadataCollection/ruleFactory.ts` создают дочерний context заново:

```ts
const deferred = itemRule.externalMetadata !== undefined
const requiredPolicy = {
  currentBoundary: deferred ? "defer" : "full",
  cacheVariant: deferred ? "extension-overlay" : "full",
} as const
```

Поэтому адресуемый nested item получает свою отложенную границу, а обычная
вложенная value-структура немедленно возвращается в `full`. Состояние родителя
не протекает в потомков, и повторное использование одного `itemRule` в разных
маршрутах не ослабляет схему.

Добавить `cacheVariant` в `$id`/ref ключ `jsonSchemaRefs.ts`, чтобы full и overlay схемы не перезаписывали друг друга. Корень cfe и все cf-файлы используют full-вариант.

- [ ] **Step 4: Сформировать pending check в первом проходе**

После успешного YAML parse и overlay schema validation вызвать `collectAddressableRequiredChecks()` для адресуемых файлов `cfe/*`. Добавить checks к `ProjectValidationFirstPassResult` независимо от `state.kind === "form"`; существующие `dataPath`/`fillValue` сохранить.

Если файл не cfe, target отсутствует или root — применить полную схему и не создавать отложенную проверку.

- [ ] **Step 5: Сериализовать проверку в ProjectState**

Расширить оба union вариантом:

```ts
{
  readonly kind: "addressableRequired"
  readonly yamlPath: ProjectStateYamlPath
  readonly location: { readonly line: number; readonly col: number; readonly path?: string }
  readonly canonicalTarget: string
  readonly missing: readonly string[]
}
```

Кодировать payload как версионированный JSON в существующем `payloadId`, аналогично `fillValue`; поля бинарной записи и версия формата ProjectState не меняются. Обновить reader, writer, validation, reachability и round-trip тесты бинарного снимка.

- [ ] **Step 6: Проверить target в cf отдельным B5 batch**

Добавить в `ProjectStateDependencyValidator` нейтральный метод:

```ts
validateAddressableRequired(params: {
  checks: readonly ProjectStateAddressableRequiredCheck[]
  projectDir: string
  queryPort: Pick<ProjectStateQueryPort, "resolveTargets">
}): readonly Diagnostic[]
```

В `binary/store.ts` отделить такие checks от `ProjectDependencyInputQuery`: одним пакетным `resolveTargets` запросить каждый `canonicalTarget` в компоненте `cf`.

- `found` — объект заимствован, диагностики нет;
- `missing` — объект собственный, по каждому `missing` сформировать `structure` diagnostic в сохранённой location;
- `ambiguous` — не считать заимствованным и выдать явную cross-file диагностику неоднозначности плюс ошибки required.

Существующий readiness обязан сначала блокировать cfe, если `cf` не прошёл локальную validation.

- [ ] **Step 7: Проверить тёплую и холодную семантику на уровне core**

В `projectStateDependencyValidation.test.ts` проверить полный target, одинаковые имена разных типов/владельцев, собственный nested объект и сохранение checks после закрытия/повторного открытия ProjectState.

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/addressableRequired.test.ts \
  metadata/ruleRuntime/property/toJSONSchemaRequired.test.ts \
  metadata/validation/projectValidationPasses.test.ts \
  metadata/projectState/fileUpdate.test.ts \
  metadata/projectState/binary/fragment.test.ts \
  metadata/validation/projectStateDependencyValidation.test.ts
pnpm duplicates -- --base origin/develop
```

Ожидается: borrowed omission проходит; own omission даёт одинаковую диагностику после diff и после полного пересоздания `.nkdk`; required обычной вложенной структуры не ослаблен.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/context packages/core/metadata/ruleRuntime packages/core/metadata/validation packages/core/metadata/projectState
git commit -m "fix: :bug: различать собственные объекты расширения"
```

---

## Task 6: Сделать E2E-диагностику точной и проверить полный договор

**Files:**

- Modify: `e2e/support/metadata-project.ts`
- Modify: `e2e/support/metadata-project.test.ts`
- Modify: `e2e/metadata-project.test.ts`
- Verify: `e2e/support/file-tree.ts`
- Verify: `e2e/support/file-tree.test.ts`

- [ ] **Step 1: Написать падающий тест пропуска compare**

Вынести маленькую функцию, которую можно проверить без реального worker:

```ts
export async function compareSuccessfulSync(params: {
  readonly sync: FullXmlSyncResult
  readonly expectedDir: string
  readonly actualDir: string
  readonly reportDir: string
  readonly compare?: typeof compareFileTrees
}): Promise<
  | { kind: "syncFailed" }
  | { kind: "compared"; comparison: FileTreeComparison }
>
```

Тест должен доказать, что `compareFileTrees` не вызывается при непустом `sync.failed`, а успешный sync возвращает реальное сравнение.

- [ ] **Step 2: Сделать результат round-trip различимым по типу**

```ts
export type ComponentRoundTripResult = {
  readonly component: E2EComponent
  readonly sync: FullXmlSyncResult
  readonly durationMs: number
} & (
  | { readonly kind: "syncFailed" }
  | { readonly kind: "compared"; readonly comparison: FileTreeComparison }
)
```

В E2E сначала утверждать `sync.failed === []`; обращаться к `comparison` только после проверки `kind === "compared"`. При сбое выводить diagnostics sync, не список удалённых файлов.

- [ ] **Step 3: Заменить искусственное неизвестное поле на missing required собственного cfe**

После импорта изменить собственный куб
`cfe/Расширение_All/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойстваExt/Кубы/КубВсеСвойства/Свойства.yaml`:
удалить существующее обязательное поле `ИмяВИсточникеДанных` безопасным YAML-преобразованием. Его полный target
`ExternalDataSource.ВнешнийИсточникДанныхВсеСвойстваExt.Cube.КубВсеСвойства`
отсутствует в `cf`. Helper обязан сначала проверить, что файл, ключ и исходное
строковое значение существуют, чтобы изменение fixture не превратило тест в
ложноположительный.

Чистый заимствованный куб под
`ВнешнийИсточникДанныхВсеСвойства/Кубы/КубВсеСвойства` остаётся положительной
проверкой отсутствующих полей: его полный target присутствует в `cf`.

Ожидание E2E:

```ts
expect(result.cold).toEqual(result.warm)
expect(result.warm).toEqual([
  expect.objectContaining({
    filePath: expect.stringContaining("cfe/Расширение_All/"),
    severity: "error",
    source: "structure",
    message: expect.stringContaining("обязательное"),
  }),
])
```

Не добавлять второй медленный validation E2E: чистый импорт уже содержит неполные borrowed объекты и служит положительной проверкой; одна изменённая копия проверяет own-object в warm/cold режимах.

- [ ] **Step 4: Проверить diff при настоящем byte mismatch**

Убедиться существующим `file-tree.test.ts`, что при изменении байтов отчёт содержит обычный и нормализованный diff. Если этот договор уже покрыт, код и тест не менять.

- [ ] **Step 5: Запустить metadata E2E**

```bash
pnpm test:e2e -- \
  e2e/support/metadata-project.test.ts \
  e2e/support/file-tree.test.ts \
  e2e/metadata-project.test.ts
```

Ожидается:

- импортированы `cf` и три `cfe` без ошибок;
- clean validation пуста;
- missing required собственного cfe одинаково виден с `.nkdk` и без него;
- каждый успешный sync сравнен;
- все четыре дерева XML совпали по путям и байтам.

- [ ] **Step 6: Commit**

```bash
git add e2e
git commit -m "test: :white_check_mark: уточнить metadata E2E"
```

---

## Task 7: Полная проверка и архитектурный аудит

**Files:**

- Verify only: `.agents/architecture.md`
- Verify only: `.agents/restrictions.md`
- Verify only: `.agents/testing.md`

- [ ] **Step 1: Проверить типы и весь проект**

```bash
pnpm test
```

Ожидается: все пакеты зелёные. Не удалять медленные unit-тесты в этой ветке: их аудит вынесен за границы спецификации.

- [ ] **Step 2: Проверить дублирование**

```bash
pnpm duplicates -- --base origin/develop
```

Ожидается: новых недопустимых дублей нет.

- [ ] **Step 3: Проверить архитектурные ограничения**

```bash
pnpm test:architecture:rules
pnpm test:architecture
```

Ожидается: оба набора зелёные; neutral layers не получили concrete-зависимостей.

- [ ] **Step 4: Сверить реализацию со спецификацией**

Проверить по пунктам:

- фактический `itemRule`, полный target и роль приходят только из topology;
- coordinator не использует registered cf topology после распознавания компонента;
- worker компилирует эквивалентную topology из того же descriptor;
- Predefined не имеет позднего JSON Schema override;
- optional required действует только на адресуемой границе;
- наличие borrowed target проверяется точным canonical в `cf`;
- byte compare запускается только после успешного sync и остаётся строгим.

Если код расходится с `.agents/architecture.md`, не переписывать архитектурный документ автоматически: остановиться и сообщить разработчику.

- [ ] **Step 5: Финальный commit при исправлениях проверки**

Если полная проверка потребовала только малых исправлений в границах плана:

```bash
git add packages/core e2e
git commit -m "fix: :bug: завершить metadata E2E"
```

Если исправлений нет, новый пустой commit не создавать.
