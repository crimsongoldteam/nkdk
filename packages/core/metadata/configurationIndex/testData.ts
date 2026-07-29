import type { ConfigurationSnapshotEntity, ConfigurationSnapshotFragment } from "./types"

export function entity(logicalAddress: string, sourceProjectPath: string): ConfigurationSnapshotEntity {
  return {
    logicalAddress,
    sourceProjectPath,
    identities: { xmlName: logicalAddress },
  }
}

export function fragment(
  targetProjectPath: string,
  ...entities: readonly ConfigurationSnapshotEntity[]
): ConfigurationSnapshotFragment {
  return { targetProjectPath, entities }
}
