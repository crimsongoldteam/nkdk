#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { existsSync, statSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")

function usage() {
  return [
    "Использование:",
    "  node .agents/skills/import-profile/import-profile.mjs <xml-dir> <yaml-dir> [--runs N] [--json]",
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
    runs: 1,
    jsonOnly: false,
    xmlDir: undefined,
    yamlDir: undefined,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--runs") {
      const value = argv[++index]
      if (!isPositiveInteger(value)) fail("--runs должен быть положительным целым числом")
      options.runs = Number(value)
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
    if (options.xmlDir === undefined) {
      options.xmlDir = resolve(arg)
      continue
    }
    if (options.yamlDir === undefined) {
      options.yamlDir = resolve(arg)
      continue
    }
    fail("ожидались только XML-каталог и YAML-каталог")
  }

  if (options.xmlDir === undefined) fail("не указан XML-каталог")
  if (options.yamlDir === undefined) fail("не указан YAML-каталог")
  assertDirectory(options.xmlDir, "XML-каталог")
  assertDirectory(options.yamlDir, "YAML-каталог")

  return options
}

function assertDirectory(path, label) {
  if (!existsSync(path)) fail(`${label} не найден: ${path}`)
  if (!statSync(path).isDirectory()) fail(`${label} не является каталогом: ${path}`)
}

function runProfile(options) {
  const runs = []
  const allSteps = []

  for (let run = 1; run <= options.runs; run += 1) {
    const started = performance.now()
    const spawned = spawnSync(
      "pnpm",
      ["--filter", "@nkdk/cli", "dev", "import", options.xmlDir, options.yamlDir],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: { ...process.env, NKDK_PROFILE: "1" },
        maxBuffer: 1024 * 1024 * 128,
      }
    )
    const elapsedMs = Math.round(performance.now() - started)
    const stdout = spawned.stdout ?? ""
    const stderr = spawned.stderr ?? ""
    const steps = stderr.split(/\r?\n/).filter((line) => line.startsWith("[nkdk-profile-step] ")).map(parseProfileLine)
    for (const step of steps) allSteps.push(step)
    const summary = parseImportSummary(stdout)
    const warnings = stderr.split(/\r?\n/).filter((line) => line.startsWith("⚠ ")).length

    runs.push({
      run,
      elapsedMs,
      exitCode: spawned.status ?? 1,
      succeeded: summary.succeeded,
      errors: summary.errors,
      warnings,
      workerPoolSize: workerPoolSize(steps),
    })

    if (spawned.status !== 0) {
      const message = [stderr.trim(), stdout.trim()].filter(Boolean).join("\n")
      throw new Error(`import run ${run} failed with status ${spawned.status}\n${message}`)
    }
  }

  const warm = runs.slice(1).map((run) => run.elapsedMs)
  return {
    mode: "source-tsx",
    xmlDir: options.xmlDir,
    yamlDir: options.yamlDir,
    runs,
    coldMs: runs[0]?.elapsedMs,
    warmAvgMs: average(warm),
    warmMinMs: warm.length === 0 ? undefined : Math.min(...warm),
    warmMaxMs: warm.length === 0 ? undefined : Math.max(...warm),
    peakRssMiB: max(allSteps.map((step) => step.rssPeak).filter((value) => value !== undefined)),
    steps: allSteps,
  }
}

function parseImportSummary(stdout) {
  const match = stdout.match(/Готово: (\d+) успешно, (\d+) с ошибкой/)
  return {
    succeeded: match === null ? undefined : Number(match[1]),
    errors: match === null ? undefined : Number(match[2]),
  }
}

function workerPoolSize(steps) {
  const workers = steps.map((step) => step.worker).filter((value) => value !== undefined)
  return workers.length === 0 ? 0 : max(workers) + 1
}

