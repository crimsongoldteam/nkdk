export * from "./types"

import {
  registerMetadataTargetOwnerResolver,
  type MetadataTargetOwnerFrame,
} from "../../orchestration/property/metadataTargetOwnerRegistry"

registerMetadataTargetOwnerResolver("MetadataExternalDataSourceDimensionTable", ({ name, frames }) => {
  const cube = findLastFrameByItemType(frames, "MetadataExternalDataSourceCube")
  if (!name || !cube?.owner) return undefined

  return {
    root: "ExternalDataSource",
    objectName: `${cube.owner.objectName}.DimensionTable.${name}`,
  }
})

function findLastFrameByItemType(
  frames: readonly MetadataTargetOwnerFrame[],
  itemType: "MetadataExternalDataSourceCube"
): MetadataTargetOwnerFrame | undefined {
  for (let index = frames.length - 1; index >= 0; index--) {
    const frame = frames[index]
    if (frame.itemType === itemType) return frame
  }
  return undefined
}
