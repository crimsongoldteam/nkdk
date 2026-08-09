export * from "./types"

import {
  externalDataSourceChildOwnerResolver,
  registerCommonMetadataTargetOwnerResolver,
} from "../metadataTargetOwnerResolver"

registerCommonMetadataTargetOwnerResolver(
  "MetadataExternalDataSourceTable",
  externalDataSourceChildOwnerResolver("Table"),
)
