#!/usr/bin/env node
import { createHash } from "node:crypto"
import { createBinaryProjectStateStore } from "../metadata/projectState/binary/store"
import { loadBinaryProjectState } from "../metadata/projectState/binary/persistence"
import { createProjectStateDependencyValidator } from "../metadata/validation/projectStateDependencyValidation"
import { measureBinaryProjectState } from "./measure-binary-project-state"
import {
  parsePositiveIntegerOption,
  parseProjectDirectoryArgument,
  requireProjectDirectory,
  runJsonMeasureCli,
} from "./measure-script-support"
import type { ProjectStateBackendKind } from "./measure-project-state-backends"

export interface ProjectStateBackendWorkerOptions {
  readonly projectDir: string
  readonly backend: ProjectStateBackendKind
  readonly run: number
  readonly lookups: number
  readonly workers: number
}

export interface ProjectStateBackendRun {
  readonly backend: ProjectStateBackendKind
  readonly run: number
  readonly elapsedMs: number
  readonly cpuUserMicros: number
  readonly cpuSystemMicros: number
  readonly rssPeakBytes: number
  readonly heapUsedPeakBytes: number
  readonly externalPeakBytes: number
  readonly arrayBuffersPeakBytes: number
  readonly snapshotBytes: number
  readonly diagnosticsDigest: string
  readonly found: number
  readonly missing: number
}

interface ProjectStateBackendMeasureDependencies {
  readonly now: () => number
  readonly cpuUsage: () => NodeJS.CpuUsage
  readonly memoryUsage: () => NodeJS.MemoryUsage
  readonly measure: typeof measureBinaryProjectState
  readonly diagnosticsDigest: (projectDir: string) => Promise<string>
}

export interface MemoryPeakTracker {
  observe(memory: NodeJS.MemoryUsage): void
  peak(): NodeJS.MemoryUsage
}

export class ProjectStateBackendUnavailableError extends Error {
  readonly code = "RUST_BACKEND_UNAVAILABLE"

  constructor() {
    super("Rust ProjectState backend недоступен")
    this.name = "ProjectStateBackendUnavailableError"
  }
}

export function parseProjectStateBackendWorkerArgs(
  argv: readonly string[],
): ProjectStateBackendWorkerOptions {
  let projectDir: string | undefined
  let backend: ProjectStateBackendKind | undefined
  let run = 1
  let lookups = 1_000_000
  let workers = 4

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!
    if (argument === "--") continue
    if (argument === "--backend") {
      const value = argv[++index]
      if (value !== "typescript" && value !== "rust") {
        throw new Error("--backend должен быть typescript или rust")
      }
      backend = value
      continue
    }
    if (argument === "--run" || argument === "--lookups" || argument === "--workers") {
      const value = parsePositiveIntegerOption(argument, argv[++index])
      if (argument === "--run") run = Number(value)
      else if (argument === "--lookups") lookups = Number(value)
      else workers = Number(value)
      continue
    }
    projectDir = parseProjectDirectoryArgument(projectDir, argument)
  }

  projectDir = requireProjectDirectory(projectDir)
  if (backend === undefined) throw new Error("Не указан --backend")
  return { projectDir, backend, run, lookups, workers }
}

export function assertProjectStateBackendAvailable(
  backend: ProjectStateBackendKind,
  rustAvailable: boolean,
): void {
  if (backend === "rust" && !rustAvailable) throw new ProjectStateBackendUnavailableError()
}

export async function measureProjectStateBackend(
  options: ProjectStateBackendWorkerOptions,
  dependencies: ProjectStateBackendMeasureDependencies = defaultDependencies,
): Promise<ProjectStateBackendRun> {
  assertProjectStateBackendAvailable(options.backend, true)
  const startedAt = dependencies.now()
  const cpuBefore = dependencies.cpuUsage()
  const memoryTracker = createMemoryPeakTracker(dependencies.memoryUsage())
  const memoryTimer = setInterval(() => memoryTracker.observe(dependencies.memoryUsage()), 25)
  let measurement: Awaited<ReturnType<typeof measureBinaryProjectState>>
  try {
    measurement = await dependencies.measure({
      projectDir: options.projectDir,
      lookups: options.lookups,
      workers: options.workers,
    })
  } finally {
    clearInterval(memoryTimer)
    memoryTracker.observe(dependencies.memoryUsage())
  }
  const cpuAfter = dependencies.cpuUsage()
  const memory = memoryTracker.peak()

  return {
    backend: options.backend,
    run: options.run,
    elapsedMs: dependencies.now() - startedAt,
    cpuUserMicros: cpuAfter.user - cpuBefore.user,
    cpuSystemMicros: cpuAfter.system - cpuBefore.system,
    rssPeakBytes: Math.max(memory.rss, measurement.rssMiB * 1024 * 1024),
    heapUsedPeakBytes: memory.heapUsed,
    externalPeakBytes: memory.external,
    arrayBuffersPeakBytes: memory.arrayBuffers,
    snapshotBytes: measurement.fileBytes,
    diagnosticsDigest: await dependencies.diagnosticsDigest(options.projectDir),
    found: measurement.results.found,
    missing: measurement.results.missing,
  }
}

export function createMemoryPeakTracker(initial: NodeJS.MemoryUsage): MemoryPeakTracker {
  const maximum = { ...initial }
  return {
    observe(memory) {
      maximum.rss = Math.max(maximum.rss, memory.rss)
      maximum.heapTotal = Math.max(maximum.heapTotal, memory.heapTotal)
      maximum.heapUsed = Math.max(maximum.heapUsed, memory.heapUsed)
      maximum.external = Math.max(maximum.external, memory.external)
      maximum.arrayBuffers = Math.max(maximum.arrayBuffers, memory.arrayBuffers)
    },
    peak: () => ({ ...maximum }),
  }
}

const defaultDependencies: ProjectStateBackendMeasureDependencies = {
  now: () => performance.now(),
  cpuUsage: () => process.cpuUsage(),
  memoryUsage: () => process.memoryUsage(),
  measure: measureBinaryProjectState,
  diagnosticsDigest: readDiagnosticsDigest,
}

async function readDiagnosticsDigest(projectDir: string): Promise<string> {
  const initial = await loadBinaryProjectState(projectDir)
  if (initial === undefined) throw new Error("Двоичное состояние проекта не найдено")
  const { store } = createBinaryProjectStateStore({
    initial,
    projectDir,
    dependencyValidator: createProjectStateDependencyValidator(),
  })
  try {
    return createHash("sha256")
      .update(JSON.stringify(store.readLocalDiagnostics({ mode: "published" })))
      .digest("hex")
  } finally {
    store.close()
  }
}

await runJsonMeasureCli(import.meta.url, () => measureProjectStateBackend(
  parseProjectStateBackendWorkerArgs(process.argv.slice(2)),
), { errorAsJson: true })
