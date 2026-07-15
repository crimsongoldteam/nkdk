#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { existsSync, statSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")

function usage() {
  return [
    "Использование:",
    "  node .agents/skills/validation-profile/validation-profile.mjs <yaml-dir> [--runs N] [--concurrency N] [--timing] [--json]",
  ].join("\n")
}

function fail(message) {
  console.error(`Ошибка: ${message}`)
  console.error(usage())
  process.exit(2)
}

function isPositiveInteger(value) {
  return typeof value === "string" && /^[1-9][0-9]*$/.test(value)
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

async function loadCompiledCore() {
  const distIndex = resolve(repoRoot, "packages/core/dist/index.js")
  const standalone = resolve(repoRoot, "packages/core/dist/projectValidationAjvStandalone.js")

  if (!existsSync(distIndex) || !existsSync(standalone)) {
    fail(
      [
        "compiled validation files are missing.",
        "Перед запуском выполни: pnpm --filter @nkdk/core build",
      ].join(" ")
    )
  }

  return import(pathToFileURL(distIndex).href)
}

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

function runTimingPass(options) {
  const script = [
    "import { createValidationWorkerPoolHandle } from './packages/core/dist/index.js';",
    `const projectDir = ${JSON.stringify(options.projectDir)};`,
    `const handle = createValidationWorkerPoolHandle(${
      options.concurrency === undefined ? "" : JSON.stringify({ concurrency: options.concurrency })
    });`,
    "try { await handle.validateProject({ projectDir }); } finally { await handle.close(); }",
  ].join("\n")

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
      ]
        .filter(Boolean)
        .join("\n")
    )
  }

  const stepLines = spawned.stderr.split(/\r?\n/).filter((line) => line.startsWith("[validation-step] "))
  if (stepLines.length === 0) {
    throw new Error("timing pass did not emit [validation-step] records. Rebuild @nkdk/core before profiling.")
  }
  return {
    steps: stepLines.map(parseValidationStepLine),
  }
}

function parseValidationStepLine(line) {
  const result = {}
  for (const token of tokenizeProfileLine(line).slice(1)) {
    const eq = token.indexOf("=")
    if (eq === -1) continue
    const key = token.slice(0, eq)
    const rawValue = token.slice(eq + 1)
    const value = parseProfileValue(rawValue)
    if (typeof value !== "string") {
      result[key] = value
      continue
    }
    if (value.endsWith("ms")) {
      result[key] = Number(value.slice(0, -"ms".length))
      continue
    }
    if (value.endsWith("MiB")) {
      result[key] = Number(value.slice(0, -"MiB".length))
      continue
    }
    const number = Number(value)
    result[key] = Number.isNaN(number) ? value : number
  }

  return result
}

function tokenizeProfileLine(line) {
  const tokens = []
  let current = ""
  let inString = false
  let escaped = false
  for (const char of line) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }
    if (char === "\\") {
      current += char
      escaped = true
      continue
    }
    if (char === '"') {
      current += char
      inString = !inString
      continue
    }
    if (char === " " && !inString) {
      if (current.length > 0) tokens.push(current)
      current = ""
      continue
    }
    current += char
  }
  if (current.length > 0) tokens.push(current)
  return tokens
}

function parseProfileValue(value) {
  if (value.startsWith('"') && value.endsWith('"')) return JSON.parse(value)
  return value
}

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
    printInitializationTable(result.timing.steps)
    printValidationStageTable(result.timing.steps)
  }
}

function printInitializationTable(steps) {
  const rows = aggregateRows(steps.filter((step) => step.step === "Инициализация"))
  if (rows.length === 0) return
  console.log("Инициализация:")
  printMarkdownTable(rows)
  console.log("")
}

function printValidationStageTable(steps) {
  const rows = aggregateRows(steps.filter((step) => step.step !== "Инициализация"))
  console.log("Шаги validation:")
  printMarkdownTable(rows)
}

function aggregateRows(steps) {
  const byStep = new Map()
  const bySubstep = new Map()
  for (const step of steps) {
    pushGroup(byStep, step.step, step)
    pushGroup(bySubstep, `${step.step}\u0000${step.substep}`, step)
  }

  const rows = []
  for (const stepName of orderedStepNames(steps)) {
    rows.push(toTableRow(stepName, byStep.get(stepName) ?? []))
    for (const substepName of orderedSubstepNames(steps, stepName)) {
      rows.push(toTableRow(`- ${substepName}`, bySubstep.get(`${stepName}\u0000${substepName}`) ?? []))
    }
  }
  return rows
}

function pushGroup(groups, key, value) {
  const group = groups.get(key) ?? []
  group.push(value)
  groups.set(key, group)
}

function orderedStepNames(steps) {
  const preferred = [
    "Инициализация",
    "Подготовка YAML-проекта",
    "Проверка по схеме",
    "Обобщение индексов",
    "Проверка зависимостей",
    "Завершение validation",
  ]
  const existing = new Set(steps.map((step) => step.step))
  return [...preferred.filter((step) => existing.has(step)), ...[...existing].filter((step) => !preferred.includes(step))]
}

