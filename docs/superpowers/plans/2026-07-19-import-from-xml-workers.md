# Two-Pass XML Import Workers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить текущий import из готовой XML-выгрузки на двухпроходную обработку в worker с общим индексом метаданных, безопасной публикацией файлов и записью индекса конфигурации последним.

**Architecture:** Главный процесс только обходит XML-выгрузку, классифицирует пути декларативными маршрутами, распределяет задания и публикует готовые файлы. Worker первого прохода читают XML, строят metadata-модели, извлекают сведения владельцев и фрагменты индекса; после барьера те же worker получают единый неизменяемый снимок метаданных и строят YAML во временных каталогах. Главный процесс перемещает worker-файлы, копирует внешние файлы из XML, хэширует итоговый Проект и атомарно записывает `.nkdk/configuration-index/default.bin`.

**Tech Stack:** TypeScript 6, Node.js 26, Piscina 5, `SharedArrayBuffer`, `p-limit`, Vitest 4, существующие `rules.ts` и metadata-регистры.

## Global Constraints

- Требования импорта: `docs/superpowers/specs/2026-07-19-import-worker-design.md` и `.agents/architecture.md`.
- План зависит от завершённого `docs/superpowers/plans/2026-07-19-configuration-index-v1.md`.
- Вход первой реализации — готовый каталог XML-выгрузки; подключение к 1С, получение выгрузки и проверка версии Конфигурации не реализуются.
- Используется одна привязка `default`; `baseFingerprint` и `configurationVersion` в индексе пусты.
- Одно задание импорта формирует ровно один итоговый YAML-файл.
- Содержимое XML читает только назначенный worker; обработчик worker никогда не выполняется в главном процессе, включая `concurrency = 1`.
- Все XML-файлы одного задания закрепляются за одним worker на оба прохода.
- Полные XML-данные и metadata-модели не передаются главному процессу или другим worker.
- Worker освобождает разобранный XML после первого прохода, а metadata-модель — после попытки построения YAML во втором проходе.
- Неизвестный файл или конфликт декларативных маршрутов останавливает import до запуска worker.
- `ПутьКДанным` разрешается только через локальные сведения формы и один общий снимок метаданных; YAML-файлы Проекта для этого не читаются.
- Неразрешённый `ПутьКДанным` сохраняется без изменения и возвращается как предупреждение.
- Никакие файлы не публикуются до успешного построения всех YAML.
- YAML и созданные worker файлы перемещаются из `.nkdk/tmp/import/<operation-id>/`; внешние файлы XML-выгрузки копируются.
- Каждый файл заменяется атомарно, но публикация всего набора не является транзакцией и не откатывается.
- Проект перед import не очищается; устаревшие файлы могут сохраниться.
- Файл индекса конфигурации записывается последним, только после публикации и хэширования фактического Проекта.
- После успеха временный корень удаляется; после любой ошибки сохраняется, а его путь возвращается вызывающей стороне.
- Аварийно завершившийся worker не перезапускается, его задания не повторяются.
- Существующие XML-фикстуры не изменять; новые правила fromXML/toXML/fromYAML/toYAML без явной необходимости не создавать.

---

## File Structure

- `packages/core/metadata/importFromXml/types.ts` — задания, результаты проходов, диагностика и планы файлов.
- `packages/core/metadata/importFromXml/routes.ts` — нейтральный договор декларативных XML-маршрутов.
- `packages/core/metadata/importFromXml/discovery.ts` — рекурсивный обход путей без чтения XML.
- `packages/core/metadata/importFromXml/prepareModel.ts` — чтение файлов одного задания и построение metadata-модели без записи Проекта.
- `packages/core/metadata/importFromXml/ownerFacts.ts` — сведения владельцев для общего снимка.
- `packages/core/metadata/importFromXml/worker.ts` — два прохода и состояние одного worker.
- `packages/core/metadata/importFromXml/workerPool.ts` — статическое распределение, барьеры и аварийное завершение.
- `packages/core/metadata/importFromXml/transfer.ts` — проверка целевых путей, move/copy и атомарная замена отдельных файлов.
- `packages/core/metadata/importFromXml/importConfiguration.ts` — главный координатор операции.
- `packages/core/metadata/importFromXml/index.ts` — экспорты нового механизма.
- `packages/core/metadata/configurationIndex/collector/*` — rule-guided сбор `uid`, идентификаторов, XML-порядка и значений на основе `reference-order-spec`.
- `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts` — совместимый переходник `syncConfigurationFromXML`.

### Task 1: Убрать выполнение validation worker в главном процессе

**Files:**
- Create: `packages/core/metadata/validation/validateProjectPartial.ts`
- Create: `packages/core/metadata/validation/validateProjectWorkerBoundary.test.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/metadata/project/preparedYamlProject.test.ts`

**Interfaces:**
- Preserves: `createPreparedYamlProjectWorkerPool(params)`.
- Produces: `validateProjectPartial(params)` as the existing dependency-aware partial validation engine, callable only by the worker entry point.
- Produces: `PreparedYamlProjectWorkerPool.runPartialValidation(params)`.
- Changes invariant: every `prepare`, `initValidation`, `validateFirstPass`, `validateSecondPass`, and `validatePartial` command goes through `PreparedWorkerPool.run`.

- [ ] **Step 1: Write failing tests for both main-process exceptions**

Add an injected-pool test for `concurrency = 1` with one real descriptor:

```ts
it("uses the worker pool when concurrency is one", async () => {
  const run = vi.fn(async (task: PreparedYamlProjectWorkerTask) => {
    if (task.kind === "prepare") return preparedResultFor(task.files)
    throw new Error(`unexpected task: ${task.kind}`)
  })
  const pool = createPreparedYamlProjectWorkerPool({
    concurrency: 1,
    createWorkerPool: () => ({ run, destroy: vi.fn(async () => undefined) }),
  })

  await pool.run({ projectDir, context: validationContext, files: [descriptor] })

  expect(run).toHaveBeenCalledOnce()
  await pool.close()
})
```

Keep the existing empty-partition case separately: an empty partition creates no worker and invokes no handler.

Extend the worker-pool seam accepted by `createValidationWorkerPoolHandle` and test the single-file path:

```ts
it("validates one file through the persistent worker", async () => {
  const run = vi.fn(async (task: PreparedYamlProjectWorkerTask) => {
    expect(task).toMatchObject({ kind: "validatePartial", filePath: "Справочник/Товары/Свойства.yaml" })
    return { kind: "validatePartialResult", diagnostics: [] }
  })
  const handle = createValidationWorkerPoolHandle({
    concurrency: 1,
    createWorkerPool: () => ({ run, destroy: vi.fn(async () => undefined) }),
  })

  await expect(handle.validateProject({ projectDir, filePath: "Справочник/Товары/Свойства.yaml" })).resolves.toEqual({
    diagnostics: [],
  })
  expect(run).toHaveBeenCalledOnce()
  await handle.close()
})
```

- [ ] **Step 2: Run the tests against the two current shortcuts**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts metadata/validation/validateProject.test.ts -t "worker"`

Expected: FAIL because `concurrency = 1` still calls the handler directly and `filePath` still calls `validateProjectInProcess`.

- [ ] **Step 3: Extract the existing partial-validation engine**

Move `validateProjectInProcess` and its private queue/dependency helpers from `validateProject.ts` to `validateProjectPartial.ts` without changing their behavior. Export only:

```ts
export async function validateProjectPartial(params: {
  projectDir: string
  filePath: string
  context: ConfigurationContext
}): Promise<{ diagnostics: Diagnostic[] }>
```

The extracted engine keeps its current dependency queue: it reads the requested YAML and only dependencies discovered from that file. Do not adapt it to full-project preparation and do not move its reads back to the coordinator.

- [ ] **Step 4: Add the partial-validation worker command**

Extend the worker union and result union:

```ts
| {
    kind: "validatePartial"
    workerIndex: number
    projectDir: string
    filePath: string
    context: ConfigurationContext
  }

| {
    kind: "validatePartialResult"
    diagnostics: Diagnostic[]
  }
```

`preparedYamlProjectWorker.ts` handles the command by calling `validateProjectPartial`; therefore every YAML read performed by partial validation occurs inside the worker.

- [ ] **Step 5: Route every command through the pool**

Replace each conditional direct call with the same expression:

```ts
const response = (await getOrCreatePool(pools, index, createPool).run(task)) as PreparedYamlProjectWorkerTaskResult
```

Remove the default-function import `runPreparedYamlProjectWorkerTask`; retain only the imported task/result types. Add `runPartialValidation` to the pool; it reserves worker `0`, sends `validatePartial`, validates the result kind, and returns its diagnostics. Keep the worker filename construction in `createWorkerPool()` unchanged.

- [ ] **Step 6: Route both public validation APIs through the worker**

For a one-shot `validateProject({ filePath })`, create a pool, call `runPartialValidation`, and close the pool in `finally`. The persistent handle calls the same pool method and keeps its existing exclusive-run serialization. Remove `validateProjectInProcess` from `validateProject.ts` entirely.

Add `validateProjectWorkerBoundary.test.ts` to read both source modules and assert that `preparedYamlProjectWorkerPool.ts` contains no `params.concurrency === 1` branch and `validateProject.ts` contains no call to `validateProjectInProcess`.

- [ ] **Step 7: Run prepared-project and validation parity tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts metadata/validation/validateProject.test.ts metadata/validation/validateProjectWorkerBoundary.test.ts`

Expected: PASS; diagnostics for `concurrency = 1` and parallel validation remain equal.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/project/preparedYamlProjectWorker.ts packages/core/metadata/project/preparedYamlProjectWorkerPool.ts packages/core/metadata/project/preparedYamlProject.test.ts packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/validateProjectPartial.ts packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/validation/validateProjectWorkerBoundary.test.ts
git commit -m "refactor: :recycle: всегда выполнять validation в worker"
```

### Task 2: Декларативные маршруты и обнаружение заданий

**Files:**
- Create: `packages/core/metadata/importFromXml/types.ts`
- Create: `packages/core/metadata/importFromXml/routes.ts`
- Create: `packages/core/metadata/importFromXml/routes.test.ts`
- Create: `packages/core/metadata/importFromXml/discovery.ts`
- Create: `packages/core/metadata/importFromXml/discovery.test.ts`
- Create: `packages/core/metadata/importFromXml/index.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalFromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childSubsystemNames/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/externalFile/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/externalPicture/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/help/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/module/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/recalculation/register.ts`
- Modify: `packages/core/metadata/commonObjects/wsDefinitionSchemas/fromXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/propertyRules.ts`

**Interfaces:**
- Produces: `XmlImportRoute`, `ImportAssignment`, `ImportExternalFile`, `ImportIgnoredFile`.
- Produces: `describeRegisteredXmlImportRoutes(): readonly XmlImportRoute[]`.
- Produces: `discoverXmlImport(params): Promise<{ assignments: ImportAssignment[] }>`; every external file belongs to exactly one assignment.

- [ ] **Step 1: Define the neutral contracts**

```ts
export type ImportAssignmentRole = "configuration" | "properties" | "fileItem"

export interface ImportXmlInput {
  role: "metadata" | "body" | "property"
  sourcePath: string
}

export interface ImportAssignment {
  id: string
  role: ImportAssignmentRole
  targetProjectPath: string
  itemType: string
  itemName: string
  logicalAddress: string
  owner: { itemType: string; name: string; logicalAddress: string } | undefined
  xmlFiles: readonly ImportXmlInput[]
  externalFiles: readonly ImportExternalFile[]
}

export interface ImportExternalFile {
  sourcePath: string
  targetProjectPath: string
}

export type XmlImportRoute =
  | {
      kind: "assignment"
      xmlPattern: string
      targetPattern: string
      role: ImportAssignmentRole
      itemType: string
      source: ProjectResourceSource
    }
  | {
      kind: "externalFile"
      xmlPattern: string
      targetPattern: string
      assignmentTargetPattern: string
      source: ProjectResourceSource
    }
  | {
      kind: "ignore"
      xmlPattern: string
      source: ProjectResourceSource
    }
