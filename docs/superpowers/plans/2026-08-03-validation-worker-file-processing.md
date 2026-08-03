# Validation Worker File Processing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести чтение и хэширование файлов актуализации в validation worker, чтобы изменённый YAML проверялся из тех же байтов, а основной процесс не накапливал содержимое проекта.

**Architecture:** Координатор обнаруживает только пути и одним пакетным запросом получает сохранённые хэши через `ProjectStateStore`. Ограниченное число validation worker читает пути, сразу освобождает неизменённые байты, а изменённые YAML проверяет и индексирует в том же задании. Единственный writer применяет ограниченные пачки результатов в одной транзакции; `stat`/`fstat` и повтор всей актуализации удаляются.

**Tech Stack:** TypeScript 7, Node.js worker threads, Piscina, `@node-rs/xxhash`, SQLite `DatabaseSync`, Vitest, pnpm.

## Global Constraints

- Существующую спецификацию `docs/superpowers/specs/2026-08-01-validation-project-state-cache-design.md` не изменять.
- Источник требований: `docs/superpowers/specs/2026-08-03-validation-worker-file-processing-design.md`.
- Не изменять XML-фикстуры и не добавлять правила fromXML/toXML/fromYAML/toYAML.
- Validation worker не получает SQLite-соединение, SQL или объект `ProjectStateStore`.
- Каждый управляемый файл читается не более одного раза за один вызов актуализации.
- `stat`, `fstat`, `size`, `mtimeNs`, `dev` и `inode` не входят в новый поток.
- Одновременно worker удерживает байты не более одного файла; очередь содержит только ограниченное число нормализованных результатов.
- Локальные validation-ошибки фиксируются, техническая ошибка или отмена откатывает актуализацию.
- Mutation testing в этой задаче не запускать.
- Юнит-тест выполняется желательно до 10 мс и не дольше 50 мс; интеграционный тестовый файл — не дольше 1 секунды без учёта общего холодного старта Vitest.
- `/Users/nikita/git/nkdk-yaml` и его кэш не изменять; профиль выполнять на временной копии средствами `validation-profile`.
- Каждый профиль целевого проекта ограничивать внешним процессным таймером 115 секунд; внутренний `AbortSignal` не считается достаточной защитой для синхронной SQLite-фазы.
- Проверку дублей выполнять относительно `e768ba6321fc99b2623e04f1fe72a06c77f07b38`.
- Незавершённые изменения профилирования и пакетного разрешения зависимостей не удалять; адаптировать их к новому потоку.

## File Structure

- `projectState/contracts.ts`, `store.ts`, `sqlite/store.ts` — пакетный исходный набор хэшей за абстракцией хранилища.
- `projectState/writerProtocol.ts`, `writerWorker.ts`, `writerHandle.ts` — перенос исходного набора через writer worker.
- `projectState/projectFiles.ts` — только обнаружение и классификация путей.
- `project/preparedYamlProjectWorker.ts` — чтение, хэширование и немедленная обработка одного файла.
- `project/preparedYamlProjectWorkerPool.ts` — ограниченные пачки путей и обратное давление.
- `projectState/refresh.ts` — одна транзакция обнаружения, worker-прохода и dependency validation.
- `projectState/service.ts` и validation profile — измерение новых фаз.
- `.agents/architecture.md` — актуальные этапы Б1–Б6; старая спецификация остаётся неизменной.

---

### Task 1: Пакетное чтение исходных хэшей

**Files:**
- Modify: `packages/core/metadata/projectState/contracts.ts`
- Modify: `packages/core/metadata/projectState/contracts.test.ts`
- Modify: `packages/core/metadata/projectState/store.ts`
- Modify: `packages/core/metadata/projectState/storeContract.ts`
- Modify: `packages/core/metadata/projectState/sqlite/store.ts`
- Modify: `packages/core/metadata/projectState/writerProtocol.ts`
- Modify: `packages/core/metadata/projectState/writerProtocol.test.ts`
- Modify: `packages/core/metadata/projectState/writerWorker.ts`
- Modify: `packages/core/metadata/projectState/writerHandle.ts`
- Modify: `packages/core/metadata/projectState/writerHandle.test.ts`
- Modify: `packages/core/metadata/projectState/tests/mockWriterTransport.ts`

