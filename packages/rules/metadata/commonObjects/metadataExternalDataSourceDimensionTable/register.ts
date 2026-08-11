export * from "./types"

import {
  externalDataSourceNestedOwnerResolver,
  defineCommonMetadataTargetOwnerResolver,
} from "../metadataTargetOwnerResolver"

export const metadataExternalDataSourceDimensionTableOwnerRules = defineCommonMetadataTargetOwnerResolver(
  "MetadataExternalDataSourceDimensionTable",
  externalDataSourceNestedOwnerResolver("MetadataExternalDataSourceCube", "DimensionTable"),
)
