# Validation Profile Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `.agents/skills/validation-profile`, a repo-skill that profiles compiled standalone project validation for a YAML directory.

**Architecture:** The skill has a concise `SKILL.md` and one deterministic Node runner. The runner imports `packages/core/dist/index.js`, so validation uses compiled `projectValidationWorker.js` and `projectValidationAjvStandalone.js`; the skill workflow performs `pnpm --filter @nakidka/core build` before invoking the runner.

**Tech Stack:** Node.js ESM, `@nakidka/core` built dist, existing validation worker pool, existing `NKDK_VALIDATION_TIMING=1` logs, repo skill metadata format.

## Global Constraints

- Create files only under `.agents/skills/validation-profile/`.
- Measure only compiled standalone validation; do not call `packages/mcp/src/services/validateProject.ts` and do not import `packages/core/index.ts`.
- The runner does not run `pnpm --filter @nakidka/core build`; the skill workflow does.
- The runner does not modify project files, commit, push, or run `pnpm test`.
- Full `pnpm test` is not required because only diagnostic skill files are added.
- Use ASCII in new files unless existing project text requires Russian user-facing messages.

---

## File Structure

- Create `.agents/skills/validation-profile/validation-profile.mjs`.
  - Responsibility: parse CLI args, run compiled standalone validation, collect timing/memory/diagnostics, optionally run a timing pass, print JSON or JSON plus short text summary.
- Create `.agents/skills/validation-profile/SKILL.md`.
  - Responsibility: tell Codex when and how to use the runner, enforce compiled-only workflow, and define the final response shape.

---

### Task 1: Compiled Standalone Profile Runner

**Files:**
- Create: `.agents/skills/validation-profile/validation-profile.mjs`

**Interfaces:**
- Consumes: `packages/core/dist/index.js` exports `createValidationWorkerPoolHandle(params?: { concurrency?: number })`.
- Produces: CLI command `node .agents/skills/validation-profile/validation-profile.mjs <yaml-dir> [--runs N] [--concurrency N] [--timing] [--json]`.
- Produces JSON object:
  - `mode: "compiled-standalone"`
  - `projectDir: string`
  - `runs: Array<{ run: number; elapsedMs: number; diagnostics: number; errors: number; warnings: number; workerPoolSize: number; rssMiB: number; heapUsedMiB: number }>`
  - `coldMs?: number`
  - `warmAvgMs?: number`
  - `warmMinMs?: number`
  - `warmMaxMs?: number`
  - `peakRssMiB: number`
  - `timing?: { firstPass: unknown[]; secondPass: unknown[]; rawLines: string[] }`

- [ ] **Step 1: Create runner skeleton with strict argument parsing**

Create `.agents/skills/validation-profile/validation-profile.mjs` with:

```js
#!/usr/bin/env node
import { existsSync, statSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { spawnSync } from "node:child_process"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")

function usage() {
  return [
    "Использование:",
    "  node .agents/skills/validation-profile/validation-profile.mjs <yaml-dir> [--runs N] [--concurrency N] [--timing] [--json]",
  ].join("\\n")
}

function fail(message) {
  console.error(`Ошибка: ${message}`)
  console.error(usage())
  process.exit(2)
}

function parseArgs(argv) {
  const options = {
    runs: 5,
    concurrency: undefined,
    timing: false,
    jsonOnly: false,
    projectDir: undefined,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--runs") {
      const value = argv[++index]
      if (!isPositiveInteger(value)) fail("--runs должен быть положительным целым числом")
      options.runs = Number(value)
      continue
    }
    if (arg === "--concurrency") {
      const value = argv[++index]
      if (!isPositiveInteger(value)) fail("--concurrency должен быть положительным целым числом")
      options.concurrency = Number(value)
      continue
    }
    if (arg === "--timing") {
      options.timing = true
      continue
    }
    if (arg === "--json") {
      options.jsonOnly = true
      continue
    }
    if (arg === "-h" || arg === "--help") {
      console.log(usage())
      process.exit(0)
    }
    if (arg.startsWith("-")) fail(`неизвестный параметр ${arg}`)
    if (options.projectDir !== undefined) fail("можно указать только один YAML-каталог")
    options.projectDir = resolve(arg)
  }

  if (options.projectDir === undefined) fail("не указан YAML-каталог")
  if (!existsSync(options.projectDir)) fail(`YAML-каталог не найден: ${options.projectDir}`)
  if (!statSync(options.projectDir).isDirectory()) fail(`путь не является каталогом: ${options.projectDir}`)

  return options
}

function isPositiveInteger(value) {
  return typeof value === "string" && /^[1-9][0-9]*$/.test(value)
}

const options = parseArgs(process.argv.slice(2))
const result = await runProfile(options)
printResult(result, options)
```

