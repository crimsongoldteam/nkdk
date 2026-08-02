import type { ConfigurationContext } from "../context/types"
import { join } from "node:path"
import { createProjectStateFileUpdateBatch } from "./fileUpdate"
import { toPreparedYamlProjectFileDescriptor } from "../project/preparedYamlProject"
import {
  createPreparedYamlValidationOperation,
  type PreparedYamlLocalValidationSource,
  type PreparedYamlProjectWorkerPool,
  type PreparedYamlValidationOperation,
} from "../project/preparedYamlProjectWorkerPool"
import type { Diagnostic } from "../validation/types"
import type { ProjectStateFileIdentity, ProjectStateFileUpdateBatch } from "./fileUpdate"
import type { ProjectStateFileChanges } from "./store"
import type { ProjectStateFileHashBatch, ProjectStateReadToken } from "./contracts"
import {
  collectProjectStateFiles,
  isProjectStateFileCollectionStable,
  ProjectStateFilesChangedError,
  releaseProjectResourceBytesExcept,
  type HashedProjectResource,
  type ProjectStateFileCollection,
} from "./projectFiles"

export interface ProjectStateRefreshStats {
  readonly hashedFiles: number
  readonly parsedYamlFiles: number
  readonly changedFiles: number
  readonly deletedFiles: number
}

export interface ProjectStateRefreshResult {
  readonly diagnostics: readonly Diagnostic[]
  readonly readToken: ProjectStateReadToken
  readonly stats: ProjectStateRefreshStats
}

export interface ProjectStateRefreshHandle {
  compareFiles(batch: ProjectStateFileHashBatch): Promise<ProjectStateFileChanges>
  beginUpdate(projectDir: string, signal?: AbortSignal): Promise<void>
  writeBatch(batch: ProjectStateFileUpdateBatch): Promise<void>
  deleteFiles(projectPaths: readonly string[]): Promise<void>
  readLocalDiagnostics(): Promise<readonly Diagnostic[]>
  createReadToken(): Promise<ProjectStateReadToken>
  commitAndCheckpoint(): Promise<{ readonly snapshotPath: string }>
  rollbackUpdate(): Promise<void>
}

export interface ProjectStateRefreshParams {
  readonly projectDir: string
  readonly context?: ConfigurationContext
  readonly concurrency?: number
  readonly signal?: AbortSignal
}

export interface CollectedProjectStateFiles extends ProjectStateFileCollection {
  readonly hashBatch: ProjectStateFileHashBatch
  readonly yamlInputs: readonly ProjectStateYamlInput[]
  readonly releaseBytesExcept: (retainedProjectPaths: ReadonlySet<string>) => void
}

export interface ProjectStateYamlInput {
  readonly identity: ProjectStateFileIdentity
  readonly projectDir: string
  readonly value: unknown
}

export interface ProjectStateRefreshOperation extends PreparedYamlValidationOperation {}

export interface ProjectStateRefreshDependencies {
  readonly handle: ProjectStateRefreshHandle
  readonly collectFiles: (params: ProjectStateRefreshParams) => Promise<CollectedProjectStateFiles>
  readonly runLocalValidation: (
    files: readonly ProjectStateYamlInput[],
    producer: Pick<ProjectStateRefreshHandle, "writeBatch">,
    operation: ProjectStateRefreshOperation,
  ) => Promise<number>
  readonly writeChangedResources: (
    changes: ProjectStateFileChanges,
    files: CollectedProjectStateFiles,
    producer: Pick<ProjectStateRefreshHandle, "writeBatch">,
  ) => Promise<void>
  readonly isStable: (files: CollectedProjectStateFiles, signal?: AbortSignal) => Promise<boolean>
}

