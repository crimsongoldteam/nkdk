import type { ValidationGraphContribution } from "./projectValidationTypes"
import type { Diagnostic } from "./types"
import type { ProjectStateEncodedFileUpdateBatch } from "../projectState/contracts/fileUpdate"

export interface ValidationFirstPassFileResult {
  componentPath: string
  filePath: string
  rootProjectPath: string
  contributedFacts: boolean
  schemaDiagnostics: Diagnostic[]
}

export interface ComponentFirstPassPoolResult {
  componentPath: string
  contribution: ValidationGraphContribution
  diagnostics: Diagnostic[]
  schemaDiagnostics: Diagnostic[]
  fileResults: ValidationFirstPassFileResult[]
}

export interface FirstPassPoolResult {
  components: ComponentFirstPassPoolResult[]
  diagnostics: Diagnostic[]
  schemaDiagnostics: Diagnostic[]
  fileResults: ValidationFirstPassFileResult[]
  fileUpdateBatches: readonly ProjectStateEncodedFileUpdateBatch[]
  yamlLifetime: ValidationYamlLifetime
}

export interface ValidationYamlLifetime {
  current: number
  max: number
  parsed: number
  propertyEvents: number
}

export interface ValidationWorkerPoolStartProfile {
  workerInitMs: number
  schemaCompileMs: number
  formSchemaMs: number
  propertiesSchemaMs: number
  rulesSnapshotBytes: number
  reused?: boolean
}
