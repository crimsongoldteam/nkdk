# Import/Validation ProjectState Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить обязательный rebuild между последовательными XML-import `cf` и `cfe`: окончательный ProjectState импортированного YAML должен содержать те же `structuredDocuments`, что и обычная validation.

**Architecture:** В `metadata/project` появляется единый построитель полного `ProjectStateYamlFileUpdate`. Он принимает уже полученный `ProjectValidationFirstPassResult`, описание YAML и файловые targets, добавляет проекцию структуры формы и применяет изоляцию `БазоваяФорма.yaml`. Обычная validation и XML-import вызывают этот построитель; import после этого только разделяет готовое обновление на индексную и финальную части транспортного протокола.

**Tech Stack:** TypeScript, Vitest, XML → YAML import, resource topology, двоичный ProjectState, pnpm.

## Global Constraints

- Работать только в worktree `/Users/nikita/git/nkdk/.worktrees/import-validation-project-state-design` на ветке `codex/import-validation-project-state-design` от `44fd122b8`.
- Не изменять существующие XML-фикстуры; для сквозного теста собирать временную минимальную XML-конфигурацию из их копий.
- Не перечитывать и не разбирать сериализованный YAML повторно: import использует существующий `validateSerializedProjectYaml`.
- Временный индекс первого прохода import не обобщать: он работает до финализации YAML и остаётся специализированным.
- В нейтральные `project`, `projectState`, `validation` и `resourceTopology/core` не добавлять условия по `itemType`, именам объектов или каталогам `Формы`/`Макеты`.
- Не добавлять правила `fromXML`/`toXML`/`fromYAML`/`toYAML`, общие признаки rules.ts и применения `!xml`.
- Не менять формат ProjectState и import session; поле `structuredDocuments` уже присутствует в обоих договорах.
- Не добавлять автоматический rebuild и резервную ветку после import.
- Пять исходных падений `metadata/configurationIndex/projectFiles.test.ts` не исправлять в этой ветке. Полный прогон должен либо стать зелёным вследствие внешнего обновления baseline, либо показать только эти же пять известных падений без новых.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base 44fd122b8`.

---

### Task 1: Вынести единый построитель окончательного YAML ProjectState

**Files:**
- Create: `packages/core/metadata/project/projectStateYamlUpdate.ts`
- Create: `packages/core/metadata/project/projectStateYamlUpdate.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts:697`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts:610`

**Interfaces:**
- Produces: `buildProjectStateYamlFileUpdate(params): ProjectStateYamlFileUpdate`.
- Consumes: `ProjectValidationFirstPassResult`, нейтральное описание компонента/YAML, `ProjectStateTargetEntry[]`, topology и зарегистрированную проекцию структуры формы.
- Preserves: `toProjectStateFileUpdate` как низкоуровневое преобразование validation-фактов; `isolateProjectStateYamlUpdate` как низкоуровневую очистку изолированного вклада.

- [ ] **Step 1: Write a failing narrow contract test for the shared builder**

Создать `projectStateYamlUpdate.test.ts`. Тест `строит structuredDocuments рабочей формы из результата первого прохода` должен:

1. создать временный `cf/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml`;
2. получить `ValidationProjectFile` через `resolveValidationProjectFile`;
3. получить `firstPass` через `validateProjectFileFirstPass`;
4. вызвать новый `buildProjectStateYamlFileUpdate`;
5. проверить документ формы, реквизит и элемент.

Ключевой вызов и утверждение:

```ts
const update = buildProjectStateYamlFileUpdate({
  projectDir,
  descriptor: {
    componentPath: "cf",
    componentDir: join(projectDir, "cf"),
    rootProjectPath: `cf/${projectPath}`,
    projectPath,
    role: "form",
  },
  firstPass,
  fileBackedTargets: [],
})

expect(update.structuredDocuments).toEqual(expect.arrayContaining([
  expect.objectContaining({
    documentKind: "clientApplicationForm",
    representation: "working",
    logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    workingProjectPath: projectPath,
  }),
  expect.objectContaining({ componentKind: "attribute", name: "Объект" }),
  expect.objectContaining({ componentKind: "element", name: "Поле" }),
]))
```

