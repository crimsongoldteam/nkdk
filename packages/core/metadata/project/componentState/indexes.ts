import type { ConfigurationContext } from "../../context/types"
import { createPreparedYamlProjectWorkerPool } from "../preparedYamlProjectWorkerPool"
import type { PreparedWorkerPool } from "../preparedYamlProjectWorkerPool"
import { discoverPreparedYamlProjectFiles } from "../preparedYamlProject"
import { createValidationObjectTable } from "../../validation/projectValidationObjectTable"
import { createSharedValidationSnapshot } from "../../validation/sharedValidationSnapshot"
import { projectXmlExportAssignment } from "../../resourceTopology/xmlExportProjection"
import type { ComponentHashState, ComponentIndexes, ComponentProjectStructure } from "./types"
import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "../../validation/dataPath/sharedOwnerCache"
import type { SharedValidationSnapshot } from "../../validation/sharedValidationSnapshot"

export async function readComponentIndexes(params: {
  readonly structure: ComponentProjectStructure
  readonly hashes: ComponentHashState
  readonly context: ConfigurationContext
  readonly concurrency?: number
  readonly createWorkerPool?: () => PreparedWorkerPool
}): Promise<ComponentIndexes> {
  const selectedPaths = new Set(
    params.structure.resources.filter(({ kind }) => kind === "content").map(({ projectPath }) => projectPath)
  )
  const cold = await buildColdComponentIndexes({
    componentDir: params.structure.componentDir,
    context: params.context,
    concurrency: params.concurrency,
    projectPaths: selectedPaths,
    ...(params.createWorkerPool === undefined
      ? {}
      : { createWorkerPool: params.createWorkerPool }),
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
    logicalAddresses: uniqueLogicalAddresses([...logicalAddresses, ...cold.logicalAddresses]),
  }
}

export async function buildColdComponentIndexes(params: {
  readonly componentDir: string
  readonly context: ConfigurationContext
  readonly concurrency?: number
  readonly projectPaths?: ReadonlySet<string>
  readonly createWorkerPool?: () => PreparedWorkerPool
}): Promise<Pick<ComponentIndexes, "metadata" | "dependencies" | "logicalAddresses">> {
  const descriptors = (await discoverPreparedYamlProjectFiles(params.componentDir)).filter(
    ({ projectPath }) => params.projectPaths?.has(projectPath) ?? true
  )
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

export function createLayeredOwnerMetadataCache(params: {
  readonly localProjectDir: string
  readonly baseProjectDir?: string
  readonly snapshots: {
    readonly local: SharedValidationSnapshot
    readonly base?: SharedValidationSnapshot
  }
}): OwnerMetadataCache {
  const local = createOwnerMetadataCacheFromSharedValidationSnapshot({
    projectDir: params.localProjectDir,
    snapshot: params.snapshots.local,
  })
  const base =
    params.snapshots.base === undefined
      ? undefined
      : createOwnerMetadataCacheFromSharedValidationSnapshot({
          projectDir: params.baseProjectDir ?? params.localProjectDir,
          snapshot: params.snapshots.base,
        })

  return {
    get(ref) {
      const localResult = local.get(ref)
      if (localResult.status !== "not-found" || base === undefined) return localResult
      return base.get(ref)
    },
    listRefs(kind) {
      if (base === undefined) return local.listRefs(kind)
      const result = [...local.listRefs(kind)]
      const seen = new Set(result.map(ownerRefKey))
      for (const ref of base.listRefs(kind)) {
        const key = ownerRefKey(ref)
        if (seen.has(key)) continue
        seen.add(key)
        result.push(ref)
      }
      return result
    },
  }
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

function ownerRefKey(ref: { readonly kind: string; readonly name?: string }): string {
  return `${ref.kind}:${ref.name ?? ""}`
}
