# Deferred Import Reference Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Удерживать все основные YAML до общего индекса и разрешать именованные значения через единый смысловой механизм без ошибочного `!xml`.

**Architecture:** Первый проход XML-импорта всегда сохраняет `PreparedImportYaml` и публикует только предварительный вклад в индекс; формирование текста и запись основного YAML выполняются во втором проходе. Прямой поиск цели остаётся в `ProjectStateQueryPort.resolveTargets`, а единое дополнение для значений объекта разрешает предопределённые значения, перечисления и пустые ссылки по сведениям владельца; его вызывают и проверка проекта, и импорт.

**Tech Stack:** TypeScript 7, Vitest, pnpm workspace, `@nkdk/runtime`, двоичный ProjectState/LMDB, js-yaml.

## Global Constraints

- Не изменять существующие XML-фикстуры: они остаются источником истины.
- Не добавлять новые правила fromXML/toXML/fromYAML/toYAML; использовать существующий `rules.ts` и регистрацию зависимых свойств.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule`, параметры построителей правил или `DependentItemParams`.
- Не расширять применение `!xml`: найденная цель остаётся обычным YAML, отсутствующая или несовместимая сохраняет текущее поведение, неоднозначная сохраняет текущее поведение.
- Проверка проекта не изменяет YAML и пропускает смысловую проверку значения заполнения с `!xml`.
- Нейтральные слои не получают частных условий по `itemType`, XML-корням или конкретным прикладным объектам.
- В памяти удерживаются разобранные YAML-объекты, но не их исходные тексты.
- Внешние и вспомогательные файлы сохраняют существующий жизненный цикл; откладывается основной YAML из `PreparedImportYaml`.
- После каждого законченного слоя запускать `pnpm duplicates -- --base db14e509c`.
- Перед завершением выполнить `pnpm test`, `pnpm test:architecture:rules` и `pnpm test:architecture`.

---

## File Map

- `packages/rules/metadata/importFromXml/worker.ts` — всегда сохраняет основной YAML после первого прохода; во втором проходе вызывает общий механизм разрешения значений и записывает файл.
- `packages/rules/metadata/importFromXml/worker.integration.test.ts` — закрепляет отсутствие основной YAML-записи в первом проходе, перенос ошибок записи во второй проход и освобождение объектов.
- `packages/rules/metadata/validation/projectReferenceValueResolver.ts` — новый общий пакетный механизм разрешения значений объекта по сведениям владельца.
- `packages/rules/metadata/validation/projectReferenceValueResolver.test.ts` — проверяет предопределённые значения, перечисления, пустые ссылки, отсутствие и неоднозначность владельца.
- `packages/rules/metadata/validation/projectStateDependencyValidation.ts` — использует общий механизм вместо собственной ветки разрешения значений.
- `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts` — подтверждает неизменное поведение проверки ссылок и пропуск `!xml`.
- `packages/rules/tests/xmlImportWorkerTestPool.ts` — создаёт отдельное состояние для каждого испытательного работника и позволяет проверить распределение заданий.
- `packages/rules/metadata/importFromXml/russianMetadataReferences.integration.test.ts` — проверяет разрешение ссылки на предопределённое значение между разными работниками.
- `e2e/fixtures/nkdk/cf/ПланОбмена/ПланОбменаВсеСвойства/Свойства.yaml` — ожидаемый YAML без ошибочного `!xml`.
- `.agents/architecture.md` — отражает обязательный барьер общего индекса перед записью всех основных YAML.

---

### Task 1: Отложить запись всех основных YAML до второго прохода

**Files:**
- Modify: `packages/rules/metadata/importFromXml/worker.ts:724-862`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts:180-340, 550-585`

**Interfaces:**
- Consumes: существующие `PreparedImportYaml`, `DeferredImportYaml`, `importIndexContribution()` и `writePreparedYamlToOutput()`.
- Produces: инвариант `preparedYaml.has(assignment.id) === true` после успешной подготовки любого основного YAML; основной YAML отсутствует в результате первого прохода и записывается `processSecondPass()`.

- [ ] **Step 1: Изменить проверки первого прохода так, чтобы они требовали удержания любого YAML**