```

Extend `TypeRule` with `xmlImportRoutes?: XmlImportRoutesFunction`; the function returns only neutral patterns and sources.

- [ ] **Step 2: Write route tests for root, object, form, and external files**

```ts
it("describes import without concrete itemType checks in discovery", () => {
  const routes = describeRegisteredXmlImportRoutes()
  expect(routes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ kind: "assignment", xmlPattern: "Configuration.xml", targetPattern: "Конфигурация.yaml" }),
      expect.objectContaining({ kind: "assignment", xmlPattern: "Catalogs/{ownerName}.xml", targetPattern: "Справочник/{ownerName}/Свойства.yaml" }),
      expect.objectContaining({ kind: "assignment", xmlPattern: "Catalogs/{ownerName}/Forms/{itemName}.xml", targetPattern: "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml" }),
      expect.objectContaining({
        kind: "externalFile",
        xmlPattern: "Catalogs/{ownerName}/Forms/{itemName}/Ext/{relativePath...}",
        assignmentTargetPattern: "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
      }),
    ])
  )
})
```

- [ ] **Step 3: Write discovery tests that never read XML contents**

Use a filesystem dependency seam:

```ts
it("builds one assignment per YAML and reports every unknown path", async () => {
  const readFile = vi.fn()
  const result = await discoverXmlImport({
    xmlDir,
    routes: testRoutes,
    fs: { listFiles: async () => fixturePaths, readFile },
  })

  expect(readFile).not.toHaveBeenCalled()
  expect(result.assignments.map((assignment) => assignment.targetProjectPath)).toEqual([
    "Конфигурация.yaml",
    "Справочник/Контрагенты/Свойства.yaml",
    "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
  ])
  expect(result.assignments.at(-1)?.externalFiles).toEqual([
    expect.objectContaining({
      targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Модуль.bsl",
    }),
  ])
})

it("fails before workers for an unknown file", async () => {
  await expect(discoverXmlImport({ xmlDir, routes: testRoutes, fs: fakeFs(["Unknown.bin"]) })).rejects.toMatchObject({
    code: "unknown_xml_dump_file",
    paths: ["Unknown.bin"],
  })
})
```

- [ ] **Step 4: Run and verify failures**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/routes.test.ts metadata/importFromXml/discovery.test.ts`

Expected: FAIL because the route and discovery modules do not exist.

- [ ] **Step 5: Build registered routes from rules**

`routes.ts` MUST iterate `configurationMetadataProjectSpec` and `metadataProjectSpecs`, combine item-level XML declarations with property `xmlImportRoutes`, and recurse through `childCollections`. The common route compiler receives only rule contracts and never compares concrete `itemType`, XML root names, or directories such as `Forms`/`Templates`.

Use one segment matcher for both files and directories:

```ts
export function matchImportPattern(pattern: string, path: string): Record<string, string> | undefined {
  const patternParts = pattern.split("/")
  const pathParts = path.split("/")
  const values: Record<string, string> = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const rest = patternParts[index].match(/^\{([^}]+)\.\.\.\}$/)
    if (rest !== null) {
      if (index !== patternParts.length - 1 || index >= pathParts.length) return undefined
      values[rest[1]] = pathParts.slice(index).join("/")
      return values
    }
    if (index >= pathParts.length) return undefined
    const parameter = patternParts[index].match(/^\{([^}]+)\}$/)
    if (parameter !== null) values[parameter[1]] = pathParts[index]
    else if (patternParts[index] !== pathParts[index]) return undefined
  }
  return patternParts.length === pathParts.length ? values : undefined
}
```

- [ ] **Step 6: Implement discovery and conflict validation**

Recursively list regular files, normalize paths with `/`, sort by UTF-8 bytes, match every path against all routes, and classify it as assignment input, external file, or ignore. Reject zero matches and more than one incompatible match. Group assignment routes by expanded `targetPattern`; all XML inputs of that group become one `ImportAssignment`. Expand `assignmentTargetPattern` for every external match and attach the descriptor to that assignment; reject an external file when its assignment is absent.

Before returning, validate:

```ts
assertUnique(assignments, (assignment) => assignment.targetProjectPath, "Повторный целевой YAML")
assertUnique(assignments.flatMap((assignment) => assignment.externalFiles), (file) => file.targetProjectPath, "Повторный внешний файл")
assertNoCrossKindTargetConflicts(assignments, assignments.flatMap((assignment) => assignment.externalFiles))
assertEveryMetadataXmlBelongsToOneAssignment(assignments)
assertEveryExternalFileBelongsToOneAssignment(assignments)
```

- [ ] **Step 7: Run route/discovery tests and boundary test**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/routes.test.ts metadata/importFromXml/discovery.test.ts metadata/importBoundaries.test.ts`

Expected: PASS and no concrete-object import knowledge in the common layer.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/importFromXml packages/core/metadata/orchestration/property packages/core/metadata/commonObjects packages/core/metadata/forms packages/core/metadata/appliedObjects packages/core/metadata/importBoundaries.test.ts
git commit -m "feat: :sparkles: обнаруживать задания XML-import по правилам"
```

### Task 3: Сбор данных индекса из XML без хранения XML

**Files:**
- Create: `packages/core/metadata/configurationIndex/collector/context.ts`
- Create: `packages/core/metadata/configurationIndex/collector/writer.ts`
- Create: `packages/core/metadata/configurationIndex/collector/collectProperty.ts`
- Create: `packages/core/metadata/configurationIndex/collector/writer.test.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXML.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/childItems/fromXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/fromXML.ts`

**Interfaces:**
- Consumes: `uid` builders and logical records from the configuration-index plan.
- Produces: `ConfigurationIndexCollector` with `setUuid`, `setXmlId`, `setXmlName`, `setOrder`, `setAlias`, `setPresent`, `setXsiNil`, `setExplicitEmpty`, `setXsiType`, `setXmlText`, `setXmlPrefix`, `setUserSettingsId`, and `fragment(targetProjectPath)`.
- Produces: `withConfigurationIndexCollector(context, collector, logicalAddress)`.

- [ ] **Step 1: Port the experiment behavior into focused tests**

```ts
it("collects identity, order, aliases and explicit values by uid", () => {
  const collector = createConfigurationIndexCollector()
  collector.setUuid("Справочник.Товары", "00000000-0000-4000-8000-000000000001")
  collector.setOrder("Справочник.Товары", ["name", "synonym"])
  collector.setAlias("Справочник.Товары", "synonym", "Synonym")
  collector.setPresent("Справочник.Товары", "name")
  collector.setExplicitEmpty("Справочник.Товары.synonym")

  expect(collector.fragment("Справочник/Товары/Свойства.yaml")).toEqual({
    targetProjectPath: "Справочник/Товары/Свойства.yaml",
    identities: [{ logicalAddress: "Справочник.Товары", kind: "uuid", value: "00000000-0000-4000-8000-000000000001" }],
    xmlNodes: [{ logicalAddress: "Справочник.Товары", order: ["name", "synonym"], aliases: { synonym: "Synonym" }, present: ["name"] }],
    xmlValues: [{ logicalAddress: "Справочник.Товары.synonym", explicitEmpty: true }],
  })
})

it("does not expose source XML, XML_REFERENCE_RAW, or collection order", () => {
  expect(Object.keys(createConfigurationIndexCollector())).not.toEqual(
    expect.arrayContaining(["setRawXml", "setXmlReferenceRaw", "setItemOrder"])
  )
})
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/collector/writer.test.ts`

