import { commonRegisterFieldProperties } from "~/metadata/commonObjects/metadataRegisterField/rules"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const hasExplicitProperty = (propertyKey: string) => (metadataItem: unknown): boolean =>
  metadataItem !== null &&
  metadataItem !== undefined &&
  typeof metadataItem === "object" &&
  Object.prototype.hasOwnProperty.call(metadataItem, propertyKey)

const accountingFlagProperties = {
  ...commonRegisterFieldProperties,
  indexing: {
    ...commonRegisterFieldProperties.indexing,
    toXML: hasExplicitProperty("indexing"),
  },
  fullTextSearch: {
    ...commonRegisterFieldProperties.fullTextSearch,
    toXML: hasExplicitProperty("fullTextSearch"),
  },
}

export const AccountingFlagRules = {
  itemType: "AccountingFlag",
  properties: accountingFlagProperties,
} as const satisfies MetadataItemRule

export const ExtDimensionAccountingFlagRules = {
  itemType: "ExtDimensionAccountingFlag",
  properties: accountingFlagProperties,
} as const satisfies MetadataItemRule