Для первого прохода использовать те же `mockContext`, `createProjectYamlCache`, `createTestValidationSchemaCache` и `createValidationRulesSnapshot`, что и соседние validation-тесты. В YAML задать основной реквизит `Объект` и элемент `Поле` с `ПутьКДанным: Объект`.

- [ ] **Step 2: Run the new test to verify the builder does not exist yet**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/projectStateYamlUpdate.test.ts --no-isolate
```

Expected: FAIL — модуль `./projectStateYamlUpdate` или экспорт `buildProjectStateYamlFileUpdate` ещё отсутствует.

- [ ] **Step 3: Implement the common descriptor and builder**

В `projectStateYamlUpdate.ts` объявить минимальный нейтральный договор:

```ts
export interface ProjectStateYamlUpdateDescriptor {
  readonly componentPath: string
  readonly componentDir: string
  readonly rootProjectPath: string
  readonly projectPath: string
  readonly role: "configuration" | "properties" | "form"
  readonly indexContribution?: "isolated"
}

export interface BuildProjectStateYamlFileUpdateParams {
  readonly projectDir: string
  readonly descriptor: ProjectStateYamlUpdateDescriptor
  readonly firstPass: ProjectValidationFirstPassResult
  readonly fileBackedTargets?: readonly ProjectStateTargetEntry[]
}
```

Реализовать единый алгоритм:

```ts
export function buildProjectStateYamlFileUpdate(
  params: BuildProjectStateYamlFileUpdateParams,
): ProjectStateYamlFileUpdate {
  const { descriptor, firstPass } = params
  const components = firstPass.structuredComponents === undefined
    ? undefined
    : [
        ...firstPass.structuredComponents,
        ...(descriptor.indexContribution === "isolated" && firstPass.state.kind === "form"
          ? firstPass.state.pendingChecks
              .filter((check) => check.kind === "dataPath")
              .map((check) => ({
                componentKind: "dataPath" as const,
                name: check.value,
                yamlPath: check.yamlPath,
              }))
          : []),
      ]

  const update = toProjectStateFileUpdate(firstPass, {
    projectPath: descriptor.rootProjectPath,
    componentPath: descriptor.componentPath,
    resourceKind: "yaml",
    yamlRole: descriptor.role,
  }, params.fileBackedTargets ?? [], projectFormStructureDocuments({
    projectDir: params.projectDir,
    descriptor,
    components,
  }))

  return descriptor.indexContribution === "isolated"
    ? isolateProjectStateYamlUpdate(update)
    : update
}
```

Перенести в тот же модуль без изменения поведения:

- `projectFormStructureDocuments`;
- topology-классификацию рабочей и базовой формы;
- получение `logicalAddress`;
- вызов `getRegisteredFormStructureProjection`.

Построитель не должен импортировать XML-import, applied objects или конкретные реализации форм.

- [ ] **Step 4: Switch ordinary validation to the common builder**

В `preparedYamlProjectWorker.ts` заменить композицию
`isolateYamlUpdateIfNeeded(toProjectStateFileUpdate(...projectFormStructureDocuments(...)))`
на один вызов:

```ts
update: buildProjectStateYamlFileUpdate({
  projectDir: input.projectDir,
  descriptor,
  firstPass: first,
  fileBackedTargets: input.fileBackedTargets,
}),
```

Удалить из worker ставшие ненужными импорты topology/projection, прямые импорты
`toProjectStateFileUpdate`, `isolateProjectStateYamlUpdate` и локальную
`isolateYamlUpdateIfNeeded`.

В `preparedYamlProjectWorker.test.ts` импортировать `projectFormStructureDocuments`
из `./projectStateYamlUpdate`, а не из worker. Существующие тесты рабочей формы,
`БазоваяФорма.yaml` и topology оставить без ослабления утверждений.

- [ ] **Step 5: Run focused validation/project tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/project/projectStateYamlUpdate.test.ts \
  metadata/project/preparedYamlProjectWorker.test.ts \
  --no-isolate
```

Expected: PASS — прямой тест построителя и существующие договоры worker зелёные.

- [ ] **Step 6: Check types, duplicates, and commit the layer**

Run:

```bash
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base 44fd122b8
git diff --check
```

Expected: PASS; новых дублей и ошибок пробелов нет.

Commit:

