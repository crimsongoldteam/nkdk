export * from "./types"

import {
  externalDataSourceChildOwnerResolver,
  defineCommonMetadataTargetOwnerResolver,
} from "../metadataTargetOwnerResolver"

export const metadataExternalDataSourceTableOwnerRules = defineCommonMetadataTargetOwnerResolver(
  "MetadataExternalDataSourceTable",
  externalDataSourceChildOwnerResolver("Table"),
)
