# Remove referenceDir Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Удалить старую ветку YAML → XML и все production-договоры `referenceDir`, оставив новый full sync единственным путём синхронизации в XML.

**Architecture:** Верхнеуровневые legacy API и их частичный/полный исполнители удаляются целиком. Из общего orchestration и реестра property-типов удаляется только недостижимая ветка исполнения в XML; функции подготовки XML, topology, импорт из XML и configuration index сохраняются.

**Tech Stack:** TypeScript 5.9, pnpm, Vitest, Stryker, `metadata/fullSyncToXml`, metadata resource topology.

## Global Constraints

- Не изменять существующие XML-фикстуры.
- Не добавлять новые `fromXML`/`toXML`/`fromYAML`/`toYAML`.
- Общие metadata-слои не должны знать о конкретных объектах.
- Удаляемые `shortRoundTripXML` и `syncConfigurationIncrementallyToXML` не получают совместимых обёрток.
- `syncState` и его публичные экспорты сохраняются: он участвует в configuration index.
- В production-коде `packages` не должно остаться `referenceDir` или `externalReferenceDir`.
- Перед завершением обязательны `pnpm type-check` и `pnpm test`.

---

### Task 1: Удалить публичные legacy API и конфигурационные исполнители

**Files:**
- Modify: `packages/core/index.ts`
- Modify: `packages/mcp/src/coreApi.ts`
- Delete: `packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.ts`
- Delete: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
- Delete: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`
- Delete: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Delete: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`
- Delete: `packages/core/metadata/appliedObjects/configuration/incrementalPlan.ts`
- Delete: `packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts`
- Delete: `packages/core/metadata/appliedObjects/configuration/xmlChangeTracker.ts`
- Delete: `packages/core/metadata/appliedObjects/configuration/xmlChangeTracker.test.ts`

**Interfaces:**
- Consumes: действующий `syncConfigurationToXML` из `metadata/fullSyncToXml`.
- Produces: `@nakidka/core` без `shortRoundTripXML` и `syncConfigurationIncrementallyToXML`; MCP `CoreApi` без частичного исполнителя.

- [ ] **Step 1: Зафиксировать исходную защиту сохраняемого full sync**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/fullSyncToXml/syncConfiguration.test.ts metadata/fullSyncToXml/failureIntegration.test.ts
pnpm --filter @nakidka/mcp exec vitest run src/services/syncToXml.test.ts
```

Expected: PASS; публичный `syncConfigurationToXML` уже использует новый full sync.

- [ ] **Step 2: Запустить падающую проверку удаляемого договора**

```bash
if rg -n "shortRoundTripXML|syncConfigurationIncrementallyToXML" packages/core/index.ts packages/mcp/src/coreApi.ts packages/core/metadata/appliedObjects/configuration; then exit 1; fi
```

Expected: FAIL, потому что старые экспорты и реализации ещё существуют.

- [ ] **Step 3: Удалить старые экспорты и модули**

В `packages/core/index.ts` удалить только:

```ts
export { syncConfigurationIncrementallyToXML } from "./metadata/appliedObjects/configuration/incrementalSyncToXML"
export { shortRoundTripXML } from "./metadata/appliedObjects/configuration/shortRoundTripXML"
```

Из `CoreApi` удалить весь метод с именем `syncConfigurationIncrementallyToXML`, затем удалить перечисленные production- и test-файлы. Экспорты нового full sync и `syncState` не менять.

- [ ] **Step 4: Проверить удаление верхнего уровня**

```bash
if rg -n "shortRoundTripXML|syncConfigurationIncrementallyToXML" packages/core/index.ts packages/mcp/src/coreApi.ts packages/core/metadata/appliedObjects/configuration; then exit 1; fi
pnpm --filter @nakidka/core exec vitest run metadata/fullSyncToXml/syncConfiguration.test.ts
pnpm --filter @nakidka/mcp exec vitest run src/services/syncToXml.test.ts
```

Expected: поиск пуст; тесты PASS.

- [ ] **Step 5: Зафиксировать несовместимое удаление API**

```bash
git add packages/core/index.ts packages/mcp/src/coreApi.ts packages/core/metadata/appliedObjects/configuration
git commit -m "refactor!: :fire: удалить старые API синхронизации XML" -m "Новый full sync уже является основной реализацией и не использует referenceDir.