```bash
git add \
  packages/core/metadata/project/projectStateYamlUpdate.ts \
  packages/core/metadata/project/projectStateYamlUpdate.test.ts \
  packages/core/metadata/project/preparedYamlProjectWorker.ts \
  packages/core/metadata/project/preparedYamlProjectWorker.test.ts
git commit -m "refactor: :recycle: унифицировать построение YAML ProjectState"
```

---

### Task 2: Подключить общий построитель к окончательному XML-import

**Files:**
- Modify: `packages/core/metadata/importFromXml/worker.ts:914`
- Modify: `packages/core/metadata/importFromXml/worker.ts:1016`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts:487`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts:774`

**Interfaces:**
- Consumes: `buildProjectStateYamlFileUpdate` из Task 1.
- Preserves: `validateSerializedProjectYaml` и его готовый `ProjectValidationFirstPassResult`.
- Produces: `ProjectStateImportIndexContribution` с `structuredDocuments` и прежний `ProjectStateImportFinalFileStateBatch`.

- [ ] **Step 1: Write the failing import-worker regression test**

В `worker.test.ts` рядом с тестом `writes a cross-object DataPath through the shared snapshot...` добавить самостоятельный договор:

```ts
it("публикует структуру импортированной формы в окончательном ProjectState", async () => {
  const outputDir = createTempDir("structured-form")
  const { assignments, second } = await runCatalogAndFormSecondPass(
    outputDir,
    "Объект.Товары.LineNumber",
  )
  expect(second).toMatchObject({ diagnostics: [], warnings: [] })

  const snapshot = buildProjectStateSnapshot({
    fragments: second.stateFragments.map(openProjectStateFragment),
    deletions: [],
  })
  const query = createBinaryProjectStateQueryPort(new ProjectStateSnapshotView(snapshot), {
    dependencyValidator: createProjectStateDependencyValidator(),
  })

  expect(query.readStructuredDocumentEntries({
    componentPath: "cf",
    logicalAddress: assignments.form.logicalAddress,
  })).toEqual(expect.arrayContaining([
    expect.objectContaining({
      documentKind: "clientApplicationForm",
      representation: "working",
      componentKind: "element",
      name: "Путь",
    }),
    expect.objectContaining({ componentKind: "attribute", name: "Объект" }),
  ]))
})
```

Этот тест проверяет именно окончательные `stateFragments` второго прохода, а не
временный индекс первого прохода.

- [ ] **Step 2: Run the regression and verify structured documents are absent**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/worker.test.ts --no-isolate
```

Expected: FAIL — `readStructuredDocumentEntries(...)` возвращает пустой массив.

- [ ] **Step 3: Replace the import-only final update assembly**

В `worker.ts` удалить прямой импорт `toProjectStateFileUpdate` и добавить
`buildProjectStateYamlFileUpdate`.

В `validateSerializedImportYaml` использовать уже найденный `file` как источник
описания и передать тот же `first`, который вернул `validateSerializedProjectYaml`:

```ts
const full = profiler.measure(
  "Локальная валидация готового YAML",
  "Преобразование результата в состояние проекта",
  { items: 1 },
  () => buildProjectStateYamlFileUpdate({
    projectDir: state.projectDir,
    descriptor: {
      componentPath: file.componentPath,
      componentDir: file.componentDir,
      rootProjectPath: file.rootProjectPath,
      projectPath: file.projectPath,
      role: file.kind,
      ...(indexContribution === "isolated" ? { indexContribution: "isolated" as const } : {}),
    },
    firstPass: first,
    fileBackedTargets: importFileBackedTargets(state, prepared.targetProjectPath),
  }),
)
return splitImportYamlUpdate(full, serialized.localHash)
```

Удалить повторную изоляцию вокруг `splitImportYamlUpdate`: она теперь является
частью общего построителя. Экспорт `isolateProjectStateYamlUpdate` из worker
оставить только если он ещё нужен существующему тесту; предпочтительно перевести
тест на прямой импорт из `projectState/fileUpdate` и удалить реэкспорт.

- [ ] **Step 4: Preserve structured documents when splitting the full update**

В `splitImportYamlUpdate` расширить деструктуризацию:

```ts
const {
  targets,
  owners,
  fields,
  forms,
  structuredDocuments,
  pendingReferences,
  pendingChecks,
  dependencies,
  localValidation,
} = update
```

Индексный вклад собрать без пересчёта данных:

```ts
index: {
  ...identity,
  targets,
  owners,
  fields,
  forms,
  ...(structuredDocuments === undefined ? {} : { structuredDocuments }),
},
```

Финальная часть остаётся прежней: в ней хранятся diagnostics, pending checks и
dependencies. Формат `ProjectStateImportIndexContribution` уже поддерживает
`structuredDocuments`, поэтому типы и двоичный формат не менять.

- [ ] **Step 5: Run focused import and binary-state tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/worker.test.ts \
  metadata/importFromXml/workerPool.test.ts \
  metadata/projectState/binary/fragment.test.ts \
  metadata/projectState/importSession.test.ts \
  --no-isolate
```

