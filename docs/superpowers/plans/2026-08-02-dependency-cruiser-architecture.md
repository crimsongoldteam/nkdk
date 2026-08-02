# Dependency-Cruiser Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ввести обязательную проверку архитектурных зависимостей NKDK через dependency-cruiser с закрытой metadata-матрицей, shrink-only baseline и локальными HTML-отчётами.

**Architecture:** Приватный workspace-пакет `tools/dependency-cruiser` изолирует dependency-cruiser 18.1.0 и TypeScript 6.0.3 от TypeScript 7.0.2 основного проекта. Корневая конфигурация объединяет общие правила и metadata-матрицу; команды сначала строят единый JSON-граф, проверяют его полноту, а затем форматируют его для консоли или HTML без повторного анализа исходников.

**Tech Stack:** Node.js 26, pnpm workspace, dependency-cruiser 18.1.0, TypeScript 6.0.3 для анализа, TypeScript 7.0.2 для NKDK, Node test runner, HTML reporters dependency-cruiser.

## Global Constraints

- Не изменять существующие XML/YAML-фикстуры.
- `orchestration`, `validation` и `project` пока могут зависеть друг от друга.
- Metadata-матрица применяется только к production-файлам трёх нейтральных слоёв.
- Тесты могут импортировать конкретные реализации; production-код не может импортировать тесты.
- Учитывать runtime- и type-only импорты через `parser: "tsc"` и `tsPreCompilationDeps: true`.
- Использовать dependency-cruiser 18.1.0 с изолированным TypeScript 6.0.3 до подтверждённой поддержки TypeScript не ниже 7.1.
- Нулевой код запрещён при недоступном TypeScript-парсере или графе меньше 1 800 модулей.
- Baseline хранится в Git и штатно может только сокращаться.
- HTML-файлы и промежуточный JSON-граф сохраняются в `reports/dependency-cruiser/` и не входят в Git.
- `pnpm test:architecture` остаётся отдельной командой и не включается внутрь `pnpm test`.
- Медиана трёх повторных полных запусков должна быть не более пяти секунд.
- Новые правила должны иметь имя, русское объяснение причины и способ исправления.

## File Map

- `.dependency-cruiser.mjs` — композиция правил и общие параметры настоящего графа.
- `.dependency-cruiser-known-violations.json` — точный baseline текущего долга.
- `tsconfig.dependency-cruiser.json` — параметры разрешения TypeScript-модулей для анализатора.
- `tools/dependency-cruiser/src/common-rules.mjs` — общие запреты графа.
- `tools/dependency-cruiser/src/metadata-rules.mjs` — закрытая матрица и reachable-правило.
- `tools/dependency-cruiser/src/paths.mjs` — абсолютные пути и имена файлов отчётов.
- `tools/dependency-cruiser/src/run-depcruise.mjs` — единая граница запуска CLI и проверки окружения.
- `tools/dependency-cruiser/src/cruise-result.mjs` — создание, чтение и проверка полноты JSON-графа.
- `tools/dependency-cruiser/src/check.mjs` — самопроверка правил и консольная проверка проекта.
- `tools/dependency-cruiser/src/report.mjs` — полный HTML-отчёт нарушений.
- `tools/dependency-cruiser/src/graph.mjs` — свёрнутое HTML-представление графа.
- `tools/dependency-cruiser/src/baseline.mjs` — генерация и shrink-only замена baseline.
- `tools/dependency-cruiser/README.md` — причина временного TypeScript 6 и критерий его удаления.
- `tools/dependency-cruiser/test/*.test.mjs` — Node-тесты окружения, правил и baseline.
- `tools/dependency-cruiser/fixtures/**` — малый синтетический TypeScript-граф.

---

### Task 1: Изолированное окружение dependency-cruiser

**Files:**
- Modify: `pnpm-workspace.yaml`
- Create: `tools/dependency-cruiser/package.json`
- Create: `tools/dependency-cruiser/src/paths.mjs`
- Create: `tools/dependency-cruiser/src/run-depcruise.mjs`
- Create: `tools/dependency-cruiser/README.md`
- Create: `tools/dependency-cruiser/test/environment.test.mjs`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: Node.js `spawnSync`, workspace root three levels above `src/paths.mjs`.
- Produces: `projectRoot`, `reportsDir`, `baselinePath`, `runDepcruise(command, args, options)`, `readDepcruiseInfo()` и `assertUsableTypeScript(info)`.

- [ ] **Step 1: Подключить приватный пакет и написать падающий тест проверки окружения**

Добавить `tools/*` в workspace:

```yaml
packages:
  - packages/*
  - tools/*
```

Создать `tools/dependency-cruiser/package.json`:

```json
{
  "name": "@nkdk/dependency-cruiser",
  "private": true,
  "type": "module",
  "devDependencies": {
    "dependency-cruiser": "18.1.0",
    "typescript": "6.0.3"
  }
}
```

