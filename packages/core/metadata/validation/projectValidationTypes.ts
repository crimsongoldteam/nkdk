import type { ObjectFieldIndex } from "./dataPath/objectFields"
import type { OwnerTypeRef } from "./dataPath/types"
import type { ValidationProjectFile } from "./projectFiles"
import type { Diagnostic } from "./types"

export type ValidationMode = "full" | "partial"

export type ValidationQueueStatus = "pending" | "running" | "ready" | "error"

export interface ValidationQueueEntry {
  file: ValidationProjectFile
  status: ValidationQueueStatus
}

export type EnqueueDependencyResult = "enqueued" | "already-known"

export interface ValidationObjectRecord {
  filePath: string
  projectPath: string
  kind: ValidationProjectFile["kind"]
  owner: { dir: string; name: string }
  ownerRef?: OwnerTypeRef
  model?: unknown
  fieldIndex?: ObjectFieldIndex
  importDiagnostics: Diagnostic[]
}

export interface ValidationObjectTableSnapshot {
  records: ValidationObjectRecord[]
}

export interface ValidationDependencyRequest {
  kind: "needsDependency"
  file: ValidationProjectFile
  requestedBy: string
}