Expected: FAIL because the collector does not exist.

- [ ] **Step 3: Implement the collector as a logical-record writer**

Use maps keyed by `logicalAddress` and a set keyed by `logicalAddress + identity kind`. Normalize record arrays only when `fragment()` is called. Do not add `itemOrder` from the experiment.

```ts
export interface ConfigurationIndexCollector {
  setUuid(address: string, value: string): void
  setXmlId(address: string, value: string): void
  setXmlName(address: string, value: string): void
  setOrder(address: string, keys: readonly string[]): void
  setAlias(address: string, propertyKey: string, sourceXmlKey: string): void
  setPresent(address: string, propertyKey: string): void
  setXsiNil(address: string): void
  setExplicitEmpty(address: string): void
  setXsiType(address: string, value: string): void
  setXmlText(address: string, value: string): void
  setXmlPrefix(address: string, value: string): void
  setUserSettingsId(address: string, value: string): void
  fragment(targetProjectPath: string): ConfigurationIndexFragment
}
```

- [ ] **Step 4: Port only supported hooks from `reference-order-spec`**

Inspect the experiment from repository history with `git show 30edc0e61:packages/core/metadata/referenceStore/context.ts` and use commits `a7e4908b6`, `0eeae452a`, `130992846`, and `30edc0e61` as behavioral references. Replace the experiment writer with `ConfigurationIndexCollector`; retain the existing `uid` paths; deliberately omit `itemOrder` and all `XML_REFERENCE_RAW` branches.

The universal property hook records:

```ts
collector.setOrder(address, importedKeysInSourceOrder)
if (sourceXmlKey !== canonicalXmlKey) collector.setAlias(address, modelKey, sourceXmlKey)
if (presenceAffectsExport) collector.setPresent(address, modelKey)
```

Specific identity hooks record `_uuid`, `_id`, and only non-reconstructible `_name` on the current element `uid`.

- [ ] **Step 5: Add form and applied-object regression tests**

Extend existing fromXML tests to assert fragments for:

```ts
expect(fragment.identities).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ logicalAddress: "Справочник.Контрагенты", kind: "uuid" }),
    expect.objectContaining({ logicalAddress: "Справочник.Контрагенты.Форма.ФормаЭлемента", kind: "uuid" }),
    expect.objectContaining({ logicalAddress: expect.stringContaining(".Элемент."), kind: "xmlId" }),
  ])
)
```

Also assert that collection order from `childItems` is absent.

- [ ] **Step 6: Run collector and affected import tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/collector metadata/orchestration/property/fromXML.test.ts metadata/orchestration/appliedObject/convertFromXML.test.ts metadata/forms/clientApplicationForm/fromXML.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/configurationIndex packages/core/metadata/context/types.ts packages/core/metadata/orchestration packages/core/metadata/forms
git commit -m "feat: :sparkles: извлекать данные индекса при import"
```

### Task 4: Первый проход worker и освобождение XML

**Files:**
- Create: `packages/core/metadata/importFromXml/prepareModel.ts`
- Create: `packages/core/metadata/importFromXml/prepareModel.test.ts`
- Create: `packages/core/metadata/importFromXml/ownerFacts.ts`
- Create: `packages/core/metadata/importFromXml/ownerFacts.test.ts`
- Create: `packages/core/metadata/importFromXml/worker.ts`
- Create: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rootIO.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`

**Interfaces:**
- Produces: `prepareImportModel({ assignment, context, collector }): Promise<PreparedImportModel>` without writing files.
- Produces: `extractImportOwnerFacts(prepared): ValidationOwnerFacts[]` using existing validation owner types.
- Produces worker commands `initialize`, `firstPass`, `secondPass`, `dispose`.

- [ ] **Step 1: Split model preparation from file writing with failing tests**

```ts
it("prepares an applied object without writing YAML or external files", async () => {
  const writeFile = vi.spyOn(fs.promises, "writeFile")
  const prepared = await prepareImportModel({ assignment: catalogAssignment, context, collector })

  expect(prepared.targetProjectPath).toBe("Справочник/Контрагенты/Свойства.yaml")
  expect(prepared.model).toMatchObject({ itemType: "MetadataCatalog", name: "Контрагенты" })
  expect(writeFile).not.toHaveBeenCalled()
})
```

Add equivalent tests for `Конфигурация.yaml` and a form assignment that reads both metadata XML and `Ext/Form.xml` but does not load the owner catalog model.

- [ ] **Step 2: Run and verify failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/prepareModel.test.ts`

Expected: FAIL because `prepareImportModel` does not exist.

- [ ] **Step 3: Introduce pure preparation entry points**

Extract existing logic into functions returning models and generated-file descriptors:

```ts
export interface PreparedImportModel {
  assignment: ImportAssignment
  model: MetadataItem
  rule: MetadataItemRule
  localDataPathIndex?: FormDataPathIndex
  generatedFiles: ExternalFileEntry[]
}
```

The legacy `convertAppliedObjectFromXML` and form writer remain thin wrappers during migration: call the pure preparation function, export YAML, and write using their current paths. They must not be used by the new coordinator.

- [ ] **Step 4: Reuse validation owner facts**

Build `ValidationOwnerFacts` with the existing `createValidationOwnerFacts`, `ObjectFieldIndex`, and `OwnerTypeRef`. Do not introduce an import-only owner schema. Convert the merged facts later through the existing binary shared-owner snapshot.

- [ ] **Step 5: Define worker state and first-pass result**

```ts
type ImportWorkerCommand =
  | { kind: "initialize"; operationId: string; workerIndex: number; context: ConfigurationContextFromXML; tempDir: string }
  | { kind: "firstPass"; assignments: ImportAssignment[] }
  | { kind: "secondPass"; sharedMetadata: SharedValidationSnapshot }
  | { kind: "dispose" }

interface ImportFirstPassResult {
  kind: "firstPassResult"
  ownerFacts: ValidationOwnerFacts[]
  diagnostics: ImportDiagnostic[]
  fragmentBuffer: ArrayBuffer
}