Создать `test/environment.test.mjs`, сначала импортируя ещё не существующую функцию:

```js
import assert from "node:assert/strict"
import test from "node:test"
import { assertUsableTypeScript } from "../src/run-depcruise.mjs"

test("принимает полный TypeScript 6 graph environment", () => {
  assert.doesNotThrow(() =>
    assertUsableTypeScript(`
✔ typescript             >=2.0.0 <7.0.0      typescript@6.0.3
✔ .ts
✔ .tsx
✔ .d.ts
`)
  )
})

test("отклоняет TypeScript 7 без публичного API", () => {
  assert.throws(
    () => assertUsableTypeScript("x typescript >=2.0.0 <7.0.0 -\nx .ts\nx .tsx\nx .d.ts"),
    /TypeScript-парсер dependency-cruiser недоступен/u
  )
})
```

- [ ] **Step 2: Установить зависимости и подтвердить падение теста**

Run:

```bash
pnpm install
pnpm --filter @nkdk/dependency-cruiser exec node --test test/environment.test.mjs
```

Expected: FAIL с `ERR_MODULE_NOT_FOUND` для `src/run-depcruise.mjs`.

- [ ] **Step 3: Реализовать пути, запуск CLI и строгую проверку TypeScript**

`src/paths.mjs`:

```js
import { fileURLToPath } from "node:url"
import { resolve } from "node:path"

export const toolRoot = fileURLToPath(new URL("..", import.meta.url))
export const projectRoot = resolve(toolRoot, "../..")
export const reportsDir = resolve(projectRoot, "reports/dependency-cruiser")
export const cruiseResultPath = resolve(reportsDir, "current.json")
export const baselinePath = resolve(projectRoot, ".dependency-cruiser-known-violations.json")
```

`src/run-depcruise.mjs`:

```js
import { spawnSync } from "node:child_process"
import { projectRoot } from "./paths.mjs"

export function runDepcruise(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    encoding: "utf8",
    stdio: options.capture === false ? "inherit" : "pipe",
    env: process.env,
  })
  if (result.error) throw result.error
  if (!options.allowFailure && result.status !== 0) {
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim()
    throw new Error(output || `${command} завершился с кодом ${result.status}`)
  }
  return result
}

export function assertUsableTypeScript(info) {
  const hasCompiler = /✔ typescript\s+[^\n]*typescript@6\.0\.3/u.test(info)
  const hasExtensions = [
    /^\s*✔ \.ts\s*$/mu,
    /^\s*✔ \.tsx\s*$/mu,
    /^\s*✔ \.d\.ts\s*$/mu,
  ].every((pattern) => pattern.test(info))
  if (!hasCompiler || !hasExtensions) {
    throw new Error("TypeScript-парсер dependency-cruiser недоступен или неполон")
  }
}

export function readDepcruiseInfo() {
  const result = runDepcruise("dependency-cruise", ["--info"])
  const info = `${result.stdout}${result.stderr}`
  assertUsableTypeScript(info)
  return info
}
```

В `tools/dependency-cruiser/README.md` зафиксировать: TypeScript 6.0.3 нужен
только потому, что dependency-cruiser 18.1.0 не поддерживает публичный API
TypeScript 7.0.2; зависимость удаляется только после перехода NKDK на TypeScript
не ниже 7.1, положительного `dependency-cruise --info` и прохождения type-only
fixture.

- [ ] **Step 4: Проверить unit- и интеграционный договор окружения**

Run:

```bash
pnpm --filter @nkdk/dependency-cruiser exec node --test test/environment.test.mjs
pnpm --filter @nkdk/dependency-cruiser exec dependency-cruise --info
```

Expected: Node-тесты PASS; `--info` показывает `typescript@6.0.3` и доступные
`.ts`, `.tsx`, `.d.ts`.

- [ ] **Step 5: Создать коммит окружения**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml tools/dependency-cruiser
git commit -m "chore: :wrench: изолировать dependency-cruiser"
```

---

### Task 2: Общие правила графа

**Files:**
- Create: `tools/dependency-cruiser/src/common-rules.mjs`
- Modify: `tools/dependency-cruiser/src/paths.mjs`
- Create: `tools/dependency-cruiser/src/fixture-cruise.mjs`
- Create: `tools/dependency-cruiser/fixture.config.mjs`
- Create: `tools/dependency-cruiser/fixtures/package.json`
- Create: `tools/dependency-cruiser/fixtures/packages/core/runtime/{cycle-a,cycle-b,imports-test,imports-dev,unresolvable,valid}.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/runtime/example.test.ts`
- Create: `tools/dependency-cruiser/test/common-rules.test.mjs`

**Interfaces:**
- Consumes: `runDepcruise`, TypeScript 6.0.3, dependency-cruiser JSON reporter.
- Produces: `productionSourcePattern`, `testModulePattern`, `commonRules` и `cruiseFixture()`.

- [ ] **Step 1: Написать падающий тест ожидаемых общих нарушений**

Создать fixture-модули с такими импортами:

```ts
// cycle-a.ts
import "./cycle-b"

