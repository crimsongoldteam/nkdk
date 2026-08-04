# Assignment-scoped configuration index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать глобальный строковый lookup configuration index из штатной обработки свойств YAML → XML, ограничив поиск диапазоном entity текущего назначения.

**Architecture:** Дисковый configuration index `1.3` и логический `FullXmlSyncPlan` остаются неизменными. Главный процесс один раз связывает назначения с диапазонами существующего shared snapshot; worker создаёт на время назначения маленький reader `logicalAddress → binary offset`, кэширует декодированные entity и использует существующий глобальный reader только при локальном промахе.

**Tech Stack:** TypeScript 7, Node.js, Vitest, Piscina, SharedArrayBuffer, существующий двоичный configuration index и `@node-rs/xxhash`.

## Global Constraints

- Не изменять дисковый формат configuration index `1.3`.
- Не сохранять `rangeId`, `start` или `count` между операциями либо поколениями снимка.
- Не изменять `refreshAndValidate`, `concurrency: 4`, import, validation, `rules.ts`, прикладные metadata-типы и XML-фикстуры.
- Base configuration index расширения оставить на существующем глобальном reader.
- Повреждение диапазона не скрывать глобальным fallback; пустой диапазон для нового файла допустим.
- Следовать TDD: каждый production-шаг начинается с наблюдаемого падения ближайшего теста.
- После каждого законченного слоя выполнить `pnpm check:duplicates -- --base 63b786f9e`; `pnpm test:architecture` выполнить только в самом конце вместе с остальными итоговыми проверками.
- Эталон `doc`: 22 135 YAML-файлов, 51,14 с real, 147,69 с user, 23,01 с system, 2,36 ГиБ RSS и три известных XML-diff.

---

## File map

- `packages/core/metadata/configurationIndex/sharedSnapshot.ts` — вычисляет диапазон source path и создаёт assignment-scoped reader поверх общего снимка.
- `packages/core/metadata/configurationIndex/sharedSnapshot.test.ts` — защищает границы диапазона, локальные попадания, кэш, fallback и ошибки целостности.
- `packages/core/metadata/configurationIndex/index.ts` — экспортирует новые типы и фабрики configuration index.
- `packages/core/metadata/fullSyncToXml/types.ts` — отделяет временное исполняемое назначение от логического `FullXmlSyncAssignment`.
- `packages/core/metadata/fullSyncToXml/workerPool.ts` — один раз связывает назначения с диапазонами до разбиения между worker.
- `packages/core/metadata/fullSyncToXml/workerPool.test.ts` — проверяет передаваемые worker числовые диапазоны, включая новый путь.
- `packages/core/metadata/fullSyncToXml/worker.ts` — создаёт и освобождает локальный reader для каждого назначения, собирает профильные счётчики.
- `packages/core/metadata/fullSyncToXml/worker.test.ts` — интеграционно проверяет штатный локальный путь, fallback и жизненный цикл reader.
- `packages/core/metadata/fullSyncToXml/prepareAssignment.ts` — изменений логики не требует; получает локальный reader через существующий параметр `index`.

### Task 1: Диапазон и локальный reader configuration index

**Files:**
- Modify: `packages/core/metadata/configurationIndex/sharedSnapshot.ts`
- Modify: `packages/core/metadata/configurationIndex/sharedSnapshot.test.ts`
- Modify: `packages/core/metadata/configurationIndex/index.ts`

**Interfaces:**
- Consumes: существующие `SharedConfigurationIndexSnapshot`, `ConfigurationIndexReader.entity(logicalAddress)` и таблицы `sourceEntityOffsets`/`sourceEntityRanges`.
- Produces: `ConfigurationIndexEntityRange`, `ConfigurationIndexAssignmentLookupStats`, `ConfigurationIndexReader.entityRange(projectPath)`, `ConfigurationIndexReader.forEntityRange(range, stats)`.

- [ ] **Step 1: Добавить падающие тесты связывания и локального чтения**

В существующий `describe("shared configuration index snapshot")` добавить проверки реального `sampleSnapshot()`:

```ts
it("связывает sourceProjectPath с числовым диапазоном текущего снимка", () => {
  const reader = createConfigurationIndexReader(
    snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot())),
  )

  const range = reader.entityRange("Документы/Заказ.yaml")
  expect(range.count).toBe(1)
  expect(reader.entityRange("Новый.yaml")).toEqual({ start: 0, count: 0 })
  expect(reader.forEntityRange(range).entity("Документ.Заказ"))
    .toEqual(sampleSnapshot().entities[1])
})

it("сначала читает entity локально, кэширует декодирование и считает fallback", () => {
  const reader = createConfigurationIndexReader(
    snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot())),
  )
  const stats = createConfigurationIndexAssignmentLookupStats()
  const local = reader.forEntityRange(reader.entityRange("Документы/Заказ.yaml"), stats)

  expect(local.entity("Документ.Заказ")).toEqual(local.entity("Документ.Заказ"))
  expect(local.entity("Конфигурация")).toEqual(reader.entity("Конфигурация"))
  expect(stats).toEqual({
    localHits: 2,
    localMisses: 1,
    globalFallbacks: 1,
    decodedEntities: 2,
    rangeEntities: 1,
  })
})
```

Добавить отдельные проверки, что entity соседнего диапазона считается локальным промахом, диапазон за границей выбрасывает `Повреждён диапазон entity индекса конфигурации`, а повторный `logicalAddress` в диапазоне выбрасывает `Повторяется logicalAddress entity в диапазоне` до первого lookup.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/sharedSnapshot.test.ts
```

Expected: FAIL, потому что `entityRange`, `forEntityRange` и `createConfigurationIndexAssignmentLookupStats` ещё отсутствуют.

- [ ] **Step 3: Добавить минимальные типы и фабрики**

В `sharedSnapshot.ts` добавить:

```ts
export interface ConfigurationIndexEntityRange {
  readonly start: number
  readonly count: number
}

export interface ConfigurationIndexAssignmentLookupStats {
  localHits: number
  localMisses: number
  globalFallbacks: number
  decodedEntities: number
  rangeEntities: number
}

export function createConfigurationIndexAssignmentLookupStats(): ConfigurationIndexAssignmentLookupStats {
  return { localHits: 0, localMisses: 0, globalFallbacks: 0, decodedEntities: 0, rangeEntities: 0 }
}
```

Расширить `ConfigurationIndexReader`:

```ts
entityRange(projectPath: string): ConfigurationIndexEntityRange
forEntityRange(
  range: ConfigurationIndexEntityRange,
  stats?: ConfigurationIndexAssignmentLookupStats,
): ConfigurationIndexReader
```

`SharedConfigurationIndexReader.entityRange()` должен выполнить существующий поиск `sourceProjectPath → rangeId` ровно один раз и вернуть пару из `sourceEntityRanges`; неизвестный путь возвращает `{ start: 0, count: 0 }`.

- [ ] **Step 4: Реализовать assignment-scoped reader без копирования shared-данных**

В том же файле добавить закрытый `AssignmentConfigurationIndexReader`. `SharedConfigurationIndexReader.forEntityRange()` сначала проверяет целочисленные неотрицательные `start`/`count` и `start + count <= sourceEntityOffsets.length`, затем передаёт локальному reader:

```ts
return new AssignmentConfigurationIndexReader({
  source: this,
  snapshot: this.snapshot,
  offsets: this.sourceEntityOffsets.subarray(range.start, range.start + range.count),
  logicalAddressAt: (offset) => this.logicalAddressAt(offset),
  decodeAt: (offset) => this.decodeEntity(offset),
  stats,
})
```

Локальный reader в конструкторе строит `Map<string, number>` только по переданным offset. Повтор адреса является ошибкой конструктора. `entity(address)` работает так:

```ts
const offset = this.offsetByLogicalAddress.get(logicalAddress)
if (offset === undefined) {
  this.stats.localMisses += 1
  this.stats.globalFallbacks += 1
  const entity = this.source.entity(logicalAddress)
  if (entity !== undefined && !this.cache.has(logicalAddress)) {
    this.cache.set(logicalAddress, entity)
    this.stats.decodedEntities += 1
  }
  return entity
}
this.stats.localHits += 1
let entity = this.cache.get(logicalAddress)
if (entity === undefined) {
  entity = this.decodeAt(offset)
  this.cache.set(logicalAddress, entity)
  this.stats.decodedEntities += 1
}
return entity
```

`header`, `file`, `files`, `entities` и `entitiesBySourceProjectPath` делегировать `source`; `snapshot` должен быть тем же объектом. Для чтения адреса без полной entity добавить в глобальный reader маленький `logicalAddressAt(offset)`, который читает только stringId по `offset + 4`.

- [ ] **Step 5: Экспортировать API и получить GREEN**

Экспортировать из `configurationIndex/index.ts` оба типа и фабрику статистики. Затем выполнить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/sharedSnapshot.test.ts
pnpm --filter @nkdk/core type-check
pnpm check:duplicates -- --base 63b786f9e
```