interface ImportSecondPassResult {
  kind: "secondPassResult"
  diagnostics: ImportDiagnostic[]
  warnings: ImportDiagnostic[]
  files: ImportResultFile[]
}
```

Worker module state is a `Map<assignment.id, PreparedImportModel>`. For every assignment, `firstPass` reads and parses XML inside `try/finally`; only `PreparedImportModel`, local DataPath facts, external descriptors, and collector records survive. No parsed XML value is stored in module state or returned.

- [ ] **Step 6: Return a custom Piscina transferable result**

```ts
import { move, transferableSymbol, valueSymbol } from "piscina"

function movableFirstPassResult(result: ImportFirstPassResult): ImportFirstPassResult {
  const transferable = {
    get [transferableSymbol]() {
      return [result.fragmentBuffer]
    },
    get [valueSymbol]() {
      return result
    },
  }
  return move(transferable) as unknown as ImportFirstPassResult
}
```

In the worker unit test, inspect the custom transferable before `move`: its `transferableSymbol` value is exactly `[result.fragmentBuffer]`, and its `valueSymbol` value is the result object. Detachment is a Piscina integration property and is tested through the real pool in Task 6, not by invoking the worker handler directly.

- [ ] **Step 7: Test error aggregation and retained models**

```ts
it("continues first pass after a task error and blocks no other parsing", async () => {
  const result = await runImportWorkerCommand(firstPassWithOneBrokenAndOneValidAssignment)
  expect(result.diagnostics).toHaveLength(1)
  expect(result.diagnostics[0]).toMatchObject({ sourcePath: expect.stringContaining("broken.xml") })
  expect(workerStateForTests().preparedIds).toContain(validAssignment.id)
})
```

- [ ] **Step 8: Run first-pass tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/prepareModel.test.ts metadata/importFromXml/ownerFacts.test.ts metadata/importFromXml/worker.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/core/metadata/importFromXml packages/core/metadata/appliedObjects/configuration packages/core/metadata/orchestration/appliedObject packages/core/metadata/forms/clientApplicationForm
git commit -m "feat: :sparkles: выполнять первый проход XML-import в worker"
```

### Task 5: Общий снимок метаданных и второй проход YAML

**Files:**
- Create: `packages/core/metadata/importFromXml/metadataSnapshot.ts`
- Create: `packages/core/metadata/importFromXml/metadataSnapshot.test.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/formatter.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toYAML.ts`

**Interfaces:**
- Consumes: `ValidationOwnerFacts[]` from every worker.
- Produces: `createImportSharedMetadata(facts): SharedValidationSnapshot`.
- Worker second pass consumes one physical shared snapshot and produces YAML files plus warnings.

- [ ] **Step 1: Write merge conflict and shared-buffer tests**

```ts
it("builds one immutable shared snapshot for all workers", () => {
  const snapshot = createImportSharedMetadata(sampleOwnerFacts())
  expect(snapshot.owners.table).toBeInstanceOf(SharedArrayBuffer)
  expect(snapshot.owners.strings.buffer).toBeInstanceOf(SharedArrayBuffer)
  expect(snapshot.reference.buffer).toBeInstanceOf(SharedArrayBuffer)
})

it("rejects duplicate logical owners before second pass", () => {
  const fact = sampleOwnerFacts()[0]
  expect(() => createImportSharedMetadata([fact, fact])).toThrow("Повторный логический адрес владельца")
})
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/metadataSnapshot.test.ts`

Expected: FAIL because `metadataSnapshot.ts` does not exist.

- [ ] **Step 3: Adapt existing validation snapshot construction**

Convert owner facts to the existing `ValidationObjectTableSnapshot`, then call `createSharedValidationSnapshot`. Keep import-specific code as an adapter; do not duplicate `sharedValidationBinaryOwners`, the shared string pool, or the DataPath owner cache.

```ts
export function createImportSharedMetadata(facts: readonly ValidationOwnerFacts[]): SharedValidationSnapshot {
  const records = normalizeUniqueOwnerFacts(facts).map(ownerFactToValidationObjectRecord)
  return createSharedValidationSnapshot({
    records,
    filePaths: [...new Set(records.map((record) => record.filePath))],
    objectIndexEntries: records.flatMap((record) => record.objectIndexEntries ?? []),
    memberIndexEntries: records.flatMap((record) => record.memberIndexEntries ?? []),
    valueIndexEntries: records.flatMap((record) => record.valueIndexEntries ?? []),
  })
}
```

- [ ] **Step 4: Inject the snapshot into YAML export without `projectDir` reads**

Extend `FormExportToYAMLContext` with an optional read-only `ownerMetadataCache`. In second pass create it from `createOwnerMetadataCacheFromSharedValidationSnapshot`; remove `projectDir` from the context passed by the new import path. DataPath formatting uses the supplied cache first and must not construct `createOwnerMetadataCache(projectDir)` when the cache exists.

```ts
export interface FormExportToYAMLContext {
  toTyped: boolean
  projectDir?: string
  ownerMetadataCache?: OwnerMetadataCache
  externalFilesCollector?: ExternalFileEntry[]
  metadataTargetOwners?: MetadataTargetOwnerContext[]
  formAttributes?: readonly FormDataPathAttributeContext[]
}
```

- [ ] **Step 5: Preserve unresolved DataPath and emit a warning**

Add an optional diagnostic sink to the DataPath formatting request. When `resolveDataPathCore` returns `status: "error"`, return the original string and append:

```ts
{
  severity: "warning",
  code: "unresolved_data_path",
  targetProjectPath,
  value: originalValue,
  message: `Не удалось преобразовать ПутьКДанным: ${originalValue}`,
}
```

Warnings do not enter the error barrier.

- [ ] **Step 6: Implement second-pass state release**

For each saved model, export YAML, write it and generated textual files under the worker temp directory, record the source and target paths, and delete the model from worker state in `finally`. Continue after per-assignment errors. Return all errors and warnings after the loop.

```ts
for (const [id, prepared] of preparedModels) {
  try {
    files.push(...(await writePreparedYamlToTemp(prepared, sharedMetadata, tempDir, warnings)))
    files.push(
      ...prepared.assignment.externalFiles.map((file) => ({
        sourceKind: "xml" as const,
        sourcePath: file.sourcePath,
        targetProjectPath: file.targetProjectPath,
      }))
    )
  } catch (caught) {
    diagnostics.push(importDiagnostic(prepared.assignment, caught))
  } finally {
    preparedModels.delete(id)
  }
}
```

