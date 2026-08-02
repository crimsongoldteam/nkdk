import type { ProjectStateCompatibility } from "./compatibility"
import type { Diagnostic } from "../validation/types"
import { assertProjectStateFileHashBatch, type ProjectStateFileHashBatch, type ProjectStateReadToken } from "./contracts"
import {
  assertProjectStateFileUpdateBatch,
  type ProjectStateFileIdentity,
  type ProjectStateFileUpdateBatch,
} from "./fileUpdate"
import type { ProjectStateComponentProjection, ProjectStateFileChanges } from "./store"
import {
  assertProjectStateImportFinalFileStateBatch,
  type ProjectStateImportFinalFileStateBatch,
  type ProjectStateImportIndexContribution,
} from "./importSession"

export type ProjectStateWriterCommand =
  | { readonly kind: "openProject"; readonly requestId: string; readonly projectDir: string; readonly compatibility: ProjectStateCompatibility }
  | { readonly kind: "compareFiles"; readonly requestId: string; readonly batch: ProjectStateFileHashBatch }
  | { readonly kind: "readLocalDiagnostics"; readonly requestId: string }
  | { readonly kind: "validateDependencies"; readonly requestId: string; readonly operationId: string }
  | { readonly kind: "createReadToken"; readonly requestId: string }
  | { readonly kind: "readComponentProjection"; readonly requestId: string; readonly componentPath: string }
  | { readonly kind: "beginUpdate"; readonly requestId: string; readonly operationId: string }
  | { readonly kind: "writeBatch"; readonly requestId: string; readonly operationId: string; readonly batch: ProjectStateFileUpdateBatch }
  | { readonly kind: "writeImportIndexBatch"; readonly requestId: string; readonly operationId: string; readonly batch: readonly ProjectStateImportIndexContribution[] }
  | { readonly kind: "registerImportFileIdentities"; readonly requestId: string; readonly operationId: string; readonly files: readonly ProjectStateFileIdentity[] }
  | { readonly kind: "writeImportFinalFileState"; readonly requestId: string; readonly operationId: string; readonly batch: ProjectStateImportFinalFileStateBatch }
  | { readonly kind: "clearImportOutput"; readonly requestId: string; readonly operationId: string; readonly componentPaths: readonly string[] }
  | { readonly kind: "deleteFiles"; readonly requestId: string; readonly operationId: string; readonly projectPaths: readonly string[] }
  | { readonly kind: "commitUpdate"; readonly requestId: string; readonly operationId: string }
  | { readonly kind: "rollbackUpdate"; readonly requestId: string; readonly operationId: string }
  | { readonly kind: "checkpoint"; readonly requestId: string }
  | { readonly kind: "cancelOperation"; readonly requestId: string; readonly operationId: string }
  | { readonly kind: "reset"; readonly requestId: string; readonly projectDir: string }
  | { readonly kind: "close"; readonly requestId: string }

export type ProjectStateWriterAcknowledgement =
  | { readonly kind: "opened" }
  | { readonly kind: "filesCompared"; readonly changes: ProjectStateFileChanges }
  | { readonly kind: "localDiagnostics"; readonly diagnostics: readonly Diagnostic[] }
  | { readonly kind: "dependencyDiagnostics"; readonly diagnostics: readonly Diagnostic[]; readonly operationId: string }
  | { readonly kind: "readToken"; readonly token: ProjectStateReadToken }
  | { readonly kind: "componentProjection"; readonly projection: ProjectStateComponentProjection }
  | { readonly kind: "updateBegun"; readonly operationId: string }
  | { readonly kind: "batchWritten"; readonly operationId: string }
  | { readonly kind: "importIndexBatchWritten"; readonly operationId: string }
  | { readonly kind: "importFileIdentitiesRegistered"; readonly operationId: string }
  | { readonly kind: "importFinalFileStateWritten"; readonly operationId: string }
  | { readonly kind: "importOutputCleared"; readonly operationId: string }
  | { readonly kind: "filesDeleted"; readonly operationId: string }
  | { readonly kind: "updateCommitted"; readonly operationId: string }
  | { readonly kind: "updateRolledBack"; readonly operationId: string }
  | { readonly kind: "checkpointed"; readonly snapshotPath: string }
  | { readonly kind: "operationCancelled"; readonly operationId: string }
  | { readonly kind: "reset" }
  | { readonly kind: "closed" }

export type ProjectStateWriterResponse =
  | { readonly kind: "ack"; readonly requestId: string; readonly result: ProjectStateWriterAcknowledgement }
  | { readonly kind: "failed"; readonly requestId: string; readonly error: { readonly name: string; readonly message: string } }

type TransferableProjectStateFileUpdateBatch = ProjectStateFileUpdateBatch & {
  readonly hashBytes: Uint8Array<ArrayBuffer>
}

