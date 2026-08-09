# Dependency Baseline Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разделить точный baseline нарушений metadata-границ и компактный baseline циклических компонент, чтобы переносы файлов не создавали тысячи ложных расхождений и при этом циклы не могли расти незаметно.

**Architecture:** Обычные нарушения продолжают сравниваться по точным связям. Циклы перестают добавляться в `summary.violations`: они вычисляются как strongly connected components и сравниваются с отдельным снимком по составу модулей и числу внутренних зависимостей. Обычная проверка принимает только подмножество известной компоненты, а явное обновление после переименований дополнительно проверяет невозрастание всех показателей.

**Tech Stack:** Node.js 26, JavaScript ES modules, `node:test`, dependency-cruiser 18, pnpm.

## Global Constraints

- Не изменять существующие XML-фикстуры.
- Не принимать новые `not-in-allowed` и `neutral-not-reach-implementations` в baseline.
- Не добавлять новые циклические компоненты, модули в циклах или внутренние циклические зависимости.
- Сохранять текущие незакоммиченные изменения; не восстанавливать и не перезаписывать файлы пользователя.
- После каждого законченного изменения выполнять `pnpm duplicates -- --base 4d099beeb`.
- Перед завершением всего плана выполнить `pnpm test` из корня.

## Out of Scope

Этот план реализует только инфраструктуру измерения и baseline. Переносы
`metadataTarget`, property-типов, форм, validation-снимков, точки регистрации и
`metadataItemAugmenter` выполняются следующими самостоятельными планами в
порядке, закреплённом в спеке.

---

## File Structure

- `tools/dependency-cruiser/src/baseline-format.mjs` — выбирает и сериализует только нарушения границ.
- `tools/dependency-cruiser/src/cycle-baseline.mjs` — создаёт, сериализует и проверяет снимок циклических компонент.
- `tools/dependency-cruiser/src/cycle-baseline-update.mjs` — явно и атомарно обновляет cycle-baseline после проверки невозрастания.
- `tools/dependency-cruiser/src/paths.mjs` — содержит пути обоих baseline.
- `tools/dependency-cruiser/src/cruise-result.mjs` — формирует граф и нарушения границ без тысяч псевдонарушений циклов.
- `tools/dependency-cruiser/src/check.mjs` — независимо проверяет границы и циклические компоненты.
- `tools/dependency-cruiser/src/baseline.mjs` — сокращает только baseline границ.
- `.dependency-cruiser-known-violations.json` — временный точный baseline границ; удаляется на следующем этапе при достижении `0/0`.
- `.dependency-cruiser-cycle-baseline.json` — компактный снимок циклических компонент.

### Task 1: Формат baseline границ

**Files:**
- Modify: `tools/dependency-cruiser/src/baseline-format.mjs`
- Modify: `tools/dependency-cruiser/test/baseline-format.test.mjs`

**Interfaces:**
- Produces: `boundaryViolations(result): Violation[]`
- Produces: `serializeBaseline(result): string`, содержащий только правила `not-in-allowed` и `neutral-not-reach-implementations`.

- [ ] **Step 1: Заменить тест сериализации на проверку фильтрации**

```js
test("сохраняет только нарушения границ metadata-слоёв", () => {
  const violations = [
    { type: "dependency", rule: { name: "not-in-allowed" } },
    { type: "dependency", rule: { name: "no-circular-production" } },
    { type: "dependency", rule: { name: "no-unresolvable" } },
    { type: "reachability", rule: { name: "neutral-not-reach-implementations" } },
  ]

  assert.deepEqual(
    JSON.parse(serializeBaseline({ summary: { violations } })),
    [violations[0], violations[3]]
  )
})
```

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run: `node --test tools/dependency-cruiser/test/baseline-format.test.mjs`

Expected: FAIL, потому что `no-circular-production` и `no-unresolvable` ещё попадают в результат.

- [ ] **Step 3: Реализовать белый список правил границы**

```js
const boundaryRuleNames = new Set([
  "not-in-allowed",
  "neutral-not-reach-implementations",
])

export function boundaryViolations(result) {
  return result.summary.violations.filter(({ rule }) =>
    boundaryRuleNames.has(rule.name)
  )
}

export function serializeBaseline(result) {
  return `${JSON.stringify(boundaryViolations(result), null, 2)}\n`
}
```

