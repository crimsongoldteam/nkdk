import { resolve } from "node:path"
import type { ConfigurationContext } from "../context/types"
import type { Diagnostic } from "../validation/types"
import { discoverMetadataProjectResources } from "./resources"

export interface PreparedYamlProject {
  projectDir: string
  files: PreparedYamlProjectFileDescriptor[]
  resourceFiles: PreparedYamlProjectResourceDescriptor[]
  metadataIndex: PreparedGlobalMetadataIndex
  workers: PreparedYamlWorkerPartition[]
}

export interface PreparedYamlProjectFileDescriptor {
  projectPath: string
  filePath: string
  role: "configuration" | "properties" | "form"
  owner: { dir: string; name: string }
}

export interface PreparedYamlProjectResourceDescriptor {
  projectPath: string
  filePath: string
  owner: { dir: string; name: string }
  role: string
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
  data: unknown
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

export async function prepareYamlProject(params: {
  projectDir: string
  context: ConfigurationContext
  concurrency?: number
}): Promise<PreparedYamlProjectResult> {
  void params.context
  void params.concurrency

  const projectDir = resolve(params.projectDir)
  const files = discoverMetadataProjectResources(projectDir)
    .filter((resource) => resource.absolutePath !== undefined)
    .map(
      (resource): PreparedYamlProjectFileDescriptor => ({
        projectPath: resource.projectPath,
        filePath: resource.absolutePath!,
        role: resource.role,
        owner: { dir: resource.owner.dir, name: resource.owner.name },
      })
    )

  return {
    ok: true,
    project: {
      projectDir,
      files,
      resourceFiles: [],
      metadataIndex: { declarations: [] },
      workers: [{ workerIndex: 0, yamlFiles: [], dependencyIndex: { dependencies: [] } }],
    },
  }
}