// cycle-b.ts
import "./cycle-a"

// imports-test.ts
import "./example.test"

// imports-dev.ts
import "vitest"

// unresolvable.ts
import "./does-not-exist"

// valid.ts
export const valid = true
```

В `fixtures/package.json` объявить `vitest` только в `devDependencies`, чтобы
dependency-cruiser классифицировал импорт как `npm-dev`:

```json
{
  "name": "dependency-cruiser-fixtures",
  "private": true,
  "type": "module",
  "devDependencies": { "vitest": "4.1.10" }
}
```

В `test/common-rules.test.mjs`:

```js
import assert from "node:assert/strict"
import test from "node:test"
import { cruiseFixture } from "../src/fixture-cruise.mjs"

test("обнаруживает общие нарушения production-графа", () => {
  const result = cruiseFixture()
  const names = new Set(result.summary.violations.map(({ rule }) => rule.name))
  const expected = [
    "no-circular-production",
    "no-unresolvable",
    "no-production-to-test",
    "no-runtime-to-dev-dependency",
  ]
  for (const name of expected) assert.equal(names.has(name), true, name)
})
```

- [ ] **Step 2: Запустить тест и подтвердить отсутствие конфигурации**

Run:

```bash
pnpm --filter @nkdk/dependency-cruiser exec node --test test/common-rules.test.mjs
```

Expected: FAIL на отсутствующем `fixture-cruise.mjs` или `fixture.config.mjs`.

- [ ] **Step 3: Реализовать общие правила и fixture-runner**

`src/common-rules.mjs`:

```js
export const testModulePattern = "(?:\\.(?:test|spec)\\.[cm]?[jt]sx?$|/(?:tests?|__tests__|__fixtures__)/)"
export const productionSourcePattern = "^packages/(?:core/(?:index\\.ts|helpers/|metadata/|xml/|yaml/)|mcp/src/|platform/(?:index\\.ts|src/))"

const productionFrom = {
  path: productionSourcePattern,
  pathNot: testModulePattern,
}

export const commonRules = [
  {
    name: "no-circular-production",
    severity: "error",
    comment: "Production-модули не должны образовывать цикл; вынесите общий договор ниже по графу.",
    from: productionFrom,
    to: { circular: true, pathNot: testModulePattern },
  },
  {
    name: "no-unresolvable",
    severity: "error",
    comment: "Статический импорт должен разрешаться из зафиксированного workspace.",
    from: {},
    to: { couldNotResolve: true },
  },
  {
    name: "no-production-to-test",
    severity: "error",
    comment: "Production-код не импортирует тесты; перенесите общий helper в production-модуль.",
    from: productionFrom,
    to: { path: testModulePattern },
  },
  {
    name: "no-runtime-to-dev-dependency",
    severity: "error",
    comment: "Runtime-пакет не должен требовать devDependency; перенесите пакет в dependencies или уберите импорт.",
    from: productionFrom,
    to: { dependencyTypes: ["npm-dev"] },
  },
]
```

В `paths.mjs` добавить:

```js
export const fixturesRoot = resolve(toolRoot, "fixtures")
export const fixtureConfigPath = resolve(toolRoot, "fixture.config.mjs")
```

`fixture.config.mjs`:

```js
import { commonRules } from "./src/common-rules.mjs"

export default {
  forbidden: commonRules,
  options: {
    parser: "tsc",
    tsPreCompilationDeps: true,
    moduleSystems: ["es6", "cjs"],
    doNotFollow: { path: "node_modules" },
    skipAnalysisNotInRules: true,
  },
}
```

`src/fixture-cruise.mjs` запускает:

```js
import { fixtureConfigPath, fixturesRoot } from "./paths.mjs"
import { runDepcruise } from "./run-depcruise.mjs"

export function cruiseFixture() {
  const result = runDepcruise("dependency-cruise", [
    "--config", fixtureConfigPath,
    "--output-type", "json",
    "packages",
  ], { cwd: fixturesRoot })
  return JSON.parse(result.stdout)
}
```

- [ ] **Step 4: Запустить проверку общих правил**

Run:

```bash
pnpm --filter @nkdk/dependency-cruiser exec node --test test/common-rules.test.mjs
```

Expected: PASS и ровно четыре ожидаемых имени правил. Если `vitest` не
разрешается из fixture-root, добавить в `options.enhancedResolveOptions.modules`
абсолютный корневой `node_modules`, не создавать fixture `node_modules`.

- [ ] **Step 5: Создать коммит общих правил**

```bash
git add tools/dependency-cruiser
git commit -m "chore: :wrench: задать общие правила зависимостей"
```

---

### Task 3: Закрытая metadata-матрица

**Files:**
- Create: `tools/dependency-cruiser/src/metadata-rules.mjs`
- Modify: `tools/dependency-cruiser/fixture.config.mjs`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/orchestration/{allowed,direct-runtime,direct-type,transitive}.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/project/contract.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/helpers/bridge.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/appliedObjects/example/{runtime,types}.ts`
- Create: `tools/dependency-cruiser/test/metadata-rules.test.mjs`