export function createProjectStateRefreshDependencies(params: {
  readonly handle: ProjectStateRefreshHandle
  readonly pool: PreparedYamlProjectWorkerPool
  readonly context: ConfigurationContext
}): ProjectStateRefreshDependencies {
  return {
    handle: params.handle,
    async collectFiles(refreshParams) {
      const collection = await collectProjectStateFiles({
        projectDir: refreshParams.projectDir,
        signal: refreshParams.signal,
      })
      const resources = [...collection.resources]
      const yamlInputs = resources.flatMap((resource, index) => resource.ref.kind === "yaml"
        ? [{
            identity: resource.identity,
            projectDir: refreshParams.projectDir,
            value: {
              resource,
              projectDir: refreshParams.projectDir,
              hashBatch: collection.hashBatch,
              hashIndex: index,
            },
          }]
        : [])
      return {
        ...collection,
        resources,
        yamlInputs,
        releaseBytesExcept(retainedProjectPaths) {
          releaseProjectResourceBytesExcept({ ...collection, resources }, retainedProjectPaths)
          for (let index = yamlInputs.length - 1; index >= 0; index -= 1) {
            if (!retainedProjectPaths.has(yamlInputs[index]!.identity.projectPath)) yamlInputs.splice(index, 1)
          }
        },
      }
    },
    async runLocalValidation(files, producer, operation) {
      const firstFile = files[0]
      if (firstFile === undefined) return 0
      const sources: PreparedYamlLocalValidationSource[] = files.map((file) => ({
        createFile() {
          const { projectDir: _projectDir, ...localFile } = localValidationFile(file.value)
          return localFile
        },
      }))
      const result = await params.pool.runLocalValidation({
        projectDir: firstFile.projectDir,
        context: params.context,
        files: sources,
        operation,
      }, producer)
      return result.parsedYamlFiles
    },
    async writeChangedResources(changes, files, producer) {
      const entries = changes.changed.flatMap(({ index, file }) => {
        if (file.resourceKind !== "resource") return []
        return [{
          update: { ...file, kind: "resource" as const },
          hashBytes: files.hashBatch.hashBytes.slice(index * 8, index * 8 + 8),
        }]
      })
      if (entries.length > 0) await producer.writeBatch(createProjectStateFileUpdateBatch(entries))
    },
    isStable: isProjectStateFileCollectionStable,
  }
}

export async function refreshProjectState(
  params: ProjectStateRefreshParams,
  dependencies: ProjectStateRefreshDependencies,
): Promise<ProjectStateRefreshResult> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const operation = createPreparedYamlValidationOperation(params.signal)
    const operationParams = { ...params, signal: operation.signal }
    let updateActive = false
    try {
      operation.signal.throwIfAborted()
      const files = await dependencies.collectFiles(operationParams)
      operation.signal.throwIfAborted()
      const changes = await dependencies.handle.compareFiles(files.hashBatch)
      operation.signal.throwIfAborted()
      const changedPaths = new Set(changes.changed.map(({ file }) => file.projectPath))
      const changedYamlInputs = files.yamlInputs.filter(({ identity }) => changedPaths.has(identity.projectPath))
      files.releaseBytesExcept(new Set(changedYamlInputs.map(({ identity }) => identity.projectPath)))
      await dependencies.handle.beginUpdate(params.projectDir, operation.signal)
      updateActive = true
      await dependencies.handle.deleteFiles(changes.deleted.map(({ projectPath }) => projectPath))
      await dependencies.writeChangedResources(changes, files, dependencies.handle)
      const parsedYamlFiles = await dependencies.runLocalValidation(changedYamlInputs, dependencies.handle, operation)
      const diagnostics = await dependencies.handle.readLocalDiagnostics()
      if (!(await dependencies.isStable(files, operation.signal))) {
        await dependencies.handle.rollbackUpdate()
        continue
      }
      const readToken = await dependencies.handle.createReadToken()
      await dependencies.handle.commitAndCheckpoint()
      updateActive = false
      return {
        diagnostics,
        readToken,
        stats: {
          hashedFiles: files.hashBatch.files.length,
          parsedYamlFiles,
          changedFiles: changes.changed.length,
          deletedFiles: changes.deleted.length,
        },
      }
    } catch (caught) {
      if (updateActive) {
        try {
          await dependencies.handle.rollbackUpdate()
        } catch (rollbackCaught) {
          throw new AggregateError([caught, rollbackCaught], errorMessage(caught))
        }
      }
      if (caught instanceof ProjectStateFilesChangedError) continue
      throw caught
    }
  }
  throw new Error("Файлы проекта изменились во время актуализации после двух попыток")
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : "Ошибка актуализации состояния проекта"
}

function localValidationFile(value: unknown) {
  const input = value as {
    resource: HashedProjectResource
    projectDir: string
    hashBatch: ProjectStateFileHashBatch
    hashIndex: number
  }
  const { resource } = input
  if (resource.ref.kind !== "yaml" || resource.ref.absolutePath === undefined) {
    throw new Error("Локальная validation получила не YAML-ресурс")
  }
  const projectDir = input.projectDir
  const componentDir = join(projectDir, ...resource.identity.componentPath.split("/"))
  const descriptor = toPreparedYamlProjectFileDescriptor(resource.ref, {
    componentPath: resource.identity.componentPath,
    componentDir,
  })
  const hashStart = input.hashIndex * 8
  return {
    projectDir,
    descriptor,
    bytes: resource.bytes,
    hashBytes: input.hashBatch.hashBytes.slice(hashStart, hashStart + 8),
  }
}