Expected: PASS — импортированная форма читается через
`readStructuredDocumentEntries`, а транспорт и import session не изменились.

- [ ] **Step 6: Check types, duplicates, and commit the layer**

Run:

```bash
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base 44fd122b8
git diff --check
```

Expected: PASS.

Commit:

```bash
git add \
  packages/core/metadata/importFromXml/worker.ts \
  packages/core/metadata/importFromXml/worker.test.ts
git commit -m "fix: :bug: сохранить структуру форм после XML-импорта"
```

---

### Task 3: Защитить последовательный публичный import `cf → cfe`

**Files:**
- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts:16`
- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts:180`
- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts:327`

**Interfaces:**
- Consumes: публичный `importConfigurationFromXml` и один общий `ProjectStateService`.
- Produces: интеграционный договор — импорт расширения сразу после XML-import базы видит текущую форму `cf` без ручного YAML и rebuild.

- [ ] **Step 1: Replace manually written base YAML with a base XML import**

В тесте объявить пути к существующим источникам:

```ts
const configurationFixtureDir = join(
  import.meta.dirname,
  "../appliedObjects/configuration/__fixtures__",
)
const catalogFixtureDir = join(
  import.meta.dirname,
  "../appliedObjects/metadataCatalog/__fixtures__",
)
const formFixtureDir = join(
  import.meta.dirname,
  "../forms/clientApplicationForm/__fixtures__",
)
const languageFixtureDir = join(
  import.meta.dirname,
  "../appliedObjects/metadataLanguage/__fixtures__",
)
```

Добавить `importBaseConfiguration(projectDir)`. Функция создаёт временный XML-каталог и:

- копирует `configuration/__fixtures__/minimal.xml` в `Configuration.xml`;
- копирует `metadataCatalog/__fixtures__/minimal.xml` в
  `Catalogs/СправочникПолный.xml`, заменяет `ПоУмолчанию` на
  `СправочникПолный` и `<ChildObjects/>` на
  `<ChildObjects><Form>ФормаОтчета</Form><Form>ФормаБезОсновы</Form></ChildObjects>`;
- дважды копирует `clientApplicationForm/__fixtures__/minimalMetadata.xml` в
  metadata XML форм и заменяет `Минимальная` на соответствующее имя;
- дважды копирует `clientApplicationForm/__fixtures__/minimal.xml` в `Ext/Form.xml`;
- в тело `ФормаОтчета` добавляет `InputField` `БазовоеПоле` и реквизит
  `БазовыйРеквизитФормы` типа `xs:dateTime`, соответствующие `BaseForm`
  расширения;
- копирует `metadataLanguage/__fixtures__/ru.xml` в
  `Languages/БазовыйЯзык.xml` и заменяет `<Name>Русский</Name>` на
  `<Name>БазовыйЯзык</Name>`.

Затем функция вызывает публичный import с теми же `xmlImportWorkerPoolHandle` и
`projectState`:

```ts
const result = await importConfigurationFromXml({
  context: mockContextFromXML(),
  inputDir,
  projectDir,
  concurrency: 1,
  operationId: "configuration-base-e2e",
  xmlImportWorkerPoolHandle,
  projectState,
})

