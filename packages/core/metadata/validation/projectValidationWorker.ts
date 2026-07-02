import { performance } from "node:perf_hooks"
import { parentPort } from "node:worker_threads"
import { resolve } from "path"
import type { ConfigurationContext } from "../context/types"
import { registerCoreMetadata } from "../register"
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import { createProjectMetadataResolverFromValidationTable } from "./projectMetadataResolver"
import { resolveValidationProjectFile } from "./projectFiles"
import {
  createProjectYamlCache,
  createProjectYamlCacheFromEntries,
  type ProjectYamlCache,
  type ProjectYamlEntry,
} from "./projectYamlCache"
import {
  createValidationSchemaCache,
  readProjectYamlDiagnostic,
  readProjectYamlEntryForValidation,
  validateProjectFileFirstPass,
  validateProjectFileSecondPass,
  type ProjectValidationFileState,
} from "./projectValidationPasses"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import type { ValidationMode, ValidationObjectRecord, ValidationObjectTableSnapshot } from "./projectValidationTypes"
import type { Diagnostic } from "./types"

registerCoreMetadata()

type ValidationWorkerMessage =
  | {
      id: number
      kind: "firstPass"
      projectDir: string
      context: ConfigurationContext
      filePaths: string[]
    }
  | {
      id: number
      kind: "secondPass"
      projectDir: string
      context: ConfigurationContext
      mode: ValidationMode
      objectTable: ValidationObjectTableSnapshot
      filePaths: string[]
    }

interface WorkerValidationState {
  entries: Map<string, ProjectYamlEntry>
  states: Map<string, ProjectValidationFileState>
  localTable: ReturnType<typeof createValidationObjectTable>
}

let workerState = createEmptyWorkerValidationState()

function createEmptyWorkerValidationState(): WorkerValidationState {
  return {
    entries: new Map(),
    states: new Map(),
    localTable: createValidationObjectTable(),
  }
}

parentPort?.on("message", (message: ValidationWorkerMessage) => {
  try {
    if (message.kind === "firstPass") {
      parentPort?.postMessage({ id: message.id, kind: "firstPassResult", ...runFirstPass(message) })
      return
    }

    parentPort?.postMessage({ id: message.id, kind: "secondPassResult", ...runSecondPass(message) })
  } catch (caught) {
    parentPort?.postMessage({
      id: message.id,
      kind: "error",
      message: caught instanceof Error ? caught.message : String(caught),
    })
  }
})

function runFirstPass(message: Extract<ValidationWorkerMessage, { kind: "firstPass" }>): {
  diagnostics: Diagnostic[]
  objectRecords: ValidationObjectRecord[]
} {
  workerState = createEmptyWorkerValidationState()
  const diagnostics: Diagnostic[] = []
  const objectRecords: ValidationObjectRecord[] = []
  const schemaCache = createValidationSchemaCache(message.context)

  for (const filePath of message.filePaths) {
    const file = resolveValidationProjectFile(message.projectDir, filePath)
    if (file === undefined) {
      diagnostics.push(unrecognizedFileDiagnostic(filePath))
      continue
    }

    const entry = readProjectYamlEntryForValidation(file.absolutePath)
    if ("error" in entry) {
      diagnostics.push(readProjectYamlDiagnostic(entry))
      continue
    }

    workerState.entries.set(resolve(entry.filePath), entry)
    const cache = createProjectYamlCacheFromEntries([entry])
    const first = validateProjectFileFirstPass({
      projectDir: message.projectDir,
      file,
      cache,
      context: message.context,
      schemaCache,
    })
    workerState.states.set(resolve(file.absolutePath), first.state)
    workerState.localTable.mergeRecords(first.objectRecords)
    diagnostics.push(...first.diagnostics)
    objectRecords.push(...first.objectRecords)
  }

  return { diagnostics, objectRecords }
}

function runSecondPass(message: Extract<ValidationWorkerMessage, { kind: "secondPass" }>): {
  diagnostics: Diagnostic[]
  timing: {
    contextMs: number
    validationMs: number
    fileCount: number
    supplementRecords: number
    supplementFilePaths: number
  }
} {
  const contextStartedAt = performance.now()
  const diagnostics: Diagnostic[] = []
  const localSnapshot = workerState.localTable.snapshot()
  const supplementedTable = createValidationObjectTable({
    records: [...localSnapshot.records, ...message.objectTable.records],
    filePaths: [...localSnapshot.filePaths, ...message.objectTable.filePaths],
  })
  const cache = createWorkerYamlCache()
  const ownerCache = createOwnerMetadataCacheFromValidationTable({ projectDir: message.projectDir, table: supplementedTable })
  const metadataResolver = createProjectMetadataResolverFromValidationTable({
    projectDir: message.projectDir,
    table: supplementedTable,
    mode: message.mode,
    ownerCache,
    yamlCache: cache,
  })
  const validationStartedAt = performance.now()

  for (const filePath of message.filePaths) {
    const state = workerState.states.get(resolve(filePath))
    if (state === undefined) continue
    const second = validateProjectFileSecondPass({
      projectDir: message.projectDir,
      state,
      cache,
      context: message.context,
      ownerCache,
      metadataResolver,
    })
    diagnostics.push(...second.diagnostics)
  }

  return {
    diagnostics,
    timing: {
      contextMs: validationStartedAt - contextStartedAt,
      validationMs: performance.now() - validationStartedAt,
      fileCount: message.filePaths.length,
      supplementRecords: message.objectTable.records.length,
      supplementFilePaths: message.objectTable.filePaths.length,
    },
  }
}

function createWorkerYamlCache(): ProjectYamlCache {
  const local = createProjectYamlCacheFromEntries([...workerState.entries.values()])
  const fallback = createProjectYamlCache()

  return {
    get(filePath) {
      const entry = local.get(filePath)
      if (!("error" in entry) || !entry.error.message.startsWith("YAML-файл отсутствует в validation snapshot")) {
        return entry
      }
      return fallback.get(filePath)
    },
    release(filePath) {
      local.release(filePath)
      fallback.release(filePath)
    },
  }
}

function unrecognizedFileDiagnostic(filePath: string): Diagnostic {
  return {
    filePath,
    line: 1,
    col: 1,
    severity: "error",
    source: "external-file",
    message: "Не удалось распознать YAML-файл для validation",
  }
}