**Interfaces:**
- Consumes: `ProjectStateFileIdentity[]`, `project_files`, `file_hashes`.
- Produces:

```ts
export interface ProjectStateFileBaseline {
  readonly knownHashBits: Uint8Array
  readonly hashBytes: Uint8Array
  readonly deleted: readonly ProjectStateFileIdentity[]
}

readFileBaseline(files: readonly ProjectStateFileIdentity[]): ProjectStateFileBaseline
```

`hashBytes` занимает `files.length * 8` байт. Бит `i` в `knownHashBits` сообщает, что диапазон `[i * 8, i * 8 + 8)` содержит сохранённый хэш; нулевой хэш нового файла отличается отсутствующим битом.

- [ ] **Step 1: Добавить падающий договорный тест store**

После сохранения двух файлов запросить baseline для `[известный, новый]`. Проверить известный бит, позиционный хэш, нули нового файла и появление второго сохранённого пути в `deleted`.

```ts
const baseline = store.readFileBaseline([identity(first), identity(newFile)])
expect([...baseline.knownHashBits]).toEqual([0b0000_0001])
expect(baseline.hashBytes.slice(0, 8)).toEqual(firstHash)
expect(baseline.hashBytes.slice(8, 16)).toEqual(new Uint8Array(8))
expect(baseline.deleted.map(({ projectPath }) => projectPath)).toEqual([second.projectPath])
```

- [ ] **Step 2: Подтвердить падение**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/projectState/sqlite/store.test.ts --no-isolate
```

Expected: FAIL — `readFileBaseline` отсутствует.

- [ ] **Step 3: Добавить тип и строгую проверку пакета**

В `contracts.ts` добавить `ProjectStateFileBaseline` и `assertProjectStateFileBaseline(value, fileCount)`. Отклонять лишние поля, ненулевой `byteOffset`, буферы неправильной длины и единичные биты за пределами `fileCount`.

```ts
const expectedBitBytes = Math.ceil(fileCount / 8)
const expectedHashBytes = fileCount * PROJECT_STATE_HASH_BYTE_LENGTH
```

- [ ] **Step 4: Реализовать пакетный SQLite-запрос**

Загрузить пути во временную таблицу с `request_index`. Одним `LEFT JOIN` прочитать хэши, вторым пакетным запросом получить исчезнувшие сохранённые пути. Не выполнять запрос на каждый файл.

```sql
SELECT request.request_index, hash.hash
FROM temp.file_baseline_requests request
LEFT JOIN project_files file ON file.project_path = request.project_path COLLATE BINARY
LEFT JOIN file_hashes hash ON hash.file_id = file.id
ORDER BY request.request_index
```

- [ ] **Step 5: Провести договор через writer worker**

Добавить команду `readFileBaseline` и подтверждение `fileBaseline`. `writerHandle.readFileBaseline` проверяет ответ через `assertProjectStateFileBaseline`; команда выполняется до `beginUpdate`.

```ts
| { readonly kind: "readFileBaseline"; readonly requestId: string; readonly files: readonly ProjectStateFileIdentity[] }
| { readonly kind: "fileBaseline"; readonly baseline: ProjectStateFileBaseline }
```

- [ ] **Step 6: Расширить тесты protocol и handle**

Добавить допустимую команду в существующий `it.each`, проверить один вызов транспорта и отказ принять baseline неправильной длины.

- [ ] **Step 7: Запустить целевые тесты**

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/projectState/contracts.test.ts \
  metadata/projectState/sqlite/store.test.ts \
  metadata/projectState/writerProtocol.test.ts \
  metadata/projectState/writerHandle.test.ts \
  --no-isolate
```

Expected: PASS; SQLite-тестовый файл после общего старта укладывается в 1 секунду.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/core/metadata/projectState/contracts.ts packages/core/metadata/projectState/contracts.test.ts \
  packages/core/metadata/projectState/store.ts packages/core/metadata/projectState/storeContract.ts \
  packages/core/metadata/projectState/sqlite/store.ts packages/core/metadata/projectState/writerProtocol.ts \
  packages/core/metadata/projectState/writerProtocol.test.ts packages/core/metadata/projectState/writerWorker.ts \
  packages/core/metadata/projectState/writerHandle.ts packages/core/metadata/projectState/writerHandle.test.ts \
  packages/core/metadata/projectState/tests/mockWriterTransport.ts