expect(result.failed).toEqual([])
expect(result.componentPath).toBe("cf")
```

Новые постоянные XML-фикстуры не создавать: все изменения выполняются только в
копиях внутри временного каталога.

- [ ] **Step 2: Make the existing extension scenario sequential**

В начале `importExtension` после создания `projectDir` выполнить:

```ts
await importBaseConfiguration(projectDir)
```

Удалить вызовы:

```ts
writeBaseLanguage(projectDir)
writeBaseCatalog(projectDir)
writeBaseForm(projectDir, "ФормаОтчета")
writeBaseForm(projectDir, "ФормаБезОсновы")
writeBaseConfiguration(projectDir)
```

Удалить сами пять `writeBase*` helpers. Между двумя import не вызывать refresh,
rebuild, validation и не закрывать `projectState`.

В основном тесте дополнить утверждение результата явной защитой причины ошибки:

```ts
expect(result.failed).not.toEqual(expect.arrayContaining([
  expect.objectContaining({ message: expect.stringContaining("Не найдена текущая форма cf") }),
]))
```

Оставшиеся ожидаемые diagnostics обновлять только по фактическому результату
минимальной базы; не ослаблять проверку до одного `succeeded`.

- [ ] **Step 3: Temporarily verify the test fails on the parent implementation**

До подключения production-изменений из Task 2 этот сценарий должен воспроизводить
исходную ошибку. Если задачи выполняются в одном worktree последовательно, проверить
красный тест на временном `git stash` production-изменений либо отдельным запуском
на `d72f13dc4`, не изменяя XML-фикстуры.

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/importConfigurationExtension.test.ts \
  --no-isolate
```

Expected before Task 2: FAIL — результат содержит «Не найдена текущая форма cf».
Expected with Tasks 1–2: PASS — расширение использует опубликованную структуру
формы основной конфигурации.

- [ ] **Step 4: Run the complete import integration cluster**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/importConfigurationExtension.test.ts \
  metadata/importFromXml/importConfiguration.test.ts \
  metadata/importFromXml/worker.test.ts \
  --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Check types, duplicates, and commit the integration test**

Run:

```bash
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base 44fd122b8
git diff --check
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/importFromXml/importConfigurationExtension.test.ts
git commit -m "test: :white_check_mark: проверить import cf и cfe без rebuild"
```

---

### Task 4: Проверить реальный `sed_xml` и весь проект

**Files:**
- Verify only: `/Users/nikita/git/sed_xml/cf`
- Verify only: `/Users/nikita/git/sed_xml/cfe/дкз`
- Temporary output only: каталог под `/private/tmp`

- [ ] **Step 1: Build the production core path**

Run:

```bash
pnpm --filter @nkdk/core build
```

Expected: PASS; `packages/core/dist/index.js` содержит текущую реализацию.

- [ ] **Step 2: Import real cf and cfe into one fresh temporary project**

Создать точный временный каталог через `mktemp -d` и передать его в один процесс.
Не удалять и не изменять `/Users/nikita/git/sed_nkdk` и пользовательский `.nkdk`.

Run:

```bash
NKDK_PARITY_TMP=$(mktemp -d /private/tmp/nkdk-project-state-parity.XXXXXX)
printf '%s\n' "$NKDK_PARITY_TMP" > /private/tmp/nkdk-project-state-parity.path
env NKDK_PARITY_TMP="$NKDK_PARITY_TMP" node --input-type=module -e '
import * as core from "./packages/core/dist/index.js"
const projectDir = process.env.NKDK_PARITY_TMP
if (projectDir === undefined) throw new Error("NKDK_PARITY_TMP is required")
const context = {
  defaultLanguage: "ru",
  version: "2.20",
  exportToYAML: { toTyped: false },
  fromXML: { forReference: false },
}
const projectState = core.createProjectStateService()
try {
  for (const run of [
    { inputDir: "/Users/nikita/git/sed_xml/cf", requestedComponentPath: "cf" },
    { inputDir: "/Users/nikita/git/sed_xml/cfe/дкз", requestedComponentPath: "cfe/дкз" },
  ]) {
    const result = await core.importConfigurationFromXml({
      context,
      inputDir: run.inputDir,
      projectDir,
      requestedComponentPath: run.requestedComponentPath,
      concurrency: 4,
      projectState,
    })
    console.log(JSON.stringify({
      componentPath: result.componentPath,
      succeeded: result.succeeded,
      failed: result.failed,
      warnings: result.warnings.length,
    }))
  }
} finally {
  await projectState.close()
}
' | tee /private/tmp/nkdk-project-state-parity-import.jsonl
```

