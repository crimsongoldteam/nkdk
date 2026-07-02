import type { ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import type { OwnerMetadataCache } from "./dataPath/ownerCache"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "./dataPath/sharedOwnerCache"
import type { ProjectReferenceIndex } from "./projectReferenceIndex"
import type { ValidationDependencyRequest, ValidationMode, ValidationObjectTableSnapshot } from "./projectValidationTypes"
import { createSharedProjectReferenceIndex } from "./sharedProjectReferenceIndex"
import { createSharedValidationSnapshot, type SharedValidationSnapshot } from "./sharedValidationSnapshot"

export type ResolveObjectFilePath = (target: Extract<ParsedMetadataTarget, { kind: "object" }>) => string | undefined

export type ResolveProjectFileDependency = (
  target: Extract<ParsedMetadataTarget, { kind: "object" }>
) => ValidationDependencyRequest | undefined

export interface ValidationSnapshotProvider {
  ownerCache(projectDir: string): OwnerMetadataCache
  referenceIndex(params: {
    projectDir: string
    mode: ValidationMode
    resolveObjectFilePath: ResolveObjectFilePath
    resolveProjectFile?: ResolveProjectFileDependency
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
        mode: params.mode,
        snapshot: shared.reference,
        resolveObjectFilePath: params.resolveObjectFilePath,
        resolveProjectFile: params.resolveProjectFile,
      })
    },
    sharedPayload() {
      return shared
    },
  }
}
