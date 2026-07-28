# Unified Configuration and Extension XML Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать один механизм полной XML-синхронизации для `cf` и выбранного `cfe/<Имя>`, который использует независимые поставщики структуры, хэшей и индексов, лениво строит `BaseForm`, сразу записывает XML и не создаёт `ConfigDumpInfo.xml`.

**Architecture:** Координатор получает подтверждённое состояние компонента через независимые, пригодные для будущего кэширования договоры, выбирает профиль `cf` или `cfe` и передаёт явный состав общему однопроходному исполнителю. Исполнитель перечитывает и проверяет хэш каждого YAML, строит и сразу записывает XML; профиль расширения добавляет заимствование, `Контроль`, служебные состояния и ленивое построение `BaseForm`, не открывая другие расширения.

**Tech Stack:** TypeScript 6, Vitest 4, Piscina 5, fast-xml-parser, js-yaml, единая metadata resource topology, configuration index и shared validation snapshot.

## Global Constraints

- Текущая реализация включает полную синхронизацию `cf` и одного выбранного `cfe` в отдельный XML-каталог.
- Операции синхронизации `cf` и `cfe` запускаются отдельно.
- Публичная частичная синхронизация и вычисление состава изменений не реализуются; общий исполнитель принимает только готовый состав `all` или `selected`.
- `selected` не расширяет изменение формы до владельца; правила добавления и удаления внешних свойств остаются вне текущей реализации.
- Структура, хэши, индексы и снимок читаются независимыми механизмами; повторное чтение YAML допустимо.
- Структура и хэши охватывают все распознанные файлы выбранного компонента; другие `cfe` не читаются.
- Индексы обязаны быть привязаны к точному полному набору текущих хэшей.
- Перед синхронизацией `cfe` полный набор текущих хэшей `cf` должен точно совпадать со снимком `cf`.
- Заимствование определяется совпадением логического адреса элемента `cfe` с элементом `cf`.
- Для каждого заимствованного объекта и дочернего элемента UUID должен существовать в снимке `cf` до запуска XML-worker.
- Поиск расширения выполняется только в порядке `cfe → cf`; другие расширения невидимы.
- YAML расширения хранит полную итоговую форму; `BaseForm` не хранится ни в YAML, ни в снимке.
- Собственная форма не читает YAML из `cf`; заимствованная форма читает только соответствующую форму `cf` и повторно проверяет её хэш.
- XML записывается сразу после подготовки одного задания; разобранный YAML и подготовленный XML задания после записи освобождаются.
- При ошибке уже записанные XML не удаляются, но прежний снимок компонента сохраняется.
- `ConfigDumpInfo.xml` не создаётся, не обновляется, не удаляется и не хранится в configuration index: им управляет платформа 1С.
- Общие metadata-слои не знают `cf`, `cfe`, `ObjectBelonging`, `ExtendedConfigurationObject`, `Контроль` и `BaseForm`.
- Маршруты YAML, XML и внешних файлов берутся только из проекций единой metadata resource topology.
- Поддерживаются состояния расширения формата до 8.3.27: `Notify` и сохранённый `Extended`; `Auto` не добавляется.
- XML-фикстуры не изменяются и остаются источником истины.
- Перед завершением реализации обязательны `pnpm test`, `pnpm --filter @nkdk/core type-check` и `pnpm --filter @nkdk/mcp type-check`.

---

## File Structure

Новые файлы:

- `packages/core/metadata/project/componentState/types.ts` — нейтральные договоры структуры, хэшей, индексов и подтверждённого состояния компонента.
- `packages/core/metadata/project/componentState/structure.ts` — компиляция топологии и получение структуры файлов без чтения содержимого.
- `packages/core/metadata/project/componentState/hashes.ts` — хэширование точного состава файлов структуры.
- `packages/core/metadata/project/componentState/indexes.ts` — холодная сборка shared metadata index, зависимостей и логических адресов либо восстановление этих данных из подходящего снимка.
- `packages/core/metadata/project/componentState/confirm.ts` — единая проверка согласованности структуры, хэшей, индексов и снимка.
- `packages/core/metadata/project/componentState/index.ts` — публичные экспорты поставщиков состояния.
- `packages/core/metadata/project/componentIndexFacts.ts` — нейтральные записи локальных зависимостей и логических адресов, общие для validation и configuration index.
- `packages/core/metadata/fullSyncToXml/selection.ts` — проекция `all`/`selected` в XML-задания и внешние файлы.
- `packages/core/metadata/fullSyncToXml/componentProfile.ts` — нейтральный договор и реестр профилей компонента.
- `packages/core/metadata/fullSyncToXml/profiles/configuration.ts` — профиль основной конфигурации.
- `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts` — профиль расширения, проверка `cf` и построение составного контекста.
- `packages/core/metadata/orchestration/property/yamlToXmlAugmenter.ts` — нейтральная регистрация дополнений metadata-item при YAML → XML.
- `packages/core/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts` — `ObjectBelonging`, `ExtendedConfigurationObject`, `Notify` и сохранённый `Extended`.
- `packages/core/metadata/forms/clientApplicationForm/baseForm.ts` — построение `BaseForm` заново из YAML базовой формы.
- `packages/core/metadata/fullSyncToXml/baseFormSource.ts` — ленивое чтение и проверка хэша нужной формы `cf`.

Основные изменяемые файлы:

- `packages/core/metadata/components/address.ts` — обратный разбор `cf` и `cfe/<Имя>` в `ComponentAddress`.
- `packages/core/metadata/validation/projectValidationTypes.ts` и `packages/core/metadata/validation/yamlFactExtractor.ts` — выдача логических адресов и локальных зависимостей вместе с validation-фактами.
- `packages/core/metadata/importFromXml/componentReferenceIndex.ts` — переход на общий поставщик component indexes вместо импорт-специфичной холодной сборки.
- `packages/core/metadata/fullSyncToXml/{types,discovery,prepareAssignment,writeAssignment,worker,workerPool,syncConfiguration,sharedMetadata,index}.ts` — общий однопроходный исполнитель и координатор профилей.
- `packages/core/metadata/context/types.ts` — сериализуемый контекст профиля экспорта без `configDumpInfo`.
- `packages/core/metadata/orchestration/property/fromYAMLToXML.ts` — вызов зарегистрированных дополнений на каждой рекурсивной границе metadata-item.
- `packages/core/metadata/forms/clientApplicationForm/{fromYAMLToXML,syncToXML,types}.ts` — договор построения и встраивания `BaseForm`.
- `packages/core/metadata/appliedObjects/configurationExtension/register.ts` и `packages/core/metadata/register.ts` — регистрация профиля и экспортного дополнения расширения.
- `packages/core/metadata/configurationIndex/{types,sharedSnapshot,index}.ts` — перечисление логических адресов/идентификаторов и запись актуальных локальных индексов.
- `packages/core/index.ts` — публичный общий API синхронизации.
- `packages/mcp/src/{coreApi.ts,services/syncToXml.ts}` — разрешение `cfe/<Имя>` и вызов общего API.

Удаляемые файлы:

- `packages/core/metadata/fullSyncToXml/writeConfigDumpInfo.ts`
- `packages/core/metadata/fullSyncToXml/writeConfigDumpInfo.test.ts`
- весь каталог `packages/core/metadata/appliedObjects/configDumpInfo/`

Файлы, из которых удаляется управление `ConfigDumpInfo`:

- `packages/core/metadata/appliedObjects/configuration/{register,syncToXML,incrementalSyncToXML,shortRoundTripXML}.ts`
- `packages/core/metadata/fullSyncToXml/testHelpers.ts`
- `packages/core/tests/{mockContext,readAndParseXMLFile}.ts`
- `packages/mcp/src/{coreApi.ts,services/syncToXml.ts}`

---

### Task 1: Нейтральные поставщики структуры и хэшей компонента

**Files:**
- Create: `packages/core/metadata/project/componentState/types.ts`
- Create: `packages/core/metadata/project/componentState/structure.ts`
- Create: `packages/core/metadata/project/componentState/hashes.ts`
- Create: `packages/core/metadata/project/componentState/index.ts`
- Create: `packages/core/metadata/project/componentState/structure.test.ts`
- Create: `packages/core/metadata/project/componentState/hashes.test.ts`
- Modify: `packages/core/metadata/components/address.ts`
- Modify: `packages/core/metadata/components/address.test.ts`

**Interfaces:**
- Produces:

```ts
export interface ComponentProjectStructure {
  readonly address: ComponentAddress
  readonly componentPath: string
  readonly componentDir: string
  readonly topology: CompiledMetadataResourceTopology
  readonly resources: readonly MetadataProjectResourceMatch[]
  readonly projectPaths: readonly string[]
}

export interface ComponentHashState {
  readonly componentPath: string
  readonly projectFiles: readonly ConfigurationProjectFile[]
}

export async function readComponentProjectStructure(params: {
  projectDir: string
  address: ComponentAddress
  topology?: CompiledMetadataResourceTopology
}): Promise<ComponentProjectStructure>

export async function readComponentHashState(params: {
  structure: ComponentProjectStructure
  concurrency?: number
}): Promise<ComponentHashState>

export function parseComponentPath(path: string): ComponentAddress
```

- Consumes: `compileRegisteredMetadataResourceTopology`, `discoverMetadataProjectResources`, `hashConfigurationProjectFileList`.

- [ ] **Step 1: Write failing component-path and structure tests**

```ts
expect(parseComponentPath("cf")).toEqual({ kind: "configuration" })
expect(parseComponentPath("cfe/Расширение_All")).toEqual({
  kind: "configurationExtension",
  name: "Расширение_All",
})
expect(() => parseComponentPath("cfe")).toThrow("Ожидался путь cfe/<Имя>")
expect(() => parseComponentPath("cfe/a/b")).toThrow("Недопустимый путь компонента")

const structure = await readComponentProjectStructure({
  projectDir,
  address: { kind: "configurationExtension", name: "Дополнение" },
})
expect(structure.componentPath).toBe("cfe/Дополнение")
expect(structure.projectPaths).toEqual([
  "Configuration.yaml",
  "Справочники/Товары/Свойства.yaml",
].sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right))))
expect(structure.resources.every((entry) => !entry.projectPath.startsWith("../"))).toBe(true)
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/components/address.test.ts metadata/project/componentState/structure.test.ts`

Expected: FAIL — `parseComponentPath` и каталог `componentState` отсутствуют.

- [ ] **Step 3: Implement address parsing and structure discovery**

```ts
export function parseComponentPath(path: string): ComponentAddress {
  if (path === "cf") return { kind: "configuration" }
  const parts = path.replace(/\\/g, "/").split("/")
  if (parts.length === 2 && parts[0] === "cfe") {
    const address = { kind: "configurationExtension", name: parts[1]! } as const
    if (componentPath(address) !== path) throw new Error(`Недопустимый путь компонента: ${path}`)
    return address
  }
  throw new Error(`Неподдерживаемый путь компонента: ${path}`)
}
```

`readComponentProjectStructure` вычисляет `componentDir = resolve(projectDir, ...componentPath(address).split("/"))`, один раз компилирует переданную либо зарегистрированную топологию, вызывает `discoverMetadataProjectResources` и сохраняет только пути/роли/регистрации, без содержимого файлов.

- [ ] **Step 4: Write failing exact-hash-set tests**

```ts
const state = await readComponentHashState({ structure, concurrency: 2 })
expect(state.componentPath).toBe("cfe/Дополнение")
expect(state.projectFiles.map(({ projectPath }) => projectPath)).toEqual(structure.projectPaths)
expect(state.projectFiles).toEqual(
  [...state.projectFiles].sort((a, b) => Buffer.compare(Buffer.from(a.projectPath), Buffer.from(b.projectPath))),
)
```

Добавить проверку, что изменение внешнего файла меняет его `contentHash`, но не заставляет поставщик разбирать YAML.

- [ ] **Step 5: Implement the hash provider**

```ts
export async function readComponentHashState(
  params: ReadComponentHashStateParams,
): Promise<ComponentHashState> {
  return {
    componentPath: params.structure.componentPath,
    projectFiles: await hashConfigurationProjectFileList(
      params.structure.componentDir,
      params.structure.projectPaths,
      { concurrency: params.concurrency },
    ),
  }
}
```

- [ ] **Step 6: Run focused tests and type-check**

Run: `pnpm --filter @nkdk/core test -- metadata/components/address.test.ts metadata/project/componentState`

Expected: PASS.

Run: `pnpm --filter @nkdk/core type-check`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/components packages/core/metadata/project/componentState
git commit -m "refactor: :recycle: выделить структуру и хэши компонента"
```

---

### Task 2: Поставщик индексов и барьер согласованности состояния

**Files:**
- Create: `packages/core/metadata/project/componentState/indexes.ts`
- Create: `packages/core/metadata/project/componentState/confirm.ts`
- Create: `packages/core/metadata/project/componentIndexFacts.ts`
- Create: `packages/core/metadata/project/componentState/indexes.test.ts`
- Create: `packages/core/metadata/project/componentState/confirm.test.ts`
- Modify: `packages/core/metadata/project/componentState/types.ts`
- Modify: `packages/core/metadata/project/componentState/index.ts`
- Modify: `packages/core/metadata/validation/projectValidationTypes.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.test.ts`
- Modify: `packages/core/metadata/importFromXml/componentReferenceIndex.ts`
- Modify: `packages/core/metadata/importFromXml/componentReferenceIndex.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/configurationIndex/types.ts`
- Modify: `packages/core/metadata/configurationIndex/encode.ts`
- Modify: `packages/core/metadata/configurationIndex/decode.ts`
- Modify: `packages/core/metadata/configurationIndex/testData.ts`
- Modify: `packages/core/metadata/configurationIndex/sharedSnapshot.ts`
- Modify: `packages/core/metadata/configurationIndex/sharedSnapshot.test.ts`

**Interfaces:**
- Produces:

```ts
export interface ComponentLogicalAddress {
  readonly logicalAddress: string
  readonly sourceProjectPath: string
}

export interface ComponentIndexes {
  readonly componentPath: string
  readonly sourceProjectFiles: readonly ConfigurationProjectFile[]
  readonly metadata: SharedValidationSnapshot
  readonly dependencies: readonly ConfigurationLocalDependency[]
  readonly logicalAddresses: readonly ComponentLogicalAddress[]
}

export interface ConfirmedComponentState {
  readonly structure: ComponentProjectStructure
  readonly hashes: ComponentHashState
  readonly indexes: ComponentIndexes
  readonly snapshot: SharedConfigurationIndexSnapshot
}