- [ ] **Step 4: Запустить тест формата**

Run: `node --test tools/dependency-cruiser/test/baseline-format.test.mjs`

Expected: PASS.

- [ ] **Step 5: Проверить отсутствие новых дубликатов**

Run: `pnpm duplicates -- --base 4d099beeb`

Expected: `Новых дублей относительно 4d099beeb нет`.

- [ ] **Step 6: Зафиксировать изменение**

```bash
git add tools/dependency-cruiser/src/baseline-format.mjs tools/dependency-cruiser/test/baseline-format.test.mjs
git commit -m "refactor: :recycle: отделить baseline границ metadata"
```

### Task 2: Снимок и проверка циклических компонент

**Files:**
- Create: `tools/dependency-cruiser/src/cycle-baseline.mjs`
- Create: `tools/dependency-cruiser/test/cycle-baseline.test.mjs`
- Modify: `tools/dependency-cruiser/src/cycle-analysis.mjs`
- Create: `tools/dependency-cruiser/src/cycle-report.mjs` (уже подготовлен в рабочем дереве)
- Create: `tools/dependency-cruiser/test/cycle-report.test.mjs` (уже подготовлен в рабочем дереве)

**Interfaces:**
- Consumes: `findProductionCycleComponents(result)`.
- Produces: `createCycleBaseline(result): { version: 1, components: CycleComponent[] }`.
- Produces: `assertCyclesNotWorse(result, baseline): void` для обычной проверки.
- Produces: `assertCycleRewriteNotWorse(result, baseline): void` для явного обновления после перемещения файлов.
- `CycleComponent` содержит `modules: string[]` и `dependencyCount: number`.

- [ ] **Step 1: Добавить тестовый построитель production-цикла**

```js
const source = (name) => `packages/core/helpers/${name}`

function baselineComponent(names, dependencyCount) {
  return { modules: names.map(source).sort(), dependencyCount }
}

function resultWithCycle(names, dependencyCount) {
  const modules = names.map((name, index) => ({
    source: source(name),
    dependencies: [{ resolved: source(names[(index + 1) % names.length]) }],
  }))
  for (let index = names.length; index < dependencyCount; index += 1) {
    modules[index % modules.length].dependencies.push({
      resolved: modules[(index + 1) % modules.length].source,
    })
  }
  return { modules }
}
```

- [ ] **Step 2: Создать тест обычной проверки**

```js
test("принимает уменьшение известной компоненты", () => {
  const baseline = {
    version: 1,
    components: [baselineComponent(["a.ts", "b.ts", "c.ts"], 4)],
  }
  assert.doesNotThrow(() =>
    assertCyclesNotWorse(resultWithCycle(["a.ts", "b.ts"], 2), baseline)
  )
})

test("отклоняет новый модуль и рост числа зависимостей", () => {
  const baseline = {
    version: 1,
    components: [baselineComponent(["a.ts", "b.ts"], 2)],
  }
  assert.throws(
    () => assertCyclesNotWorse(resultWithCycle(["a.ts", "new.ts"], 2), baseline),
    /новый модуль.*new\.ts/u
  )
  assert.throws(
    () => assertCyclesNotWorse(resultWithCycle(["a.ts", "b.ts"], 3), baseline),
    /внутренних зависимостей.*3.*2/u
  )
})
```

В тестовом helper `resultWithCycle(modules, dependencyCount)` построить минимальный граф: для двух модулей добавить взаимные зависимости; для трёх — кольцо, а дополнительные рёбра добавлять до требуемого `dependencyCount`.

- [ ] **Step 3: Создать тест явной перезаписи путей**