Expected:

- `cf` импортирован;
- `cfe/дкз` имеет `succeeded: 411`;
- `cfe/дкз.failed` пуст;
- между import нет rebuild или validation.

- [ ] **Step 3: Verify the formerly disappearing files and clean validation**

В том же временном каталоге проверить 19 ранее пропадавших файлов и выполнить
production validation через новый `ProjectStateService`:

```bash
read -r NKDK_PARITY_TMP < /private/tmp/nkdk-project-state-parity.path
env NKDK_PARITY_TMP="$NKDK_PARITY_TMP" node --input-type=module -e '
import * as core from "./packages/core/dist/index.js"
const projectDir = process.env.NKDK_PARITY_TMP
if (projectDir === undefined) throw new Error("NKDK_PARITY_TMP is required")
const projectState = core.createProjectStateService()
try {
  const result = await core.validateProject({ projectDir, projectState, concurrency: 4 })
  const diagnostics = [...result.diagnostics]
  result.diagnostics.release()
  console.log(JSON.stringify({
    errors: diagnostics.filter(({ severity }) => severity === "error").length,
    warnings: diagnostics.filter(({ severity }) => severity === "warning").length,
  }))
} finally {
  await projectState.close()
}
'
env NKDK_PARITY_TMP="$NKDK_PARITY_TMP" node --input-type=module -e '
import { existsSync } from "node:fs"
import { join } from "node:path"
const projectDir = process.env.NKDK_PARITY_TMP
if (projectDir === undefined) throw new Error("NKDK_PARITY_TMP is required")
const reports = [
  "ЗакрытыеИОткрытыеОбращения",
  "ОстаткиНаМОЛ",
  "СводПоЗаявкам",
  "дкз_ДетальныйПланНаучноИсследовательскойДеятельностиИнститута",
  "дкз_ДубликатыДляБРС",
  "дкз_ОтчетПоРасходам",
  "дкз_ОтчетПоказателиПлановНаучноИсследовательскойДеятельности",
  "дкз_СводныйПланНаучноИсследовательскойДеятельностиИнститута",
]
const templatePaths = reports.flatMap((name) => {
  const root = `cfe/дкз/Отчет/${name}/Шаблоны/ОсновнаяСхемаКомпоновкиДанных`
  return [`${root}/Template.xml`, `${root}/Ext/Template.xml`]
})
const formRoot = "cfe/дкз/Справочник/ДокументыПредприятия/Формы/ФормаЭлемента"
const expected = [
  ...templatePaths,
  `${formRoot}/Форма.yaml`,
  `${formRoot}/БазоваяФорма.yaml`,
  `${formRoot}/Модуль.bsl`,
]
const missing = expected.filter((path) => !existsSync(join(projectDir, path)))
console.log(JSON.stringify({ expected: expected.length, missing }, null, 2))
if (missing.length !== 0) process.exitCode = 1
'
```

Expected: validation возвращает `errors: 0`, `warnings: 0`; в проекте присутствуют
16 файлов шаблонов и 3 файла формы из исходной группы; проверка печатает
`{ "expected": 19, "missing": [] }`. Жёстко заданный список остаётся только в
разовой проверочной команде и не попадает в production-код или тесты репозитория.

- [ ] **Step 4: Run mandatory repository verification**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 44fd122b8
git diff --check
git status --short
```

Expected:

- `type-check`, обе архитектурные проверки, duplicates и `git diff --check` — PASS;
- целевые и новые тесты — PASS;
- `pnpm test` — PASS, либо ровно те же пять заранее зафиксированных падений
  `metadata/configurationIndex/projectFiles.test.ts`; при любом новом падении
  реализацию не считать завершённой;
- после коммитов `git status --short` пуст.

- [ ] **Step 5: Summarize test changes and evidence**

В итоговом сообщении перечислить:

- добавленный узкий тест общего построителя и его уникальный договор;
- добавленный worker-тест сохранения `structuredDocuments` в import transport;
- изменённый интеграционный тест `cf XML → cfe XML` без ручного YAML/rebuild;
- сохранённые тесты рабочей и базовой формы;
- фактические результаты `sed_xml`, type-check, architecture, duplicates и полного
  `pnpm test`, отдельно отметив известный baseline, если он всё ещё проявляется.