В `worker.integration.test.ts` заменить ожидание досрочно записанного справочника:

```ts
it("удерживает каждый основной YAML до общего индекса", async () => {
  const outputDir = createTempDir("all-yaml-deferred")
  const assignment = catalogAssignment()
  await initializeWorker(outputDir)

  const first = expectFirstPass(await runImportWorkerCommand({
    kind: "firstPass",
    assignments: [assignment],
  }))

  expect(first.diagnostics).toEqual([])
  expect(first.files.map(({ targetProjectPath }) => targetProjectPath))
    .not.toContain(assignment.targetProjectPath)
  expect(workerStateForTests().preparedYamlIds).toEqual([assignment.id])
  expect(existsSync(join(outputDir, assignment.targetProjectPath))).toBe(false)
})
```

Профиль первого прохода должен показывать один ожидающий YAML и не должен содержать формирования или записи основного YAML:

```ts
expect(lines).toContainEqual(
  expect.stringMatching(/substep="YAML, ожидающие второго прохода".*items=1/),
)
expect(lines.some((line) => line.includes('substep="Досрочно записанные YAML"'))).toBe(false)
expect(lines.some((line) => line.includes('substep="Сериализация YAML"'))).toBe(false)
expect(lines.some((line) => line.includes('substep="Запись основного YAML-файла"'))).toBe(false)
```

- [ ] **Step 2: Перенести проверку ошибки записи во второй проход**

Заменить `continues first pass after an early YAML write error` проверкой, где первый проход успешен, а каталог с именем основного YAML заранее создан как каталог. После `beginSecondPass` обработать оба задания одной пачкой и ожидать одну ошибку записи при сохранённом успешном файле второго задания:

```ts
const first = expectFirstPass(await runImportWorkerCommand({
  kind: "firstPass",
  assignments: [blocked, valid],
}))
expect(first.diagnostics).toEqual([])
expect(workerStateForTests().preparedYamlIds).toEqual([blocked.id, valid.id])

await runImportWorkerCommand({ kind: "beginSecondPass", readToken: createReadToken(first) })
const second = await runImportWorkerCommand({
  kind: "secondPassBatch",
  assignmentIds: [blocked.id, valid.id],
})
await runImportWorkerCommand({ kind: "endSecondPass" })

expect(second).toMatchObject({
  kind: "secondPassResult",
  diagnostics: [expect.objectContaining({
    code: "xml_import_yaml_failed",
    targetProjectPath: blocked.targetProjectPath,
  })],
})
expect(workerStateForTests().preparedYamlIds).toEqual([])
```

- [ ] **Step 3: Запустить проверки и убедиться, что они падают на досрочной записи**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/importFromXml/worker.integration.test.ts
```

Expected: FAIL — основной YAML уже записан в первом проходе, `preparedYamlIds` пуст и профиль содержит `Досрочно записанные YAML`.

- [ ] **Step 4: Удалить ветку досрочной записи из `processFirstPass()`**

После подготовки вспомогательных и внешних файлов всегда создавать предварительный вклад и сохранять `DeferredImportYaml`:

```ts
const indexContribution = importIndexContribution(prepared, validationContribution, state)
accumulator.fragmentWriter.appendImportIndex(indexContribution)
accumulator.stateEntries += 1
preparedYaml.set(assignment.id, {
  diagnosticAssignment: {
    targetProjectPath: assignment.targetProjectPath,
    xmlFiles: assignment.xmlFiles,
  },
  targetProjectPath: prepared.targetProjectPath,
  logicalAddress: assignment.logicalAddress,
  yaml: prepared.yaml,
  rule: prepared.rule,
  ownerContext: prepared.ownerContext,
  formDataPathIndex: prepared.localIndexes.metadata.formDataPathIndex,
  deferred: prepared.deferred,
  dependentDeferred: prepared.dependentDeferred,
  dependentOwner: prepared.dependentOwner,
  indexContribution,
  ...(prepared.baseFormCandidate === undefined
    ? {}
    : { baseFormCandidate: prepared.baseFormCandidate }),
})
waitingYamlCount += 1
deferredValueCount += prepared.deferred.length + prepared.dependentDeferred.length
accumulator.files.push(...assignmentFiles)
```

Удалить вычисление `requiresFormDataPathCompatibility` только из условия досрочной записи, само уточнение пути данных второго прохода не менять. Удалить `earlyYamlCount`, `earlyYamlBytes` и запись профиля `Досрочно записанные YAML`; переименовать оставшийся счётчик и запись:

```ts
profiler.record("Подготовка импорта конфигурации", "YAML, ожидающие второго прохода", {
  items: waitingYamlCount,
  timeMs: 0,
})
```

- [ ] **Step 5: Запустить проверки работника**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/importFromXml/worker.integration.test.ts
```