export function assertProjectStateWriterBatch(
  value: unknown,
): asserts value is TransferableProjectStateFileUpdateBatch {
  assertProjectStateFileUpdateBatch(value)
  if (!(value.hashBytes.buffer instanceof ArrayBuffer)) {
    throw new Error("hashBytes должен владеть обычным ArrayBuffer")
  }
}

export function assertProjectStateWriterCommand(value: unknown): asserts value is ProjectStateWriterCommand {
  const command = requiredRecord(value, "ProjectStateWriterCommand")
  assertString(command["kind"], "kind")
  assertString(command["requestId"], "requestId")
  switch (command["kind"]) {
    case "openProject":
      assertExactKeys(command, ["kind", "requestId", "projectDir", "compatibility"])
      assertString(command["projectDir"], "projectDir")
      assertCompatibility(command["compatibility"])
      return
    case "beginUpdate":
    case "validateDependencies":
    case "commitUpdate":
    case "rollbackUpdate":
    case "cancelOperation":
      assertExactKeys(command, ["kind", "requestId", "operationId"])
      assertString(command["operationId"], "operationId")
      return
    case "writeBatch":
      assertExactKeys(command, ["kind", "requestId", "operationId", "batch"])
      assertString(command["operationId"], "operationId")
      assertProjectStateWriterBatch(command["batch"])
      return
    case "writeImportIndexBatch":
      assertExactKeys(command, ["kind", "requestId", "operationId", "batch"])
      assertString(command["operationId"], "operationId")
      if (!Array.isArray(command["batch"])) throw new Error("Import index batch должен быть массивом")
      return
    case "registerImportFileIdentities":
      assertExactKeys(command, ["kind", "requestId", "operationId", "files"])
      assertString(command["operationId"], "operationId")
      if (!Array.isArray(command["files"])) throw new Error("Import identities должен быть массивом")
      return
    case "writeImportFinalFileState":
      assertExactKeys(command, ["kind", "requestId", "operationId", "batch"])
      assertString(command["operationId"], "operationId")
      assertProjectStateImportFinalFileStateBatch(command["batch"])
      return
    case "deleteFiles":
      assertExactKeys(command, ["kind", "requestId", "operationId", "projectPaths"])
      assertString(command["operationId"], "operationId")
      if (!Array.isArray(command["projectPaths"]) || !command["projectPaths"].every((path) => typeof path === "string")) {
        throw new Error("projectPaths должен быть массивом строк")
      }
      return
    case "clearImportOutput":
      assertExactKeys(command, ["kind", "requestId", "operationId", "componentPaths"])
      assertString(command["operationId"], "operationId")
      if (!Array.isArray(command["componentPaths"])
        || !command["componentPaths"].every((path) => typeof path === "string" && path.length > 0)) {
        throw new Error("componentPaths должен быть массивом непустых строк")
      }
      return
    case "reset":
      assertExactKeys(command, ["kind", "requestId", "projectDir"])
      assertString(command["projectDir"], "projectDir")
      return
    case "compareFiles":
      assertExactKeys(command, ["kind", "requestId", "batch"])
      assertProjectStateFileHashBatch(command["batch"])
      return
    case "readComponentProjection":
      assertExactKeys(command, ["kind", "requestId", "componentPath"])
      assertString(command["componentPath"], "componentPath")
      return
    case "readLocalDiagnostics":
    case "createReadToken":
    case "checkpoint":
    case "close":
      assertExactKeys(command, ["kind", "requestId"])
      return
    default:
      throw new Error(`Неизвестная команда ProjectState writer: ${command["kind"]}`)
  }
}

function assertCompatibility(value: unknown): asserts value is ProjectStateCompatibility {
  const compatibility = requiredRecord(value, "compatibility")
  assertExactKeys(compatibility, ["schemaVersion", "producerVersion", "rulesFingerprint", "hashAlgorithm"])
  if (compatibility["schemaVersion"] !== 1) throw new Error("schemaVersion должен быть равен 1")
  assertString(compatibility["producerVersion"], "producerVersion")
  assertString(compatibility["rulesFingerprint"], "rulesFingerprint")
  if (compatibility["hashAlgorithm"] !== "xxhash64-be-v1") throw new Error("Неизвестный hashAlgorithm")
}

function requiredRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isPlainRecord(value)) throw new Error(`${path} должен быть обычным объектом`)
  return value
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false
  const prototype: unknown = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function assertExactKeys(value: Record<string, unknown>, keys: readonly string[]): void {
  if (Object.keys(value).some((key) => !keys.includes(key))) throw new Error("Команда содержит неизвестное поле")
  if (keys.some((key) => !(key in value))) throw new Error("В команде отсутствует обязательное поле")
}

function assertString(value: unknown, path: string): asserts value is string {
  const valid = typeof value === "string" && value.length > 0
  if (!valid) throw new Error(`${path} должен быть непустой строкой`)
}