Expected: PASS; jscpd не сообщает новых дублей.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/core/metadata/configurationIndex/sharedSnapshot.ts packages/core/metadata/configurationIndex/sharedSnapshot.test.ts packages/core/metadata/configurationIndex/index.ts
git commit -m "perf: :zap: добавить локальный reader индекса назначения" -m "Глобальный configuration index остаётся резервным источником, а штатный поиск ограничивается диапазоном entity одного YAML-файла."
```

### Task 2: Связывание исполняемых назначений в главном процессе

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.test.ts`

**Interfaces:**
- Consumes: `ConfigurationIndexReader.entityRange(projectPath)` из Task 1 и неизменяемый `FullXmlSyncAssignment`.
- Produces: `FullXmlSyncExecutionAssignment` с `configurationIndexEntityRange`; worker-команды `execute`/`executeBatch` получают только исполняемые назначения.

- [ ] **Step 1: Добавить падающую проверку числового связывания**

В `workerPool.test.ts` заменить тестовый `targetIndex: {} as never` на настоящий snapshot с entity для `one.yaml`, а затем добавить:

```ts
it("один раз связывает назначения с диапазонами target index до передачи worker", async () => {
  const pools = createFakePools()
  const pool = createFullXmlSyncWorkerPool({ concurrency: 1, createWorkerPool: pools.factory })
  await pool.initialize(initializationWithTargetEntities([entity("Справочник.one", "one.yaml")]))

  await pool.execute([assignment("one"), assignment("new")])

  expect(pools.executionAssignments(0).map(({ configurationIndexEntityRange }) => configurationIndexEntityRange))
    .toEqual([{ start: expect.any(Number), count: 1 }, { start: 0, count: 0 }])
})
```

Helper из примера должен использовать уже существующие `entity()` и `encodeConfigurationIndex()`:

```ts
function initializationWithTargetEntities(
  entities: readonly ConfigurationSnapshotEntity[],
): FullXmlSyncWorkerInitialization {
  return {
    ...initialization,
    targetIndex: snapshotConfigurationIndex(encodeConfigurationIndex({
      specificationVersion: "1.3",
      indexGeneration: 1n,
      componentPath: "cf",
      files: [],
      entities,
    })),
  }
}
```

В `createFakePools()` добавить только проекцию уже записанных команд:

```ts
executionAssignments(workerIndex: number): FullXmlSyncExecutionAssignment[] {
  return pools.commands(workerIndex).flatMap((task) =>
    task.kind === "executeBatch" ? [...task.assignments] : []
  )
}
```

Дополнительно типовой тест должен подтверждать, что обычный `FullXmlSyncAssignment` не содержит диапазона и `FullXmlSyncPlan` не изменился.

- [ ] **Step 2: Запустить тест и подтвердить RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/workerPool.test.ts
```

Expected: FAIL: команды пока передают исходные назначения без `configurationIndexEntityRange`.

- [ ] **Step 3: Ввести временный тип исполнения**

В `types.ts` добавить:

```ts
export interface FullXmlSyncExecutionAssignment extends FullXmlSyncAssignment {
  readonly configurationIndexEntityRange: ConfigurationIndexEntityRange
}
```

Изменить только ветки команд worker:

```ts
| { readonly kind: "execute"; readonly assignments: readonly FullXmlSyncExecutionAssignment[] }
| { readonly kind: "executeBatch"; readonly assignments: readonly FullXmlSyncExecutionAssignment[] }
```

Публичный `FullXmlSyncPlan.assignments` и `FullXmlSyncWorkerPool.execute()` оставить типизированными как `FullXmlSyncAssignment[]`.

- [ ] **Step 4: Связать назначения перед partitionRoundRobin**

При `initialize()` создать и сохранить единственный главный reader `createConfigurationIndexReader(initializeParams.targetIndex)`. В начале `execute()` до разбиения построить временный массив:

```ts
const executableAssignments = assignments.map((assignment): FullXmlSyncExecutionAssignment => ({
  ...assignment,
  configurationIndexEntityRange: targetIndexReader.entityRange(assignment.sourceProjectPath),
}))
const partitions = partitionRoundRobin(executableAssignments, concurrency)
  .filter((partition) => partition.length > 0)
```

Reader и диапазоны живут только до закрытия текущего пула; в snapshot или план ничего не записывать.

- [ ] **Step 5: Получить GREEN и проверить слой**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/workerPool.test.ts
pnpm --filter @nkdk/core type-check
pnpm check:duplicates -- --base 63b786f9e
```