Expected: PASS.

- [ ] **Step 6: Проверить новые дубли и зафиксировать слой**

Run:

```bash
pnpm duplicates -- --base db14e509c
```

Expected: PASS, новых дублирующихся блоков нет.

Commit:

```bash
git add packages/rules/metadata/importFromXml/worker.ts packages/rules/metadata/importFromXml/worker.integration.test.ts
git commit -m "refactor: :recycle: отложить запись всех YAML импорта"
```

---

### Task 2: Выделить единое разрешение именованных значений проекта

**Files:**
- Create: `packages/rules/metadata/validation/projectReferenceValueResolver.ts`
- Create: `packages/rules/metadata/validation/projectReferenceValueResolver.test.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.ts:275-365`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts:250-370, 1160-1210`

**Interfaces:**
- Consumes: `ProjectStateQueryPort.readOwners`, `ownerMetadataFromFacts()`, `projectStateFieldIndex()`, `ProjectReferenceValueContributor` и `OwnerTypeRef`.
- Produces:

```ts
export interface ProjectValueTargetRequest {
  readonly requestId: string
  readonly componentPath: string
  readonly target: Extract<ParsedMetadataTarget, { kind: "value" }>
}

export type ProjectValueTargetResolution =
  | { readonly requestId: string; readonly status: "found" }
  | { readonly requestId: string; readonly status: "missing" | "ambiguous" }
  | { readonly requestId: string; readonly status: "invalid"; readonly diagnostics: readonly Diagnostic[] }

export function resolveProjectValueTargets(params: {
  readonly requests: readonly ProjectValueTargetRequest[]
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort, "readOwners">
  readonly getContributor: (root: MetadataRootName) => ProjectReferenceValueContributor | undefined
}): readonly ProjectValueTargetResolution[]
```

- [ ] **Step 1: Написать модульные проверки общего механизма**

Создать `projectReferenceValueResolver.test.ts`. Передавать из `readOwners`
минимальные `ProjectStateOwnerFacts`: `{ predefined: [{ name: "Основной" }] }`
для справочника и `{ enumValues: [{ name: "Новый" }] }` для перечисления. Затем
проверить пакет из следующих запросов:

```ts
expect(resolveProjectValueTargets({
  requests: [
    valueRequest("predefined", predefinedTarget("Catalog", "Товары", "Основной")),
    valueRequest("enum", enumTarget("Enum", "Статусы", "Новый")),
    valueRequest("empty", emptyRefTarget("Catalog", "Товары")),
  ],
  projectDir: "/project",
  queryPort,
  getContributor: (root) => contributors.get(root),
})).toEqual([
  { requestId: "predefined", status: "found" },
  { requestId: "enum", status: "found" },
  { requestId: "empty", status: "found" },
])
```

Отдельными проверками закрепить:

```ts
expect(resolve("unknown-value")).toEqual({ requestId: "unknown-value", status: "missing" })
expect(resolveWithOwnerStatus("missing")).toEqual({ requestId: "value", status: "missing" })
expect(resolveWithOwnerStatus("ambiguous")).toEqual({ requestId: "value", status: "ambiguous" })
```

Проверить, что `readOwners` получает один пакет для всех запросов, а
`getContributor` вызывается по корню цели. Для предопределённых значений и
перечислений использовать настоящие `createNamedValueReference("predefined")`
и `createNamedValueReference("enumValues")`, а не заглушку результата.

- [ ] **Step 2: Запустить новую проверку и убедиться, что модуль отсутствует**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata metadata/validation/projectReferenceValueResolver.test.ts
```

Expected: FAIL — `projectReferenceValueResolver.ts` не найден.

