import type { OwnerMetadataCache } from "./ownerCache"
import {
  createOwnerMetadataCacheFromBinarySharedOwners,
  createOwnerMetadataCacheFromBinarySharedProjectOwners,
} from "../sharedValidationBinaryOwners"
import type { SharedProjectValidationGraph, SharedValidationSnapshot } from "../sharedValidationSnapshot"

export function createOwnerMetadataCacheFromSharedValidationSnapshot(params: {
  projectDir: string
  snapshot: SharedValidationSnapshot
}): OwnerMetadataCache {
  return createOwnerMetadataCacheFromBinarySharedOwners({
    projectDir: params.projectDir,
    snapshot: params.snapshot.owners,
  })
}

export function createOwnerMetadataCacheFromSharedProjectValidationGraph(params: {
  projectDir: string
  componentPath: string
  graph: SharedProjectValidationGraph
}): OwnerMetadataCache {
  return createOwnerMetadataCacheFromBinarySharedProjectOwners({
    projectDir: params.projectDir,
    componentPath: params.componentPath,
    snapshot: params.graph.owners,
  })
}