function parseProfileLine(line) {
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

  const lastRun = result.runs.at(-1)
  console.log("Import profile: source tsx")
  console.log(`XML-каталог: ${result.xmlDir}`)
  console.log(`YAML-каталог: ${result.yamlDir}`)
  console.log(`Воркеры: ${lastRun?.workerPoolSize ?? "unknown"}`)
  console.log(`Cold: ${formatMs(result.coldMs)}`)
  console.log(
    `Warm: avg=${formatMs(result.warmAvgMs)} min=${formatMs(result.warmMinMs)} max=${formatMs(result.warmMaxMs)}`
  )
  console.log(`Warnings/Errors: ${lastRun?.warnings ?? "-"} warnings / ${lastRun?.errors ?? "-"} errors`)
  console.log(`Peak RSS: ${formatMiB(result.peakRssMiB)}`)
  console.log("")
  console.log("Runs:")
  for (const run of result.runs) {
    console.log(
      [
        `  ${run.run}.`,
        `${formatMs(run.elapsedMs)}`,
        `succeeded=${run.succeeded ?? "-"}`,
        `errors=${run.errors ?? "-"}`,
        `warnings=${run.warnings}`,
        `workers=${run.workerPoolSize}`,
      ].join(" ")
    )
  }

  if (result.steps.length > 0) {
    console.log("")
    console.log("Шаги import-from-xml:")
    printMarkdownTable(aggregateRows(result.steps))
  }
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
    for (const row of orderedSubstepRows(steps, stepName)) {
      rows.push(toTableRow(row.label, bySubstep.get(`${stepName}\u0000${row.substep}`) ?? []))
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
  const preferred = ["Подготовка импорта конфигурации"]
  const existing = new Set(steps.map((step) => step.step))
  return [...preferred.filter((step) => existing.has(step)), ...[...existing].filter((step) => !preferred.includes(step))]
}

function orderedSubstepRows(steps, stepName) {
  const preferred = {
    "Подготовка импорта конфигурации": [
      "Подготовка правил структуры XML-выгрузки",
      "Поиск XML-файлов выгрузки",
      "Формирование и распределение заданий импорта",
      "Инициализация worker",
      "Первый проход worker",
      "Чтение XML",
      "Парсинг XML",
      "Построение модели",
      "Извлечение данных для индекса конфигурации",
      "Извлечение локального индекса метаданных",
      "Обобщение индекса метаданных",
      "Обобщение фрагментов данных файла индекса конфигурации",
      "Распределение индекса метаданных",
      "Второй проход worker",
      "Запись YAML",
      "Формирование worker списка файлов результата импорта",
      "Обобщение списка файлов результата импорта",
      "Копирование внешних файлов XML-выгрузки",
      "Вычисление хэшей файлов проекта",
      "Формирование данных файла индекса конфигурации",
      "Запись файла индекса конфигурации",
    ],
  }[stepName]
  const result = []
  const seen = new Set()
  const existing = new Set(steps.filter((step) => step.step === stepName).map((step) => step.substep))
  for (const substep of preferred ?? []) {
    if (!existing.has(substep)) continue
    seen.add(substep)
    result.push({ substep, label: `- ${substep}` })
  }
  for (const step of steps) {
    if (step.step !== stepName || seen.has(step.substep)) continue
    seen.add(step.substep)
    result.push({ substep: step.substep, label: `- ${step.substep}` })
  }
  return result
}

function toTableRow(name, records) {
  const main = records.filter((record) => record.scope === "main")
  const workers = records.filter((record) => record.scope === "worker")
  const workerTimes = aggregateWorkerValues(workers, "time", "sum")
  const workerRss = aggregateWorkerValues(workers, "rssPeak", "max")
  const workerBytes = aggregateWorkerValues(workers, "bytes", "max")
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
    bytesMax: max([maxValue(main, "bytes"), max(workerBytes)].filter((value) => value !== undefined)),
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
    "Данные max",
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
        formatBytes(row.bytesMax),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |")
    )
  }
}

function average(values) {
  if (values.length === 0) return undefined
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
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
  if (values.length === 0) return undefined
  let result = values[0]
  for (const value of values.slice(1)) result = Math.min(result, value)
  return result
}

function max(values) {
  if (values.length === 0) return undefined
  let result = values[0]
  for (const value of values.slice(1)) result = Math.max(result, value)
  return result
}

function maxValue(records, field) {
  const values = records.map((record) => record[field]).filter((value) => value !== undefined)
  return max(values)
}

function avg(values) {
  return values.length === 0 ? undefined : values.reduce((total, value) => total + value, 0) / values.length
}

function formatMs(value) {
  return value === undefined ? "-" : `${(value / 1000).toFixed(2)}s`
}

function formatMiB(value) {
  return value === undefined ? "-" : `${value.toFixed(1)}MiB`
}

function formatBytes(value) {
  return value === undefined ? "-" : `${(value / 1024 / 1024).toFixed(2)}MiB`
}

const options = parseArgs(process.argv.slice(2))
const result = runProfile(options)
printResult(result, options)