- [ ] **Step 3: Реализовать пакетное разрешение значений**

В `projectReferenceValueResolver.ts`:

1. преобразовать каждый `target` в владельца через `getOwnerKindByMetadataLinkPrefix(target.root) ?? target.root`;
2. одним вызовом `readOwners` получить сведения всех владельцев;
3. для `ambiguous` вернуть `ambiguous`, для отсутствующего владельца — `missing`;
4. при найденном владельце сразу принять `emptyRef`;
5. создать `OwnerMetadata` через `ownerMetadataFromFacts()` и `projectStateFieldIndex(ownerRef, [])`;
6. вызвать предметный обработчик, переданный через `getContributor`;
7. `contributed.ok === true` преобразовать в `found`, `ok === false` — в `invalid` с теми же сообщениями, отсутствие результата — в `missing`.

Основной цикл должен сохранять порядок запросов:

```ts
return params.requests.map((request) => {
  const ownerResult = ownerByRequestId.get(request.requestId)
  if (ownerResult?.status === "ambiguous") {
    return { requestId: request.requestId, status: "ambiguous" }
  }
  if (ownerResult?.status !== "found") {
    return { requestId: request.requestId, status: "missing" }
  }
  if (request.target.valueKind === "emptyRef") {
    return { requestId: request.requestId, status: "found" }
  }
  // ownerMetadataFromFacts + зарегистрированный contributor
})
```

- [ ] **Step 4: Перевести проверку проекта на общий механизм**

В `validateProjectStateReferenceBatch()` сохранить прямой пакетный
`resolveTargets`. Для обычных, не помеченных `!xml`, ссылок на значения со
статусом `missing` вызвать `resolveProjectValueTargets()` одним пакетом:

```ts
const valueResults = resolveProjectValueTargets({
  requests: valueOwnerChecks.map(({ requestId, componentPath, reference }) => {
    if (reference.target.kind !== "value") throw new Error("Ожидалась ссылка на значение")
    return { requestId, componentPath, target: reference.target }
  }),
  projectDir: params.projectDir,
  queryPort: params.queryPort,
  getContributor: getProjectReferenceValueContributor,
})
const valueResultByRequestId = new Map(valueResults.map((result) => [result.requestId, result]))
```

В цикле результатов:

```ts
const valueResult = valueResultByRequestId.get(check.requestId)
if (valueResult?.status === "found") return
if (valueResult?.status === "invalid") {
  diagnostics.push(...valueResult.diagnostics)
  return
}
if (valueResult?.status === "ambiguous") {
  diagnostics.push(...unresolvedProjectReferenceResult(check.reference, "ambiguous").diagnostics)
  return
}
```

Удалить из `projectStateDependencyValidation.ts` локальные
`valueTargetOwner`, `ownerMetadataFromFacts`/`projectStateFieldIndex` для этой
ветки и прямой вызов обработчика, если эти импорты больше нигде не нужны.

