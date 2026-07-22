import type { ConfigurationContext } from "../context/types"
import type {
  PendingMetadataTargetReference,
  ProjectMemberIndexEntry,
  ProjectObjectIndexEntry,
  ProjectValueIndexEntry,
} from "./projectMetadataReferences"
import type { ValidationMode, ValidationObjectRecord, ValidationObjectTableSnapshot } from "./projectValidationTypes"
import type { Diagnostic } from "./types"

export interface FirstPassPoolResult {
  diagnostics: Diagnostic[]
  objectRecords: ValidationObjectRecord[]
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
  yamlLifetime: ValidationYamlLifetime
}

export interface ValidationYamlLifetime {
  current: number
  max: number
  parsed: number
  propertyEvents: number
}

export interface SecondPassPoolParams {
  projectDir: string
  context: ConfigurationContext
  mode: ValidationMode
  objectTable: ValidationObjectTableSnapshot
}

export interface SecondPassPoolResult {
  diagnostics: Diagnostic[]
}

export interface ValidationWorkerPoolStartProfile {
  workerInitMs: number
  schemaCompileMs: number
  formSchemaMs: number
  propertiesSchemaMs: number
  rulesSnapshotBytes: number
  reused?: boolean
}