git commit -m "feat: :sparkles: добавить чтение исходных хэшей проекта"
```

### Task 2: Обработка одного файла внутри validation worker

**Files:**
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`

**Interfaces:**
- Consumes: путь, identity, YAML descriptor, известный бит и ожидаемый хэш.
- Produces:

```ts
export interface ProjectStateValidationFileTask {
  readonly identity: ProjectStateFileIdentity
  readonly absolutePath: string
  readonly descriptor?: PreparedYamlProjectFileDescriptor
}

type RefreshProjectStateTask = {
  readonly kind: "refreshProjectState"
  readonly workerIndex: number
  readonly projectDir: string
  readonly context: ConfigurationContext
  readonly files: readonly ProjectStateValidationFileTask[]
  readonly knownHashBits: Uint8Array
  readonly expectedHashBytes: Uint8Array
}

type RefreshProjectStateResult = {
  readonly kind: "refreshProjectStateResult"
  readonly fileUpdateBatches: readonly ProjectStateFileUpdateBatch[]
  readonly missingProjectPaths: readonly string[]
  readonly hashedFiles: number
  readonly parsedYamlFiles: number
  readonly changedFiles: number
}
```

- [ ] **Step 1: Написать падающий прямой worker-тест**

Одним `it.each` проверить неизменённый YAML, изменённый YAML и изменённый resource. Подменить только `readFile` и `hashBytes`; проверить одно чтение, отсутствие локального разбора неизменённого YAML и отсутствие исходных байтов в результате. Отдельно проверить `ENOENT` как `missingProjectPaths` и `EACCES` как техническую ошибку.

```ts
expect(readCalls).toEqual([absolutePath])
expect(result).not.toHaveProperty("bytes")
expect(result.fileUpdateBatches.flatMap(({ updates }) => updates)).toHaveLength(expectedUpdates)
```

- [ ] **Step 2: Подтвердить падение**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts --no-isolate
```

Expected: FAIL — worker не знает `refreshProjectState`.

- [ ] **Step 3: Добавить инъецируемую файловую границу**

Расширить зависимости `runPreparedYamlProjectWorkerTask`:

```ts
interface PreparedWorkerDependencies {
  readonly createValidationSchemaCache?: typeof createProjectValidationWorkerSchemaCache
  readonly readFile?: (absolutePath: string) => Promise<Uint8Array>
  readonly hashBytes?: (bytes: Uint8Array) => bigint
}
```

Production использует `node:fs/promises.readFile` и `hashFileBytes`. `stat` и `fstat` не вызывать.

- [ ] **Step 4: Выделить обработку байтов одного YAML**

Из цикла `runValidationFirstPass` выделить helper, принимающий уже прочитанные байты и возвращающий один `ProjectStateFileUpdateBatchEntry`. Старый `validateLocal` временно перевести на helper, чтобы не дублировать JSON Schema и извлечение фактов.

```ts
function validateProjectStateYamlBytes(params: {
  projectDir: string
  context: ConfigurationContext
  descriptor: PreparedYamlProjectFileDescriptor
  bytes: Uint8Array
  hash: bigint
}): { updateEntry?: ProjectStateFileUpdateBatchEntry; diagnostics: Diagnostic[] }
```

- [ ] **Step 5: Реализовать последовательный цикл worker-задания**

Для каждого файла прочитать байты, вычислить xxHash64, сравнить с ожидаемым хэшем и сразу пропустить либо обработать файл. Не складывать байты нескольких файлов в массив. Нормализованные результаты собирать максимум до `LOCAL_VALIDATION_BATCH_SIZE`.

- [ ] **Step 6: Передавать только выходные хэши**

Добавить `refreshProjectStateResult` к существующей обёртке `move(...)`. Transfer list содержит только `hashBytes.buffer` выходных пачек; вход содержит пути и ожидаемые хэши, но не содержимое файлов.

- [ ] **Step 7: Запустить тесты и type-check**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts --no-isolate
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 8: Зафиксировать worker-слой**

```bash
git add packages/core/metadata/project/preparedYamlProjectWorker.ts \
  packages/core/metadata/project/preparedYamlProjectWorker.test.ts \
  packages/core/metadata/project/preparedYamlProjectWorkerPool.ts