function orderedSubstepNames(steps, stepName) {
  const preferred = {
    "Подготовка YAML-проекта": [
      "Поиск файлов проекта",
      "Классификация файлов проекта",
      "Классификация прочих файлов проекта",
      "Разбиение по worker",
      "Сбор правил структуры проекта",
      "Чтение YAML",
      "Разбор YAML",
      "Извлечение локальных индексов",
      "Сохранение worker данных YAML",
      "Обмен с worker и получение результата",
      "Слияние индекса объявлений",
      "Перераспределение индекса обращений",
    ],
    "Проверка по схеме": ["Ожидание worker first pass", "Worker first pass"],
    "Обобщение индексов": ["Слияние first pass", "Снимок object table"],
    "Проверка зависимостей": [
      "Ожидание worker second pass",
      "Построение контекста worker",
      "Проверка ссылок",
      "Worker second pass",
    ],
    "Завершение validation": ["Сортировка и дедупликация диагностик"],
    "Инициализация": ["Инициализация validation worker", "Компиляция схем"],
  }[stepName]
  const result = []
  const seen = new Set()
  if (preferred !== undefined) {
    const existing = new Set(steps.filter((step) => step.step === stepName).map((step) => step.substep))
    for (const substep of preferred) {
      if (!existing.has(substep)) continue
      seen.add(substep)
      result.push(substep)
    }
  }
  for (const step of steps) {
    if (step.step !== stepName || seen.has(step.substep)) continue
    seen.add(step.substep)
    result.push(step.substep)
  }
  return result
}

function toTableRow(name, records) {
  const main = records.filter((record) => record.scope === "main")
  const workers = records.filter((record) => record.scope === "worker")
  const workerTimes = aggregateWorkerValues(workers, "time", "sum")
  const workerRss = aggregateWorkerValues(workers, "rssPeak", "max")
  return {
    step: name,
    projectMs: main.length > 0 ? sum(main, "time") : max(workerTimes),
    mainMs: sumOrUndefined(main, "time"),
    workerMinMs: min(workerTimes),
    workerAvgMs: avg(workerTimes),
    workerMaxMs: max(workerTimes),
    workerSumMs: sumValues(workerTimes),
    processRssMaxMiB: maxValue(main, "rssPeak"),
    workerRssMinMiB: min(workerRss),
    workerRssAvgMiB: avg(workerRss),
    workerRssMaxMiB: max(workerRss),
  }
}

function aggregateWorkerValues(records, field, mode) {
  const byWorker = new Map()
  for (const record of records) {
    if (record.worker === undefined || record[field] === undefined) continue
    const current = byWorker.get(record.worker)
    byWorker.set(record.worker, mode === "max" ? Math.max(current ?? record[field], record[field]) : (current ?? 0) + record[field])
  }
  return [...byWorker.values()]
}

function printMarkdownTable(rows) {
  const headers = [
    "Шаг",
    "Общее время",
    "Главный поток",
    "Worker min",
    "Worker avg",
    "Worker max",
    "Worker sum",
    "RSS процесса max",
    "RSS worker min",
    "RSS worker avg",
    "RSS worker max",
  ]
  console.log(`| ${headers.join(" | ")} |`)
  console.log(`| ${headers.map(() => "---").join(" | ")} |`)
  for (const row of rows) {
    console.log(
      [
        row.step,
        formatMs(row.projectMs),
        formatMs(row.mainMs),
        formatMs(row.workerMinMs),
        formatMs(row.workerAvgMs),
        formatMs(row.workerMaxMs),
        formatMs(row.workerSumMs),
        formatMiB(row.processRssMaxMiB),
        formatMiB(row.workerRssMinMiB),
        formatMiB(row.workerRssAvgMiB),
        formatMiB(row.workerRssMaxMiB),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |")
    )
  }
}

function sum(records, field) {
  return records.reduce((total, record) => total + (record[field] ?? 0), 0)
}

function sumOrUndefined(records, field) {
  return records.length === 0 ? undefined : sum(records, field)
}

function sumValues(values) {
  return values.length === 0 ? undefined : values.reduce((total, value) => total + value, 0)
}

function min(values) {
  return values.length === 0 ? undefined : Math.min(...values)
}

function max(values) {
  return values.length === 0 ? undefined : Math.max(...values)
}

function maxValue(records, field) {
  const values = records.map((record) => record[field]).filter((value) => value !== undefined)
  return max(values)
}

function avg(values) {
  if (values.length === 0) return undefined
  return values.reduce((total, value) => total + value, 0) / values.length
}

function formatMs(value) {
  return value === undefined ? "-" : `${(value / 1000).toFixed(2)}s`
}

function formatMiB(value) {
  return value === undefined ? "-" : `${value.toFixed(1)}MiB`
}

const options = parseArgs(process.argv.slice(2))
const result = await runProfile(options)
printResult(result, options)