Expected: PASS.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/core/metadata/fullSyncToXml/types.ts packages/core/metadata/fullSyncToXml/workerPool.ts packages/core/metadata/fullSyncToXml/workerPool.test.ts
git commit -m "perf: :zap: связать sync назначения с диапазонами индекса" -m "Диапазоны вычисляются один раз в главном процессе и не сохраняются в логическом плане либо configuration index."
```

### Task 3: Использование локального reader и профильные счётчики в worker

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/binaryResult.ts` только если профильные счётчики невозможно вывести существующим `ValidationProfiler`; предпочтительно не менять двоичный результат.

**Interfaces:**
- Consumes: `FullXmlSyncExecutionAssignment`, `ConfigurationIndexReader.forEntityRange()` и `ConfigurationIndexAssignmentLookupStats`.
- Produces: каждый вызов `prepareFullXmlSyncAssignment({ index })` получает локальный reader; при `NKDK_PROFILE=1` worker печатает агрегированные local hits/misses/fallbacks/decoded/range entities.

- [ ] **Step 1: Добавить падающий интеграционный тест локального пути**

В `worker.test.ts` изменить helper `initialize()` так, чтобы он принимал `targetSnapshot`, а команды получали `FullXmlSyncExecutionAssignment` с диапазоном именно этого снимка. Добавить helper:

```ts
function bindAssignment(
  snapshot: SharedConfigurationIndexSnapshot,
  value: FullXmlSyncAssignment,
): FullXmlSyncExecutionAssignment {
  return {
    ...value,
    configurationIndexEntityRange:
      createConfigurationIndexReader(snapshot).entityRange(value.sourceProjectPath),
  }
}
```

Добавить тест с индексом, содержащим entity текущего `Справочник.Товары`:

```ts
it("обслуживает обычное назначение локальным reader и освобождает его после обработки", async () => {
  const projectDir = createProject(["Товары"])
  const targetSnapshot = snapshotConfigurationIndex(encodeConfigurationIndex(snapshotForProjectPath(
    "Справочник/Товары/Свойства.yaml",
    "Справочник.Товары",
  )))
  const assigned = bindAssignment(targetSnapshot, assignment(projectDir, "Товары"))
  await initialize(projectDir, [assigned], context, undefined, undefined, undefined, targetSnapshot)

  const result = await runFullXmlSyncWorkerCommand({ kind: "execute", assignments: [assigned] })

  expect(result).toMatchObject({ diagnostics: [] })
  expect(fullXmlSyncWorkerStateForTests()).not.toHaveProperty("assignmentIndex")
})
```

`snapshotForProjectPath()` возвращает `ConfigurationSnapshot` версии `1.3` с `componentPath: "cf"`, поколением `1n`, пустым `files` и одной `entity(logicalAddress, sourceProjectPath)`; её код должен быть записан в тесте полностью, а не импортирован из production.

Усилить тест новым/переименованным source path: диапазон `{ start: 0, count: 0 }`, но XML-семантика восстанавливается глобальным fallback. Существующие проверки UUID/XML-флагов в `prepareAssignment.test.ts` оставить неизменными и прогнать как регрессионные.

- [ ] **Step 2: Запустить тесты и подтвердить RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/prepareAssignment.test.ts
```

Expected: FAIL, потому что worker передаёт `state.index`, а не `state.index.forEntityRange(...)`.

- [ ] **Step 3: Создавать локальный reader на границе назначения**

В начале каждой итерации `for (const assignment of assignments)` создать статистику и локальный reader:

```ts
const lookupStats = createConfigurationIndexAssignmentLookupStats()
const assignmentIndex = state.index.forEntityRange(
  assignment.configurationIndexEntityRange,
  lookupStats,
)
```

Передать `assignmentIndex` в `prepareFullXmlSyncAssignment({ index: assignmentIndex })`. Не сохранять его в `InitializedFullXmlSyncWorkerState`; после итерации единственная ссылка исчезает. `baseConfigurationIndex: state.baseIndex` оставить глобальным.

- [ ] **Step 4: Агрегировать пять счётчиков существующим profiler**

При initialize создать:

```ts
profiler: createOperationProfiler({
  operation: "full-sync-to-xml",
  scope: { scope: "worker", workerIndex: command.workerIndex },
  aggregate: true,
})
```

После каждого назначения записать пять records с `timeMs: 0` и `items` из `lookupStats` под шагом `"Configuration index назначения"`. В `finishExecution` вызвать `state.profiler.flush()` один раз. Имена подшагов: `"Локальные попадания"`, `"Локальные промахи"`, `"Глобальные fallback"`, `"Декодированные entity"`, `"Entity в диапазонах"`.

Добавить тест с `vi.stubEnv("NKDK_PROFILE", "1")`, `vi.spyOn(console, "error").mockImplementation(() => undefined)` и проверить наличие всех пяти агрегированных подшагов в аргументах `console.error`. Не добавлять счётчики в production-ответ sync и не менять `binaryResult.ts`, если этот путь работает.

- [ ] **Step 5: Получить GREEN и прогнать регрессии full sync**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/prepareAssignment.test.ts metadata/fullSyncToXml/writeAssignment.test.ts metadata/fullSyncToXml/writeRootAssignment.test.ts metadata/forms/clientApplicationForm/baseForm.test.ts
pnpm --filter @nkdk/core type-check
pnpm check:duplicates -- --base 63b786f9e
```

