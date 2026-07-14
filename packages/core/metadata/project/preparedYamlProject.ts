import { resolve } from "node:path"
import type { ConfigurationContext } from "../context/types"
import type { Diagnostic } from "../validation/types"
import { createPreparedYamlProjectWorkerPool } from "./preparedYamlProjectWorkerPool"
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
  itemType: string
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

  const projectDir = resolve(params.projectDir)
  const resources = discoverMetadataProjectResources(projectDir).filter((resource) => resource.absolutePath !== undefined)
  const files = resources
    .filter((resource) => resource.kind === "yaml")
    .map(
      (resource): PreparedYamlProjectFileDescriptor => ({
        projectPath: resource.projectPath,
        filePath: resource.absolutePath!,
        role: resource.role,
        owner: { dir: resource.owner.dir, name: resource.owner.name },
        itemType:
          resource.owner.spec.rule.metadataTargetOwner?.kind === "self"
            ? resource.owner.spec.rule.metadataTargetOwner.root
            : (resource.owner.spec.rule.itemTypePrefix ?? resource.owner.spec.rule.itemType),
      })
    )
  const resourceFiles = resources
    .filter((resource) => resource.kind !== "yaml")
    .map(
      (resource): PreparedYamlProjectResourceDescriptor => ({
        projectPath: resource.projectPath,
        filePath: resource.absolutePath!,
        owner: { dir: resource.owner.dir, name: resource.owner.name },
        role: resource.role,
        propertyType: resource.source.kind === "property" ? resource.source.propertyType : undefined,
      })
    )
  const pool = createPreparedYamlProjectWorkerPool({ concurrency: Math.max(1, params.concurrency ?? 1) })

  try {
    const prepared = await pool.run({ projectDir, context: params.context, files })
    if (prepared.diagnostics.length > 0) {
      return {
        ok: false,
        code: prepared.diagnostics.some((diagnostic) => diagnostic.message.startsWith("Повторное объявление metadata:"))
          ? "declaration_conflict"
          : "prepare_failed",
        message: "Не удалось подготовить YAML-проект",
        diagnostics: prepared.diagnostics,
      }
    }

    return {
      ok: true,
      project: {
        projectDir,
        files,
        resourceFiles,
        metadataIndex: prepared.metadataIndex,
        workers: prepared.workers,
      },
    }
  } finally {
    await pool.close()
  }
}