export async function readComponentIndexes(params: {
  structure: ComponentProjectStructure
  hashes: ComponentHashState
  context: ConfigurationContext
  snapshot?: SharedConfigurationIndexSnapshot
  concurrency?: number
}): Promise<ComponentIndexes>

export function confirmComponentState(params: {
  structure: ComponentProjectStructure
  hashes: ComponentHashState
  indexes: ComponentIndexes
  snapshot: SharedConfigurationIndexSnapshot
}): ConfirmedComponentState
```

- Extends `ValidationIndexContribution` with exact `localDependencies` and `logicalAddresses`, so the cold provider does not import from `importFromXml`. Validation imports their neutral definitions from `project/componentIndexFacts.ts`; it does not import configuration index.
- Adds read-only enumeration to `ConfigurationIndexReader`:

```ts
projectFiles(): readonly ConfigurationProjectFile[]
identities(): readonly ConfigurationIdentity[]
```

- Extends the persisted component-local indexes:

```ts
export interface ConfigurationLocalIndexes {
  readonly metadata: PersistedSharedValidationSnapshot
  readonly dependencies: readonly ConfigurationLocalDependency[]
  readonly logicalAddresses: readonly ComponentLogicalAddress[]
}
```

- [ ] **Step 1: Write failing cold/restored index equivalence tests**

```ts
const cold = await readComponentIndexes({ structure, hashes, context, concurrency: 2 })
const restored = await readComponentIndexes({ structure, hashes, context, snapshot })

expect(serializeSharedValidationSnapshot(restored.metadata))
  .toEqual(serializeSharedValidationSnapshot(cold.metadata))
expect(restored.dependencies).toEqual(cold.dependencies)
expect(restored.logicalAddresses).toEqual(cold.logicalAddresses)
expect(restored.sourceProjectFiles).toEqual(hashes.projectFiles)
```

В снимке теста должны быть `localIndexes` и тот же `projectFiles`; отдельный тест меняет один хэш и доказывает, что поставщик не восстанавливает устаревшие индексы, а запускает холодную сборку.

- [ ] **Step 2: Run index tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/project/componentState/indexes.test.ts metadata/validation/yamlFactExtractor.test.ts`

Expected: FAIL — `ComponentIndexes` и выдача `logicalAddresses` отсутствуют.

- [ ] **Step 3: Extend the validation fact result**

Добавить нейтральные записи:

```ts
export interface ProjectLogicalAddressEntry {
  readonly logicalAddress: string
  readonly sourceProjectPath: string
}

export interface ProjectLocalDependency {
  readonly sourceProjectPath: string
  readonly yamlPath: readonly (string | number)[]
  readonly rulePath: readonly {
    readonly propertyKey: string
    readonly nestedItemType?: string
  }[]
  readonly kind: "metadataTarget"
  readonly canonical: string
}

export interface ValidationIndexContribution {
  readonly objectRecords: ValidationObjectRecord[]
  readonly objectIndexEntries: ProjectObjectIndexEntry[]
  readonly memberIndexEntries: ProjectMemberIndexEntry[]
  readonly valueIndexEntries: ProjectValueIndexEntry[]
  readonly pendingReferences: PendingMetadataTargetReference[]
  readonly localDependencies: readonly ProjectLocalDependency[]
  readonly logicalAddresses: readonly ProjectLogicalAddressEntry[]
}
```

`yamlFactExtractor` формирует `localDependencies` из тех же `metadataTargets`, включая `yamlPath`, `rulePath` и `canonical`, а логические адреса получает из зарегистрированной адресации metadata-item во время рекурсивного обхода правил. Пустой вклад всегда возвращает пустые массивы, чтобы не вводить необязательные ветви.

В `configurationIndex/types.ts` сохранить публичное имя без копирования структуры:

```ts
export type ConfigurationLocalDependency = ProjectLocalDependency
```

- [ ] **Step 4: Implement cold and snapshot-backed indexes**

```ts
const snapshotMatches =
  params.snapshot !== undefined &&
  equalProjectFiles(
    createConfigurationIndexReader(params.snapshot).projectFiles(),
    params.hashes.projectFiles,
  )

if (snapshotMatches) {
  const decoded = decodeConfigurationIndex(
    new Uint8Array(params.snapshot!.bytes, 0, params.snapshot!.byteLength),
  )
  return {
    componentPath: params.structure.componentPath,
    sourceProjectFiles: params.hashes.projectFiles,
    metadata: restoreSharedValidationSnapshot(decoded.localIndexes.metadata),
    dependencies: decoded.localIndexes.dependencies,
    logicalAddresses: decoded.localIndexes.logicalAddresses,
  }
}
```

Холодная ветвь вызывает `runValidationFactPass` только для `content`-ресурсов структуры, собирает `SharedValidationSnapshot`, зависимости и адреса и привязывает результат к переданному `hashes.projectFiles`. Общую холодную сборку из `componentReferenceIndex.ts` заменить делегированием этому поставщику.

Расширить encode/decode configuration index секцией `logicalAddresses` внутри `localIndexes`. Импорт XML заполняет её уникальными логическими адресами UUID из `fragmentData.identities`; последующая холодная YAML-сборка заменяет её актуальным полным набором.

- [ ] **Step 5: Write failing consistency tests**

```ts
expect(() => confirmComponentState({
  structure,
  hashes: { ...hashes, projectFiles: hashes.projectFiles.slice(1) },
  indexes,
  snapshot,
})).toThrow("структура и хэши относятся к разному составу файлов")

expect(() => confirmComponentState({
  structure,
  hashes,
  indexes: { ...indexes, sourceProjectFiles: changedHashes },
  snapshot,
})).toThrow("индексы относятся к другому состоянию файлов")
```

Добавить проверку несовпадающего `binding.componentPath`.

- [ ] **Step 6: Implement the confirmation barrier**

`confirmComponentState` сравнивает отсортированные пары `projectPath/contentHash`, требует точного равенства `structure.projectPaths` путям хэшей и проверяет `snapshot.binding().componentPath`. Функция только проверяет и замораживает ссылки; она не перечитывает файлы и не исправляет состояние.

- [ ] **Step 7: Run component-state and import regression tests**

Run: `pnpm --filter @nkdk/core test -- metadata/project/componentState metadata/importFromXml/componentReferenceIndex.test.ts metadata/importFromXml/importConfigurationExtension.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/project packages/core/metadata/validation packages/core/metadata/importFromXml packages/core/metadata/configurationIndex
git commit -m "refactor: :recycle: выделить индексы и подтверждение состояния"
```

---

### Task 3: Явный состав `all`/`selected` из общей топологии

**Files:**
- Create: `packages/core/metadata/fullSyncToXml/selection.ts`
- Create: `packages/core/metadata/fullSyncToXml/selection.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/discovery.ts`
- Modify: `packages/core/metadata/fullSyncToXml/discovery.test.ts`

**Interfaces:**
- Produces:

```ts
export type XmlSyncSelection =
  | { readonly kind: "all" }
  | {
      readonly kind: "selected"
      readonly projectPaths: readonly string[]
    }

export function buildXmlSyncPlan(params: {
  structure: ComponentProjectStructure
  hashes: ComponentHashState
  selection: XmlSyncSelection
}): FullXmlSyncPlan
```