```js
test("разрешает явную замену путей без роста показателей", () => {
  const baseline = {
    version: 1,
    components: [baselineComponent(["old-a.ts", "old-b.ts"], 2)],
  }
  assert.doesNotThrow(() =>
    assertCycleRewriteNotWorse(
      resultWithCycle(["new-a.ts", "new-b.ts"], 2),
      baseline
    )
  )
})

test("не разрешает явную перезапись с ростом суммарных показателей", () => {
  const baseline = {
    version: 1,
    components: [baselineComponent(["old-a.ts", "old-b.ts"], 2)],
  }
  assert.throws(
    () => assertCycleRewriteNotWorse(resultWithCycle(["a.ts", "b.ts", "c.ts"], 3), baseline),
    /модулей в циклах.*3.*2/u
  )
})
```

- [ ] **Step 4: Запустить новый тест и подтвердить падение импорта**

Run: `node --test tools/dependency-cruiser/test/cycle-baseline.test.mjs`

Expected: FAIL с `ERR_MODULE_NOT_FOUND` для `cycle-baseline.mjs`.

- [ ] **Step 5: Реализовать создание и сериализацию снимка**

```js
export function createCycleBaseline(result) {
  return {
    version: 1,
    components: findProductionCycleComponents(result).map(
      ({ modules, dependencyCount }) => ({ modules, dependencyCount })
    ),
  }
}

export function serializeCycleBaseline(result) {
  return `${JSON.stringify(createCycleBaseline(result), null, 2)}\n`
}
```

- [ ] **Step 6: Реализовать строгую обычную проверку**

Для каждой текущей компоненты найти одну baseline-компоненту, множество модулей которой содержит все текущие модули. Отклонить результат, если компонента не найдена, число компонент стало больше либо `dependencyCount` превысил значение найденной компоненты. Сообщение должно перечислять новый модуль или оба сравниваемых числа.

```js
export function assertCyclesNotWorse(result, baseline) {
  const current = createCycleBaseline(result).components
  if (current.length > baseline.components.length) {
    throw new Error(`Циклических компонент стало больше: ${current.length} > ${baseline.components.length}`)
  }
  for (const component of current) {
    const known = baseline.components.find(({ modules }) =>
      component.modules.every((source) => modules.includes(source))
    )
    if (known === undefined) {
      const knownModules = new Set(baseline.components.flatMap(({ modules }) => modules))
      const added = component.modules.filter((source) => !knownModules.has(source))
      throw new Error(`Циклическая компонента содержит новый модуль: ${added.join(", ")}`)
    }
    if (component.dependencyCount > known.dependencyCount) {
      throw new Error(
        `Число внутренних зависимостей выросло: ${component.dependencyCount} > ${known.dependencyCount}`
      )
    }
  }
}
```

- [ ] **Step 7: Реализовать проверку явной перезаписи**

Отсортировать текущие и исходные компоненты по убыванию числа модулей, затем по `dependencyCount`. Отклонить перезапись, если выросло число компонент, суммарное число модулей, суммарное число зависимостей либо любой элемент отсортированного вектора показателей.

```js
function metrics(components) {
  return components
    .map(({ modules, dependencyCount }) => ({ moduleCount: modules.length, dependencyCount }))
    .sort((left, right) =>
      right.moduleCount - left.moduleCount || right.dependencyCount - left.dependencyCount
    )
}

export function assertCycleRewriteNotWorse(result, baseline) {
  const current = metrics(createCycleBaseline(result).components)
  const known = metrics(baseline.components)
  const sum = (items, key) => items.reduce((total, item) => total + item[key], 0)
  if (current.length > known.length) throw new Error(`Циклических компонент стало больше: ${current.length} > ${known.length}`)
  if (sum(current, "moduleCount") > sum(known, "moduleCount")) throw new Error(`Модулей в циклах стало больше: ${sum(current, "moduleCount")} > ${sum(known, "moduleCount")}`)
  if (sum(current, "dependencyCount") > sum(known, "dependencyCount")) throw new Error(`Внутренних зависимостей стало больше: ${sum(current, "dependencyCount")} > ${sum(known, "dependencyCount")}`)
  current.forEach((item, index) => {
    if (item.moduleCount > known[index].moduleCount || item.dependencyCount > known[index].dependencyCount) {
      throw new Error(`Ухудшилась циклическая компонента ${index + 1}`)
    }
  })
}
```

- [ ] **Step 8: Запустить тесты cycle-baseline и существующего отчёта**

