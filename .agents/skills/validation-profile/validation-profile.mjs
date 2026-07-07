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

  const rawLines = spawned.stderr.split(/\r?\n/).filter((line) => line.startsWith("[validation] worker "))
  return {
    firstPass: rawLines.filter((line) => line.includes(" first pass ")).map(parseTimingLine),
    secondPass: rawLines.filter((line) => line.includes(" second pass ")).map(parseTimingLine),
    rawLines,
  }
}

function parseTimingLine(line) {
  const result = { raw: line }
  const worker = /worker (\d+)/.exec(line)
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

const options = parseArgs(process.argv.slice(2))
const result = await runProfile(options)
printResult(result, options)