- `FullXmlSyncAssignment` gains `expectedContentHash: bigint`.
- `FullXmlSyncExternalFile` gains `expectedContentHash: bigint`.
- Consumes only `ComponentProjectStructure`, `projectXmlExportAssignment` and `ConfigurationProjectFile` lookup from confirmed hashes.

- [ ] **Step 1: Write failing selection tests**

```ts
const all = buildXmlSyncPlan({ structure, hashes, selection: { kind: "all" } })
const selected = buildXmlSyncPlan({
  structure,
  hashes,
  selection: {
    kind: "selected",
    projectPaths: all.assignments.map(({ sourceProjectPath }) => sourceProjectPath)
      .concat(all.externalFiles.map(({ sourceProjectPath }) => sourceProjectPath)),
  },
})
expect(selected).toEqual(all)
```

Также проверить: неизвестный путь отклоняется; повтор пути отклоняется; выбор формы не добавляет YAML владельца; конфликт целевых XML-путей диагностируется до worker.

- [ ] **Step 2: Run selection tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/fullSyncToXml/selection.test.ts`

Expected: FAIL — `XmlSyncSelection` отсутствует.

- [ ] **Step 3: Implement the topology projection**

```ts
const selectedPaths = params.selection.kind === "all"
  ? new Set(params.structure.projectPaths)
  : new Set(assertUniqueKnownPaths(params.selection.projectPaths, params.structure))

const resources = params.structure.resources.filter(({ projectPath }) =>
  selectedPaths.has(projectPath),
)
```

Для `content` использовать существующий `projectXmlExportAssignment`; для внешнего файла — его `xmlPattern` и `transferCapabilityId`. Не добавлять таблицу путей для `cfe` и не проверять причину выбора файла.

- [ ] **Step 4: Replace the old discovery entry point with an explicit state adapter**

```ts
export function buildFullXmlSyncPlan(params: {
  structure: ComponentProjectStructure
  hashes: ComponentHashState
}): FullXmlSyncPlan {
  return buildXmlSyncPlan({
    structure: params.structure,
    hashes: params.hashes,
    selection: { kind: "all" },
  })
}
```

Удалить старую сигнатуру с одним `projectDir`: адрес компонента уже известен координатору, поэтому discovery не должен восстанавливать его по имени каталога.

- [ ] **Step 5: Run topology and selection tests**

Run: `pnpm --filter @nkdk/core test -- metadata/resourceTopology metadata/fullSyncToXml/discovery.test.ts metadata/fullSyncToXml/selection.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/fullSyncToXml
git commit -m "refactor: :recycle: унифицировать состав XML-синхронизации"
```

---

### Task 4: Профили `cf` и `cfe` и предварительная проверка основной конфигурации

**Files:**
- Create: `packages/core/metadata/fullSyncToXml/componentProfile.ts`
- Create: `packages/core/metadata/fullSyncToXml/componentProfile.test.ts`
- Create: `packages/core/metadata/fullSyncToXml/profiles/configuration.ts`
- Create: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts`
- Create: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/register.ts`
- Modify: `packages/core/metadata/register.ts`

**Interfaces:**
- Produces:

```ts
export type XmlSyncProfileKind = "configuration" | "configurationExtension"

export interface FullXmlSyncProfileRuntime {
  readonly kind: XmlSyncProfileKind
  readonly target: ConfirmedComponentState
  readonly base?: ConfirmedComponentState
  readonly workerProfile: FullXmlSyncWorkerProfileRuntime
}

export interface FullXmlSyncWorkerProfileRuntime {
  readonly kind: XmlSyncProfileKind
  readonly componentKind: string
  readonly adoptedUuids: Readonly<Record<string, string>>
  readonly baseForms?: {
    readonly componentDir: string
    readonly projectFiles: readonly ConfigurationProjectFile[]
  }
}

export interface FullXmlSyncComponentProfile {
  readonly kind: XmlSyncProfileKind
  supports(address: ComponentAddress): boolean
  baseAddress(address: ComponentAddress): ComponentAddress | undefined
  confirm(params: {
    target: ConfirmedComponentState
    base?: ConfirmedComponentState
  }): FullXmlSyncProfileRuntime
}

export function resolveFullXmlSyncComponentProfile(
  address: ComponentAddress,
): FullXmlSyncComponentProfile
```

- Produces extension runtime with exactly two layers: local target and base `cf`.
- Consumes `ComponentIndexes.logicalAddresses` and enumerated identities from Task 2.

- [ ] **Step 1: Write failing profile-registry tests**

```ts
expect(resolveFullXmlSyncComponentProfile({ kind: "configuration" }).kind)
  .toBe("configuration")
expect(resolveFullXmlSyncComponentProfile({
  kind: "configurationExtension",
  name: "Дополнение",
}).baseAddress({ kind: "configurationExtension", name: "Дополнение" }))
  .toEqual({ kind: "configuration" })
```

Проверить повторную регистрацию вида и отсутствие подходящего профиля.

- [ ] **Step 2: Run profile tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/fullSyncToXml/componentProfile.test.ts`

Expected: FAIL — реестр профилей отсутствует.

- [ ] **Step 3: Implement neutral registration and the cf profile**

Профиль `configuration` принимает только `address.kind === "configuration"`, запрещает переданный `base` и возвращает target без дополнительных слоёв.

- [ ] **Step 4: Write failing cfe preflight tests**

```ts
expect(() => extensionProfile.confirm({
  target: extensionState,
  base: {
    ...baseState,
    hashes: { ...baseState.hashes, projectFiles: changedBaseFiles },
  },
})).toThrow("основная конфигурация не синхронизирована")

expect(() => extensionProfile.confirm({
  target: extensionStateWithAdoptedAddress,
  base: baseStateWithoutUuid,
})).toThrow('не найден UUID заимствованного элемента "Catalog.Товары"')
```

Добавить тест, где совпадает дочерний логический адрес реквизита; отсутствие его UUID также завершается до worker. Добавить тест, что в runtime нет данных второго `cfe`.

- [ ] **Step 5: Implement strict cf confirmation and adoption**

```ts
assertEqualProjectFiles(
  base.hashes.projectFiles,
  createConfigurationIndexReader(base.snapshot).projectFiles(),
  "основная конфигурация не синхронизирована",
)

const baseUuids = new Map(
  createConfigurationIndexReader(base.snapshot)
    .identities()
    .filter(({ kind }) => kind === "uuid")
    .map(({ logicalAddress, value }) => [logicalAddress, value]),
)
const adopted = target.indexes.logicalAddresses.filter(({ logicalAddress }) =>
  base.indexes.logicalAddresses.some((entry) => entry.logicalAddress === logicalAddress),
)
for (const entry of adopted) {
  if (!baseUuids.has(entry.logicalAddress)) {
    throw new Error(`Не найден UUID заимствованного элемента "${entry.logicalAddress}"`)
  }
}
```

Сохранить `adoptedUuids` и только `base.componentDir/projectFiles`, нужные ленивым формам, в `workerProfile`. Сам `ConfirmedComponentState` остаётся в координаторе. Не искать каталоги `cfe/*` и не объединять снимки.

- [ ] **Step 6: Register profiles in main and worker registration entry points**

Регистрация должна выполняться через `packages/core/metadata/register.ts`, чтобы основной процесс и source worker получали одинаковый набор профилей.

- [ ] **Step 7: Run profile tests**