git commit -m "feat: :sparkles: обрабатывать файл проекта внутри worker"
```

### Task 3: Ограниченная очередь путей

**Files:**
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts`

**Interfaces:**
- Consumes: `ProjectStateFileBaseline`, обнаруженные кандидаты.
- Produces:

```ts
export interface ProjectStateValidationFile {
  readonly identity: ProjectStateFileIdentity
  readonly absolutePath: string
  readonly descriptor?: PreparedYamlProjectFileDescriptor
}

runProjectStateRefresh(params: {
  projectDir: string
  context: ConfigurationContext
  source: { files: readonly ProjectStateValidationFile[]; baseline: ProjectStateFileBaseline }
  operation?: PreparedYamlValidationOperation
}, producer: {
  writeBatch(batch: ProjectStateFileUpdateBatch): Promise<void>
  deleteFiles(projectPaths: readonly string[]): Promise<void>
}): Promise<{ hashedFiles: number; parsedYamlFiles: number; changedFiles: number; missingFiles: number }>
```

- [ ] **Step 1: Переписать тест backpressure на задания с путями**

Передать 65 путей. Первый `producer.writeBatch` удержать gate и проверить, что следующая задача той же lane не начата до подтверждения. Для двух worker проверить не более двух одновременных задач и отсутствие `bytes` в task. Вернуть результаты двух lane в обратном порядке и проверить те же обновления, сопоставленные по `projectPath`.

```ts
expect(taskSizes).toEqual([32])
releaseFirstWrite()
await running
expect(taskSizes).toEqual([32, 32, 1])
```

- [ ] **Step 2: Подтвердить падение нового договора**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts --no-isolate
```

Expected: FAIL до появления `runProjectStateRefresh`.

- [ ] **Step 3: Реализовать lane и обратное давление**

Создавать для каждой lane не более одной пачки до завершения всех `producer.writeBatch` и `producer.deleteFiles` результата. Из общего baseline собирать позиционные `knownHashBits` и `expectedHashBytes` текущей пачки. При первой ошибке отменить новые задачи и дождаться settlement уже начатых задач и записей.

- [ ] **Step 4: Запустить worker-тесты и type-check**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts --no-isolate
pnpm --filter @nkdk/core type-check
```

Expected: PASS; существующий refresh пока продолжает использовать старый метод pool и будет заменён в Task 4.

- [ ] **Step 5: Зафиксировать очередь**

```bash
git add packages/core/metadata/project/preparedYamlProjectWorkerPool.ts \
  packages/core/metadata/project/preparedYamlProjectWorker.test.ts
git commit -m "refactor: :recycle: передавать worker только пути проекта"
```

### Task 4: Однопроходная транзакция актуализации

**Files:**
- Modify: `packages/core/metadata/projectState/projectFiles.ts`
- Delete: `packages/core/metadata/projectState/projectFilesConcurrency.test.ts`
- Modify: `packages/core/metadata/projectState/refresh.ts`
- Modify: `packages/core/metadata/projectState/refresh.test.ts`
- Modify: `packages/core/metadata/projectState/service.ts`
- Modify: `packages/core/metadata/projectState/service.test.ts`
- Modify: `packages/core/metadata/projectState/index.ts`
- Modify: `packages/core/index.ts`

**Interfaces:**
- Consumes: `discoverProjectStateValidationFiles`, `readFileBaseline`, `runProjectStateRefresh`.
- Produces: прежний `ProjectStateRefreshResult` без stability retry и профиль новых фаз:

```ts
export interface ProjectStateRefreshProfile {
  readonly snapshotBytes: number
  readonly loadMs: number
  readonly checkpointMs: number
  readonly discoverFilesMs: number
  readonly readBaselineMs: number
  readonly processFilesMs: number
  readonly readLocalDiagnosticsMs: number
  readonly dependencyValidationMs: number
}
```

- [ ] **Step 1: Заменить внутренние refresh-тесты договорными сценариями**

Сохранить проверки отката, отмены, diagnostics и checkpoint, но заменить `CollectedProjectStateFiles` на кандидаты и baseline. Холодный, прогретый, изменённый YAML, изменённый resource и удалённый путь проверить одним последовательным сценарием состояния.

