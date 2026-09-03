import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, isAbsolute, relative } from "node:path"
import type { ResolvedConcurrency } from "./concurrency"
import type { PlatformMode } from "./concurrency"
import type { ScenarioResult } from "./stepwise-scenario"

export type StepwiseRunMetadata = {
  readonly sourceRevision: string
  readonly mcpBuildId: string
  readonly platformVersion: string
  readonly compatibilityHash: string
  readonly concurrency: ResolvedConcurrency
  readonly scenarioIds: readonly string[]
}

export type StepwiseReportSummary = {
  readonly successfulSteps: number
  readonly failedSteps: number
  readonly interruptedSteps: number
  readonly notRunSteps: number
}

export type StepwiseReport = {
  readonly version: 1
  readonly run?: StepwiseRunMetadata
  readonly summary?: StepwiseReportSummary
  readonly scenarios: Record<string, {
    readonly modes: Record<string, {
      readonly attempts: readonly ScenarioResult[]
    }>
  }>
}

export type StepwiseReportIo = {
  mkdir(path: string): Promise<void>
  read(path: string): Promise<string>
  write(path: string, value: string): Promise<void>
  move(from: string, to: string): Promise<void>
}

export function createStepwiseReportStore(
  reportDir: string,
  io: StepwiseReportIo = nodeIo,
  metadata?: StepwiseRunMetadata,
) {
  const jsonPath = reportPath(reportDir, "report.json")
  const markdownPath = reportPath(reportDir, "report.md")
  let queue = Promise.resolve()
  return {
    jsonPath,
    markdownPath,
    record(result: ScenarioResult): Promise<void> {
      const operation = queue.then(async () => {
        await io.mkdir(reportDir)
        const report = await readReport(jsonPath, io)
        const scenario = report.scenarios[result.id] ?? { modes: {} }
        const mode = scenario.modes[result.mode] ?? { attempts: [] }
        const normalizedResult = normalizeResult(result, dirname(reportDir))
        const scenarios = {
          ...report.scenarios,
          [result.id]: {
            modes: {
              ...scenario.modes,
              [result.mode]: { attempts: [...mode.attempts, normalizedResult] },
            },
          },
        }
        const next: StepwiseReport = {
          version: 1,
          ...(metadata === undefined ? (report.run === undefined ? {} : { run: report.run }) : { run: metadata }),
          scenarios,
          summary: summarize(scenarios),
        }
        await publish(jsonPath, `${JSON.stringify(next, null, 2)}\n`, io)
        await publish(markdownPath, toMarkdown(next), io)
      })
      queue = operation.catch(() => undefined)
      return operation
    },
    async read(): Promise<StepwiseReport> {
      await queue
      return readReport(jsonPath, io)
    },
  }
}

async function readReport(path: string, io: StepwiseReportIo): Promise<StepwiseReport> {
  try {
    const parsed: unknown = JSON.parse(await io.read(path))
    if (!isReport(parsed)) throw new Error(`Неизвестный формат отчёта: ${path}`)
    return parsed
  } catch (caught) {
    if (caught instanceof Error && "code" in caught && caught.code === "ENOENT") {
      return { version: 1, scenarios: {} }
    }
    throw caught
  }
}

async function publish(path: string, contents: string, io: StepwiseReportIo): Promise<void> {
  const temporary = `${path}.tmp`
  await io.write(temporary, contents)
  await io.move(temporary, path)
}

function toMarkdown(report: StepwiseReport): string {
  const lines = ["# Пошаговый e2e 1С", ""]
  if (report.run !== undefined) {
    lines.push(
      `- Ревизия: ${report.run.sourceRevision}`,
      `- Сборка MCP: ${report.run.mcpBuildId}`,
      `- Платформа: ${report.run.platformVersion}`,
      `- Эталон: ${report.run.compatibilityHash}`,
      `- Параллельность: ${JSON.stringify(report.run.concurrency)}`,
      "",
    )
  }
  if (report.summary !== undefined) {
    lines.push(
      `Успешно шагов: ${report.summary.successfulSteps}; с ошибкой: ${report.summary.failedSteps}; ` +
      `прервано: ${report.summary.interruptedSteps}; не выполнено: ${report.summary.notRunSteps}.`,
      "",
    )
  }
  lines.push("| Сценарий | Режим | Попытка | Итог | Шаги | Время |", "|---|---|---:|---|---:|---:|")
  for (const [scenarioId, scenario] of Object.entries(report.scenarios)) {
    for (const [mode, data] of Object.entries(scenario.modes)) {
      for (const attempt of data.attempts) {
        lines.push(`| ${scenarioId} | ${mode} | ${attempt.attempt} | ${attempt.status} | ${attempt.completedSteps}/${attempt.totalSteps} | ${attempt.durationMs} мс |`)
        if (attempt.failure !== undefined) lines.push(`\n> ${attempt.failure.category}: ${attempt.failure.message}\n`)
      }
    }
  }
  return `${lines.join("\n")}\n`
}

function normalizeResult(result: ScenarioResult, runRoot: string): ScenarioResult {
  return {
    ...result,
    steps: result.steps.map((step) => ({
      ...step,
      attemptLogDir: normalizePath(step.attemptLogDir, runRoot),
    })),
  }
}

function normalizePath(path: string, runRoot: string): string {
  const value = isAbsolute(path) ? relative(runRoot, path) : path
  return value.replaceAll("\\", "/")
}

function summarize(scenarios: StepwiseReport["scenarios"]): StepwiseReportSummary {
  const summary = { successfulSteps: 0, failedSteps: 0, interruptedSteps: 0, notRunSteps: 0 }
  for (const scenario of Object.values(scenarios)) {
    for (const mode of Object.values(scenario.modes)) {
      const latest = mode.attempts.at(-1)
      if (latest === undefined) continue
      summary.successfulSteps += latest.completedSteps
      const remaining = Math.max(0, latest.totalSteps - latest.completedSteps)
      if (latest.status === "failed" && remaining > 0) summary.failedSteps += 1
      if (latest.status === "interrupted" && remaining > 0) summary.interruptedSteps += 1
      summary.notRunSteps += Math.max(0, remaining - (latest.status === "succeeded" ? 0 : 1))
    }
  }
  return summary
}

function isReport(value: unknown): value is StepwiseReport {
  return typeof value === "object" && value !== null &&
    Reflect.get(value, "version") === 1 &&
    typeof Reflect.get(value, "scenarios") === "object" && Reflect.get(value, "scenarios") !== null
}

function reportPath(directory: string, name: string): string {
  return `${directory.replace(/[\\/]$/u, "")}/${name}`
}

const nodeIo: StepwiseReportIo = {
  async mkdir(path) { await mkdir(path, { recursive: true }) },
  read: (path) => readFile(path, "utf8"),
  async write(path, value) { await writeFile(path, value, "utf8") },
  move: rename,
}

export function modeReport(
  report: StepwiseReport,
  scenario: string,
  mode: PlatformMode,
): readonly ScenarioResult[] {
  return report.scenarios[scenario]?.modes[mode]?.attempts ?? []
}
