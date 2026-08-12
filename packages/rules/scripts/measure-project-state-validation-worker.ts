#!/usr/bin/env node
import { createHash } from "node:crypto"
import { createBinaryProjectStateStore } from "../metadata/projectState/binary/store"
import { loadBinaryProjectState } from "../metadata/projectState/binary/persistence"
import { createRustProjectStateStore, readLastRustProjectStateValidationStats } from "../metadata/projectState/rust/store"
import { createProjectStateDependencyValidator } from "../metadata/validation/projectStateDependencyValidation"
import type { ProjectStateStore } from "../metadata/projectState/store"
import {
  parsePositiveIntegerOption,
  parseProjectDirectoryArgument,
  requireProjectDirectory,
  runJsonMeasureCli,
} from "./measure-script-support"
import type { ProjectStateBackendKind } from "./measure-project-state-backends"

export interface ProjectStateValidationWorkerOptions {
  readonly projectDir: string
  readonly backend: ProjectStateBackendKind
  readonly run: number
  readonly pageSize: number
}

export interface ProjectStateValidationRun {
  readonly backend: ProjectStateBackendKind
  readonly run: number
  readonly elapsedMs: number
  readonly cpuUserMicros: number
  readonly cpuSystemMicros: number
  readonly rssPeakBytes: number
  readonly heapUsedBytes: number
  readonly externalBytes: number
  readonly arrayBuffersBytes: number
  readonly snapshotBytes: number
  readonly diagnosticsDigest: string
  readonly diagnostics: number
  readonly nativeDiagnostics: number
  readonly deferredChecks: number
  readonly pages: number
  readonly maxNativeTemporaryBytes: number
}

export function parseValidationWorkerArgs(
  argv: readonly string[],
): ProjectStateValidationWorkerOptions {
  let projectDir: string | undefined
  let backend: ProjectStateBackendKind | undefined
  let run = 1
  let pageSize = 2_000
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!
    if (argument === "--") continue
    if (argument === "--backend") {
      backend = parseBackend(argv[++index])
      continue
    }
    if (argument === "--run" || argument === "--page-size") {
      const value = Number(parsePositiveIntegerOption(argument, argv[++index]))
      if (argument === "--run") run = value
      else pageSize = value
      continue
    }
    projectDir = parseProjectDirectoryArgument(projectDir, argument)
  }
  if (backend === undefined) throw new Error("Не указан --backend")
  return { projectDir: requireProjectDirectory(projectDir), backend, run, pageSize }
}

function parseBackend(value: string | undefined): ProjectStateBackendKind {
  if (value === "typescript" || value === "rust") return value
  throw new Error("--backend должен быть typescript или rust")
}

export async function measureProjectStateValidation(
  options: ProjectStateValidationWorkerOptions,
): Promise<ProjectStateValidationRun> {
  const initial = await loadBinaryProjectState(options.projectDir)
  if (initial === undefined) throw new Error("Двоичное состояние проекта не найдено")
  const dependencyValidator = createProjectStateDependencyValidator()
  const store: ProjectStateStore = options.backend === "rust"
    ? createRustProjectStateStore({
        initial,
        projectDir: options.projectDir,
        dependencyValidator,
        validationPageSize: options.pageSize,
      })
    : createBinaryProjectStateStore({
        initial,
        projectDir: options.projectDir,
        dependencyValidator,
      }).store
  try {
    const validate = store.validateDependencyDiagnosticBatches
    if (validate === undefined) throw new Error("Хранилище не поддерживает пакетную проверку")
    const cpuBefore = process.cpuUsage()
    const startedAt = performance.now()
    const batches = validate.call(store, { requests: [] })
    const elapsedMs = performance.now() - startedAt
    const cpuAfter = process.cpuUsage()
    const hash = createHash("sha256")
    let diagnostics = 0
    for (const batch of batches) {
      for (let index = 0; index < batch.count; index += 1) {
        hash.update(JSON.stringify(batch.diagnostic(index)))
        hash.update("\n")
        diagnostics += 1
      }
    }
    const memory = process.memoryUsage()
    const native = options.backend === "rust" ? readLastRustProjectStateValidationStats() : undefined
    return {
      backend: options.backend,
      run: options.run,
      elapsedMs,
      cpuUserMicros: cpuAfter.user - cpuBefore.user,
      cpuSystemMicros: cpuAfter.system - cpuBefore.system,
      rssPeakBytes: process.resourceUsage().maxRSS * 1024,
      heapUsedBytes: memory.heapUsed,
      externalBytes: memory.external,
      arrayBuffersBytes: memory.arrayBuffers,
      snapshotBytes: Object.values(initial).reduce((sum, buffer) => sum + buffer.byteLength, 0),
      diagnosticsDigest: hash.digest("hex"),
      diagnostics,
      nativeDiagnostics: native?.nativeDiagnostics ?? 0,
      deferredChecks: native?.deferredRows ?? 0,
      pages: native?.pages ?? 1,
      maxNativeTemporaryBytes: native?.maxNativeTemporaryBytes ?? 0,
    }
  } finally {
    store.close()
  }
}

await runJsonMeasureCli(import.meta.url, () => measureProjectStateValidation(
  parseValidationWorkerArgs(process.argv.slice(2)),
), { errorAsJson: true })