```ts
expect(cold.stats).toEqual({ hashedFiles: 2, parsedYamlFiles: 1, changedFiles: 2, deletedFiles: 0 })
expect(warm.stats).toMatchObject({ hashedFiles: 2, parsedYamlFiles: 0, changedFiles: 0 })
expect(handle.events).toEqual([
  "readFileBaseline",
  "beginUpdate",
  "deleteFiles",
  "runProjectStateRefresh",
  "readLocalDiagnostics",
  "validateDependencies",
  "createReadToken",
  "commitAndCheckpoint",
])
```

Добавить сценарий: исчезновение между discovery и чтением приводит к `deleteFiles` и успешной фиксации без повтора; `EACCES` вызывает один rollback.

- [ ] **Step 2: Подтвердить падение старой последовательности**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/projectState/refresh.test.ts --no-isolate
```

Expected: FAIL на `collectFiles → compareFiles → runLocalValidation`.

- [ ] **Step 3: Оставить в `projectFiles.ts` только discovery**

Удалить `open`, чтение, `stat`, `fstat`, `ProjectResourceStability`, `HashedProjectResource`, `collectProjectStateFiles`, stability-обход и `p-limit`. Реализовать:

```ts
export async function discoverProjectStateValidationFiles(
  projectDir: string,
): Promise<readonly ProjectStateValidationFile[]>
```

Функция строит identity и YAML descriptor, сортирует по корневому пути и не открывает файлы. Удалить `projectFilesConcurrency.test.ts`: его договор заменён pool-тестом ограничения worker-задач.

- [ ] **Step 4: Переписать `refreshProjectState` без retry**

Реализовать последовательность:

```ts
const files = await dependencies.discoverFiles(params)
const baseline = await dependencies.handle.readFileBaseline(files.map(({ identity }) => identity))
await dependencies.handle.beginUpdate(params.projectDir, operation.signal)
await dependencies.handle.deleteFiles(baseline.deleted.map(({ projectPath }) => projectPath))
const workerStats = await dependencies.pool.runProjectStateRefresh(
  { projectDir: params.projectDir, context, source: { files, baseline }, operation },
  dependencies.handle,
)
const localDiagnostics = await dependencies.handle.readLocalDiagnostics()
const dependencyDiagnostics = await dependencies.handle.validateDependencies()
```

После `beginUpdate` любая техническая ошибка вызывает один `rollbackUpdate`. Удалить `ProjectStateFilesChangedError`, `isStable`, две попытки, `bytes`, полный актуальный `hashBatch` и отдельный `writeChangedResources`.

После переключения refresh удалить больше не используемые `runLocalValidation`, `PreparedYamlLocalValidationSource` и worker-команду `validateLocal`. Helper обработки одного YAML остаётся единственной реализацией локальной validation для `refreshProjectState`.

- [ ] **Step 5: Адаптировать профиль Task 16**

Переименовать фазы `collectFiles/compareFiles/localValidation` в `discoverFiles/readBaseline/processFiles`; удалить `writeResources`. В `service.ts` сохранить `stat(snapshotPath)` только для размера SQLite-снимка: это не проверка файла проекта.

- [ ] **Step 6: Обновить service-тест профиля**

Проверить появление профиля только при `profile`, новые поля и стабильный порядок событий `discoverFiles`, `readBaseline`, `processFiles`, `readLocalDiagnostics`, `dependencyValidation`, `checkpoint`.

- [ ] **Step 7: Запустить целевые тесты и type-check**

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/projectState/refresh.test.ts \
  metadata/projectState/service.test.ts \
  metadata/project/preparedYamlProjectWorker.test.ts \
  --no-isolate
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 8: Зафиксировать актуализацию**

```bash
git add packages/core/metadata/projectState/projectFiles.ts \
  packages/core/metadata/projectState/refresh.ts packages/core/metadata/projectState/refresh.test.ts \
  packages/core/metadata/projectState/service.ts packages/core/metadata/projectState/service.test.ts \
  packages/core/metadata/projectState/index.ts packages/core/index.ts