- [ ] **Step 7: Add a cross-object DataPath test**

Build owner facts for `Справочник.Товары` and a form model containing `Объект.Товары.LineNumber`. Assert the second pass writes `Объект.Товары.НомерСтроки` without a YAML file for the catalog in the Project directory. Add a second case with an unknown transition and assert unchanged text plus one warning.

- [ ] **Step 8: Run second-pass and DataPath tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/metadataSnapshot.test.ts metadata/importFromXml/worker.test.ts metadata/validation/dataPath/formatter.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/core/metadata/importFromXml packages/core/metadata/context/types.ts packages/core/metadata/validation/dataPath packages/core/metadata/forms/clientApplicationForm
git commit -m "feat: :sparkles: строить YAML после общего metadata-снимка"
```

### Task 6: Worker pool, барьеры и аварийное завершение

**Files:**
- Create: `packages/core/metadata/importFromXml/workerPool.ts`
- Create: `packages/core/metadata/importFromXml/workerPool.test.ts`
- Modify: `packages/core/scripts/build.mjs`
- Modify: `packages/mcp/scripts/build.mjs`

**Interfaces:**
- Produces: `createXmlImportWorkerPool({ concurrency, createWorkerPool? })`.
- Produces: `runFirstPass(partitions)` and `runSecondPass(sharedMetadata)`.
- Guarantees static round-robin assignment and same-worker state across passes.

- [ ] **Step 1: Write static distribution and command-count tests**

```ts
it("sends one command per pass to each active worker", async () => {
  const pools = createFakePools(2)
  const pool = createXmlImportWorkerPool({ concurrency: 2, createWorkerPool: pools.factory })
  await pool.initialize({ operationId: "op", context, tempRoot })
  await pool.runFirstPass([assignment1, assignment2, assignment3])
  await pool.runSecondPass(sharedMetadata)

  expect(pools.runs(0).map((task) => task.kind)).toEqual(["initialize", "firstPass", "secondPass"])
  expect(pools.runs(1).map((task) => task.kind)).toEqual(["initialize", "firstPass", "secondPass"])
  expect(pools.firstPassIds(0)).toEqual([assignment1.id, assignment3.id])
  expect(pools.firstPassIds(1)).toEqual([assignment2.id])
})
```

- [ ] **Step 2: Write barrier and crash tests**

```ts
it("does not start second pass when any first-pass diagnostic is an error", async () => {
  const result = await pool.runFirstPass(assignments)
  expect(result.diagnostics).toContainEqual(expect.objectContaining({ severity: "error" }))
  await expect(pool.runSecondPass(sharedMetadata)).rejects.toThrow("Первый проход import завершён с ошибками")
})

it("destroys every worker and preserves temp data after a worker crash", async () => {
  pools.failWorker(1, new Error("worker exited"))
  await expect(pool.runFirstPass(assignments)).rejects.toThrow("worker exited")
  expect(pools.destroyCalls()).toEqual([1, 1])
})
```

Add one integration case without `createWorkerPool`: run a minimal real assignment through `concurrency: 1`, decode the returned fragment data, and assert it equals the collector records. This covers the Piscina transfer boundary; the worker unit test from Task 4 covers the declared transfer list.

- [ ] **Step 3: Run and verify failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/workerPool.test.ts`

Expected: FAIL because `workerPool.ts` does not exist.

- [ ] **Step 4: Implement one single-thread Piscina instance per partition**

Follow `preparedYamlProjectWorkerPool.ts`: each active worker index owns one Piscina with `minThreads: 1`, `maxThreads: 1`. Always call `pool.run`; do not add a `concurrency === 1` direct branch. Partition once with round-robin and store active indexes until `close()`.

- [ ] **Step 5: Implement barriers explicitly**

`runFirstPass` waits for every active worker, aggregates all returned diagnostics, validates/merges fragment buffers, and exposes owner facts. `runSecondPass` is legal only after a clean first pass and a successful shared snapshot merge. An error result is not a thrown crash; a rejected Piscina call is a crash and triggers `destroy()` for all pools.

- [ ] **Step 6: Add the worker entry point to both builds**

Build `metadata/importFromXml/worker.ts` as `importFromXmlWorker.js` alongside `preparedYamlProjectWorker.js` in both core and MCP build scripts. Use the same TS `tsx` registration strategy in development.

- [ ] **Step 7: Run pool tests and production builds**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/workerPool.test.ts`

Expected: PASS.

Run: `pnpm --filter @nkdk/core build && pnpm --filter @nkdk/mcp build`

Expected: exit code 0; both distributions contain `importFromXmlWorker.js`.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/importFromXml/workerPool.ts packages/core/metadata/importFromXml/workerPool.test.ts packages/core/scripts/build.mjs packages/mcp/scripts/build.mjs
git commit -m "feat: :sparkles: координировать два прохода XML-import"
```

### Task 7: Публикация файлов и временный каталог

**Files:**
- Create: `packages/core/metadata/importFromXml/transfer.ts`
- Create: `packages/core/metadata/importFromXml/transfer.test.ts`
- Create: `packages/core/metadata/importFromXml/tempDirectory.ts`
- Create: `packages/core/metadata/importFromXml/tempDirectory.test.ts`

**Interfaces:**
- Produces: `createImportTempRoot(projectDir, operationId)`.
- Produces: `mergeImportResultFiles(files)` for the unified worker result.
- Produces: `transferImportResult({ projectDir, files, concurrency }): Promise<void>`.

- [ ] **Step 1: Write path collision and containment tests**

```ts
it("rejects duplicate and escaping target paths before transfer", () => {
  expect(() => mergeImportResultFiles([workerFile("Конфигурация.yaml"), externalFile("Конфигурация.yaml")])).toThrow(
    "Повторный целевой путь"
  )
  expect(() => mergeImportResultFiles([workerFile("../outside.yaml")])).toThrow("вне Проекта")
})
```

- [ ] **Step 2: Write move/copy behavior tests**

```ts
it("moves worker files and copies XML external files", async () => {
  const files = [
    { sourceKind: "worker", sourcePath: workerYaml, targetProjectPath: "Конфигурация.yaml" },
    { sourceKind: "xml", sourcePath: xmlModule, targetProjectPath: "МодульПриложения.bsl" },
  ] as const

  await transferImportResult({ projectDir, files, concurrency: 2 })

  await expect(fs.promises.stat(workerYaml)).rejects.toMatchObject({ code: "ENOENT" })
  expect(await fs.promises.readFile(join(projectDir, "Конфигурация.yaml"), "utf8")).toBe(yamlText)
  expect(await fs.promises.readFile(xmlModule, "utf8")).toBe(moduleText)
  expect(await fs.promises.readFile(join(projectDir, "МодульПриложения.bsl"), "utf8")).toBe(moduleText)
})
```

