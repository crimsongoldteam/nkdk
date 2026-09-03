import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import type { PlatformMode } from "./concurrency"
import type { ScenarioResult } from "./stepwise-scenario"

export type StepwiseReport = {
  readonly version: 1
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
        const next: StepwiseReport = {
          version: 1,
          scenarios: {
            ...report.scenarios,
            [result.id]: {
              modes: {
                ...scenario.modes,
                [result.mode]: { attempts: [...mode.attempts, result] },
              },
            },
          },
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
  const lines = ["# Пошаговый e2e 1С", "", "| Сценарий | Режим | Попытка | Итог | Шаги | Время |", "|---|---|---:|---|---:|---:|"]
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