Run: `node --test tools/dependency-cruiser/test/cycle-baseline.test.mjs tools/dependency-cruiser/test/cycle-report.test.mjs`

Expected: PASS.

- [ ] **Step 9: Проверить отсутствие новых дубликатов**

Run: `pnpm duplicates -- --base 4d099beeb`

Expected: новых дубликатов нет.

- [ ] **Step 10: Зафиксировать изменение**

```bash
git add tools/dependency-cruiser/src/cycle-analysis.mjs tools/dependency-cruiser/src/cycle-report.mjs tools/dependency-cruiser/src/cycle-baseline.mjs tools/dependency-cruiser/test/cycle-report.test.mjs tools/dependency-cruiser/test/cycle-baseline.test.mjs
git commit -m "feat: :sparkles: проверять baseline циклических компонент"
```

### Task 3: Подключение раздельных проверок

**Files:**
- Modify: `tools/dependency-cruiser/src/paths.mjs`
- Modify: `tools/dependency-cruiser/src/cruise-result.mjs`
- Modify: `tools/dependency-cruiser/src/check.mjs`
- Modify: `tools/dependency-cruiser/src/report.mjs`
- Modify: `tools/dependency-cruiser/src/run-depcruise.mjs` (Windows-запуск локальных `.mjs` уже подготовлен в рабочем дереве)
- Modify: `tools/dependency-cruiser/test/check-result.test.mjs`
- Modify: `tools/dependency-cruiser/test/architecture-rules.test.mjs`

**Interfaces:**
- Produces: `cycleBaselinePath`, равный `.dependency-cruiser-cycle-baseline.json` в корне.
- `createCruiseResult()` больше не добавляет `no-circular-production` в `summary.violations`.
- Produces: `analyzeCruiseResult(rawResult, knownViolations)` — чистая функция отделения циклов, добавления reachability и смягчения известных границ.
- `check.mjs` вызывает `assertNoNewViolations(result)` и отдельно `assertCyclesNotWorse(result, cycleBaseline)`.

- [ ] **Step 1: Добавить архитектурный тест отсутствия циклов в списке точных нарушений**

```js
test("project cruise не смешивает циклы с нарушениями границ", () => {
  const analyzed = analyzeCruiseResult(result, [])
  assert.equal(
    analyzed.summary.violations.some(({ rule }) => rule.name === "no-circular-production"),
    false
  )
  assert.equal(findProductionCycleComponents(analyzed).length, 1)
})
```

Добавить импорты `analyzeCruiseResult` из `cruise-result.mjs` и
`findProductionCycleComponents` из `cycle-analysis.mjs`. Используется уже
существующий `result = cruiseFixture()`.

- [ ] **Step 2: Запустить архитектурные тесты и подтвердить падение**

Run: `node --test tools/dependency-cruiser/test/architecture-rules.test.mjs`

Expected: FAIL, пока production-код вызывает `addProductionCycleViolations`.

- [ ] **Step 3: Добавить путь cycle-baseline**

```js
export const cycleBaselinePath = resolve(
  projectRoot,
  ".dependency-cruiser-cycle-baseline.json"
)
```

- [ ] **Step 4: Убрать преобразование циклов в отдельные нарушения**

В `createCruiseResult` оставить последовательность `rawResult -> addImplementationReachabilityViolations -> softenKnownViolations`. Удалить импорт и вызов `addProductionCycleViolations`; вычисление компонент остаётся доступно через исходный `modules`.

```js
export function analyzeCruiseResult(rawResult, knownViolations = []) {
  const withoutCycleViolations = {
    ...rawResult,
    summary: {
      ...rawResult.summary,
      violations: rawResult.summary.violations.filter(
        ({ rule }) => rule.name !== "no-circular-production"
      ),
    },
  }
  return softenKnownViolations(
    addImplementationReachabilityViolations(withoutCycleViolations),
    knownViolations
  )
}
```

- [ ] **Step 5: Подключить проверку компоненты в `check.mjs`**

```js
const cycleBaseline = JSON.parse(readFileSync(cycleBaselinePath, "utf8"))
const result = createCruiseResult({ ignoreKnown: true, writeEnhanced: false })
assertNoNewViolations(result)
assertCyclesNotWorse(result, cycleBaseline)
```