**Interfaces:**
- Consumes: `testModulePattern` и dependency-cruiser `allowed`/`reachable` semantics.
- Produces: `neutralProductionPattern`, `allowedNeutralRules`, `metadataForbiddenRules`.

- [ ] **Step 1: Добавить fixture-граф и падающие проверки четырёх договоров**

Fixture-импорты:

```ts
// orchestration/allowed.ts
import type { ProjectContract } from "../project/contract"
export type Allowed = ProjectContract

// orchestration/direct-runtime.ts
import "../../appliedObjects/example/runtime"

// orchestration/direct-type.ts
import type { ConcreteType } from "../../appliedObjects/example/types"
export type LeakedType = ConcreteType

// orchestration/transitive.ts
import "../../helpers/bridge"

// helpers/bridge.ts
import "../appliedObjects/example/runtime"
```

Тест:

```js
test("разрешает связь нейтральных слоёв", () => {
  const result = cruiseFixture()
  assert.equal(result.summary.violations.some(
    ({ from }) => from === "packages/core/metadata/orchestration/allowed.ts"
  ), false)
})

test("запрещает runtime, type-only и транзитивное знание реализации", () => {
  const result = cruiseFixture()
  const namesFor = (source) => new Set(
    result.summary.violations
      .filter(({ from }) => from === source)
      .map(({ rule }) => rule.name)
  )
  assert.deepEqual(namesFor("packages/core/metadata/orchestration/direct-runtime.ts"),
    new Set(["not-in-allowed", "neutral-not-reach-implementations"]))
  assert.deepEqual(namesFor("packages/core/metadata/orchestration/direct-type.ts"),
    new Set(["not-in-allowed", "neutral-not-reach-implementations"]))
  assert.deepEqual(namesFor("packages/core/metadata/orchestration/transitive.ts"),
    new Set(["neutral-not-reach-implementations"]))
})
```

- [ ] **Step 2: Запустить тест и подтвердить отсутствие metadata-правил**

Run:

```bash
pnpm --filter @nkdk/dependency-cruiser exec node --test test/metadata-rules.test.mjs
```

Expected: запрещённые импорты не имеют ожидаемого нарушения.

- [ ] **Step 3: Реализовать закрытую матрицу и reachable-правило**

В `metadata-rules.mjs` определить:

```js
import { testModulePattern } from "./common-rules.mjs"

export const neutralProductionPattern = "^packages/core/metadata/(?:orchestration|validation|project)/"

const allowedInternalTargets = [
  "^packages/core/metadata/(?:orchestration|validation|project)/",
  "^packages/core/metadata/(?:context|helpers|resourceTopology|configurationIndex|components|sourceWorkerRuntime)(?:/|\\.ts$)",
  "^packages/core/(?:helpers|yaml|xml)/",
]

const implementationTargets = [
  "^packages/core/metadata/(?:appliedObjects|forms|commonObjects|systemEnumerations|operations|importFromXml)/",
  "^packages/core/metadata/register\\.ts$",
]

export const allowedNeutralRules = [
  { from: { pathNot: neutralProductionPattern }, to: {} },
  { from: { path: testModulePattern }, to: {} },
  {
    from: { path: neutralProductionPattern, pathNot: testModulePattern },
    to: { path: allowedInternalTargets },
  },
  {
    from: { path: neutralProductionPattern, pathNot: testModulePattern },
    to: { dependencyTypes: ["core", "npm", "npm-peer", "npm-optional"] },
  },
]

export const metadataForbiddenRules = [{
  name: "neutral-not-reach-implementations",
  severity: "error",
  comment: "Нейтральный metadata-слой не знает реализацию даже транзитивно; используйте rules.ts, регистрацию или нейтральный договор.",
  from: { path: neutralProductionPattern, pathNot: testModulePattern },
  to: { path: implementationTargets, reachable: true },
}]
```

Подключить к fixture-конфигурации:

```js
export default {
  forbidden: [...commonRules, ...metadataForbiddenRules],
  allowed: allowedNeutralRules,
  allowedSeverity: "error",
  options,
}
```

- [ ] **Step 4: Проверить runtime-, type-only и reachable-договоры**

Run:

```bash
pnpm --filter @nkdk/dependency-cruiser exec node --test \
  test/common-rules.test.mjs test/metadata-rules.test.mjs
```

Expected: PASS; `allowed.ts` чистый, три запрещённых источника имеют reachable-
диагностику, оба прямых импорта дополнительно не входят в allowed-матрицу.