git commit -m "refactor: :recycle: выполнять актуализацию одним worker-проходом"
```

### Task 5: Архитектура и профиль памяти

**Files:**
- Modify: `.agents/architecture.md`
- Modify: `.agents/skills/validation-profile/SKILL.md`
- Modify: `.agents/skills/validation-profile/validation-profile.mjs`
- Modify: `packages/core/metadata/validation/profile.ts`
- Modify: `packages/core/metadata/validation/profile.test.ts`

**Interfaces:**
- Consumes: `ProjectStateRefreshProfile` из Task 4 и compiled standalone validation.
- Produces: профиль новых фаз, `hashedFiles`, `parsedYamlFiles`, Peak RSS и размер снимка.

- [ ] **Step 1: Обновить описание Б1–Б3**

В `.agents/architecture.md` зафиксировать: координатор обнаруживает пути и получает исходные хэши; worker читает путь, хэширует и только при изменении из тех же байтов выполняет Б2 и Б3. Удалить формулировки о первом общем чтении с последующей передачей изменённых YAML. Старую спецификацию не менять.

- [ ] **Step 2: Адаптировать профиль**

Переименовать фазы в JSON и человекочитаемом выводе. Профиль различает `hashedFiles` и `parsedYamlFiles`, выводит Peak RSS и не создаёт файлы в пользовательском проекте.

- [ ] **Step 3: Запустить быстрые тесты профиля**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/profile.test.ts --no-isolate
```

Expected: PASS; большой проект в юнит-тесте не запускается.

- [ ] **Step 4: Выполнить compiled профиль на временной копии**

Следовать `.agents/skills/validation-profile/SKILL.md`. `/Users/nikita/git/nkdk-yaml` использовать только для чтения. Для холодного и прогретого прохода сохранить полное время, Peak RSS, `hashedFiles`, `parsedYamlFiles`, `discoverFilesMs`, `readBaselineMs`, `processFilesMs`, `dependencyValidationMs`, `checkpointMs`.

Expected: прогретый проход имеет `parsedYamlFiles === 0`; Peak RSS не растёт пропорционально суммарному размеру ресурсов. При падении compiled validation или повторном разборе неизменённых YAML остановиться и исправить причину.

Фактический контроль: прогретая validation временной копии завершилась за `48.925s`, захэшировала `121410` файлов и разобрала `0` YAML. Холодная перестройка завершилась за `140.512s`, поэтому её дальнейшее ускорение остаётся отдельной задачей и не должно маскироваться повторными прогонами без внешнего таймера.

- [ ] **Step 5: Зафиксировать документацию и профиль**

```bash
git add .agents/architecture.md .agents/skills/validation-profile/SKILL.md \
  .agents/skills/validation-profile/validation-profile.mjs \
  packages/core/metadata/validation/profile.ts packages/core/metadata/validation/profile.test.ts
git commit -m "docs: :memo: уточнить профиль worker-актуализации"
```

### Task 6: Итоговая проверка

**Files:**
- Verify: production-код и тесты Tasks 1–5.

**Interfaces:**
- Consumes: все реализованные слои.
- Produces: проверенную ветку без новых дублей и регрессий.

- [ ] **Step 1: Найти остатки старого потока**

```bash
rg -n "ProjectResourceStability|isProjectStateFileCollectionStable|ProjectStateFilesChangedError|mtimeNs|handle\.stat|fstat" \
  packages/core/metadata/projectState packages/core/metadata/project
```

Expected: нет совпадений production-кода. `stat(snapshotPath)` в `service.ts` допустим только для размера SQLite-снимка.

- [ ] **Step 2: Проверить новые дубли**

```bash
pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
```

Expected: PASS.

- [ ] **Step 3: Запустить общий type-check**

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 4: Запустить полный набор один раз**

```bash
pnpm test
```

Expected: PASS во всех пакетах. Mutation testing не запускать.

- [ ] **Step 5: Проверить diff и рабочее дерево**

```bash
git diff --check e768ba6321fc99b2623e04f1fe72a06c77f07b38..HEAD
git status --short
```

Expected: `git diff --check` без вывода; нет незакоммиченных изменений реализации или временных файлов профиля.

- [ ] **Step 6: Исправить только выявленную регрессию**

Если предыдущие шаги выявили ошибку, сначала добавить падающий узкий тест в ответственном `*.test.ts`, затем исправить соответствующий production-файл и повторить узкую проверку. Создать коммит только при фактическом исправлении:

```bash
git commit -m "fix: :bug: устранить регрессию worker-актуализации"
```

Если ошибок нет, Step 6 не создаёт коммит.