BREAKING CHANGE: удалены shortRoundTripXML и syncConfigurationIncrementallyToXML; используйте syncConfigurationToXML."
```

### Task 2: Сократить applied-object orchestration до подготовки XML

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Preserve: `packages/core/metadata/orchestration/appliedObject/syncPreparedToXML.test.ts`
- Delete: `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts`
- Delete: `packages/core/metadata/orchestration/appliedObject/syncToXML.partial.test.ts`
- Delete: `packages/core/metadata/orchestration/appliedObject/syncToXML.noModel.test.ts`
- Delete: `packages/core/tests/appliedObject/runSyncToXML.ts`
- Delete: `packages/core/metadata/appliedObjects/__tests__/externalSync.test.ts`
- Delete: `packages/core/metadata/commonObjects/recalculation/syncExternal.test.ts`
- Delete: applied-object `syncToXML.test.ts` files that import `syncAppliedObjectToXML` or `runSyncToXML`: `metadataBot`, `metadataCatalog`, `metadataCommonAttribute`, `metadataCommonModule`, `metadataConstant`, `metadataDataProcessor`, `metadataDefinedType`, `metadataDocument`, `metadataDocumentJournal`, `metadataDocumentNumerator`, `metadataEnumeration`, `metadataEventSubscription`, `metadataExchangePlan`, `metadataExternalDataSource`, `metadataFilterCriterion`, `metadataFunctionalOptionsParameter`, `metadataHTTPService`, `metadataInformationRegister`, `metadataReport`, `metadataSequence`, `metadataSessionParameter`, `metadataSettingsStorage`, `metadataStyleItem`, `metadataSubsystem`, `metadataWSReference`, `metadataWebSocketClient`, `metadataXDTOPackage`.

**Interfaces:**
- Consumes: `PreparedYamlFile`, `MetadataXmlPrepareCompositionEntry`, `registerMetadataXmlPrepareCapability`.
- Produces: `prepareAppliedObjectOwnerXML` и `writePreparedAppliedObjectOwnerToXML`; не производит `SyncAppliedObjectToXMLParams`, `AppliedObjectXmlAreaRequest`, `syncAppliedObjectToXML` или `syncAppliedObjectAreaToXML`.

- [ ] **Step 1: Зафиксировать mutation baseline сохраняемой подготовки**

```bash
pnpm test:mutation -- --report before-reference-dir --tests packages/core/metadata/orchestration/appliedObject/syncPreparedToXML.test.ts,packages/core/metadata/fullSyncToXml/worker.test.ts packages/core/metadata/orchestration/appliedObject/syncToXML.ts:74-393
```

Expected: достоверный отчёт без `Timeout`, `RuntimeError` и `CompileError`.

- [ ] **Step 2: Запустить падающую архитектурную проверку**

```bash
if rg -n "SyncAppliedObjectToXMLParams|syncAppliedObjectAreaToXML|syncAppliedObjectToXML|referenceDir|externalReferenceDir" packages/core/metadata/orchestration/appliedObject/syncToXML.ts packages/core/tests/appliedObject; then exit 1; fi
```

Expected: FAIL на старом интерфейсе, исполнителе и тестовом переходнике.

- [ ] **Step 3: Удалить старый исполнитель**

Удалить интерфейсы/функции:

```ts
SyncAppliedObjectToXMLParams
AppliedObjectXmlAreaRequest
syncAppliedObjectAreaToXML
syncAppliedObjectToXML
syncAppliedObjectToXMLInternal
```

Удалить helpers, доступные только из `syncAppliedObjectToXMLInternal`: чтение reference XML, восстановление reference-файлов, рекурсивную синхронизацию дочерних объектов, обход `syncExternalToXML`/`xmlSyncWriter` и manifest старого исполнителя. Сохранить `prepareAppliedObjectOwnerXML`, `writePreparedAppliedObjectOwnerToXML` и prepare capabilities `appliedObject`, `itemProperty`, `externalFileProperty`. Очистить только ставшие неиспользуемыми импорты. Удалить перечисленные прямые тесты и тестовый переходник; XML-фикстуры оставить.

- [ ] **Step 4: Проверить сохраняемую подготовку**

```bash
if rg -n "SyncAppliedObjectToXMLParams|syncAppliedObjectAreaToXML|syncAppliedObjectToXML|referenceDir|externalReferenceDir" packages/core/metadata/orchestration/appliedObject/syncToXML.ts packages/core/tests/appliedObject; then exit 1; fi
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/appliedObject/syncPreparedToXML.test.ts metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/sharedMetadata.test.ts
```

Expected: поиск пуст; тесты PASS.

- [ ] **Step 5: Зафиксировать удаление нижнего уровня**

```bash
git add packages/core/metadata/orchestration/appliedObject packages/core/metadata/appliedObjects packages/core/metadata/commonObjects/recalculation/syncExternal.test.ts packages/core/tests/appliedObject
git commit -m "refactor: :fire: удалить старый applied-object XML sync"
```

### Task 3: Удалить legacy property-операции и обработчики reference XML

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/commonObjects/help/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/recalculation/register.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/resourceTopology.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/resourceTopology.ts`
- Modify: `packages/core/metadata/commonObjects/childSubsystemNames/toXML.ts`
- Delete: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
- Delete: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts`
- Delete: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts`
- Delete: `packages/core/metadata/commonObjects/externalFile/toXML.ts`
- Delete: `packages/core/metadata/commonObjects/externalPicture/toXML.ts`
- Delete: `packages/core/metadata/commonObjects/module/toXML.ts`
- Delete: `packages/core/metadata/commonObjects/wsDefinitionSchemas/toXML.ts`