- [ ] **Step 5: Запустить проверки общего механизма и проверки проекта**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata metadata/validation/projectReferenceValueResolver.test.ts metadata/validation/projectStateDependencyValidation.test.ts metadata/validation/yamlFactExtractor.fillValue.test.ts
```

Expected: PASS, включая существующую проверку
`dependent fill value validation не валидирует смысловое значение !xml DesignTimeRef`.

- [ ] **Step 6: Проверить новые дубли и зафиксировать слой**

Run:

```bash
pnpm duplicates -- --base db14e509c
```

Expected: PASS.

Commit:

```bash
git add packages/rules/metadata/validation/projectReferenceValueResolver.ts packages/rules/metadata/validation/projectReferenceValueResolver.test.ts packages/rules/metadata/validation/projectStateDependencyValidation.ts packages/rules/metadata/validation/projectStateDependencyValidation.test.ts
git commit -m "refactor: :recycle: объединить разрешение значений проекта"
```

---

### Task 3: Использовать общий механизм для `ЗначениеЗаполнения` при импорте

**Files:**
- Modify: `packages/rules/metadata/importFromXml/worker.ts:450-490`
- Modify: `packages/rules/tests/xmlImportWorkerTestPool.ts:20-55`
- Modify: `packages/rules/metadata/importFromXml/russianMetadataReferences.integration.test.ts:1-75`
- Modify: `e2e/fixtures/nkdk/cf/ПланОбмена/ПланОбменаВсеСвойства/Свойства.yaml:53`

**Interfaces:**
- Consumes: `resolveProjectValueTargets()`, `parseMetadataTargetFromModel()`, `getProjectReferenceValueContributor()` и общий снимок `ActiveSecondPass.readSession`.
- Produces: `metadataTargetLookup(canonical)` возвращает `found` для именованного значения, найденного через сведения владельца, даже если точной записи значения нет в индексе целей.

- [ ] **Step 1: Добавить сквозное ожидание значения без `!xml`**

В `russianMetadataReferences.integration.test.ts` использовать испытательный
пул с четырьмя независимыми работниками и добавить:

```ts
const exchangePlan = readYaml("ПланОбмена/ПланОбменаВсеСвойства/Свойства.yaml")
expect(exchangePlan).toContain(
  "ЗначениеЗаполнения: Справочник.СправочникРеквизит.ПредопредленноеЗначение",
)
expect(exchangePlan).not.toContain(
  "ЗначениеЗаполнения: !xml Справочник.СправочникРеквизит.ПредопредленноеЗначение",
)
```

Испытательный помощник должен позволить определить работника по заданиям
`firstPassBatch`. Проверить, что пути
`ПланОбмена/ПланОбменаВсеСвойства/Свойства.yaml` и
`Справочник/СправочникРеквизит/Свойства.yaml` попали разным работникам:

```ts
expect(workerFor("ПланОбмена/ПланОбменаВсеСвойства/Свойства.yaml"))
  .not.toBe(workerFor("Справочник/СправочникРеквизит/Свойства.yaml"))
```

В ожидаемой YAML-фикстуре удалить только тег, не меняя значение:

```yaml
ЗначениеЗаполнения: Справочник.СправочникРеквизит.ПредопредленноеЗначение
```

- [ ] **Step 2: Запустить сквозную проверку и увидеть ошибочный `!xml`**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/importFromXml/russianMetadataReferences.integration.test.ts
```

Expected: FAIL — импортированный `ЗначениеЗаполнения` содержит `!xml`.

- [ ] **Step 3: Изолировать состояние испытательных работников**

В `xmlImportWorkerTestPool.ts` хранить отдельный
`createImportWorkerCommandRunner()` по `workerIndex`, который передаёт
`createMockWorkerThreadPoolFactory`:

```ts
const workers = new Map<number, ReturnType<typeof createImportWorkerCommandRunner>>()
const threadPools = createMockWorkerThreadPoolFactory<ImportWorkerCommand, ImportWorkerCommandResult>(
  async (command, workerIndex) => {
    const worker = workers.get(workerIndex) ?? createImportWorkerCommandRunner()
    workers.set(workerIndex, worker)
    if (command.kind !== "initialize") return worker.run(command)
    worker.setSchemaCacheForTests(fastSchemaCache)
    try {
      return await worker.run(command)
    } finally {
      worker.setSchemaCacheForTests(undefined)
    }
  },
)
```

Добавить экспортируемый испытательный вариант, возвращающий и `handle`, и
`commands(workerIndex)`, а существующий `createXmlImportWorkerTestPool()`
оставить совместимой обёрткой над ним.

- [ ] **Step 4: Подключить общий механизм в `metadataTargetLookup` второго прохода**

Сначала сохранить существующий прямой поиск. Только при `missing` разобрать
каноническую ссылку как значение и вызвать общий механизм:

```ts
metadataTargetLookup: (canonical) => {
  const requestId = `import-value:${canonical}`
  const [direct] = readSession.resolveTargets([{
    requestId,
    componentPath: state.componentPath,
    canonicalTarget: canonical,
  }])
  if (direct?.status !== "missing") return direct?.status ?? "missing"

  const parsed = parseMetadataTargetFromModel({ canonical, constraint: { kind: "value" } })
  if (!parsed.ok || parsed.target.kind !== "value") return "missing"
  const [semantic] = resolveProjectValueTargets({
    requests: [{ requestId, componentPath: state.componentPath, target: parsed.target }],
    projectDir: state.projectDir,
    queryPort: readSession,
    getContributor: getProjectReferenceValueContributor,
  })
  return semantic?.status === "invalid" ? "missing" : semantic?.status ?? "missing"
},
```

