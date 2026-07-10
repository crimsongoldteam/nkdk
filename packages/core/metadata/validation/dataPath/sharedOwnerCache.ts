import type { OwnerMetadataCache } from "./ownerCache"
import { createOwnerMetadataCacheFromBinarySharedOwners } from "../sharedValidationBinaryOwners"
import type { SharedValidationSnapshot } from "../sharedValidationSnapshot"

export function createOwnerMetadataCacheFromSharedValidationSnapshot(params: {
  projectDir: string
  snapshot: SharedValidationSnapshot
}): OwnerMetadataCache {
  return createOwnerMetadataCacheFromBinarySharedOwners({
    projectDir: params.projectDir,
    snapshot: params.snapshot.owners,
  })
}
