import type { ConfigurationContext } from "../context/types"
import type { ValidationGraphContribution, ValidationObjectTableSnapshot } from "./projectValidationTypes"
import type { Diagnostic } from "./types"

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
