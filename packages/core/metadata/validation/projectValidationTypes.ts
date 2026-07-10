import type { ObjectFieldIndex } from "./dataPath/objectFields"
import type { ValidationOwnerFacts } from "./dataPath/ownerFacts"
import type { OwnerTypeRef } from "./dataPath/types"
import type {
  PendingMetadataTargetReference,
  ProjectMemberIndexEntry,
  ProjectObjectIndexEntry,
  ProjectValueIndexEntry,
} from "./projectReferenceIndex"
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
  ownerFacts?: ValidationOwnerFacts
  fieldIndex?: ObjectFieldIndex
  objectIndexEntries?: ProjectObjectIndexEntry[]
  memberIndexEntries?: ProjectMemberIndexEntry[]
  valueIndexEntries?: ProjectValueIndexEntry[]
  pendingReferences?: PendingMetadataTargetReference[]
  importDiagnostics: Diagnostic[]
}

export interface ValidationReferenceIndexEntries {
  objectIndexEntries?: ProjectObjectIndexEntry[]
  memberIndexEntries?: ProjectMemberIndexEntry[]
  valueIndexEntries?: ProjectValueIndexEntry[]
  pendingReferences?: PendingMetadataTargetReference[]
}

export interface ValidationObjectTableSnapshot extends ValidationReferenceIndexEntries {
  records: ValidationObjectRecord[]
  filePaths: string[]
}

export interface ValidationDependencyRequest {
  kind: "needsDependency"
  file: ValidationProjectFile
  requestedBy: string
}

export type ValidationResolveResult =
  | { ok: true; filePath?: string; details?: unknown }
  | { ok: false; diagnostics: Diagnostic[]; dependency?: ValidationDependencyRequest }