Не менять контракт `DependentItemParams.metadataTargetLookup` и правила
`shouldTagFillValueXML`: импорт по-прежнему ставит `!xml` только на основании
того же трёхзначного результата `found | missing | ambiguous`.

- [ ] **Step 5: Запустить связанные проверки импорта и проверки проекта**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project unit metadata/importFromXml/dependentItems.test.ts
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata metadata/importFromXml/fillValueImport.test.ts metadata/validation/fillValueReferences.test.ts
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/importFromXml/russianMetadataReferences.integration.test.ts
```

Expected: PASS; существующие случаи `missing` и `ambiguous` не меняют результат.

- [ ] **Step 6: Проверить новые дубли и зафиксировать слой**

Run:

```bash
pnpm duplicates -- --base db14e509c
```

Expected: PASS.

Commit:

```bash
git add packages/rules/metadata/importFromXml/worker.ts packages/rules/tests/xmlImportWorkerTestPool.ts packages/rules/metadata/importFromXml/russianMetadataReferences.integration.test.ts e2e/fixtures/nkdk/cf/ПланОбмена/ПланОбменаВсеСвойства/Свойства.yaml
git commit -m "fix: :bug: разрешить значения заполнения по общему индексу"
```

---

### Task 4: Обновить архитектурную схему и выполнить полную проверку

**Files:**
- Modify: `.agents/architecture.md:188-250`

**Interfaces:**
- Consumes: утверждённая спецификация `docs/superpowers/specs/2026-08-13-deferred-import-reference-resolution-design.md`.
- Produces: архитектурная схема, в которой первый проход всегда сохраняет подготовленный YAML, а второй всегда разрешает ссылки, формирует текст и записывает основной файл.

- [ ] **Step 1: Обновить схему «Импорт XML → YAML»**

Заменить развилку `ready` и обе ветки записи на обязательный путь первого
прохода:

```mermaid
subgraph first["Воркер"]
  direction TD
  readXml["Прочитать XML"] --> toModel["Разобрать XML<br/>и построить модель"] --> toYaml["Преобразовать модель в YAML"]
  toYaml --> facts["Собрать локальные сведения<br/>для общего индекса"]
  facts --> defer["Сохранить подготовленный YAML<br/>до второго прохода"]
  defer --> firstResult["Вернуть внешние файлы<br/>и части состояния"]
end
```

Во втором проходе удалить условие `pending`:

```mermaid
subgraph second["Воркер"]
  direction TD
  readIndex["Прочитать рабочий индекс"] --> resolve["Разрешить ссылки и уточнить<br/>зависимые значения"]
  resolve --> serialize2["Сформировать текст YAML"] --> local2[["Проверить YAML и подготовить<br/>вклад в индекс"]] --> write2["Записать YAML<br/>и окончательный вклад"]
end
```

Остальные стадии публикации ProjectState не менять. Разрешение на обновление
`.agents/architecture.md` получено от разработчика при согласовании спецификации.

- [ ] **Step 2: Проверить архитектурные ограничения**

Run:

```bash
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: обе команды PASS; новый общий модуль не создаёт зависимости
нейтральных слоёв от прикладных объектов.

- [ ] **Step 3: Проверить новые дубли и зафиксировать документацию**

Run:

```bash
pnpm duplicates -- --base db14e509c
```

Expected: PASS.

Commit:

```bash
git add .agents/architecture.md
git commit -m "docs: :memo: обновить схему двухпроходного импорта"
```

- [ ] **Step 4: Выполнить полный набор тестов**

Run:

```bash
pnpm test
```

Expected: PASS во всех пакетах `packages/*`.

- [ ] **Step 5: Проверить рабочее дерево и итоговые изменения**

Run:

```bash
git status --short
git log --oneline db14e509c..HEAD
git diff --check db14e509c..HEAD
```

Expected:

- `git status --short` не выводит строк;
- история содержит три изменения кода и одно обновление архитектурной схемы;
- `git diff --check` не сообщает ошибок пробелов.