- [ ] **Step 5: Создать коммит metadata-матрицы**

```bash
git add tools/dependency-cruiser
git commit -m "chore: :wrench: задать metadata-матрицу зависимостей"
```

---

### Task 4: Проверка настоящего графа и первоначальный baseline

**Files:**
- Create: `.dependency-cruiser.mjs`
- Create: `tsconfig.dependency-cruiser.json`
- Create: `.dependency-cruiser-known-violations.json`
- Modify: `.gitignore`
- Modify: `package.json`
- Create: `tools/dependency-cruiser/src/cruise-result.mjs`
- Create: `tools/dependency-cruiser/src/check.mjs`
- Create: `tools/dependency-cruiser/src/generate-baseline.mjs`
- Create: `tools/dependency-cruiser/test/cruise-result.test.mjs`
- Modify: `tools/dependency-cruiser/package.json`

**Interfaces:**
- Consumes: `commonRules`, `allowedNeutralRules`, `metadataForbiddenRules`, `runDepcruise`, root package sources.
- Produces: `MIN_MODULES = 1800`, `assertCompleteCruiseResult(result)`, `createCruiseResult({ ignoreKnown, outputPath })`, root `pnpm test:architecture`.

- [ ] **Step 1: Написать падающий тест защиты от неполного графа**

`test/cruise-result.test.mjs`:

```js
import assert from "node:assert/strict"
import test from "node:test"
import { assertCompleteCruiseResult } from "../src/cruise-result.mjs"

test("принимает полный TypeScript-граф", () => {
  assert.doesNotThrow(() => assertCompleteCruiseResult({
    summary: { totalCruised: 2052, totalDependenciesCruised: 9456 },
  }))
})

test("отклоняет почти пустой граф несовместимого TypeScript", () => {
  assert.throws(
    () => assertCompleteCruiseResult({ summary: { totalCruised: 16, totalDependenciesCruised: 7 } }),
    /Неполный dependency-граф: 16 модулей/u
  )
})
```

- [ ] **Step 2: Запустить тест и подтвердить отсутствие guard**

Run:

```bash
pnpm --filter @nkdk/dependency-cruiser exec node --test test/cruise-result.test.mjs
```

Expected: FAIL с `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Добавить настоящую конфигурацию и построитель JSON-графа**

`.dependency-cruiser.mjs`:

```js
import { commonRules } from "./tools/dependency-cruiser/src/common-rules.mjs"
import {
  allowedNeutralRules,
  metadataForbiddenRules,
} from "./tools/dependency-cruiser/src/metadata-rules.mjs"

export default {
  forbidden: [...commonRules, ...metadataForbiddenRules],
  allowed: allowedNeutralRules,
  allowedSeverity: "error",
  options: {
    tsConfig: { fileName: "tsconfig.dependency-cruiser.json" },
    parser: "tsc",
    tsPreCompilationDeps: true,
    moduleSystems: ["es6", "cjs"],
    includeOnly: "^packages/",
    exclude: { path: "(^|/)(?:node_modules|dist|generated)(?:/|$)" },
    doNotFollow: { path: "(?:node_modules|__fixtures__)" },
    skipAnalysisNotInRules: true,
    cache: { folder: "node_modules/.cache/dependency-cruiser", strategy: "content" },
  },
}
```

`tsconfig.dependency-cruiser.json` наследует `tsconfig.build.json`, но оставляет
только разрешение модулей и `noEmit`:

```json
{
  "extends": "./tsconfig.build.json",
  "compilerOptions": { "noEmit": true }
}
```

В `.gitignore` добавить:

```gitignore
# Локальные отчёты dependency-cruiser
reports/dependency-cruiser/
```

`cruise-result.mjs` создаёт каталог отчётов, запускает `dependency-cruise` с
`--output-type json`, `--output-to <path>`, `--config .dependency-cruiser.mjs`,
опциональным `--ignore-known` и аргументом `packages`, затем читает JSON.

```js
import { mkdirSync, readFileSync } from "node:fs"
import { cruiseResultPath, projectRoot, reportsDir } from "./paths.mjs"
import { runDepcruise } from "./run-depcruise.mjs"

export const MIN_MODULES = 1800

export function assertCompleteCruiseResult(result) {
  const modules = result.summary?.totalCruised ?? 0
  if (modules < MIN_MODULES) {
    throw new Error(`Неполный dependency-граф: ${modules} модулей, ожидалось не меньше ${MIN_MODULES}`)
  }
}