- [ ] **Step 3: Write partial-publication failure test**

Inject file operations so the second replacement fails. Assert the first target remains replaced, the third was never scheduled, and no rollback occurred.

- [ ] **Step 4: Run and verify failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/transfer.test.ts metadata/importFromXml/tempDirectory.test.ts`

Expected: FAIL because transfer/temp modules do not exist.

- [ ] **Step 5: Implement the temp-root contract**

```ts
export function createImportTempRoot(projectDir: string, operationId = randomUUID()): string {
  if (!/^[A-Za-z0-9_-]+$/.test(operationId)) throw new Error("Некорректный operationId")
  return join(resolve(projectDir), ".nkdk", "tmp", "import", operationId)
}

export function importWorkerTempDir(tempRoot: string, workerIndex: number): string {
  if (!Number.isSafeInteger(workerIndex) || workerIndex < 0) throw new Error("Некорректный workerIndex")
  return join(tempRoot, `worker-${workerIndex}`)
}
```

- [ ] **Step 6: Implement atomic per-file move and copy**

For `sourceKind: "worker"`, create the target parent and rename the source directly to a unique sibling temporary path, then rename it to the target. For `sourceKind: "xml"`, copy into a unique sibling temporary file, sync and close it, then rename it to the target. Validate real target containment before any I/O.

Use `p-limit`; every scheduled closure first checks a shared `aborted` flag. On the first failure set `aborted = true`, let already running closures settle, and reject with the first error. Do not remove already replaced targets.

- [ ] **Step 7: Run focused tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/transfer.test.ts metadata/importFromXml/tempDirectory.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/importFromXml/transfer.ts packages/core/metadata/importFromXml/transfer.test.ts packages/core/metadata/importFromXml/tempDirectory.ts packages/core/metadata/importFromXml/tempDirectory.test.ts
git commit -m "feat: :sparkles: публиковать результат XML-import по файлам"
```

### Task 8: Главный координатор и запись индекса последним

**Files:**
- Create: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Create: `packages/core/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/core/metadata/importFromXml/index.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`
- Modify: `packages/core/index.ts`

**Interfaces:**
- Produces: `importConfigurationFromXml(params): Promise<ConfigurationImportResult>`.
- Preserves: `syncConfigurationFromXML(params)` as a compatibility alias during this release.

- [ ] **Step 1: Define the operation result**

```ts
export interface ConfigurationImportResult {
  succeeded: number
  failed: ImportDiagnostic[]
  warnings: ImportDiagnostic[]
  configurationIndexPath?: string
  preservedTempRoot?: string
}

export interface ImportConfigurationFromXmlParams {
  context: ConfigurationContextFromXML
  inputDir: string
  outputDir: string
  concurrency?: number
  transferConcurrency?: number
  hashConcurrency?: number
  operationId?: string
}
```

- [ ] **Step 2: Write a successful ordering test with injected stages**

```ts
it("writes the index after transfer and hashing and removes temp last", async () => {
  const calls: string[] = []
  const result = await importConfigurationFromXml(params, fakeDependencies({ calls }))

  expect(calls).toEqual([
    "discover",
    "firstPass",
    "mergeMetadata",
    "secondPass",
    "mergeFiles",
    "transfer",
    "hashProject",
    "writeIndex",
    "removeTemp",
    "closeWorkers",
  ])
  expect(result).toMatchObject({ succeeded: assignments.length, failed: [], preservedTempRoot: undefined })
})
```

- [ ] **Step 3: Write barrier tests for every failure phase**

Use `it.each(["discover", "firstPass", "mergeMetadata", "secondPass", "mergeFiles", "transfer", "hashProject", "writeIndex"])`. For every injected failure assert `writeIndex` is absent unless the failure is at `writeIndex`, `removeTemp` is absent, `preservedTempRoot` equals the operation root, and workers are closed. For transfer failure assert already published files remain.

- [ ] **Step 4: Run and verify failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/importConfiguration.test.ts`

Expected: FAIL because the coordinator does not exist.

- [ ] **Step 5: Implement the exact coordinator sequence**

```ts
export async function importConfigurationFromXml(
  params: ImportConfigurationFromXmlParams,
  deps: ImportCoordinatorDependencies = defaultImportDependencies
): Promise<ConfigurationImportResult> {
  const operationId = params.operationId ?? randomUUID()
  const tempRoot = createImportTempRoot(params.outputDir, operationId)
  const pool = deps.createWorkerPool({ concurrency: normalizeConcurrency(params.concurrency) })
  let warnings: ImportDiagnostic[] = []
  try {
    await fs.promises.mkdir(tempRoot, { recursive: true })
    const discovered = await deps.discover({ xmlDir: params.inputDir })
    await pool.initialize({ operationId, context: params.context, tempRoot })
    const first = await pool.runFirstPass(discovered.assignments)
    if (hasErrors(first.diagnostics)) return failedResult(first.diagnostics, [], tempRoot)
    const sharedMetadata = deps.createSharedMetadata(first.ownerFacts)
    const second = await pool.runSecondPass(sharedMetadata)
    warnings = second.warnings
    if (hasErrors(second.diagnostics)) return failedResult(second.diagnostics, second.warnings, tempRoot)
    const files = deps.mergeFiles(second.files)
    await deps.transfer({ projectDir: params.outputDir, files, concurrency: params.transferConcurrency })
    const projectFiles = await deps.hashProject(params.outputDir, { concurrency: params.hashConcurrency })
    const indexData = buildImportedConfigurationIndex({
      producerVersion: NKDK_CORE_VERSION,
      baseId: "default",
      projectFiles,
      fragmentData: first.fragmentData,
    })
    await deps.writeIndex({ projectDir: params.outputDir, data: indexData })
    await deps.removeTemp(tempRoot)
    return successResult(discovered.assignments.length, warnings, params.outputDir)
  } catch (caught) {
    return failedResult([operationDiagnostic(caught)], warnings, tempRoot)
  } finally {
    await pool.close()
  }
}
```

`defaultImportDependencies.removeTemp` calls `fs.promises.rm(tempRoot, { recursive: true, force: true })`. The coordinator uses no direct removal call, so the ordering and failure tests observe the same boundary as production.

When an existing index is readable, set `indexGeneration = previous.indexGeneration + 1n`; otherwise use `1n`. Do not reuse any hashes or XML facts from the old index during import.

- [ ] **Step 6: Replace the old coordinator behind the public export**

Make `syncConfigurationFromXML` call `importConfigurationFromXml` and return the richer result type. Remove `runBatch`, direct top-level directory scanning, root direct writes, and direct `syncExternalFromXML` orchestration from `configuration/convertFromXML.ts`; pure object-local helpers remain for compatibility tests only.

- [ ] **Step 7: Add an end-to-end fixture test**

Using the existing `syncConfiguration/xml` fixture, assert:

```ts
expect(result.failed).toEqual([])
expect(result.warnings).toEqual([])
expect(await fs.promises.readFile(join(outputDir, "Справочник", "Контрагенты", "Свойства.yaml"), "utf8")).toBe(expectedCatalogYaml)
expect(await fs.promises.readFile(join(outputDir, "Справочник", "Контрагенты", "Формы", "ФормаЭлемента", "Форма.yaml"), "utf8")).toBe(expectedFormYaml)
expect((await readConfigurationIndex({ projectDir: outputDir, baseId: "default" })).binding).toMatchObject({
  baseId: "default",
  baseFingerprint: new Uint8Array(),
  configurationVersion: new Uint8Array(),
})
expect(fs.existsSync(join(outputDir, ".nkdk", "tmp", "import", operationId))).toBe(false)
```

Add a nonempty-target case proving stale files are retained, not deleted.

- [ ] **Step 8: Run coordinator and existing configuration import tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/importConfiguration.test.ts metadata/appliedObjects/configuration/convertFromXML.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/core/index.ts packages/core/metadata/importFromXml packages/core/metadata/appliedObjects/configuration/convertFromXML.ts packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts
git commit -m "feat: :sparkles: включить двухпроходный XML-import"
```

