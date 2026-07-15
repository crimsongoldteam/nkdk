import { resolve } from "node:path"
import type { ConfigurationContext } from "../context/types"
import { createValidationProfiler } from "../validation/profile"
import type { Diagnostic } from "../validation/types"
import {
  createPreparedYamlProjectWorkerPool,
  type PreparedYamlProjectWorkerPool,
} from "./preparedYamlProjectWorkerPool"
import { discoverMetadataProjectResources, type MetadataProjectResourceInclude } from "./resources"

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

export async function prepareYamlProject(params: {
  projectDir: string
  context: ConfigurationContext
  concurrency?: number
  includeYamlData?: boolean
  resourceInclude?: MetadataProjectResourceInclude
}): Promise<PreparedYamlProjectResult> {
  const pool = createPreparedYamlProjectWorkerPool({ concurrency: Math.max(1, params.concurrency ?? 1) })

  try {
    return await prepareYamlProjectWithPool({ ...params, pool })
  } finally {
    await pool.close()
  }
}

export async function prepareYamlProjectWithPool(params: {
  projectDir: string
  context: ConfigurationContext
  pool: PreparedYamlProjectWorkerPool
  includeYamlData?: boolean
  resourceInclude?: MetadataProjectResourceInclude
}): Promise<PreparedYamlProjectResult> {
  const profiler = createValidationProfiler({ scope: "main" })
  const projectDir = resolve(params.projectDir)
  const resources = await profiler.measureAsync("Подготовка YAML-проекта", "Поиск файлов проекта", {}, async () =>
    (await discoverMetadataProjectResources(projectDir, { include: params.resourceInclude ?? "all" })).filter(
      (resource) => resource.absolutePath !== undefined
    )
  )
  const files = profiler.measure("Подготовка YAML-проекта", "Классификация файлов проекта", { items: resources.length }, () =>
    resources
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
  )
  const resourceFiles = profiler.measure(
    "Подготовка YAML-проекта",
    "Классификация прочих файлов проекта",
    { items: resources.length },
    () =>
      resources
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
  )
  const prepared = await profiler.measureAsync(
    "Подготовка YAML-проекта",
    "Ожидание результата подготовки",
    { items: files.length },
    () => params.pool.run({ projectDir, context: params.context, files, includeYamlData: params.includeYamlData ?? true })
  )
  profiler.flush()
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
}