Expected: PASS; base form по-прежнему читает глобальный base index.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/core/metadata/fullSyncToXml/worker.ts packages/core/metadata/fullSyncToXml/worker.test.ts
git commit -m "perf: :zap: читать индекс локально в sync worker" -m "Reader и кэш ограничены одним назначением; редкие промахи сохраняют прежнее поведение через глобальный fallback."
```

### Task 4: Полная проверка и повторное профилирование `doc`

**Files:**
- Modify only if needed: implementation files from Tasks 1–3
- Do not modify: XML fixtures and architecture plan

**Interfaces:**
- Consumes: завершённая реализация Tasks 1–3.
- Produces: подтверждённая функциональная эквивалентность, сравнение времени/RSS/CPU и выбранное следующее узкое место.

- [ ] **Step 1: Запустить все статические и архитектурные проверки**

```bash
pnpm type-check
pnpm test
pnpm test:architecture
pnpm check:duplicates -- --base 63b786f9e
```

Expected: функционально все тесты проходят; dependency-cruiser не добавляет новых нарушений относительно известных 177 baseline. Если `pnpm test` снова завершится только проверкой длительности после 663/5483 зелёных тестов, сохранить точный вывод как известное ограничение, не объявлять команду успешной.

- [ ] **Step 2: Восстановить только предыдущий результат round-trip `doc`**

Пользователь заранее разрешил `git restore` в `/Users/nikita/git/round-trip-compact`; перед новым замером проверить `git status --short cf/doc`, затем восстановить только `cf/doc`, не затрагивая `cf/all` или другие пользовательские изменения:

```bash
git status --short cf/doc
git restore --source=HEAD --staged --worktree -- cf/doc
```

- [ ] **Step 3: Выполнить чистый sync `doc` при concurrency 4**

Запустить ту же команду прямого sync, которой получена исходная точка 51,14 с, под `/usr/bin/time -l`, без V8 CPU profiler и с `concurrency: 4`. Зафиксировать real/user/system, max RSS, число обработанных YAML и итог sync.

Expected: 22 135 YAML, успешный sync, время ниже 51,14 с без роста RSS, который отменяет выигрыш.

- [ ] **Step 4: Выполнить полный round-trip `doc` и сравнить diff**

Использовать `round-trip-yaml` на `/Users/nikita/git/round-trip-compact/cf/doc`. Сравнить не только количество, но и пути/содержимое расхождений с тремя известными XML-diff.

Expected: новых расхождений нет.

- [ ] **Step 5: Снять V8 CPU-профиль основного потока и четырёх worker**

Повторить ранее использованную команду с `--cpu-prof`, отдельным каталогом `/private/tmp/nkdk-doc-assignment-index-cpu` и `NKDK_PROFILE=1`. Свести `.cpuprofile` тем же скриптом, что использовался для исходного профиля, и отдельно выписать:

- долю string encode/decode;
- долю global configuration lookup;
- local hits/misses/global fallback/decoded/range entities;
- новый крупнейший участок полезного CPU;
- real/user/system и RSS с учётом накладных расходов профилировщика.

- [ ] **Step 6: Сопоставить результат со спецификацией**

Подтвердить:

```text
обычный doc почти полностью обслуживается локальным reader;
глобальный lookup больше не является главным потребителем CPU;
XML-семантика и три известных diff не изменились;
следующее узкое место выбрано по новому профилю, а не предположению.
```

Если fallback частый, остановить дальнейшую оптимизацию и сначала классифицировать sourceProjectPath/logicalAddress этих промахов. Если локальный lookup успешен, но следующее узкое место относится к другой архитектурной задаче, оформить для него отдельный brainstorming-цикл.

- [ ] **Step 7: Финальный коммит только при необходимых исправлениях проверки**

Если Task 4 потребовал правки кода, повторить затронутые целевые тесты, `pnpm type-check`, `pnpm test:architecture` и jscpd, затем создать отдельный Conventional Commit с gitmoji по фактической причине. Если правок нет — новый коммит не создавать.