### Task 9: MCP и CLI договор результата

**Files:**
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/contracts/importFromXml.ts`
- Modify: `packages/mcp/src/services/importFromXml.ts`
- Modify: `packages/mcp/src/services/importFromXml.test.ts`
- Modify: `packages/mcp/src/guides/index.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/cli/src/commands/import.ts`
- Modify: `packages/cli/src/commands/import.test.ts`

**Interfaces:**
- Consumes: richer `ConfigurationImportResult` from core.
- Produces MCP JSON with `succeeded`, `failed`, `warnings`, optional `configurationIndexPath`, optional `preservedTempRoot`.
- CLI prints warnings separately and prints preserved temp root on failure.

- [ ] **Step 1: Write failing MCP mapping tests**

```ts
it("returns warnings, index path and preserved temp root", async () => {
  const syncConfigurationFromXML = vi.fn().mockResolvedValue({
    succeeded: 1,
    failed: [],
    warnings: [{ code: "unresolved_data_path", message: "path", targetProjectPath: "Форма.yaml", severity: "warning" }],
    configurationIndexPath: "/yaml/.nkdk/configuration-index/default.bin",
  })

  const result = await importFromXml({ xmlDir: "/xml", yamlDir: "/yaml", allowWrite: true }, { syncConfigurationFromXML })

  expect(result).toMatchObject({
    ok: true,
    succeeded: 1,
    warnings: [{ code: "unresolved_data_path", message: "path", targetProjectPath: "Форма.yaml" }],
    configurationIndexPath: "/yaml/.nkdk/configuration-index/default.bin",
  })
})
```

Add an error result case with `preservedTempRoot`.

- [ ] **Step 2: Run and verify failure**

Run: `pnpm --filter @nkdk/mcp exec vitest run src/services/importFromXml.test.ts`

Expected: FAIL because the current contract omits warnings and paths.

- [ ] **Step 3: Extend schemas and mapping without changing input**

Keep `xmlDir`, `yamlDir`, and `allowWrite`; do not add base or connection parameters. Add exact output fields:

```ts
warnings: z.array(z.object({
  code: z.string(),
  message: z.string(),
  targetProjectPath: z.string().optional(),
})),
configurationIndexPath: z.string().optional(),
preservedTempRoot: z.string().optional(),
```

The tool description and guide must state that import does not clean the Project, that an unsuccessful operation preserves `.nkdk/tmp/import/<operation-id>`, and that no connection to 1С is made in this version.

- [ ] **Step 4: Update CLI output tests and implementation**

```ts
for (const warning of result.warnings) process.stderr.write(`⚠ ${warning.message}\n`)
if (result.preservedTempRoot !== undefined) process.stderr.write(`Временные файлы: ${result.preservedTempRoot}\n`)
```

Keep nonzero `process.exitCode` when `failed.length > 0`.

- [ ] **Step 5: Run MCP and CLI tests**

Run: `pnpm --filter @nkdk/mcp test && pnpm --filter @nkdk/cli test`

Expected: exit code 0 and zero failed tests.

- [ ] **Step 6: Commit**

```bash
git add packages/mcp/src packages/cli/src/commands/import.ts packages/cli/src/commands/import.test.ts
git commit -m "feat: :sparkles: раскрыть результат XML-import в MCP и CLI"
```

### Task 10: Complete import verification

**Files:**
- None planned.

**Interfaces:**
- Verifies the complete public import and configuration-index contracts.

- [ ] **Step 1: Run focused import tests in shuffled mode**

Run: `pnpm --filter @nkdk/core exec vitest run --no-isolate --sequence.shuffle metadata/importFromXml metadata/configurationIndex metadata/appliedObjects/configuration/convertFromXML.test.ts`

Expected: all focused tests PASS under shuffled order.

- [ ] **Step 2: Run type checks**

Run: `pnpm --filter @nkdk/core type-check && pnpm --filter @nkdk/mcp type-check && pnpm --filter @nkdk/cli exec tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 3: Run production builds**

Run: `pnpm --filter @nkdk/core build && pnpm --filter @nkdk/mcp build && pnpm --filter @nkdk/cli build`

Expected: exit code 0 and both worker entry points are present in core and MCP distributions.

- [ ] **Step 4: Run the full repository suite**

Run: `pnpm test`

Expected: exit code 0 and zero failed tests in every `packages/*` workspace.

- [ ] **Step 5: Record the verification result**

Do not modify or commit files in this task. If a command fails, stop and add a separate correction task with the exact failing test, affected file, and expected behavior before changing implementation.
