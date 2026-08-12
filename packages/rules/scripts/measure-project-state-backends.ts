#!/usr/bin/env node
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  parsePositiveIntegerOption,
  parseProjectDirectoryArgument,
  requireProjectDirectory,
  runJsonMeasureCli,
} from "./measure-script-support"
import type {
  ProjectStateBackendRun,
  ProjectStateBackendWorkerOptions,
} from "./measure-project-state-backend-worker"

export type ProjectStateBackendKind = "typescript" | "rust"
export type ProjectStateQueryPattern = "repeated" | "unique"

export interface ProjectStateBackendMeasureOptions {
  readonly projectDir: string
  readonly runs: number
  readonly concurrency: number
  readonly backends: readonly ProjectStateBackendKind[]
  readonly lookups: number
  readonly queryPattern: ProjectStateQueryPattern
}

export interface RustExperimentMeasurements {
  readonly typescript: { readonly rssPeak: number; readonly targetMs: number; readonly unchangedMs: number }
  readonly rust: { readonly rssPeak: number; readonly targetMs: number; readonly unchangedMs: number }
}

export function evaluateRustExperiment(input: RustExperimentMeasurements) {
  const rssPassed = input.rust.rssPeak <= input.typescript.rssPeak * 0.75
  const targetTimePassed = input.rust.targetMs <= input.typescript.targetMs * 0.8
  const unchangedPassed = input.rust.unchangedMs <= input.typescript.unchangedMs * 1.05
  return {
    rssPassed,
    targetTimePassed,
    unchangedPassed,
    passed: rssPassed && targetTimePassed && unchangedPassed,
  }
}

type RunProjectStateBackend = (
  options: ProjectStateBackendWorkerOptions,
) => Promise<ProjectStateBackendRun>

export function parseProjectStateBackendMeasureArgs(
  argv: readonly string[],
): ProjectStateBackendMeasureOptions {
  let projectDir: string | undefined
  let runs = 5
  let concurrency = 4
  let lookups = 1_000_000
  let queryPattern: ProjectStateQueryPattern = "repeated"
  let backends: readonly ProjectStateBackendKind[] = ["typescript", "rust"]

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!
    if (argument === "--") continue
    if (argument === "--runs" || argument === "--concurrency" || argument === "--lookups") {
      const value = parsePositiveIntegerOption(argument, argv[++index])
      if (argument === "--runs") runs = Number(value)
      else if (argument === "--concurrency") concurrency = Number(value)
      else lookups = Number(value)
      continue
    }
    if (argument === "--backends") {
      const value = argv[++index]
      if (value === "typescript" || value === "rust") backends = [value]
      else if (value === "both") backends = ["typescript", "rust"]
      else throw new Error("--backends должен быть typescript, rust или both")
      continue
    }
    if (argument === "--query-pattern") {
      queryPattern = parseProjectStateQueryPattern(argv[++index])
      continue
    }
    projectDir = parseProjectDirectoryArgument(projectDir, argument)
  }

  projectDir = requireProjectDirectory(projectDir)
  return { projectDir, runs, concurrency, backends, lookups, queryPattern }
}

export function parseProjectStateQueryPattern(value: string | undefined): ProjectStateQueryPattern {
  if (value === "repeated" || value === "unique") return value
  throw new Error("--query-pattern должен быть repeated или unique")
}

export function buildBackendProcessEnv(
  backend: ProjectStateBackendKind,
  base: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  return {
    ...base,
    NKDK_PROJECT_STATE_BACKEND: backend,
    NKDK_PROFILE: "1",
  }
}

export async function measureProjectStateBackends(
  options: ProjectStateBackendMeasureOptions,
  runBackend: RunProjectStateBackend = runBackendProcess,
): Promise<readonly ProjectStateBackendRun[]> {
  const results: ProjectStateBackendRun[] = []
  for (const backend of options.backends) {
    for (let run = 1; run <= options.runs; run += 1) {
      results.push(await runBackend({
        projectDir: options.projectDir,
        backend,
        run,
        lookups: options.lookups,
        workers: options.concurrency,
        queryPattern: options.queryPattern,
      }))
    }
  }
  return results
}

const executeFile = promisify(execFile)

async function runBackendProcess(
  options: ProjectStateBackendWorkerOptions,
): Promise<ProjectStateBackendRun> {
  const worker = join(dirname(fileURLToPath(import.meta.url)), "measure-project-state-backend-worker.ts")
  const { stdout } = await executeFile(process.execPath, [
    "--import", "tsx",
    worker,
    options.projectDir,
    "--backend", options.backend,
    "--run", String(options.run),
    "--lookups", String(options.lookups),
    "--workers", String(options.workers),
    "--query-pattern", options.queryPattern,
  ], {
    env: buildBackendProcessEnv(options.backend),
    maxBuffer: 10 * 1024 * 1024,
  })
  return JSON.parse(stdout) as ProjectStateBackendRun
}

await runJsonMeasureCli(import.meta.url, async () => ({
  runs: await measureProjectStateBackends(
    parseProjectStateBackendMeasureArgs(process.argv.slice(2)),
  ),
}), { pretty: true })