**Interfaces:**
- Consumes: `resourceTopology`, `fileChildNamesDescriptor`, `yamlToXMLNestedRule`, metadata XML prepare capabilities.
- Produces: `TypeRule` без `syncExternalToXML` и `xmlSyncWriter`; `prepareFormXML` без чтения reference XML; descriptors форм и макетов доступны через topology-регистрации.

- [ ] **Step 1: Запустить падающую проверку property-договора**

```bash
if rg -n 'referenceDir|externalReferenceDir|syncExternalToXML|xmlSyncWriter' packages/core/metadata/orchestration/property packages/core/metadata/commonObjects packages/core/metadata/forms/clientApplicationForm; then exit 1; fi
```

Expected: FAIL на типах, регистрациях и реализациях старого property-исполнителя.

- [ ] **Step 2: Удалить операции из реестра типов**

Из `fn.ts` удалить `SyncExternalToXMLFunction`, `XmlSyncWriterFunction`, поля `syncExternalToXML`/`xmlSyncWriter` и соответствующие элементы `TypeRulesOperations`/`importExportFunction`. Из `typeRuleRegistry.ts` удалить условные ветви этих операций. `syncExternalFromXML` сохранить.

- [ ] **Step 3: Перенести descriptors и удалить legacy writers**

Регистрации `fileChildNamesDescriptor` из двух `syncExternalToXML.ts` перенести в соответствующие `resourceTopology.ts` вместе с функциями вычисления ожидаемых имён. Удалить эти файлы, их side-effect imports и старый test.

Удалить side-effect imports и файлы `externalFile/toXML.ts`, `externalPicture/toXML.ts`, `module/toXML.ts`, `wsDefinitionSchemas/toXML.ts`: новый full sync переносит эти файлы по topology. В `childSubsystemNames/toXML.ts` оставить только `exportChildSubsystemNamesToXML` и регистрацию `exportToXML`.

