import { resolve } from "node:path"
import type { ConfigurationContext } from "../context/types"
import type { PreparedWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import {
  buildColdComponentIndexes,
  createLayeredOwnerMetadataCache as createComponentStateLayeredOwnerMetadataCache,
} from "./coldComponentIndexes"

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
  return (await buildColdComponentIndexes({
    componentDir,
    context: params.context,
    concurrency: normalizeConcurrency(params.concurrency),
    ...(params.createWorkerPool === undefined ? {} : { createWorkerPool: params.createWorkerPool }),
  })).metadata
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
}): ReturnType<typeof createComponentStateLayeredOwnerMetadataCache> {
  return createComponentStateLayeredOwnerMetadataCache({
    localProjectDir: params.projectDir,
    baseProjectDir: params.projectDir,
    snapshots: params.snapshots,
  })
}

function normalizeConcurrency(concurrency: number): number {
  return Number.isInteger(concurrency) && concurrency > 0 ? concurrency : 1
}