Run: `pnpm --filter @nkdk/core test -- metadata/fullSyncToXml/componentProfile.test.ts metadata/fullSyncToXml/profiles/configurationExtension.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/fullSyncToXml packages/core/metadata/appliedObjects/configurationExtension packages/core/metadata/register.ts
git commit -m "feat: :sparkles: добавить профили XML-синхронизации cf и cfe"
```

---

### Task 5: Однопроходный исполнитель с повторной проверкой хэша

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/sharedMetadata.ts`
- Modify: `packages/core/metadata/project/prepareYamlFiles.ts`
- Modify: `packages/core/metadata/project/prepareYamlFiles.test.ts`

**Interfaces:**
- Replaces `firstPass`/`secondPass` with:

```ts
export type FullXmlSyncWorkerCommand =
  | {
      readonly kind: "initialize"
      readonly workerIndex: number
      readonly componentDir: string
      readonly outputDir: string
      readonly context: ConfigurationContext
      readonly profile: FullXmlSyncWorkerProfileRuntime
      readonly targetIndex: SharedConfigurationIndexSnapshot
      readonly localMetadata: SharedValidationSnapshot
      readonly baseMetadata?: SharedValidationSnapshot
    }
  | {
      readonly kind: "execute"
      readonly assignments: readonly FullXmlSyncAssignment[]
    }
  | { readonly kind: "dispose" }

export interface FullXmlSyncExecutionResult {
  readonly diagnostics: readonly FullXmlSyncDiagnostic[]
  readonly warnings: readonly FullXmlSyncDiagnostic[]
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
  readonly expectedOutputs: readonly FullXmlSyncExpectedOutput[]
  readonly fragmentBuffer: ArrayBuffer
}
```

- `FullXmlSyncWorkerPool.execute(assignments)` is the only execution pass.
- `prepareFullXmlSyncAssignment` still prepares one assignment, but the caller must write it before reading the next.

- [ ] **Step 1: Replace lifecycle tests with one-pass expectations**

```ts
await pool.initialize(initialization)
const result = await pool.execute(assignments)
expect(result.writtenFiles).toHaveLength(2)
expect(() => pool.execute(assignments)).rejects.toThrow("уже был выполнен")
```

В worker-state test убрать `preparedIds`; вместо него проверять `activeAssignmentId === undefined` после ответа.

- [ ] **Step 2: Run worker tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/workerPool.test.ts`

Expected: FAIL — пул всё ещё требует два прохода.

- [ ] **Step 3: Implement one-assignment lifetime**

```ts
for (const assignment of assignments) {
  const bytes = await fs.promises.readFile(assignment.sourcePath)
  const actualHash = hashFileBytes(bytes)
  if (actualHash !== assignment.expectedContentHash) {
    diagnostics.push(assignmentDiagnostic(
      assignment,
      "full_xml_sync_source_changed",
      `YAML изменён после получения хэшей: ${assignment.sourceProjectPath}`,
    ))
    break
  }

  const [preparedYamlFile] = prepareYamlFiles({
    files: [assignmentDescriptor(assignment)],
    sourceBytes: new Map([[assignment.sourcePath, bytes]]),
    includeProjectFiles: false,
  }).yamlFiles
  const prepared = prepareFullXmlSyncAssignment({
    assignment,
    preparedYamlFile,
    context: createAssignmentContext(state),
    index: state.index,
    assignments: assignments.map(({ sourceProjectPath, itemType, itemName, logicalAddress, role, owner }) => ({
      sourceProjectPath,
      itemType,
      itemName,
      logicalAddress,
      role,
      ...(owner === undefined ? {} : { ownerLogicalAddress: owner.logicalAddress }),
    })),
  })
  const written = await writeFullXmlSyncAssignment({ prepared, context, outputDir })
  fragments.push(written.fragment)
  activeAssignmentId = undefined
}
```

Добавить в `prepareYamlFiles` именованный вход заранее прочитанных bytes, чтобы worker не читал тот же YAML второй раз внутри задания. Не хранить `PreparedXMLAssignment` в модульной `Map`.

- [ ] **Step 4: Build the layered owner cache once per worker**

Инициализация создаёт local cache, а при `cfe` — fallback на base cache:

```ts
const ownerMetadataCache = createLayeredOwnerMetadataCache({
  localProjectDir: command.componentDir,
  baseProjectDir: command.profile.baseForms?.componentDir,
  snapshots: {
    local: command.localMetadata,
    ...(command.baseMetadata === undefined ? {} : { base: command.baseMetadata }),
  },
})
```

Перенести `createLayeredOwnerMetadataCache` из `importFromXml/componentReferenceIndex.ts` в нейтральный `project/componentState/indexes.ts`, изменить его договор на отдельные `localProjectDir` и `baseProjectDir`; импорт также использует новый экспорт.

- [ ] **Step 5: Add the mutation/no-rollback test**

Тест изменяет второй YAML после построения assignments. Ожидания:

```ts
expect(result.diagnostics).toContainEqual(expect.objectContaining({
  code: "full_xml_sync_source_changed",
  sourceProjectPath: second.sourceProjectPath,
}))
expect(fs.existsSync(first.potentialOutputs[0]!.targetXmlPath)).toBe(true)
expect(fs.existsSync(second.potentialOutputs[0]!.targetXmlPath)).toBe(false)
```

- [ ] **Step 6: Run worker tests and memory-lifetime assertions**

Run: `pnpm --filter @nkdk/core test -- metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/workerPool.test.ts metadata/fullSyncToXml/prepareAssignment.test.ts`

Expected: PASS; после каждого задания worker не удерживает YAML или `PreparedXMLAssignment`.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/fullSyncToXml packages/core/metadata/project packages/core/metadata/importFromXml
git commit -m "refactor: :recycle: выполнять XML-задания за один проход"
```

---

### Task 6: Зарегистрированные служебные свойства расширения

**Files:**
- Create: `packages/core/metadata/orchestration/property/yamlToXmlAugmenter.ts`
- Create: `packages/core/metadata/orchestration/property/yamlToXmlAugmenter.test.ts`
- Create: `packages/core/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Create: `packages/core/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/register.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`

**Interfaces:**
- Produces:

```ts
export interface MetadataItemYamlToXmlAugmenter {
  augment(params: {
    context: ConfigurationContextWithExportToXML
    rule: MetadataItemRule
    yaml: Readonly<Record<string, unknown>>
    outputs: ReadonlyMap<string, Record<string, unknown>>
    logicalAddress: string
  }): void
}

export function registerMetadataItemYamlToXmlAugmenter(
  componentKind: string,
  augmenter: MetadataItemYamlToXmlAugmenter,
): void
```

- `ToXMLConfigurationContext` gains serializable fields:

```ts
readonly componentKind?: string
readonly adoptedUuids?: Readonly<Record<string, string>>
```

- Consumes `configurationIndex.xmlValue(address)?.extended` and YAML `Контроль: string[]`.

- [ ] **Step 1: Write failing recursive augmenter tests**

Проверить, что зарегистрированный обработчик вызывается для корневого metadata-item, вложенного реквизита и реквизита табличной части, каждый раз с текущим логическим адресом. Общий конвертер не должен содержать строк `ObjectBelonging`, `ExtendedConfigurationObject` или `Контроль`.

