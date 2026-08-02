import type { ConfigurationContext } from "../context/types"
import { createPreparedYamlProjectWorkerPool, type PreparedWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import { discoverPreparedYamlProjectFiles } from "../project/preparedYamlProject"
import { createValidationObjectTable } from "../validation/projectValidationObjectTable"
import { createSharedValidationSnapshot, type SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import type { OwnerMetadataCache } from "../validation/dataPath/ownerCache"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "../validation/dataPath/sharedOwnerCache"
import type { ProjectLocalDependency, ProjectLogicalAddressEntry } from "../project/componentIndexFacts"

export interface ColdComponentIndexes {
  readonly metadata: SharedValidationSnapshot
  readonly dependencies: readonly ProjectLocalDependency[]
  readonly logicalAddresses: readonly ProjectLogicalAddressEntry[]
}

export async function buildColdComponentIndexes(params: {
  readonly componentDir: string
  readonly context: ConfigurationContext
  readonly concurrency?: number
  readonly projectPaths?: ReadonlySet<string>
  readonly createWorkerPool?: () => PreparedWorkerPool
}): Promise<ColdComponentIndexes> {
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
  readonly snapshots: { readonly local: SharedValidationSnapshot; readonly base?: SharedValidationSnapshot }
}): OwnerMetadataCache {
  const local = createOwnerMetadataCacheFromSharedValidationSnapshot({
    projectDir: params.localProjectDir,
    snapshot: params.snapshots.local,
  })
  const base = params.snapshots.base === undefined
    ? undefined
    : createOwnerMetadataCacheFromSharedValidationSnapshot({
        projectDir: params.baseProjectDir ?? params.localProjectDir,
        snapshot: params.snapshots.base,
      })
  return {
    get(ref) {
      const localResult = local.get(ref)
      return localResult.status !== "not-found" || base === undefined ? localResult : base.get(ref)
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

function normalizeConcurrency(value: number | undefined): number {
  return value !== undefined && Number.isSafeInteger(value) && value > 0 ? value : 1
}

function ownerRefKey(ref: { readonly kind: string; readonly name?: string }): string {
  return `${ref.kind}:${ref.name ?? ""}`
}
