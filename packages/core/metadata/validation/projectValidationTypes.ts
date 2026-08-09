import type { ObjectFieldIndex, ValidationOwnerFacts } from "./dataPath/contracts"
import type { OwnerTypeRef } from "./dataPath/types"
import type {
  PendingMetadataTargetReference,
  ProjectMemberIndexEntry,
  ProjectObjectIndexEntry,
  ProjectValueIndexEntry,
} from "./projectReferenceIndex"
import type { ValidationProjectFile } from "./projectFiles"
import type { Diagnostic } from "./types"
import type { ProjectLocalDependency, ProjectLogicalAddressEntry } from "../project/componentIndexFacts"
import type { FormDataPathIndex } from "../orchestration/dataPath/formIndex"

export interface ValidationFormIndexContribution {
  readonly owner: OwnerTypeRef
  readonly index: FormDataPathIndex
}

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

export interface ValidationGraphContribution extends ValidationReferenceIndexEntries {
  objectRecords: ValidationObjectRecord[]
}

export interface ComponentValidationLayer {
  componentPath: string
  contribution: ValidationGraphContribution
}

export interface ProjectValidationGraph {
  layers: readonly ComponentValidationLayer[]
}

export interface ValidationIndexContribution {
  objectRecords: ValidationObjectRecord[]
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
  localDependencies: ProjectLocalDependency[]
  logicalAddresses: ProjectLogicalAddressEntry[]
}

export interface ValidationObjectTableSnapshot extends ValidationReferenceIndexEntries {
  records: ValidationObjectRecord[]
  filePaths: string[]
}