Итоговая строка должна отдельно показывать количество учтённых нарушений границ и текущие показатели циклов.

- [ ] **Step 6: Оставить подробный отчёт совместимым с новым графом**

`report.mjs` продолжает вызывать `findProductionCycleComponents(result)` напрямую. HTML получает только нарушения границ; компактная текстовая сводка показывает циклические компоненты.

- [ ] **Step 7: Запустить все тесты инструмента**

Run: `node --test tools/dependency-cruiser/test/*.test.mjs`

Expected: PASS.

- [ ] **Step 8: Проверить полный отчёт на Windows**

Run: `pnpm architecture:report`

Expected: команда использует локальные JavaScript-точки входа dependency-cruiser, печатает четыре циклические компоненты и создаёт `reports/dependency-cruiser/violations.html`.

- [ ] **Step 9: Проверить отсутствие новых дубликатов**

Run: `pnpm duplicates -- --base 4d099beeb`

Expected: новых дубликатов нет.

- [ ] **Step 10: Зафиксировать изменение**

```bash
git add tools/dependency-cruiser/src/paths.mjs tools/dependency-cruiser/src/cruise-result.mjs tools/dependency-cruiser/src/check.mjs tools/dependency-cruiser/src/report.mjs tools/dependency-cruiser/src/run-depcruise.mjs tools/dependency-cruiser/test/check-result.test.mjs tools/dependency-cruiser/test/architecture-rules.test.mjs
git commit -m "refactor: :recycle: разделить проверки границ и циклов"
```

### Task 4: Раздельное обновление и миграция baseline

**Files:**
- Modify: `tools/dependency-cruiser/src/baseline.mjs`
- Create: `tools/dependency-cruiser/src/cycle-baseline-update.mjs`
- Modify: `tools/dependency-cruiser/test/baseline.test.mjs`
- Create: `tools/dependency-cruiser/test/cycle-baseline-update.test.mjs`
- Modify: `package.json`
- Rewrite: `.dependency-cruiser-known-violations.json`
- Create: `.dependency-cruiser-cycle-baseline.json`

**Interfaces:**
- `pnpm architecture:baseline` сокращает только точные нарушения границ.
- `pnpm architecture:cycle-baseline -- --write-initial` создаёт первый снимок.
- `pnpm architecture:cycle-baseline -- --accept-rewrite` атомарно заменяет существующий снимок только после `assertCycleRewriteNotWorse`.

- [ ] **Step 1: Добавить тест удаления пустого baseline границ**

```js
test("удаляет baseline границ после достижения нуля", async () => {
  const path = join(await mkdtemp(join(tmpdir(), "nkdk-baseline-")), "baseline.json")
  await writeFile(path, "old")
  await updateBaseline({
    baselinePath: path,
    check: async () => {},
    generate: async () => "[]\n",
  })
  await assert.rejects(readFile(path, "utf8"), { code: "ENOENT" })
})
```

Изменить существующий тест атомарной замены так, чтобы `generate` возвращал строку, а запись во временный файл принадлежала `updateBaseline`.

- [ ] **Step 2: Добавить тест атомарного cycle-обновления**

```js
test("не заменяет cycle-baseline при ухудшении", async () => {
  const path = join(await mkdtemp(join(tmpdir(), "nkdk-cycles-")), "cycles.json")
  await writeFile(path, JSON.stringify(oldBaseline))
  await assert.rejects(
    updateCycleBaseline({ path, currentResult: worseResult }),
    /модулей в циклах/u
  )
  assert.deepEqual(JSON.parse(await readFile(path, "utf8")), oldBaseline)
})
```

- [ ] **Step 3: Запустить оба теста и подтвердить падение**

Run: `node --test tools/dependency-cruiser/test/baseline.test.mjs tools/dependency-cruiser/test/cycle-baseline-update.test.mjs`

Expected: FAIL из-за старого договора `generate` и отсутствующего `cycle-baseline-update.mjs`.

- [ ] **Step 4: Сделать обновление baseline границ атомарным и удаляемым**

`updateBaseline` сначала выполняет `check`, получает строку от `generate`, пишет её во временный файл и либо переименовывает файл, либо удаляет основной baseline при пустом массиве. При исключении основной файл остаётся неизменным.