export function createCruiseResult({ ignoreKnown = false, outputPath = cruiseResultPath } = {}) {
  mkdirSync(reportsDir, { recursive: true })
  const args = [
    "--config", ".dependency-cruiser.mjs",
    "--output-type", "json",
    "--output-to", outputPath,
    ...(ignoreKnown ? ["--ignore-known"] : []),
    "packages",
  ]
  runDepcruise("dependency-cruise", args, { cwd: projectRoot, capture: false })
  const result = JSON.parse(readFileSync(outputPath, "utf8"))
  assertCompleteCruiseResult(result)
  return result
}
```

- [ ] **Step 4: Подтвердить guard и увидеть текущий архитектурный долг**

Run:

```bash
pnpm --filter @nkdk/dependency-cruiser exec node --test test/cruise-result.test.mjs
pnpm --filter @nkdk/dependency-cruiser exec node src/generate-baseline.mjs --dry-run
```

`generate-baseline.mjs --dry-run` сначала вызывает `readDepcruiseInfo()`, затем
строит JSON без `--ignore-known`, вызывает `assertCompleteCruiseResult` и печатает
число нарушений по именам правил без записи baseline.

Основной поток файла:

```js
import { existsSync } from "node:fs"
import { baselinePath, cruiseResultPath } from "./paths.mjs"
import { createCruiseResult } from "./cruise-result.mjs"
import { readDepcruiseInfo, runDepcruise } from "./run-depcruise.mjs"

const mode = process.argv[2]
if (!["--dry-run", "--write-initial"].includes(mode)) {
  throw new Error("Использование: generate-baseline.mjs --dry-run|--write-initial")
}
readDepcruiseInfo()
const result = createCruiseResult({ ignoreKnown: false })
const counts = Map.groupBy(result.summary.violations, ({ rule }) => rule.name)
for (const [name, violations] of counts) console.log(`${name}: ${violations.length}`)
if (mode === "--write-initial") {
  if (existsSync(baselinePath)) throw new Error("Первоначальный baseline уже существует")
  runDepcruise("depcruise-fmt", [
    "--output-type", "baseline",
    "--output-to", baselinePath,
    cruiseResultPath,
  ], { capture: false })
}
```

Режим `--write-initial` дополнительно требует отсутствия
`.dependency-cruiser-known-violations.json` и завершается ошибкой, если файл уже
существует. После первого коммита расширить baseline этой командой нельзя.

Expected: unit-тест PASS; dry-run анализирует не меньше 1 800 модулей и показывает
ненулевой долг. Просмотреть каждую категорию; если разрешённый инфраструктурный
каталог ошибочно попал в долг, сузить или уточнить матрицу и повторить dry-run.
Не разрешать весь `commonObjects`, `forms`, `appliedObjects` или `register`.

- [ ] **Step 5: Создать и проверить первоначальный baseline**

Run:

```bash
pnpm --filter @nkdk/dependency-cruiser exec node src/generate-baseline.mjs --write-initial
pnpm test:architecture
```

До второй команды добавить scripts:

```json
"test:architecture": "pnpm --filter @nkdk/dependency-cruiser run check"
```

и package script:

```json
"check": "node src/check.mjs"
```

`check.mjs`:

```js
import { readdirSync } from "node:fs"
import { resolve } from "node:path"
import { createCruiseResult } from "./cruise-result.mjs"
import { cruiseResultPath, toolRoot } from "./paths.mjs"
import { readDepcruiseInfo, runDepcruise } from "./run-depcruise.mjs"

readDepcruiseInfo()
const testDir = resolve(toolRoot, "test")
const tests = readdirSync(testDir)
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => resolve(testDir, name))
runDepcruise(process.execPath, ["--test", ...tests], { capture: false })
createCruiseResult({ ignoreKnown: true })
runDepcruise("depcruise-fmt", [
  "--exit-code", "--output-type", "err-long", cruiseResultPath,
], { capture: false })
```

Expected: `pnpm test:architecture` PASS, показывает не меньше 1 800 модулей и
число ignored-нарушений. Проверить `git diff -- .dependency-cruiser-known-violations.json`
и убедиться, что baseline содержит точные `from`/`to`/rule записи, а не широкие
исключения.

- [ ] **Step 6: Проверить отрицательные сценарии без сохранения изменений**

Временно добавить в любой новый файл `packages/core/metadata/orchestration/`
runtime- и type-only импорты fixture-подобной реализации, запустить:

```bash
pnpm test:architecture
```

Expected: FAIL с `not-in-allowed` и `neutral-not-reach-implementations`.
Удалить временный файл, снова запустить команду. Expected: PASS.

- [ ] **Step 7: Создать коммит настоящей проверки**

```bash
git add .dependency-cruiser.mjs .dependency-cruiser-known-violations.json \
  tsconfig.dependency-cruiser.json .gitignore package.json pnpm-lock.yaml \
  tools/dependency-cruiser
git commit -m "chore: :wrench: включить архитектурную проверку"
```

---

### Task 5: HTML-отчёты и shrink-only baseline

**Files:**
- Create: `tools/dependency-cruiser/src/report.mjs`
- Create: `tools/dependency-cruiser/src/graph.mjs`
- Create: `tools/dependency-cruiser/src/baseline.mjs`
- Create: `tools/dependency-cruiser/test/baseline.test.mjs`
- Modify: `tools/dependency-cruiser/package.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: `createCruiseResult`, `assertCompleteCruiseResult`, `runDepcruise`, `baselinePath`, `reportsDir`.
- Produces: `updateBaseline({ check, generate, baselinePath })`, `pnpm architecture:report`, `pnpm architecture:graph`, `pnpm architecture:baseline`.