- [ ] **Step 2: Run augmenter tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/orchestration/property/yamlToXmlAugmenter.test.ts`

Expected: FAIL — реестр отсутствует.

- [ ] **Step 3: Invoke augmenters at the metadata-item boundary**

После заполнения всех outputs в `convertPropertiesFromYAMLToXML`, но до возврата, вызвать обработчик для `context.exportToXML.componentKind`. Логический адрес брать только из `configurationIndex.logicalAddress`; общая функция не ветвится по виду компонента или `itemType`.

- [ ] **Step 4: Write extension-state output tests**

```ts
expect(properties.ObjectBelonging).toBe("Adopted")
expect(properties.ExtendedConfigurationObject).toBe(BASE_UUID)
expect(internalInfo["xr:PropertyState"]).toEqual([
  { "xr:Property": "ExtendedConfigurationObject", "xr:State": "Notify" },
  { "xr:Property": "Format", "xr:State": "Notify" },
  { "xr:Property": "Form", "xr:State": "Extended" },
])
```

Проверить:

- собственный адрес не получает `Adopted` и базовый UUID;
- `Контроль` содержит только YAML-имена, неизвестное имя даёт диагностическую ошибку с логическим адресом;
- `Notify` создаётся только для перечисленных YAML-свойств;
- `Extended` берётся только из снимка `cfe`;
- при одновременном `Notify` и сохранённом `Extended` одного свойства в XML остаётся `Notify`;
- порядок `xr:PropertyState` повторяет порядок properties в `rules.ts`, а не порядок массива YAML.

- [ ] **Step 5: Implement the cfe augmenter**

```ts
const adoptedUuid = context.exportToXML.adoptedUuids?.[logicalAddress]
if (adoptedUuid !== undefined) {
  writeRuleProperty(outputs, rule, "objectBelonging", "Adopted")
  writeRuleProperty(outputs, rule, "extendedConfigurationObject", adoptedUuid)
}

const notify = new Set(readControl(yaml))
const states = orderedRuleProperties(rule).flatMap(({ propertyKey, propertyRule }) => {
  const yamlName = propertyRule.yaml
  const xmlName = propertyRule.xml ?? capitalize(propertyKey)
  if (typeof yamlName === "string" && notify.has(yamlName)) {
    return [{ "xr:Property": xmlName, "xr:State": "Notify" }]
  }
  return context.exportToXML.configurationIndex?.source
    .xmlValue(propertyLogicalAddress(context, propertyKey))?.extended === true
    ? [{ "xr:Property": xmlName, "xr:State": "Extended" }]
    : []
})
writePropertyStates(outputs, states)
```

Доступ к конкретным property keys и XML-контейнеру остаётся в `configurationExtension/exportPropertyStates.ts`; общий реестр только вызывает обработчик.

- [ ] **Step 6: Run recursive and extension tests**

Run: `pnpm --filter @nkdk/core test -- metadata/orchestration/property/yamlToXmlAugmenter.test.ts metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/orchestration packages/core/metadata/appliedObjects/configurationExtension packages/core/metadata/context packages/core/metadata/fullSyncToXml
git commit -m "feat: :sparkles: восстанавливать служебные свойства cfe"
```

---

### Task 7: Ленивое построение `BaseForm`

**Files:**
- Create: `packages/core/metadata/forms/clientApplicationForm/baseForm.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/baseForm.test.ts`
- Create: `packages/core/metadata/fullSyncToXml/baseFormSource.ts`
- Create: `packages/core/metadata/fullSyncToXml/baseFormSource.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`

**Interfaces:**
- Produces:

```ts
export interface BaseFormSource {
  read(params: {
    extensionAssignment: FullXmlSyncAssignment
    baseProjectPath: string
  }): Promise<PreparedYamlFile>
}

export function createVerifiedBaseFormSource(params: {
  baseStructure: ComponentProjectStructure
  baseHashes: ComponentHashState
}): BaseFormSource

export function buildClientApplicationBaseForm(params: {
  context: ConfigurationContextWithExportToXML
  baseYaml: ClientApplicationFormYAML
  extensionYaml: ClientApplicationFormYAML
  formName: string
}): ClientApplicationFormXML
```

- `convertClientApplicationFormFromYAMLToXML` gains optional `baseFormXML?: ClientApplicationFormXML` and embeds it as `formXML.BaseForm`.

- [ ] **Step 1: Write failing own/adopted form source tests**

```ts
await prepareExtensionForm(ownAssignment)
expect(readBaseYaml).not.toHaveBeenCalled()

await prepareExtensionForm(adoptedAssignment)
expect(readBaseYaml).toHaveBeenCalledExactlyOnceWith(
  "Справочники/СправочникПолный/Формы/ФормаЭлемента/Форма.yaml",
)
```

Добавить тест изменения базовой YAML-формы после получения `baseHashes`: чтение завершается ошибкой `full_xml_sync_base_form_changed`.

- [ ] **Step 2: Run base-form source tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/fullSyncToXml/baseFormSource.test.ts`

Expected: FAIL — ленивого источника нет.

- [ ] **Step 3: Implement verified lazy reading**

`createVerifiedBaseFormSource` строит lookup `projectPath → contentHash`, но не читает файлы. Метод `read`:

1. требует, чтобы путь был `content`-ресурсом `cf` с ролью формы;
2. читает один файл;
3. сравнивает `hashFileBytes(bytes)` с подтверждённым хэшем;
4. разбирает только этот YAML;
5. возвращает `PreparedYamlFile`.

- [ ] **Step 4: Write the failing BaseForm conversion test**

Использовать существующие YAML формы и сравнить построенный объект с узлом `BaseForm` из неизменяемой XML-фикстуры:

```ts
const result = buildClientApplicationBaseForm({
  context,
  baseYaml,
  extensionYaml,
  formName: "ФормаЭлемента",
})
expect(result).toEqual(referenceExtensionXml.Form.BaseForm)
expect(result).not.toHaveProperty("_xmlns")
expect(result._version).toBe("2.20")
```

Проверить, что DataPath и идентификаторы строятся в контексте итоговой формы расширения, а не копируются из XML основной конфигурации.

- [ ] **Step 5: Implement BaseForm through existing form rules**

Вызвать `convertClientApplicationFormFromYAMLToXML` для базового YAML с контекстом, содержащим индексы и реквизиты итоговой формы расширения. Из результата взять тело формы, удалить корневые namespace-атрибуты, сохранить `_version`, затем передать как `baseFormXML` при преобразовании итоговой формы:

```ts
const baseForm = stripRootNamespaces(
  convertClientApplicationFormFromYAMLToXML({
    context: contextForExtensionForm,
    yaml: params.baseYaml,
    name: params.formName,
  }).formXML,
)

return { ...baseForm, _version: baseForm._version ?? "2.20" }
```

Не читать исходный XML `cf` и не сохранять `BaseForm` в index collector.

- [ ] **Step 6: Release both forms after assignment write**

В worker держать `basePreparedYamlFile` только в локальной области текущего `try`; после `writeFullXmlSyncAssignment` не сохранять ссылку в state. Тест состояния worker должен подтвердить отсутствие обеих форм.

- [ ] **Step 7: Run form and worker tests**

Run: `pnpm --filter @nkdk/core test -- metadata/forms/clientApplicationForm/baseForm.test.ts metadata/fullSyncToXml/baseFormSource.test.ts metadata/fullSyncToXml/worker.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/forms/clientApplicationForm packages/core/metadata/fullSyncToXml
git commit -m "feat: :sparkles: лениво строить BaseForm заимствованной формы"
```

---

