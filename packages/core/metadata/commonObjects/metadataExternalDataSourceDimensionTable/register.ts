export * from "./types"

import {
  externalDataSourceNestedOwnerResolver,
  registerCommonMetadataTargetOwnerResolver,
} from "../metadataTargetOwnerResolver"

registerCommonMetadataTargetOwnerResolver(
  "MetadataExternalDataSourceDimensionTable",
  externalDataSourceNestedOwnerResolver("MetadataExternalDataSourceCube", "DimensionTable"),
)