- [ ] **Step 1: Написать падающие тесты запрета расширения baseline**

`test/baseline.test.mjs`:

```js
import assert from "node:assert/strict"
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { updateBaseline } from "../src/baseline.mjs"

test("не изменяет baseline при новом нарушении", async () => {
  const dir = await mkdtemp(join(tmpdir(), "nkdk-baseline-"))
  const path = join(dir, "baseline.json")
  await writeFile(path, "old")
  await assert.rejects(
    updateBaseline({
      baselinePath: path,
      check: async () => { throw new Error("new violation") },
      generate: async () => { await writeFile(path, "new") },
    }),
    /new violation/u
  )
  assert.equal(await readFile(path, "utf8"), "old")
})

test("атомарно заменяет baseline после чистой проверки", async () => {
  const dir = await mkdtemp(join(tmpdir(), "nkdk-baseline-"))
  const path = join(dir, "baseline.json")
  await writeFile(path, "old")
  await updateBaseline({
    baselinePath: path,
    check: async () => {},
    generate: async (temporaryPath) => { await writeFile(temporaryPath, "smaller") },
  })
  assert.equal(await readFile(path, "utf8"), "smaller")
})
```

- [ ] **Step 2: Запустить тест и подтвердить отсутствие реализации**

Run:

```bash
pnpm --filter @nkdk/dependency-cruiser exec node --test test/baseline.test.mjs
```

Expected: FAIL с `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Реализовать безопасную замену baseline**

`baseline.mjs` экспортирует тестируемую функцию и CLI-вход:

```js
import { rename, rm } from "node:fs/promises"

export async function updateBaseline({ check, generate, baselinePath }) {
  const temporaryPath = `${baselinePath}.tmp`
  await rm(temporaryPath, { force: true })
  await check()
  try {
    await generate(temporaryPath)
    await rename(temporaryPath, baselinePath)
  } finally {
    await rm(temporaryPath, { force: true })
  }
}
```

CLI сначала выполняет ту же проверку, что `check.mjs`, с текущим baseline. Только
после PASS вызывает dependency-cruiser с `--output-type baseline` и временным
`--output-to`; поэтому новый долг невозможно включить штатной командой.

CLI-вход `baseline.mjs` использует функцию так:

```js
import { resolve } from "node:path"
import { createCruiseResult } from "./cruise-result.mjs"
import { baselinePath, reportsDir, toolRoot } from "./paths.mjs"
import { runDepcruise } from "./run-depcruise.mjs"

const baselineCruisePath = resolve(reportsDir, "baseline.json")
await updateBaseline({
  baselinePath,
  check: async () => {
    runDepcruise(process.execPath, [resolve(toolRoot, "src/check.mjs")], { capture: false })
  },
  generate: async (temporaryPath) => {
    createCruiseResult({ ignoreKnown: false, outputPath: baselineCruisePath })
    runDepcruise("depcruise-fmt", [
      "--output-type", "baseline",
      "--output-to", temporaryPath,
      baselineCruisePath,
    ], { capture: false })
  },
})
```

- [ ] **Step 4: Реализовать отчёт и HTML-представление графа**

`report.mjs` строит свежий JSON без `--ignore-known`, проверяет полноту и вызывает:

```bash
depcruise-fmt --output-type err-html \
  --output-to reports/dependency-cruiser/violations.html \
  reports/dependency-cruiser/current.json
```

Поток `report.mjs` выражается без shell-конвейера:

```js
import { resolve } from "node:path"
import { createCruiseResult } from "./cruise-result.mjs"
import { cruiseResultPath, reportsDir } from "./paths.mjs"
import { runDepcruise } from "./run-depcruise.mjs"

createCruiseResult({ ignoreKnown: false })
runDepcruise("depcruise-fmt", [
  "--output-type", "err-html",
  "--output-to", resolve(reportsDir, "violations.html"),
  cruiseResultPath,
], { capture: false })
```

`graph.mjs` строит свежий JSON и вызывает штатный HTML dependency matrix с
группировкой верхних каталогов:

```bash
depcruise-fmt --output-type html \
  --collapse '^packages/(?:core/metadata/[^/]+|[^/]+)' \
  --output-to reports/dependency-cruiser/graph.html \
  reports/dependency-cruiser/current.json
```

`graph.mjs`:

```js
import { resolve } from "node:path"
import { createCruiseResult } from "./cruise-result.mjs"
import { cruiseResultPath, reportsDir } from "./paths.mjs"
import { runDepcruise } from "./run-depcruise.mjs"