### Task 8: Общий координатор и пересборка снимка выбранного компонента

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/failureIntegration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/integration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/determinism.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/index.ts`
- Modify: `packages/core/index.ts`

**Interfaces:**
- Public API becomes component-neutral while retaining the current export alias:

```ts
export interface SyncComponentToXmlParams {
  readonly context: ConfigurationContext
  readonly projectDir: string
  readonly componentPath: string
  readonly xmlDir: string
  readonly selection?: XmlSyncSelection
  readonly concurrency?: number
  readonly transferConcurrency?: number
}

export async function syncComponentToXml(
  params: SyncComponentToXmlParams,
): Promise<FullXmlSyncResult>

export const syncConfigurationToXml = syncComponentToXml
```

- The coordinator calls providers in this order: preflight, address/profile, target structure, target snapshot, target hashes, target indexes, optional base structure/snapshot/hashes/indexes, profile confirmation, selection, worker, external files, output validation, new target snapshot.

- [ ] **Step 1: Rewrite coordinator order tests**

Для `cf`:

```ts
expect(events).toEqual([
  "preflight",
  "targetStructure",
  "targetSnapshot",
  "targetHashes",
  "targetIndexes",
  "confirmTarget",
  "buildSelection",
  "execute",
  "transferExternal",
  "validateOutput",
  "writeTargetSnapshot",
])
```

Для `cfe` между target indexes и profile confirmation ожидаются `baseStructure`, `baseSnapshot`, `baseHashes`, `baseIndexes`; запись должна содержать только `writeTargetSnapshot`.

- [ ] **Step 2: Run coordinator tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/fullSyncToXml/syncConfiguration.test.ts`

Expected: FAIL — координатор принимает только `cf` и использует два worker-прохода.

- [ ] **Step 3: Implement the shared coordinator**

Разрешить адрес через `parseComponentPath`, профиль через реестр Task 4 и всегда передавать `selection ?? { kind: "all" }`. Для `cfe` получать ровно один `baseAddress` профиля. В общих ветвях не сравнивать строковые пути `cf`/`cfe`.

- [ ] **Step 4: Rebuild the complete target snapshot**

```ts
const indexData: ConfigurationIndexData = {
  binding: {
    ...previous.binding,
    producerVersion: NKDK_CORE_VERSION,
    indexGeneration: previous.binding.indexGeneration + 1n,
  },
  projectFiles: target.hashes.projectFiles,
  identities: execution.fragmentData.identities,
  xmlNodes: execution.fragmentData.xmlNodes,
  xmlValues: execution.fragmentData.xmlValues,
  localIndexes: {
    metadata: serializeSharedValidationSnapshot(target.indexes.metadata),
    dependencies: target.indexes.dependencies,
    logicalAddresses: target.indexes.logicalAddresses,
  },
}
```

Снимок `cfe` не включает base indexes, `adoptedUuids`, `BaseForm` или другие расширения. Снимок записывать только после успешной проверки всех XML и внешних файлов; это не требует удерживать XML в памяти.

- [ ] **Step 5: Add snapshot-preservation and no-rollback tests**

Сценарии:

- worker записал первый XML и упал на втором;
- внешний файл изменился после хэширования;
- отсутствует UUID заимствованного дочернего элемента;
- базовая форма изменилась.

Во всех сценариях байты прежнего `configuration-index.bin` остаются равны исходным, а уже готовые XML остаются в каталоге.

- [ ] **Step 6: Prove `all` and explicit full `selected` are identical**

Запустить один fixture в два пустых XML-каталога и сравнить все файлы и новый снимок, нормализовав только `indexGeneration`, если тест использует разные исходные поколения.

- [ ] **Step 7: Run coordinator and integration tests**

Run: `pnpm --filter @nkdk/core test -- metadata/fullSyncToXml`

Expected: PASS для существующей `cf` и новой `cfe` ветви.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/fullSyncToXml packages/core/index.ts
git commit -m "feat: :sparkles: синхронизировать cf и cfe общим координатором"
```

---

### Task 9: Полное удаление `ConfigDumpInfo` из проекта

**Files:**
- Delete: `packages/core/metadata/fullSyncToXml/writeConfigDumpInfo.ts`
- Delete: `packages/core/metadata/fullSyncToXml/writeConfigDumpInfo.test.ts`
- Delete: `packages/core/metadata/appliedObjects/configDumpInfo/`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/register.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/core/metadata/fullSyncToXml/testHelpers.ts`
- Modify: `packages/core/tests/mockContext.ts`
- Modify: `packages/core/tests/readAndParseXMLFile.ts`
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/services/syncToXml.ts`

**Interfaces:**
- Removes `ToXMLConfigurationContext.configDumpInfo`.
- Removes the resource-topology registration for `ConfigDumpInfo.xml`.
- Existing XML operations treat a platform-created `ConfigDumpInfo.xml` as an unmanaged file: they neither create nor modify nor delete it.

- [ ] **Step 1: Write failing ownership tests**

Добавить в full-sync integration:

```ts
await syncComponentToXml(params)
expect(fs.existsSync(join(xmlDir, "ConfigDumpInfo.xml"))).toBe(false)
expect(index.identities.some(({ logicalAddress }) =>
  logicalAddress.includes("ConfigDumpInfo"),
)).toBe(false)
```

В legacy incremental test заранее создать `ConfigDumpInfo.xml` с контрольным содержимым, выполнить операцию и проверить точное сохранение bytes.

- [ ] **Step 2: Run ownership tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/fullSyncToXml/integration.test.ts metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`

Expected: FAIL — текущий код создаёт либо обновляет `ConfigDumpInfo.xml`.

- [ ] **Step 3: Remove the generator and context state**

Удалить весь каталог и импорты. `exportToXML` contexts теперь создаются так:

```ts
exportToXML: {
  itemsTree: [],
  version: context.version,
  context: {
    forms: [],
    templates: [],
    parentName: "",
    metadataForNumbering: [],
  },
}
```

Из `configuration/register.ts` удалить декларацию `ConfigDumpInfo.xml`. Из full coordinator удалить dependency `writeConfigDumpInfo`, прибавление к `succeeded` и фрагмент снимка.

- [ ] **Step 4: Stop legacy operations from touching the platform file**

Из `syncToXML.ts` и `incrementalSyncToXML.ts` удалить вызовы `syncConfigDumpInfoToXML`, `updateConfigDumpInfoVersionsToXML`, трекинг записи и специальные ветви удаления. Не заменять их копированием или пустым генератором.

- [ ] **Step 5: Prove there are no production references**

Run:

```bash
rg -n "ConfigDumpInfo|configDumpInfo" packages/core packages/mcp \
  --glob '*.ts' \
  --glob '!**/*.test.ts' \
  --glob '!**/__fixtures__/**'
```

Expected: no output.

Допустимы только неизменяемые XML-фикстуры и отрицательные тесты, утверждающие отсутствие файла.

- [ ] **Step 6: Run core tests and type-check**

Run: `pnpm --filter @nkdk/core test`

Expected: PASS.

Run: `pnpm --filter @nkdk/core type-check`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A packages/core packages/mcp
git commit -m "refactor!: :fire: удалить генерацию ConfigDumpInfo" \
  -m "BREAKING CHANGE: NKDK больше не создаёт и не обновляет ConfigDumpInfo.xml."
```

---

### Task 10: MCP-доступ к синхронизации расширения

**Files:**
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/services/syncToXml.ts`
- Modify: `packages/mcp/src/services/syncToXml.test.ts`
- Modify: `packages/core/index.ts`