```js
export async function updateBaseline({ check, generate, baselinePath }) {
  const temporaryPath = `${baselinePath}.tmp`
  await rm(temporaryPath, { force: true })
  await check()
  try {
    const serialized = await generate()
    if (JSON.parse(serialized).length === 0) {
      await rm(baselinePath, { force: true })
      return
    }
    await writeFile(temporaryPath, serialized)
    await rename(temporaryPath, baselinePath)
  } finally {
    await rm(temporaryPath, { force: true })
  }
}
```

- [ ] **Step 5: Реализовать явное обновление cycle-baseline**

`updateCycleBaseline({ path, currentResult, initial = false })`:

1. создаёт `candidate = createCycleBaseline(currentResult)`;
2. при `initial` требует отсутствия `path`;
3. иначе читает старый снимок и вызывает `assertCycleRewriteNotWorse`;
4. пишет candidate во временный файл и атомарно переименовывает его;
5. удаляет временный файл в `finally`.

CLI принимает только `--write-initial` или `--accept-rewrite`; любой другой аргумент завершает работу ошибкой с подсказкой.

```js
export async function updateCycleBaseline({ path, currentResult, initial = false }) {
  const candidate = createCycleBaseline(currentResult)
  if (initial) {
    if (existsSync(path)) throw new Error("Первоначальный cycle-baseline уже существует")
  } else {
    const known = JSON.parse(await readFile(path, "utf8"))
    assertCycleRewriteNotWorse(currentResult, known)
  }
  const temporaryPath = `${path}.tmp`
  try {
    await writeFile(temporaryPath, `${JSON.stringify(candidate, null, 2)}\n`)
    await rename(temporaryPath, path)
  } finally {
    await rm(temporaryPath, { force: true })
  }
}
```

- [ ] **Step 6: Добавить команду package.json**

```json
"architecture:cycle-baseline": "node tools/dependency-cruiser/src/cycle-baseline-update.mjs"
```

- [ ] **Step 7: Запустить тесты обновления**

Run: `node --test tools/dependency-cruiser/test/baseline.test.mjs tools/dependency-cruiser/test/cycle-baseline-update.test.mjs`

Expected: PASS.

- [ ] **Step 8: Создать оба снимка из текущего полного графа**

Run: `pnpm architecture:cycle-baseline -- --write-initial`

Expected: `.dependency-cruiser-cycle-baseline.json` содержит 4 компоненты, 1092 модуля и 5725 внутренних зависимостей.

Run: `pnpm architecture:baseline`

Expected: `.dependency-cruiser-known-violations.json` содержит только 60 `not-in-allowed` и 125 `neutral-not-reach-implementations`.

- [ ] **Step 9: Выполнить полную архитектурную проверку**

Run: `pnpm test:architecture`

Expected: PASS; вывод отдельно сообщает долг границ и показатели четырёх циклических компонент.

- [ ] **Step 10: Выполнить полный набор проверок**

Run: `pnpm test`

Expected: PASS.

Run: `pnpm duplicates -- --base 4d099beeb`

Expected: новых дубликатов нет.

- [ ] **Step 11: Зафиксировать миграцию**

```bash
git add package.json .dependency-cruiser-known-violations.json .dependency-cruiser-cycle-baseline.json tools/dependency-cruiser/src/baseline.mjs tools/dependency-cruiser/src/cycle-baseline-update.mjs tools/dependency-cruiser/test/baseline.test.mjs tools/dependency-cruiser/test/cycle-baseline-update.test.mjs
git commit -m "chore: :wrench: разделить baseline границ и циклов"
```

## Completion Check

- `pnpm test:architecture:rules` проходит.
- `pnpm test:architecture` проходит без смягчения новых нарушений.
- Baseline границ не содержит `no-circular-production`.
- Cycle-baseline содержит 4 записи вместо 5725 нарушений-зависимостей.
- Текущие показатели циклов не превышают 4 компоненты, 1092 модуля и 5725 внутренних зависимостей.
- `pnpm test` и `pnpm duplicates -- --base 4d099beeb` проходят.