createCruiseResult({ ignoreKnown: false })
runDepcruise("depcruise-fmt", [
  "--output-type", "html",
  "--collapse", "^packages/(?:core/metadata/[^/]+|[^/]+)",
  "--output-to", resolve(reportsDir, "graph.html"),
  cruiseResultPath,
], { capture: false })
```

Shell-конвейеры и перенаправления не использовать.

Это интерактивное HTML-представление графа без внешнего GraphViz, которого нет
в текущем окружении. Не добавлять системную зависимость `dot` и не загружать JS
из CDN.

Добавить package scripts `report`, `graph`, `baseline` и корневые scripts:

```json
"architecture:report": "pnpm --filter @nkdk/dependency-cruiser run report",
"architecture:graph": "pnpm --filter @nkdk/dependency-cruiser run graph",
"architecture:baseline": "pnpm --filter @nkdk/dependency-cruiser run baseline"
```

- [ ] **Step 5: Проверить команды и отсутствие файлов отчётов в Git**

Run:

```bash
pnpm --filter @nkdk/dependency-cruiser exec node --test test/baseline.test.mjs
pnpm architecture:report
pnpm architecture:graph
pnpm architecture:baseline
test -s reports/dependency-cruiser/violations.html
test -s reports/dependency-cruiser/graph.html
git status --short
```

Expected: тесты PASS; оба HTML непусты; baseline не расширился; `git status` не
показывает `reports/dependency-cruiser/`.

- [ ] **Step 6: Проверить отказ baseline при новом нарушении**

Временно добавить запрещённый импорт, затем Run:

```bash
pnpm architecture:baseline
git diff --exit-code -- .dependency-cruiser-known-violations.json
```

Expected: первая команда FAIL; вторая PASS, потому что baseline не изменён.
Удалить временный импорт и повторить `pnpm test:architecture` до PASS.

- [ ] **Step 7: Создать коммит эксплуатационных команд**

```bash
git add package.json tools/dependency-cruiser
git commit -m "chore: :wrench: добавить отчёты dependency-cruiser"
```

---

### Task 6: Документация процесса и итоговая проверка

**Files:**
- Modify: `.agents/testing.md:47-56`
- Verify: `docs/superpowers/specs/2026-08-02-dependency-cruiser-architecture-design.md`

**Interfaces:**
- Consumes: четыре корневые команды архитектуры.
- Produces: обязательный процесс запуска и измеренный итог реализации.

- [ ] **Step 1: Обновить полный набор проверок**

В `.agents/testing.md` заменить блок полной проверки на:

```bash
pnpm type-check
pnpm test
pnpm test:architecture
```

После блока добавить:

```markdown
`pnpm test:architecture` обязателен после изменения импортов, структуры
каталогов, `package.json`, архитектурных правил или baseline. Команда остаётся
отдельной от `pnpm test`, чтобы её можно было запускать ранним шагом проверки.
```

- [ ] **Step 2: Запустить три полных замера архитектурной проверки**

Run три раза из корня:

```bash
/usr/bin/time -p pnpm test:architecture
```

Expected: каждый запуск PASS, анализируется не меньше 1 800 модулей; медиана
трёх прогонов не превышает пяти секунд. Записать `real` всех трёх
запусков в итоговое сообщение задачи, не в отслеживаемый файл.

Если медиана выше пяти секунд, измерить с `--progress performance-log`, затем в
таком порядке: проверить исключение `node_modules`, ограничить расширения
`.ts/.tsx/.mts/.cts/.js/.mjs/.cjs`, подтвердить content-cache. Не удалять
`tsPreCompilationDeps`, reachable-правило или проверку полноты.

- [ ] **Step 3: Выполнить полную проверку проекта**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture
git diff --check
```

Expected: все команды PASS; `pnpm test` сохраняет существующие договоры, а
архитектурная проверка отдельно подтверждает новые правила. Mutation testing не
запускается: production TypeScript не меняется, а `.mjs` инструмента не входит в
допустимые цели `test:mutation`.

- [ ] **Step 4: Сверить реализацию со спецификацией**

Проверить по пунктам:

```text
[ ] TypeScript 6.0.3 виден анализатору, TypeScript проекта остаётся 7.0.2
[ ] runtime-, type-only и reachable fixtures обнаруживаются
[ ] neutral -> neutral fixture разрешён
[ ] общие четыре правила работают
[ ] настоящий граф >= 1800 модулей
[ ] baseline штатно только сокращается
[ ] violations.html и graph.html создаются вне Git
[ ] повторный запуск <= 5 секунд
[ ] .agents/testing.md содержит отдельную обязательную команду
```

Expected: все пункты отмечены; при пробеле вернуться в владеющую им задачу, а не
добавлять исключение.

- [ ] **Step 5: Создать финальный документационный коммит**

```bash
git add .agents/testing.md
git commit -m "docs: :memo: закрепить архитектурную проверку"
```
