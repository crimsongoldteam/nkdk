import type { ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import type { OwnerMetadataCache } from "./dataPath/ownerCache"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "./dataPath/sharedOwnerCache"
import type { ProjectReferenceIndex } from "./projectReferenceIndex"
import type { ValidationObjectTableSnapshot } from "./projectValidationTypes"
import { createSharedProjectReferenceIndex } from "./sharedProjectReferenceIndex"
import { createSharedValidationSnapshot, type SharedValidationSnapshot } from "./sharedValidationSnapshot"

export type ResolveObjectFilePath = (target: Extract<ParsedMetadataTarget, { kind: "object" }>) => string | undefined

export interface ValidationSnapshotProvider {
  ownerCache(projectDir: string): OwnerMetadataCache
  referenceIndex(params: {
    projectDir: string
    resolveObjectFilePath: ResolveObjectFilePath
  }): ProjectReferenceIndex
  sharedPayload(): SharedValidationSnapshot
}

export function createValidationSnapshotProvider(snapshot: ValidationObjectTableSnapshot): ValidationSnapshotProvider {
  const shared = createSharedValidationSnapshot(snapshot)

  return {
    ownerCache(projectDir) {
      return createOwnerMetadataCacheFromSharedValidationSnapshot({ projectDir, snapshot: shared })
    },
    referenceIndex(params) {
      return createSharedProjectReferenceIndex({
        projectDir: params.projectDir,
        snapshot: shared.reference,
        resolveObjectFilePath: params.resolveObjectFilePath,
      })
    },
    sharedPayload() {
      return shared
    },
  }
}