- [ ] **Step 2: Add compiled core loading guard**

Append these functions below `parseArgs()` helpers and above the top-level call:

```js
async function loadCompiledCore() {
  const distIndex = resolve(repoRoot, "packages/core/dist/index.js")
  const standalone = resolve(repoRoot, "packages/core/dist/projectValidationAjvStandalone.js")
  const worker = resolve(repoRoot, "packages/core/dist/projectValidationWorker.js")

  if (!existsSync(distIndex) || !existsSync(worker) || !existsSync(standalone)) {
    fail(
      [
        "compiled validation files are missing.",
        "Перед запуском выполни: pnpm --filter @nakidka/core build",
      ].join(" ")
    )
  }

  return import(pathToFileURL(distIndex).href)
}
```

- [ ] **Step 3: Implement memory helpers and validation run loop**

Append:

```js
function memorySnapshot() {
  const memory = process.memoryUsage()
  return {
    rssMiB: Math.round(memory.rss / 1024 / 1024),
    heapUsedMiB: Math.round(memory.heapUsed / 1024 / 1024),
    rssBytes: memory.rss,
  }
}

function countDiagnostics(diagnostics) {
  let errors = 0
  let warnings = 0
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === "error") errors += 1
    if (diagnostic.severity === "warning") warnings += 1
  }
  return { errors, warnings }
}

function average(values) {
  if (values.length === 0) return undefined
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

async function runProfile(options) {
  const core = await loadCompiledCore()
  const handle = core.createValidationWorkerPoolHandle(
    options.concurrency === undefined ? undefined : { concurrency: options.concurrency }
  )
  const runs = []
  let peakRssBytes = process.memoryUsage().rss
  const timer = setInterval(() => {
    peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss)
  }, 25)

  try {
    for (let run = 1; run <= options.runs; run += 1) {
      const started = performance.now()
      const validation = await handle.validateProject({ projectDir: options.projectDir })
      const elapsedMs = Math.round(performance.now() - started)
      const memory = memorySnapshot()
      peakRssBytes = Math.max(peakRssBytes, memory.rssBytes)
      const counts = countDiagnostics(validation.diagnostics)

      runs.push({
        run,
        elapsedMs,
        diagnostics: validation.diagnostics.length,
        errors: counts.errors,
        warnings: counts.warnings,
        workerPoolSize: handle.size(),
        rssMiB: memory.rssMiB,
        heapUsedMiB: memory.heapUsedMiB,
      })
    }
  } finally {
    clearInterval(timer)
    await handle.close()
  }

  const warm = runs.slice(1).map((run) => run.elapsedMs)
  const result = {
    mode: "compiled-standalone",
    projectDir: options.projectDir,
    runs,
    coldMs: runs[0]?.elapsedMs,
    warmAvgMs: average(warm),
    warmMinMs: warm.length === 0 ? undefined : Math.min(...warm),
    warmMaxMs: warm.length === 0 ? undefined : Math.max(...warm),
    peakRssMiB: Math.round(peakRssBytes / 1024 / 1024),
  }

  if (options.timing) {
    result.timing = runTimingPass(options)
  }

  return result
}
```

- [ ] **Step 4: Implement `--timing` pass using existing worker logs**

Append:

```js
function runTimingPass(options) {
  const script = [
    "import { createValidationWorkerPoolHandle } from './packages/core/dist/index.js';",
    `const projectDir = ${JSON.stringify(options.projectDir)};`,
    `const handle = createValidationWorkerPoolHandle(${options.concurrency === undefined ? "" : JSON.stringify({ concurrency: options.concurrency })});`,
    "try { await handle.validateProject({ projectDir }); } finally { await handle.close(); }",
  ].join("\\n")

  const spawned = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      NKDK_VALIDATION_TIMING: "1",
    },
    maxBuffer: 1024 * 1024 * 64,
  })

  if (spawned.status !== 0) {
    throw new Error(
      [
        "timing pass failed",
        `status=${spawned.status}`,
        spawned.stderr.trim(),
        spawned.stdout.trim(),
      ].filter(Boolean).join("\\n")
    )
  }

  const rawLines = spawned.stderr.split(/\\r?\\n/).filter((line) => line.startsWith("[validation] worker "))
  return {
    firstPass: rawLines.filter((line) => line.includes(" first pass ")).map(parseTimingLine),
    secondPass: rawLines.filter((line) => line.includes(" second pass ")).map(parseTimingLine),
    rawLines,
  }
}

function parseTimingLine(line) {
  const result = { raw: line }
  const worker = /worker (\\d+)/.exec(line)
  if (worker) result.worker = Number(worker[1])
  result.phase = line.includes(" first pass ") ? "firstPass" : "secondPass"

  for (const token of line.split(" ")) {
    const eq = token.indexOf("=")
    if (eq === -1) continue
    const key = token.slice(0, eq)
    const rawValue = token.slice(eq + 1)
    if (rawValue.endsWith("ms")) {
      result[key] = Number(rawValue.slice(0, -"ms".length))
      continue
    }
    if (rawValue.endsWith("MiB")) {
      result[key] = Number(rawValue.slice(0, -"MiB".length))
      continue
    }
    const number = Number(rawValue)
    result[key] = Number.isNaN(number) ? rawValue : number
  }

  return result
}
```

- [ ] **Step 5: Implement output formatting**

Append:

```js
function printResult(result, options) {
  if (options.jsonOnly) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  console.log("Validation profile: compiled standalone")
  console.log(`YAML-каталог: ${result.projectDir}`)
  console.log(`Воркеры: ${result.runs[0]?.workerPoolSize ?? "unknown"}`)
  console.log(`Cold: ${formatMs(result.coldMs)}`)
  console.log(
    `Warm: avg=${formatMs(result.warmAvgMs)} min=${formatMs(result.warmMinMs)} max=${formatMs(result.warmMaxMs)}`
  )
  console.log(`Peak RSS: ${result.peakRssMiB} MiB`)
  console.log("")
  console.log("Runs:")
  for (const run of result.runs) {
    console.log(
      [
        `  ${run.run}.`,
        `${formatMs(run.elapsedMs)}`,
        `diagnostics=${run.diagnostics}`,
        `errors=${run.errors}`,
        `warnings=${run.warnings}`,
        `rss=${run.rssMiB}MiB`,
        `heap=${run.heapUsedMiB}MiB`,
      ].join(" ")
    )
  }

  if (result.timing !== undefined) {
    console.log("")
    console.log("Timing memory:")
    for (const item of [...result.timing.firstPass, ...result.timing.secondPass]) {
      console.log(
        [
          `  worker=${item.worker}`,
          `phase=${item.phase}`,
          `files=${item.files}`,
          `rssPeak=${item.processRssPeak}MiB`,
          `heapPeak=${item.workerHeapPeak}MiB`,
        ].join(" ")
      )
    }
  }

  console.log("")
  console.log(JSON.stringify(result, null, 2))
}

function formatMs(value) {
  return value === undefined ? "n/a" : `${(value / 1000).toFixed(2)}s`
}
```

- [ ] **Step 6: Verify runner help and validation errors**

Run:

```bash
node .agents/skills/validation-profile/validation-profile.mjs --help
```

Expected: prints usage and exits `0`.

Run:

```bash
node .agents/skills/validation-profile/validation-profile.mjs /path/that/does/not/exist
```

Expected: exits `2` and prints `Ошибка: YAML-каталог не найден`.

- [ ] **Step 7: Verify compiled profile on real YAML project**

Run:

```bash
pnpm --filter @nakidka/core build
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 1 --json
```

Expected:

- exit `0`;
- JSON contains `"mode": "compiled-standalone"`;
- `runs[0].workerPoolSize` is a positive number;
- `runs[0].elapsedMs` is a positive number;
- `runs[0].diagnostics` is a number.

- [ ] **Step 8: Verify timing mode**

Run:

```bash
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 1 --timing --json
```

Expected:

- exit `0`;
- JSON contains `timing.firstPass` and `timing.secondPass`;
- each timing entry has `worker`, `phase`, `processRssPeak`, and `workerHeapPeak`.

- [ ] **Step 9: Commit runner**

Run:

```bash
git add .agents/skills/validation-profile/validation-profile.mjs
git commit -m "feat: :sparkles: добавить validation profile runner"
```

---

### Task 2: Skill Instructions

**Files:**
- Create: `.agents/skills/validation-profile/SKILL.md`

