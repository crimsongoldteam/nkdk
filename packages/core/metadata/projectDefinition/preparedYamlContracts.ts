import type { Diagnostic } from "../diagnostics/types"

export interface PreparedYamlProject {
  projectDir: string
  files: PreparedYamlProjectFileDescriptor[]
  resourceFiles: PreparedYamlProjectResourceDescriptor[]
  metadataIndex: PreparedGlobalMetadataIndex
  workers: PreparedYamlWorkerPartition[]
}

export interface PreparedYamlProjectFileInput {
  projectPath: string
  filePath: string
  role: "configuration" | "properties" | "form"
  owner: { dir: string; name: string }
  itemType: string
}

export interface PreparedYamlProjectFileDescriptor extends PreparedYamlProjectFileInput {
  componentPath: string
  componentDir: string
  rootProjectPath: string
}

export interface PreparedYamlProjectResourceDescriptor {
  projectPath: string
  filePath: string
  owner: { dir: string; name: string }
  role: string
  propertyType?: string
}

export interface PreparedYamlWorkerPartition {
  workerIndex: number
  yamlFiles: PreparedYamlFile[]
  dependencyIndex: PreparedWorkerDependencyIndex
}

export interface PreparedYamlFile {
  projectPath: string
  filePath: string
  role: "configuration" | "properties" | "form"
  owner: { dir: string; name: string }
  data?: unknown
  syntaxDiagnostics: Diagnostic[]
}

export interface PreparedGlobalMetadataIndex {
  declarations: PreparedMetadataDeclaration[]
}

export interface PreparedMetadataDeclaration {
  canonical: string
  projectPath: string
  filePath: string
}

export interface PreparedWorkerDependencyIndex {
  dependencies: PreparedMetadataDependency[]
}

export interface PreparedMetadataDependency {
  canonical: string
  sourceProjectPath: string
  sourceFilePath: string
  yamlPath: readonly (string | number)[]
  kind: "metadata" | "dataPath" | "filePath" | "resource" | "other"
}

export type PreparedYamlProjectResult =
  | { ok: true; project: PreparedYamlProject }
  | { ok: false; code: "prepare_failed" | "declaration_conflict"; message: string; diagnostics: Diagnostic[] }
