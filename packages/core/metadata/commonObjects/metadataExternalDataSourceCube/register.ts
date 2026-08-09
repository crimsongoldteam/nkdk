export * from "./types"

import {
  externalDataSourceChildOwnerResolver,
  registerCommonMetadataTargetOwnerResolver,
} from "../metadataTargetOwnerResolver"

registerCommonMetadataTargetOwnerResolver(
  "MetadataExternalDataSourceCube",
  externalDataSourceChildOwnerResolver("Cube"),
)
