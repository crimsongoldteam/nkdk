import type {
  ProjectFileMetadataTargetReferencesQuery,
  ProjectFileMetadataTargetReferencesResult,
} from "../readSession"

export function missingProjectFileMetadataTargetReferences(
  requests: readonly ProjectFileMetadataTargetReferencesQuery[],
): readonly ProjectFileMetadataTargetReferencesResult[] {
  return requests.map(({ requestId }) => ({ requestId, status: "missing" }))
}