**Interfaces:**
- `loadCoreApi().syncConfigurationToXML` points to the component-neutral coordinator.
- MCP passes `projectDir`, `componentPath`, `xmlDir`, `context` and concurrency; `yamlDir` is no longer an independently trusted path.
- Planning mode calls the same providers/profile/selection with no XML writes.

- [ ] **Step 1: Replace the unsupported-cfe test**

```ts
await syncToXml({
  projectDir,
  componentPath: "cfe/Дополнение",
  xmlDir,
  allowWrite: true,
}, deps)

expect(deps.syncConfigurationToXML).toHaveBeenCalledWith(expect.objectContaining({
  projectDir,
  componentPath: "cfe/Дополнение",
  xmlDir,
}))
```

Добавить проверки `cfe` без имени и несовпадения пути компонента с каталогом.

- [ ] **Step 2: Run MCP tests and verify failure**

Run: `pnpm --filter @nkdk/mcp test -- src/services/syncToXml.test.ts`

Expected: FAIL — сервис возвращает `Синхронизация расширений конфигурации в XML пока не поддерживается`.

- [ ] **Step 3: Remove the cfe rejection and duplicate context types**

Удалить `isConfigurationExtensionPath`, локальный `ConfigDumpInfo` и поле `yamlDir`. Использовать экспортированные из core типы там, где это допускает ленивый `loadCoreApi`; динамический интерфейс должен точно повторять `SyncComponentToXmlParams`.

- [ ] **Step 4: Test planning and write modes for both profiles**

Табличный тест для `cf` и `cfe/Дополнение` проверяет:

- `allowWrite !== true` вызывает только планирование;
- `allowWrite === true` вызывает синхронизацию;
- диагностики core отображаются без изменения кодов;
- `configurationIndexPath` указывает на снимок выбранного компонента.

- [ ] **Step 5: Run MCP tests and type-check**

Run: `pnpm --filter @nkdk/mcp test`

Expected: PASS.

Run: `pnpm --filter @nkdk/mcp type-check`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/index.ts packages/mcp
git commit -m "feat: :sparkles: открыть XML-синхронизацию cfe через MCP"
```

---

### Task 11: Интеграционная и приёмочная проверка `cf`/`cfe`

**Files:**
- Create: `packages/core/metadata/fullSyncToXml/configurationExtensionIntegration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/integration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/testHelpers.ts`
- Modify: `docs/superpowers/specs/2026-07-25-unified-xml-sync-design.md` only if implementation reveals a necessary, approved correction

**Interfaces:**
- Consumes the public `syncComponentToXml`.
- Produces no new production API.

- [ ] **Step 1: Add a minimal cfe integration fixture builder**

Тестовый builder создаёт временный NKDK-проект с:

- синхронизированным `cf` snapshot;
- собственным объектом и собственным реквизитом `cfe`;
- заимствованным объектом и заимствованным реквизитом;
- собственной формой;
- заимствованной формой с полной итоговой YAML.

XML-ожидания читать из существующих неизменяемых fixture-файлов либо задавать точечными утверждениями; существующие XML-фикстуры не редактировать.

- [ ] **Step 2: Add end-to-end assertions**

```ts
expect(adoptedCatalog.Properties.ObjectBelonging).toBe("Adopted")
expect(adoptedCatalog.Properties.ExtendedConfigurationObject).toBe(baseCatalogUuid)
expect(adoptedAttribute.Properties.ExtendedConfigurationObject).toBe(baseAttributeUuid)
expect(ownCatalog.Properties.ExtendedConfigurationObject).toBeUndefined()
expect(adoptedForm.Form.BaseForm).toEqual(expect.objectContaining({ _version: "2.20" }))
expect(ownForm.Form.BaseForm).toBeUndefined()
expect(fs.existsSync(join(xmlDir, "ConfigDumpInfo.xml"))).toBe(false)
```

Проверить, что snapshot `cfe` содержит только его `componentPath`, текущие project hashes, локальные indexes и новые XML fragments.

- [ ] **Step 3: Run all focused synchronization tests**

Run: `pnpm --filter @nkdk/core test -- metadata/fullSyncToXml metadata/appliedObjects/configurationExtension metadata/forms/clientApplicationForm/baseForm.test.ts`

Expected: PASS.

- [ ] **Step 4: Run full repository verification**

Run: `pnpm test`

Expected: PASS во всех `packages/*`.

Run: `pnpm --filter @nkdk/core type-check`

Expected: PASS.

Run: `pnpm --filter @nkdk/mcp type-check`

Expected: PASS.

- [ ] **Step 5: Run acceptance sync on the real configuration**

Создать отдельный корень результатов:

```bash
NKDK_XML_SYNC_ACCEPTANCE_ROOT="$(mktemp -d)"
```

Запустить MCP:

```bash
pnpm --filter @nkdk/mcp dev
```

Через MCP вызвать `sync_to_xml` для основной конфигурации:

```text
projectDir=/Users/nikita/git/round-trip
componentPath=cf
xmlDir=$NKDK_XML_SYNC_ACCEPTANCE_ROOT/cf
```

Затем получить имена только непосредственных каталогов:

```bash
find /Users/nikita/git/round-trip/cfe -mindepth 1 -maxdepth 1 -type d -exec basename {} \;
```

Для каждого выведенного имени `ИМЯ` последовательно вызвать:

```text
projectDir=/Users/nikita/git/round-trip
componentPath=cfe/ИМЯ
xmlDir=$NKDK_XML_SYNC_ACCEPTANCE_ROOT/cfe/ИМЯ
```

Expected: `failed=[]`, снимок `cf` не меняется во время синхронизации `cfe`, ни в одном результате нет созданного `ConfigDumpInfo.xml`.

- [ ] **Step 6: Verify platform loading where a local 1C test base is available**

При заданных `NKDK_1C_DATA` и `NKDK_1C_DB_PATH` загрузить сначала `cf`, затем весь каталог расширений командами `ibcmd` 8.3.27:

```bash
ibcmd infobase create \
  --data "$NKDK_1C_DATA" \
  --db-path "$NKDK_1C_DB_PATH" \
  --import "$NKDK_XML_SYNC_ACCEPTANCE_ROOT/cf" \
  --apply \
  --force

ibcmd infobase config import all-extensions \
  --data "$NKDK_1C_DATA" \
  --db-path "$NKDK_1C_DB_PATH" \
  "$NKDK_XML_SYNC_ACCEPTANCE_ROOT/cfe"
```

Expected: обе команды завершаются с кодом `0`; платформа принимает XML без ручной правки файлов, ошибки UUID, `BaseForm` или формата расширения отсутствуют. Договор команд сверить с [официальным описанием `ibcmd infobase config import`](https://kb.1ci.com/1C_Enterprise_Platform/Guides/Administrator_Guides/1C_Enterprise_8.3.27_Administrator_Guide/Appendix_4._Startup_command_lines_of_system_components_and_description_of_additional_utilities/4.10._Standalone_server_administration_utility__ibcmd_/4.10.4._infobase_mode/?language=en).

- [ ] **Step 7: Commit final tests**

```bash
git add packages/core/metadata/fullSyncToXml docs/superpowers/specs/2026-07-25-unified-xml-sync-design.md
git commit -m "test: :white_check_mark: проверить полную синхронизацию cf и cfe"
```
