import { resolve } from "node:path"
import type { ConfigurationContext } from "../context/types"
import { discoverPreparedYamlProjectFiles } from "../project/preparedYamlProject"
import {
  createPreparedYamlProjectWorkerPool,
  type PreparedWorkerPool,
} from "../project/preparedYamlProjectWorkerPool"
import type { OwnerMetadataCache } from "../validation/dataPath/ownerCache"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "../validation/dataPath/sharedOwnerCache"
import { createValidationObjectTable } from "../validation/projectValidationObjectTable"
import type { ValidationIndexContribution } from "../validation/projectValidationTypes"
import {
  createSharedValidationSnapshot,
  type SharedValidationSnapshot,
} from "../validation/sharedValidationSnapshot"

export interface LayeredImportReferenceSnapshot {
  readonly local: SharedValidationSnapshot
  readonly base?: SharedValidationSnapshot
}

export async function buildComponentReferenceSnapshot(params: {
  componentDir: string
  context: ConfigurationContext
  concurrency: number
  createWorkerPool?: () => PreparedWorkerPool
}): Promise<SharedValidationSnapshot> {
  const componentDir = resolve(params.componentDir)
  const descriptors = await discoverPreparedYamlProjectFiles(componentDir)
  const pool = createPreparedYamlProjectWorkerPool({
    concurrency: normalizeConcurrency(params.concurrency),
    ...(params.createWorkerPool === undefined ? {} : { createWorkerPool: params.createWorkerPool }),
  })
  let contribution: ValidationIndexContribution
  try {
    contribution = await pool.runValidationFactPass({
      projectDir: componentDir,
      context: params.context,
      files: descriptors,
    })
  } finally {
    await pool.close()
  }
  const table = createValidationObjectTable({
    records: [],
    filePaths: descriptors.map(({ filePath }) => filePath),
  })
  table.mergeRecords(contribution.objectRecords)
  table.mergeReferenceIndexEntries(contribution)

  return createSharedValidationSnapshot(table.snapshot())
}

export function createLayeredImportReferenceSnapshot(params: {
  local: SharedValidationSnapshot
  base?: SharedValidationSnapshot
}): LayeredImportReferenceSnapshot {
  return Object.freeze({
    local: params.local,
    ...(params.base === undefined ? {} : { base: params.base }),
  })
}

export function createLayeredOwnerMetadataCache(params: {
  projectDir: string
  snapshots: LayeredImportReferenceSnapshot
}): OwnerMetadataCache {
  const local = createOwnerMetadataCacheFromSharedValidationSnapshot({
    projectDir: params.projectDir,
    snapshot: params.snapshots.local,
  })
  const base =
    params.snapshots.base === undefined
      ? undefined
      : createOwnerMetadataCacheFromSharedValidationSnapshot({
          projectDir: params.projectDir,
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

function normalizeConcurrency(concurrency: number): number {
  return Number.isInteger(concurrency) && concurrency > 0 ? concurrency : 1
}

function ownerRefKey(ref: { kind: string; name?: string }): string {
  return `${ref.kind}:${ref.name ?? ""}`
}
