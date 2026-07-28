import { availableParallelism } from "node:os"
import { performance } from "node:perf_hooks"
import { isAbsolute, join, relative, resolve, sep } from "path"
import type { ConfigurationContext } from "../context/types"
import { discoverPreparedYamlValidationProjectFiles } from "../project/preparedYamlProject"
import {
  createPreparedYamlProjectWorkerPool,
  type PreparedWorkerPool,
  type PreparedYamlProjectWorkerPool,
} from "../project/preparedYamlProjectWorkerPool"
import { createValidationProfiler } from "./profile"
import { evaluateProjectFirstPass } from "./projectFirstPassReadiness"
import { discoverValidationProjectComponents } from "./projectComponents"
import { createProjectValidationGraph } from "./projectValidationGraph"
import type { Diagnostic } from "./types"

export interface ValidateProjectParams {
  projectDir: string
  context?: ConfigurationContext
  concurrency?: number
}

export interface ValidateProjectResult {
  diagnostics: Diagnostic[]
}

export interface ValidationWorkerPoolHandle {
  validateProject(params: Omit<ValidateProjectParams, "concurrency">): Promise<ValidateProjectResult>
  close(): Promise<void>
  size(): number
}

export async function validateProject(params: ValidateProjectParams): Promise<ValidateProjectResult> {
  return validateProjectWithPreparedYaml({
    ...params,
    concurrency: normalizeValidationConcurrency(params.concurrency),
  })
}

export function createValidationWorkerPoolHandle(
  params: { concurrency?: number; createWorkerPool?: () => PreparedWorkerPool } = {}
): ValidationWorkerPoolHandle {
  const concurrency = normalizeValidationConcurrency(params.concurrency)
  const pool = createPreparedYamlProjectWorkerPool({ concurrency, createWorkerPool: params.createWorkerPool })
  let closed = false
  let currentRun: Promise<void> = Promise.resolve()

  async function runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const previous = currentRun
    let release: () => void = () => undefined
    currentRun = new Promise<void>((resolve) => {
      release = resolve
    })
    await previous
    try {
      return await task()
    } finally {
      release()
    }
  }

  return {
    validateProject(projectParams) {
      if (closed) throw new Error("Validation worker pool handle is closed")
      return runExclusive(async () => {
        return validateProjectWithPreparedYaml({
          ...projectParams,
          concurrency,
          pool,
          closePool: false,
        })
      })
    },
    async close() {
      if (closed) return
      closed = true
      await currentRun
      await pool.close()
    },
    size() {
      return pool.size()
    },
  }
}

async function validateProjectWithPreparedYaml(
  params: ValidateProjectParams & {
    concurrency: number
    pool?: PreparedYamlProjectWorkerPool
    closePool?: boolean
  }
): Promise<ValidateProjectResult> {
  const totalStartedAt = performance.now()
  const initializationProfiler = createValidationProfiler({ scope: "main" })
  const profiler = createValidationProfiler({ scope: "main" })
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultValidationContext()
  const pool = params.pool ?? createPreparedYamlProjectWorkerPool({ concurrency: params.concurrency })
  const closePool = params.closePool ?? true
  let startMs = 0
  let schemaCompileMs = 0
  let formSchemaMs = 0
  let propertiesSchemaMs = 0
  let firstPassMs = 0
  let mergeMs = 0
  let secondPassMs = 0
  let sortMs = 0
  let fileCount = 0

  try {
    const prepareStartedAt = performance.now()
    const componentDiscovery = await discoverValidationProjectComponents(projectDir)
    const files = await discoverPreparedYamlValidationProjectFiles(componentDiscovery.components)
    const prepareMs = performance.now() - prepareStartedAt

    fileCount = files.length
    const startProfile = await initializationProfiler.measureAsync(
      "Инициализация",
      "Инициализация validation worker",
      { items: params.concurrency },
      () => pool.initValidation(context)
    )
    startMs = startProfile.workerInitMs
    schemaCompileMs = startProfile.schemaCompileMs
    formSchemaMs = startProfile.formSchemaMs
    propertiesSchemaMs = startProfile.propertiesSchemaMs
    initializationProfiler.record("Инициализация", "Компиляция схем", {
      items: params.concurrency,
      timeMs: schemaCompileMs,
    })
    initializationProfiler.flush()
    const firstPassStartedAt = performance.now()
    const first = await pool.runValidationFirstPass({ projectDir, context, files })
    firstPassMs = performance.now() - firstPassStartedAt
    const firstPassReadiness = evaluateProjectFirstPass({
      hasConfiguration: componentDiscovery.hasConfiguration,
      componentPaths: componentDiscovery.components.map(({ componentPath }) => componentPath),
      firstPass: first,
    })
    const firstPassRecordCount = first.components.reduce(
      (count, component) => count + component.contribution.objectRecords.length,
      0
    )
    const graph = profiler.measure("Обобщение индексов", "Слияние first pass", { items: firstPassRecordCount }, () =>
      createProjectValidationGraph(first.components)
    )
    mergeMs = profiler.records().find((record) => record.substep === "Слияние first pass")?.timeMs ?? 0
    const second = await profiler.measureAsync(
      "Проверка зависимостей",
      "Ожидание worker second pass",
      { items: fileCount },
      () =>
        pool.runValidationSecondPass({
          projectDir,
          context,
          graph,
          blockedComponentPaths: firstPassReadiness.blockedExtensionPaths,
        })
    )
    secondPassMs = profiler.records().find((record) => record.substep === "Ожидание worker second pass")?.timeMs ?? 0
    const degradationDiagnostics = createDegradationDiagnostics({
      projectDir,
      hasConfiguration: componentDiscovery.hasConfiguration,
      blockedComponentPaths: firstPassReadiness.blockedExtensionPaths,
    })
    const diagnostics = profiler.measure(
      "Завершение validation",
      "Сортировка и дедупликация диагностик",
      {
        items:
          firstPassReadiness.publishedDiagnostics.length + second.diagnostics.length + degradationDiagnostics.length,
      },
      () =>
        sortDiagnostics(
          dedupeDiagnostics(
            [...firstPassReadiness.publishedDiagnostics, ...second.diagnostics, ...degradationDiagnostics].map(
              (diagnostic) => toRootProjectDiagnostic(projectDir, diagnostic)
            )
          )
        )
    )
    sortMs = profiler.records().find((record) => record.substep === "Сортировка и дедупликация диагностик")?.timeMs ?? 0
    profiler.flush()
    logWorkerValidationProfile({
      files: fileCount,
      concurrency: params.concurrency,
      discoverMs: prepareMs,
      startMs,
      schemaCompileMs,
      formSchemaMs,
      propertiesSchemaMs,
      firstPassMs,
      mergeMs,
      secondPassMs,
      sortMs,
      totalMs: performance.now() - totalStartedAt,
    })

    return { diagnostics }
  } finally {
    if (closePool) await pool.close()
  }
}