В `help/toXML.ts` оставить `prepareHelpXML` и capability `Help`, удалить `syncHelpToXML`, регистрацию и helpers копирования legacy-исполнителя. В `recalculation/register.ts` сохранить `syncExternalFromXML` и `yamlToXMLNestedRule`, удалить `syncRecalculationsToXML`, reference fallback и регистрацию `syncExternalToXML`.

- [ ] **Step 4: Удалить reference-ветку формы**

Из `forms/clientApplicationForm/syncToXML.ts` удалить `syncFormToXML`, `hasReferenceFormXML`, `hasReferenceFormMetadata`, `readRawReferenceForm` и параметр `referenceDir`. Сохранить существующие сигнатуры `prepareFormXML` и `writePreparedFormToXML` без изменений.

В `syncToXML.test.ts` удалить проверки `syncFormToXML` и reference XML; оставить проверки `prepareFormXML`/`writePreparedFormToXML`.

- [ ] **Step 5: Проверить registry и full-sync подготовку**

```bash
if rg -n 'referenceDir|externalReferenceDir|syncExternalToXML|xmlSyncWriter' packages/core/metadata/orchestration/property packages/core/metadata/commonObjects packages/core/metadata/forms/clientApplicationForm; then exit 1; fi
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/syncToXML.test.ts metadata/orchestration/appliedObject/fileChildNamesDescriptor.test.ts metadata/resourceTopology/registry.test.ts metadata/fullSyncToXml/transferExternalFiles.test.ts metadata/fullSyncToXml/worker.test.ts
```

Expected: поиск пуст; тесты PASS.

- [ ] **Step 6: Зафиксировать удаление property-механизма**

```bash
git add packages/core/metadata/orchestration/property packages/core/metadata/commonObjects packages/core/metadata/forms/clientApplicationForm
git commit -m "refactor: :fire: удалить property-механизм referenceDir"
```

### Task 4: Проверить полное удаление и сохранить тестовую защиту

**Files:**
- Modify only if verification exposes a remaining production consumer or a missing preserved-contract test.
- Do not modify: XML fixtures.

**Interfaces:**
- Consumes: результаты Tasks 1–3.
- Produces: репозиторий без production-упоминаний `referenceDir`, с зелёными type-check, mutation testing и полным набором тестов.

- [ ] **Step 1: Проверить отсутствие механизма и осиротевших импортов**

```bash
if rg -n 'referenceDir|externalReferenceDir' packages --glob '*.ts' --glob '!**/*.test.ts'; then exit 1; fi
if rg -n 'shortRoundTripXML|syncConfigurationIncrementallyToXML|syncAppliedObjectToXML|syncAppliedObjectAreaToXML' packages --glob '*.ts'; then exit 1; fi
pnpm type-check
```

Expected: оба поиска пусты; type-check PASS. Обнаруженные осиротевшие импорты удалить, не добавляя совместимые заглушки.

- [ ] **Step 2: Повторить mutation testing сохраняемой подготовки**

Поскольку удаление legacy-блока меняет большую часть файла, мутировать итоговый файл целиком:

```bash
pnpm test:mutation -- --report after-reference-dir --tests packages/core/metadata/orchestration/appliedObject/syncPreparedToXML.test.ts,packages/core/metadata/fullSyncToXml/worker.test.ts packages/core/metadata/orchestration/appliedObject/syncToXML.ts
pnpm test:mutation:compare -- before-reference-dir after-reference-dir
```

Expected: нет потерянного содержательного мутанта в сохраняемой подготовке; нет `Timeout`, `RuntimeError` или `CompileError`. Эквивалентные мутанты описать в итоговом отчёте.

- [ ] **Step 3: Запустить полный проект**

```bash
pnpm test
```

Expected: все пакеты PASS.

- [ ] **Step 4: Проверить состав изменений**

```bash
git status --short
git diff --check
git diff --stat HEAD~3..HEAD
```

Expected: нет незакоммиченных файлов задачи и ошибок whitespace; `.stryker-tmp/` остаётся нетронутым пользовательским файлом. В итоговом отчёте перечислить удалённые тесты и указать оставшуюся защиту full-sync и prepare-тестами.
