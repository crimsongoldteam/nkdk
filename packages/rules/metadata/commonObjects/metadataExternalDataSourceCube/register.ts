export * from "./types"

import {
  externalDataSourceChildOwnerResolver,
  defineCommonMetadataTargetOwnerResolver,
} from "../metadataTargetOwnerResolver"

export const metadataExternalDataSourceCubeOwnerRules = defineCommonMetadataTargetOwnerResolver(
  "MetadataExternalDataSourceCube",
  externalDataSourceChildOwnerResolver("Cube"),
)
