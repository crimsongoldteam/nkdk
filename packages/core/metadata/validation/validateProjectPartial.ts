import { existsSync } from "node:fs"
import { resolve } from "node:path"
import type { ConfigurationContext } from "../context/types"
import { getProjectReferenceObjectPathContributor } from "./projectReferenceIndexRegistry"
import { ProjectFileSchemaError } from "./projectFileSchema"
import { resolveValidationProjectFile, type ValidationProjectFile } from "./projectFiles"
import { createProjectYamlCacheFromEntries, type ProjectYamlEntry } from "./projectYamlCache"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import {
  createValidationSchemaCache,
  readProjectYamlDiagnostic,
  readProjectYamlEntryForValidation,
  validateProjectFileFirstPass,
  validateProjectFileSecondPass,
  type ProjectValidationFileState,
} from "./projectValidationPasses"
import { createValidationYamlQueue } from "./projectValidationQueue"
import { createValidationRulesSnapshot, type ValidationRulesSnapshot } from "./rulesSnapshot"
import type { Diagnostic } from "./types"
import { createValidationSnapshotProvider } from "./validationSnapshotProvider"

const expectedPatterns =
  "Ожидались Конфигурация.yaml или пути вида <Вид>/<Имя>/Свойства.yaml и <Вид>/<Имя>/Формы/<Форма>/Форма.yaml"

export async function validateProjectPartial(params: {
  projectDir: string
  filePath: string
  context: ConfigurationContext
}): Promise<{ diagnostics: Diagnostic[] }> {
  const projectDir = resolve(params.projectDir)
  const schemaCache = createValidationSchemaCache(params.context)
  const rulesSnapshot = createValidationRulesSnapshot(params.context)
  const queue = createValidationYamlQueue({
    mode: "partial",
    initialFiles: [resolveSingleProjectFile(projectDir, params.filePath)],
  })
  const objectTable = createValidationObjectTable()
  const entries = new Map<string, ProjectYamlEntry>()
  const states = new Map<string, ProjectValidationFileState>()
  const diagnostics: Diagnostic[] = []

  processPendingFirstPasses({
    projectDir,
    context: params.context,
    schemaCache,
    rulesSnapshot,
    queue,
    entries,
    states,
    objectTable,
    diagnostics,
  })

  const secondPassPending = new Set(states.keys())
  while (secondPassPending.size > 0) {
    let enqueuedDependency = false
    for (const stateKey of [...secondPassPending]) {
      const state = states.get(stateKey)
      if (state === undefined) {
        secondPassPending.delete(stateKey)
        continue
      }

      const cache = createProjectYamlCacheFromEntries([...entries.values()])
      const objectTableSnapshot = objectTable.snapshot()
      const provider = createValidationSnapshotProvider(objectTableSnapshot)
      const ownerCache = provider.ownerCache(projectDir)
      const referenceIndex = provider.referenceIndex({
        projectDir,
        mode: queue.mode,
        resolveObjectFilePath: (target) => resolveObjectFilePath({ projectDir, target }),
        resolveProjectFile: (target) => resolveProjectFileDependency({ projectDir, target }),
      })
      const second = validateProjectFileSecondPass({
        projectDir,
        state,
        cache,
        context: params.context,
        ownerCache,
        referenceIndex,
        skipMetadataTargetValidation: false,
      })

      if (second.status === "needsDependency" && queue.enqueueDependency(second.dependency.file) === "enqueued") {
        enqueuedDependency = true
        break
      }

      diagnostics.push(...second.diagnostics)
      secondPassPending.delete(stateKey)
    }

    if (enqueuedDependency) {
      processPendingFirstPasses({
        projectDir,
        context: params.context,
        schemaCache,
        rulesSnapshot,
        queue,
        entries,
        states,
        objectTable,
        diagnostics,
      })
      for (const stateKey of states.keys()) secondPassPending.add(stateKey)
    }
  }

  return { diagnostics: sortDiagnostics(dedupeDiagnostics(diagnostics)) }
}

function processPendingFirstPasses(params: {
  projectDir: string
  context: ConfigurationContext
  schemaCache: ReturnType<typeof createValidationSchemaCache>
  rulesSnapshot: ValidationRulesSnapshot
  queue: ReturnType<typeof createValidationYamlQueue>
  entries: Map<string, ProjectYamlEntry>
  states: Map<string, ProjectValidationFileState>
  objectTable: ReturnType<typeof createValidationObjectTable>
  diagnostics: Diagnostic[]
}): void {
  while (params.queue.hasPending()) {
    const batch = params.queue.takePending(64)
    for (const file of batch) {
      params.queue.markRunning(file.absolutePath)
      const entry = readProjectYamlEntryForValidation(file.absolutePath)
      if ("error" in entry) {
        params.queue.markError(file.absolutePath)
        params.diagnostics.push(readProjectYamlDiagnostic(entry))
        continue
      }

      const entryKey = resolve(entry.filePath)
      params.entries.set(entryKey, entry)
      const cache = createProjectYamlCacheFromEntries([...params.entries.values()])
      const first = validateProjectFileFirstPass({
        projectDir: params.projectDir,
        file,
        cache,
        context: params.context,
        schemaCache: params.schemaCache,
        rulesSnapshot: params.rulesSnapshot,
      })
      params.states.set(resolve(file.absolutePath), first.state)
      params.objectTable.mergeRecords(first.objectRecords)
      params.objectTable.mergeReferenceIndexEntries(first)
      params.diagnostics.push(...first.diagnostics)
      params.queue.markReady(file.absolutePath)
    }
  }
}

function resolveSingleProjectFile(projectDir: string, filePath: string): ValidationProjectFile {
  const file = resolveValidationProjectFile(projectDir, filePath)
  if (file) return file

  throw new ProjectFileSchemaError(expectedPatterns)
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

function resolveProjectFileDependency(params: {
  projectDir: string
  target: Parameters<NonNullable<ReturnType<typeof getProjectReferenceObjectPathContributor>>>[0]["target"]
}) {
  const filePath = resolveObjectFilePath(params)
  if (filePath === undefined || !existsSync(filePath)) return undefined
  const file = resolveValidationProjectFile(params.projectDir, filePath)
  if (file === undefined) return undefined
  return { kind: "needsDependency" as const, file, requestedBy: filePath }
}

function resolveObjectFilePath(params: {
  projectDir: string
  target: Parameters<NonNullable<ReturnType<typeof getProjectReferenceObjectPathContributor>>>[0]["target"]
}): string | undefined {
  const contributor = getProjectReferenceObjectPathContributor(params.target.root)
  return contributor?.({ projectDir: params.projectDir, target: params.target })?.filePath
}
