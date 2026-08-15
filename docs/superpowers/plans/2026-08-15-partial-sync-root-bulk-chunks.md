# Partial Sync Root Bulk Chunks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разделить массовое создание корневых объектов partial e2e на последовательные блоки максимум по 12 операций, не меняя остальные слои.

**Architecture:** Необязательное поле `bulkBlockSize` принадлежит декларации слоя. `buildScenarioPlan` сначала выполняет существующую топологическую сортировку, отделяет пробную операцию и только затем нарезает остаток на стабильные массовые блоки; исполнитель сценария продолжает работать с обычным `ScenarioBlock` без специальных условий.

**Tech Stack:** TypeScript, Vitest, декларативная матрица `e2e/partial-sync`, ручной автономный e2e.

## Global Constraints

- Ограничение `bulkBlockSize: 12` задаётся только для слоя `roots:create`.
- Разбиение выполняется после топологической сортировки и сохраняет порядок зависимостей.
- Слой без ограничения сохраняет ключ `${layer}:bulk`; разделённые блоки получают ключи `${layer}:bulk:1`, `${layer}:bulk:2` и далее.
- Сценарий не добавляется в обычные `pnpm test`, `pnpm test:e2e` или CI.
- Существующие XML-фикстуры не изменяются.

---

### Task 1: Декларативное разбиение массового блока

**Files:**
- Modify: `e2e/partial-sync/matrix/types.ts`
- Modify: `e2e/partial-sync/plan.ts`
- Modify: `e2e/partial-sync/plan.test.ts`
- Modify: `e2e/partial-sync/matrix/layers.ts`
- Modify: `e2e/partial-sync/matrix.test.ts`

**Interfaces:**
- Consumes: существующие `ScenarioLayer`, `ScenarioBlock`, `buildScenarioPlan(matrix)` и топологически отсортированный список операций слоя.
- Produces: `ScenarioLayer.bulkBlockSize?: number`; ключ `ScenarioBlock.key` допускает `${string}:bulk:${number}`; `roots:create` объявляет `bulkBlockSize: 12`.

- [ ] **Step 1: Write the failing plan test**

Добавить в `e2e/partial-sync/plan.test.ts` проверку слоя из пяти операций с пробной операцией в середине, зависимостью потребителя от более ранней операции и `bulkBlockSize: 2`:

```ts
it("splits the sorted bulk into stable dependency-safe chunks", () => {
  const source = matrix()
  const base = creationOperations(source)
  const operations = [
    { ...base[0], key: "object:first", dependsOn: [] },
    { ...base[0], key: "object:probe", dependsOn: [] },
    { ...base[0], key: "object:consumer", dependsOn: ["object:dependency"] },
    { ...base[0], key: "object:dependency", dependsOn: [] },
    { ...base[0], key: "object:last", dependsOn: [] },
  ]
  const layered = withLayers(source, [{
    key: "roots:create",
    componentPath: "cf",
    probeOperationKey: "object:probe",
    bulkBlockSize: 2,
    operations,
  }])

  expect(buildScenarioPlan(layered).map((block) => ({
    key: block.key,
    operations: block.operations.map(({ key }) => key),
  }))).toEqual([
    { key: "roots:create:probe", operations: ["object:probe"] },
    { key: "roots:create:bulk:1", operations: ["object:first", "object:dependency"] },
    { key: "roots:create:bulk:2", operations: ["object:consumer", "object:last"] },
  ])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run e2e/partial-sync/plan.test.ts`

Expected: FAIL, потому что `ScenarioLayer` пока не принимает `bulkBlockSize`, а построитель создаёт один `roots:create:bulk`.

- [ ] **Step 3: Implement minimal chunking**

В `e2e/partial-sync/matrix/types.ts` добавить поле и расширить тип ключа:

```ts
export type ScenarioLayer = {
  readonly key: string
  readonly componentPath: ScenarioComponentPath
  readonly probeOperationKey: string
  readonly bulkBlockSize?: number
  readonly operations: readonly ScenarioOperation[]
}

export type ScenarioBlock = {
  readonly key: `${string}:probe` | `${string}:bulk` | `${string}:bulk:${number}`
  readonly layerKey: string
  readonly componentPath: ScenarioComponentPath
  readonly operations: readonly ScenarioOperation[]
}
```

В `e2e/partial-sync/plan.ts` проверить, что размер — положительное целое число, и заменить создание единственного массового блока на помощник, который возвращает один прежний блок без ограничения либо пронумерованные части с ограничением. Каждая часть добавляет свои операции в `available` до проверки следующей части.

- [ ] **Step 4: Run plan tests to verify they pass**

Run: `pnpm exec vitest run e2e/partial-sync/plan.test.ts`

Expected: PASS для нового договора и существующего поведения без ограничения.

- [ ] **Step 5: Configure only root creation and strengthen the matrix test**

В `e2e/partial-sync/matrix/layers.ts` передать `bulkBlockSize: 12` только для `roots:create`. В `e2e/partial-sync/matrix.test.ts` проверить ключи и размеры:

```ts
expect(rootCreateBlocks.map(({ key, operations }) => [key, operations.length])).toEqual([
  ["roots:create:probe", 1],
  ["roots:create:bulk:1", 12],
  ["roots:create:bulk:2", 12],
  ["roots:create:bulk:3", 12],
  ["roots:create:bulk:4", 10],
])
```

Обновить существующие проверки порядка, чтобы они находили последний массовый блок слоя, а не старый ключ `roots:create:bulk`.

- [ ] **Step 6: Run focused and fast verification**

Run:

```bash
pnpm exec vitest run e2e/partial-sync/plan.test.ts e2e/partial-sync/matrix.test.ts e2e/partial-sync/scenario.test.ts e2e/partial-sync/checkpoints.test.ts e2e/partial-sync/timing.test.ts
pnpm type-check
pnpm duplicates -- --base 8f5032124^
```

Expected: все проверки PASS, TypeScript без ошибок, новые дубли отсутствуют.

- [ ] **Step 7: Commit**

```bash
git add e2e/partial-sync/matrix/types.ts e2e/partial-sync/plan.ts e2e/partial-sync/plan.test.ts e2e/partial-sync/matrix/layers.ts e2e/partial-sync/matrix.test.ts
git commit -m "test: :white_check_mark: разделить массовое создание объектов"
```

### Task 2: Проверка автономным сервером

**Files:**
- Inspect: `/Users/nikita/Базы 1С/temp_test/logs/timings.json`
- Inspect on failure: `/Users/nikita/Базы 1С/temp_test/logs/**/013-nkdk.sync_to_infobase.response.json`

**Interfaces:**
- Consumes: сценарий из Task 1 и параметризованный каталог `/Users/nikita/Базы 1С/temp_test`.
- Produces: подтверждение прохождения четырёх массовых блоков либо точный ключ первой проблемной группы и сохранённый частичный ZIP.

- [ ] **Step 1: Run the real scenario from a clean managed root**

Run outside the sandbox:

```bash
pnpm test:partial-sync -- --root '/Users/nikita/Базы 1С/temp_test' --mode standalone-server --reset
```

Expected: блоки `roots:create:bulk:1`–`roots:create:bulk:4` проходят без аварийного завершения `ibsrv`; сценарий продолжает следующие слои.

- [ ] **Step 2: Inspect timings and failure evidence**

Если сценарий проходит, сравнить время подготовки и четырёх блоков с предыдущими 103,8 секунды до падения. Если `ibsrv` снова падает, зафиксировать ключ блока, список его операций, ответ MCP, `platform.log`, системный `.ips` и ZIP; не запускать полный массив повторно до локализации внутри этой группы.
