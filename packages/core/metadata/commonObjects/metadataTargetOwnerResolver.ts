import type { MetadataTargetOwner } from "../orchestration/metadataTarget/types"
import { registerMetadataTargetOwnerResolver } from "../orchestration/property/metadataTargetOwnerRegistry"
import { registerTopologyMetadataTargetOwnerResolver } from "../resourceTopology/metadataTargetOwner"

export interface CommonMetadataTargetOwnerFrame {
  readonly itemType: string
  readonly name: string
  readonly owner?: { readonly root: string; readonly objectName: string }
}

export type CommonMetadataTargetOwnerResolver = (params: {
  readonly name: string | undefined
  readonly frames: readonly CommonMetadataTargetOwnerFrame[]
}) => MetadataTargetOwner | undefined

export function registerCommonMetadataTargetOwnerResolver(
  itemType: string,
  resolver: CommonMetadataTargetOwnerResolver,
): void {
  registerMetadataTargetOwnerResolver(itemType, resolver)
  registerTopologyMetadataTargetOwnerResolver(itemType, resolver)
}

export function externalDataSourceChildOwnerResolver(
  segment: "Table" | "Cube",
): CommonMetadataTargetOwnerResolver {
  return ({ name, frames }) => {
    const owner = findLastFrame(frames, (frame) => frame.owner?.root === "ExternalDataSource")?.owner
    return name === undefined || owner === undefined
      ? undefined
      : { root: "ExternalDataSource", objectName: `${owner.objectName}.${segment}.${name}` }
  }
}

export function externalDataSourceNestedOwnerResolver(
  parentItemType: "MetadataExternalDataSourceCube",
  segment: "DimensionTable",
): CommonMetadataTargetOwnerResolver {
  return ({ name, frames }) => {
    const owner = findLastFrame(frames, (frame) => frame.itemType === parentItemType)?.owner
    return name === undefined || owner === undefined
      ? undefined
      : { root: "ExternalDataSource", objectName: `${owner.objectName}.${segment}.${name}` }
  }
}

function findLastFrame(
  frames: readonly CommonMetadataTargetOwnerFrame[],
  predicate: (frame: CommonMetadataTargetOwnerFrame) => boolean,
): CommonMetadataTargetOwnerFrame | undefined {
  for (let index = frames.length - 1; index >= 0; index -= 1) {
    const frame = frames[index]
    if (frame !== undefined && predicate(frame)) return frame
  }
  return undefined
}
