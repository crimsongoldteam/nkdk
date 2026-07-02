export * from "./types"

import {
  registerMetadataTargetOwnerResolver,
  type MetadataTargetOwnerFrame,
} from "../../orchestration/property/metadataTargetOwnerRegistry"

registerMetadataTargetOwnerResolver("MetadataExternalDataSourceCube", ({ name, frames }) => {
  const externalDataSource = findLastOwnerByRoot(frames, "ExternalDataSource")
  if (!name || !externalDataSource) return undefined

  return {
    root: "ExternalDataSource",
    objectName: `${externalDataSource.owner.objectName}.Cube.${name}`,
  }
})

function findLastOwnerByRoot(frames: readonly MetadataTargetOwnerFrame[], root: "ExternalDataSource") {
  for (let index = frames.length - 1; index >= 0; index--) {
    const frame = frames[index]
    if (frame.owner?.root === root) return { frame, owner: frame.owner }
  }
  return undefined
}