**Interfaces:**
- Consumes: CLI produced by Task 1.
- Produces: discoverable skill metadata:
  - `name: validation-profile`
  - `description: Профилирует compiled standalone validation для YAML-каталога: сборка core, запуск dist worker/standalone, отчёт по времени, diagnostics и памяти.`

- [ ] **Step 1: Create `SKILL.md`**

Create `.agents/skills/validation-profile/SKILL.md`:

```markdown
---
name: validation-profile
description: Профилирует compiled standalone validation для YAML-каталога: сборка core, запуск dist worker/standalone, отчёт по времени, diagnostics и памяти.
---

# validation-profile

## Что делает скилл

Скилл выполняет benchmark валидации YAML-проекта через compiled standalone path:

```text
packages/core/dist/index.js
  -> packages/core/dist/projectValidationWorker.js
  -> packages/core/dist/projectValidationAjvStandalone.js
```

Он не использует MCP service и не импортирует `packages/core/index.ts`, потому что это source/tsx path.

## Жёсткие инварианты

- Перед каждым замером выполняй свежую сборку: `pnpm --filter @nakidka/core build`.
- Запускай только `node .agents/skills/validation-profile/validation-profile.mjs ...`.
- Не запускай `pnpm test`.
- Не исправляй validation diagnostics в рамках этого скилла.
- Не коммить результаты замеров.
- Если пользователь просит сравнить source/tsx и compiled standalone, скажи, что это отдельная диагностика вне этого скилла.

## Быстрый запуск

```bash
pnpm --filter @nakidka/core build
node .agents/skills/validation-profile/validation-profile.mjs /path/to/yaml
```

С одним прогоном:

```bash
pnpm --filter @nakidka/core build
node .agents/skills/validation-profile/validation-profile.mjs /path/to/yaml --runs 1
```

С worker timing:

```bash
pnpm --filter @nakidka/core build
node .agents/skills/validation-profile/validation-profile.mjs /path/to/yaml --runs 1 --timing
```

## Параметры runner'а

- `--runs N` — число прогонов, по умолчанию `5`.
- `--concurrency N` — явно задать число worker'ов. Если не задано, core использует свой default.
- `--timing` — добавить один прогон с `NKDK_VALIDATION_TIMING=1` и распарсить first/second pass worker memory.
- `--json` — вывести только JSON.

## Как отвечать пользователю

В финальном ответе покажи:

```text
Режим: compiled standalone
YAML-каталог: <path>
Воркеры: <N>
Cold: <seconds>
Warm: avg=<seconds> min=<seconds> max=<seconds>
Diagnostics: <total> = <errors> errors + <warnings> warnings
Peak RSS: <MiB>
RSS по прогонам: <run list>
```

Если был `--timing`, добавь краткую таблицу:

```text
worker | phase | files | processRssPeak | workerHeapPeak
```

## Ограничения

`--timing` использует существующий `NKDK_VALIDATION_TIMING=1`, поэтому показывает first pass и second pass целиком. Он не показывает `afterRead`, `afterReferenceValidation` или другие внутренние точки, если core не был специально инструментирован.

Если diagnostics выглядят неожиданно, явно укажи, что это результат compiled standalone, и предложи отдельную проверку parity.
```

- [ ] **Step 2: Verify skill text mentions compiled-only constraints**

Run:

```bash
rg -n "compiled standalone|packages/core/dist/index.js|packages/core/index.ts|pnpm test" .agents/skills/validation-profile/SKILL.md
```

Expected: all four concepts are present.

- [ ] **Step 3: Verify end-to-end skill command**

Run:

```bash
pnpm --filter @nakidka/core build
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 1
```

Expected:

- exit `0`;
- output starts with `Validation profile: compiled standalone`;
- output includes `YAML-каталог`, `Воркеры`, `Cold`, `Peak RSS`, and JSON.

- [ ] **Step 4: Commit skill instructions**

Run:

```bash
git add .agents/skills/validation-profile/SKILL.md
git commit -m "docs: :memo: добавить validation profile skill"
```

---

## Plan Self-Review

- Spec coverage: Task 1 covers runner, compiled dist import, N runs, concurrency, memory/timing, JSON/text output. Task 2 covers skill instructions, workflow, constraints, final response.
- Placeholder scan: no TBD/TODO/fill-in-later steps. Every code-writing step contains concrete code.
- Type consistency: runner output shape in Task 1 matches `SKILL.md` response guidance in Task 2.
