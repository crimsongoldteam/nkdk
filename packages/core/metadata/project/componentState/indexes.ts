import type { ConfigurationContext } from "../../context/types"
import {
  createConfigurationIndexReader,
  decodeConfigurationIndex,
  type SharedConfigurationIndexSnapshot,
} from "../../configurationIndex"
import { createPreparedYamlProjectWorkerPool } from "../preparedYamlProjectWorkerPool"
import type { PreparedWorkerPool } from "../preparedYamlProjectWorkerPool"
import { discoverPreparedYamlProjectFiles } from "../preparedYamlProject"
import { createValidationObjectTable } from "../../validation/projectValidationObjectTable"
import { createSharedValidationSnapshot } from "../../validation/sharedValidationSnapshot"
import { restoreSharedValidationSnapshot } from "../../validation/persistedSharedValidationSnapshot"
import { projectXmlExportAssignment } from "../../resourceTopology/xmlExportProjection"
import type {
  ComponentHashState,
  ComponentIndexes,
  ComponentProjectStructure,
} from "./types"

export async function readComponentIndexes(params: {
  readonly structure: ComponentProjectStructure
  readonly hashes: ComponentHashState
  readonly context: ConfigurationContext
  readonly snapshot?: SharedConfigurationIndexSnapshot
  readonly concurrency?: number
}): Promise<ComponentIndexes> {
  if (params.snapshot !== undefined) {
    const reader = createConfigurationIndexReader(params.snapshot)
    if (
      reader.binding().componentPath === params.structure.componentPath &&
      equalProjectFiles(reader.projectFiles(), params.hashes.projectFiles)
    ) {
      const decoded = decodeConfigurationIndex(
        new Uint8Array(params.snapshot.bytes, 0, params.snapshot.byteLength)
      )
      return {
        componentPath: params.structure.componentPath,
        sourceProjectFiles: params.hashes.projectFiles,
        metadata: restoreSharedValidationSnapshot(decoded.localIndexes.metadata),
        dependencies: decoded.localIndexes.dependencies,
        logicalAddresses: decoded.localIndexes.logicalAddresses,
      }
    }
  }

  const selectedPaths = new Set(
    params.structure.resources
      .filter(({ kind }) => kind === "content")
      .map(({ projectPath }) => projectPath)
  )
  const cold = await buildColdComponentIndexes({
    componentDir: params.structure.componentDir,
    context: params.context,
    concurrency: params.concurrency,
    projectPaths: selectedPaths,
  })
  const logicalAddresses = params.structure.resources
    .filter(({ kind }) => kind === "content")
    .map((resource) => ({
      logicalAddress: projectXmlExportAssignment(params.structure.topology, resource).logicalAddress,
      sourceProjectPath: resource.projectPath,
    }))

  return {
    componentPath: params.structure.componentPath,
    sourceProjectFiles: params.hashes.projectFiles,
    metadata: cold.metadata,
    dependencies: cold.dependencies,
    logicalAddresses: uniqueLogicalAddresses([
      ...logicalAddresses,
      ...cold.logicalAddresses,
    ]),
  }
}

export async function buildColdComponentIndexes(params: {
  readonly componentDir: string
  readonly context: ConfigurationContext
  readonly concurrency?: number
  readonly projectPaths?: ReadonlySet<string>
  readonly createWorkerPool?: () => PreparedWorkerPool
}): Promise<Pick<ComponentIndexes, "metadata" | "dependencies" | "logicalAddresses">> {
  const descriptors = (await discoverPreparedYamlProjectFiles(params.componentDir))
    .filter(({ projectPath }) => params.projectPaths?.has(projectPath) ?? true)
  const pool = createPreparedYamlProjectWorkerPool({
    concurrency: normalizeConcurrency(params.concurrency),
    ...(params.createWorkerPool === undefined ? {} : { createWorkerPool: params.createWorkerPool }),
  })
  try {
    const contribution = await pool.runValidationFactPass({
      projectDir: params.componentDir,
      context: params.context,
      files: descriptors,
    })
    const table = createValidationObjectTable({
      records: [],
      filePaths: descriptors.map(({ projectPath }) => projectPath),
    })
    table.mergeRecords(contribution.objectRecords)
    table.mergeReferenceIndexEntries(contribution)
    return {
      metadata: createSharedValidationSnapshot(table.snapshot()),
      dependencies: contribution.localDependencies,
      logicalAddresses: contribution.logicalAddresses,
    }
  } finally {
    await pool.close()
  }
}

function equalProjectFiles(
  left: readonly { projectPath: string; contentHash: bigint }[],
  right: readonly { projectPath: string; contentHash: bigint }[]
): boolean {
  if (left.length !== right.length) return false
  const rightByPath = new Map(right.map((file) => [file.projectPath, file.contentHash]))
  return left.every((file) => rightByPath.get(file.projectPath) === file.contentHash)
}

function uniqueLogicalAddresses<T extends { logicalAddress: string }>(entries: readonly T[]): T[] {
  const result = new Map<string, T>()
  for (const entry of entries) {
    if (!result.has(entry.logicalAddress)) result.set(entry.logicalAddress, entry)
  }
  return [...result.values()]
}

function normalizeConcurrency(value: number | undefined): number {
  return value !== undefined && Number.isSafeInteger(value) && value > 0 ? value : 1
}
