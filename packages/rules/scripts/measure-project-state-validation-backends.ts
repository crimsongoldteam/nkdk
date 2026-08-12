#!/usr/bin/env node
import { execFile } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import {
  parsePositiveIntegerOption,
  parseProjectDirectoryArgument,
  requireProjectDirectory,
  runJsonMeasureCli,
} from "./measure-script-support"
import type {
  ProjectStateValidationRun,
  ProjectStateValidationWorkerOptions,
} from "./measure-project-state-validation-worker"
import type { ProjectStateBackendKind } from "./measure-project-state-backends"

export interface ProjectStateValidationMeasureOptions {
  readonly projectDir: string
  readonly runs: number
  readonly backends: readonly ProjectStateBackendKind[]
  readonly pageSize: number
}

export interface ProjectStateValidationSummary {
  readonly backend: ProjectStateBackendKind
  readonly runs: number
  readonly elapsedMedianMs: number
  readonly cpuMedianMicros: number
  readonly rssPeakMedianBytes: number
  readonly rssPeakMaximumBytes: number
  readonly diagnostics: number
  readonly diagnosticsDigest: string
  readonly nativeDiagnostics: number
  readonly deferredChecks: number
  readonly pages: number
  readonly maxNativeTemporaryBytes: number
}

const DEFAULT_VALIDATION_BACKENDS = ["typescript", "rust"] as const

type RunValidation = (
  options: ProjectStateValidationWorkerOptions,
) => Promise<ProjectStateValidationRun>

export function parseValidationMeasureArgs(
  argv: readonly string[],
): ProjectStateValidationMeasureOptions {
  let projectDir: string | undefined
  let runs = 5
  let pageSize = 2_000
  let backends: readonly ProjectStateBackendKind[] = DEFAULT_VALIDATION_BACKENDS
  for (let index = 0; index !== argv.length; index += 1) {
    const argument = argv[index]!
    if (argument === "--") continue
    if (argument === "--runs" || argument === "--page-size") {
      const value = Number(parsePositiveIntegerOption(argument, argv[++index]))
      if (argument === "--runs") runs = value
      else pageSize = value
      continue
    }
    if (argument === "--backends") {
      backends = parseBackends(argv[++index])
      continue
    }
    projectDir = parseProjectDirectoryArgument(projectDir, argument)
  }
  return { projectDir: requireProjectDirectory(projectDir), runs, backends, pageSize }
}

export async function measureProjectStateValidationBackends(
  options: ProjectStateValidationMeasureOptions,
  runValidation: RunValidation = runValidationProcess,
): Promise<readonly ProjectStateValidationRun[]> {
  const results: ProjectStateValidationRun[] = []
  for (const backend of options.backends) {
    for (let run = 1; run <= options.runs; run += 1) {
      results.push(await runValidation({
        projectDir: options.projectDir,
        backend,
        run,
        pageSize: options.pageSize,
      }))
    }
  }
  return results
}

export function summarizeValidationRuns(
  runs: readonly ProjectStateValidationRun[],
): readonly ProjectStateValidationSummary[] {
  const expected = runs[0]
  for (const run of runs) {
    if (
      expected !== undefined
      && (run.diagnosticsDigest !== expected.diagnosticsDigest || run.diagnostics !== expected.diagnostics)
    ) {
      throw new Error("Реализации вернули разные наборы диагностик")
    }
  }
  return (["typescript", "rust"] as const).flatMap((backend) => {
    const selected = runs.filter((run) => run.backend === backend)
    if (selected.length === 0) return []
    const representative = selected[0]!
    return [{
      backend,
      runs: selected.length,
      elapsedMedianMs: median(selected.map(({ elapsedMs }) => elapsedMs)),
      cpuMedianMicros: median(selected.map(({ cpuUserMicros, cpuSystemMicros }) =>
        cpuUserMicros + cpuSystemMicros)),
      rssPeakMedianBytes: median(selected.map(({ rssPeakBytes }) => rssPeakBytes)),
      rssPeakMaximumBytes: Math.max(...selected.map(({ rssPeakBytes }) => rssPeakBytes)),
      diagnostics: representative.diagnostics,
      diagnosticsDigest: representative.diagnosticsDigest,
      nativeDiagnostics: representative.nativeDiagnostics,
      deferredChecks: representative.deferredChecks,
      pages: representative.pages,
      maxNativeTemporaryBytes: representative.maxNativeTemporaryBytes,
    }]
  })
}

function parseBackends(value: string | undefined): readonly ProjectStateBackendKind[] {
  if (value === "both" || value === "typescript,rust") return ["typescript", "rust"]
  if (value === "typescript" || value === "rust") return [value]
  throw new Error("--backends должен быть typescript, rust или typescript,rust")
}

function median(values: readonly number[]): number {
  if (values.length === 0) throw new Error("Нельзя вычислить медиану пустого набора")
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!
}

const executeFile = promisify(execFile)

async function runValidationProcess(
  options: ProjectStateValidationWorkerOptions,
): Promise<ProjectStateValidationRun> {
  const worker = join(
    dirname(fileURLToPath(import.meta.url)),
    "measure-project-state-validation-worker.ts",
  )
  const { stdout } = await executeFile(process.execPath, [
    "--import", "tsx", worker,
    options.projectDir,
    "--backend", options.backend,
    "--run", String(options.run),
    "--page-size", String(options.pageSize),
  ], { maxBuffer: 10 * 1024 * 1024 })
  return JSON.parse(stdout) as ProjectStateValidationRun
}

await runJsonMeasureCli(import.meta.url, async () => {
  const options = parseValidationMeasureArgs(process.argv.slice(2))
  const runs = await measureProjectStateValidationBackends(options)
  return { options, runs, summaries: summarizeValidationRuns(runs) }
}, { pretty: true })