function logWorkerValidationProfile(params: {
  files: number
  concurrency: number
  discoverMs: number
  startMs: number
  schemaCompileMs: number
  formSchemaMs: number
  propertiesSchemaMs: number
  firstPassMs: number
  mergeMs: number
  secondPassMs: number
  sortMs: number
  totalMs: number
}): void {
  if (process.env["NKDK_VALIDATION_PROFILE"] !== "1") return
  console.error(
    [
      "[validation-profile] orchestration",
      `files=${params.files}`,
      `concurrency=${params.concurrency}`,
      `discover=${params.discoverMs.toFixed(2)}ms`,
      `startWorkers=${params.startMs.toFixed(2)}ms`,
      `schemaCompile=${params.schemaCompileMs.toFixed(2)}ms`,
      `formSchema=${params.formSchemaMs.toFixed(2)}ms`,
      `propertiesSchema=${params.propertiesSchemaMs.toFixed(2)}ms`,
      `firstPassWall=${params.firstPassMs.toFixed(2)}ms`,
      `mergeFirstPass=${params.mergeMs.toFixed(2)}ms`,
      `secondPassWall=${params.secondPassMs.toFixed(2)}ms`,
      `sortDedupe=${params.sortMs.toFixed(2)}ms`,
      `total=${params.totalMs.toFixed(2)}ms`,
    ].join(" ")
  )
}

function normalizeValidationConcurrency(value: number | undefined): number {
  if (value !== undefined) {
    if (!Number.isInteger(value) || value < 1) throw new Error("validation concurrency must be a positive integer")
    return value
  }

  return Math.max(1, Math.min(4, availableParallelism() - 1))
}

function sortDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort((left, right) => {
    return (
      left.filePath.localeCompare(right.filePath) ||
      left.line - right.line ||
      left.col - right.col ||
      left.severity.localeCompare(right.severity) ||
      left.message.localeCompare(right.message)
    )
  })
}

function dedupeDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const result: Diagnostic[] = []
  const seen = new Set<string>()
  for (const diagnostic of diagnostics) {
    const key = diagnosticKey(diagnostic)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(diagnostic)
  }
  return result
}

function diagnosticKey(diagnostic: Diagnostic): string {
  return [
    diagnostic.filePath,
    diagnostic.line,
    diagnostic.col,
    diagnostic.source,
    diagnostic.severity,
    diagnostic.path ?? "",
    diagnostic.message,
  ].join("\0")
}

export function toRootProjectDiagnostic(projectDir: string, diagnostic: Diagnostic): Diagnostic {
  const relativePath = relative(resolve(projectDir), resolve(diagnostic.filePath))
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new Error(`Путь диагностики находится за пределами projectDir: ${diagnostic.filePath}`)
  }
  const rootProjectPath = relativePath.split(sep).join("/")
  const componentProjectPath =
    rootProjectPath.startsWith("cf/") || /^cfe\/[^/]+\//.test(rootProjectPath)
      ? rootProjectPath
      : `cf/${rootProjectPath}`
  return { ...diagnostic, filePath: componentProjectPath }
}

function createDegradationDiagnostics(params: {
  projectDir: string
  hasConfiguration: boolean
  blockedComponentPaths: readonly string[]
}): Diagnostic[] {
  const diagnostics = params.blockedComponentPaths.map(
    (componentPath): Diagnostic => ({
      filePath: join(params.projectDir, componentPath, "Конфигурация.yaml"),
      line: 1,
      col: 1,
      severity: "error",
      source: "cross-file",
      message: "Семантическая валидация расширения невозможна из-за ошибок базовой конфигурации",
    })
  )
  if (!params.hasConfiguration) {
    diagnostics.push({
      filePath: join(params.projectDir, "cf", "Конфигурация.yaml"),
      line: 1,
      col: 1,
      severity: "error",
      source: "structure",
      message: "Базовая конфигурация cf не найдена",
    })
  }
  return diagnostics
}

function defaultValidationContext(): ConfigurationContext {
  return {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  }
}
