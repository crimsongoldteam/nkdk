import { commonRegisterFieldProperties } from "~/metadata/commonObjects/metadataRegisterField/rules"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const hasExplicitProperty = (propertyKey: string) => (metadataItem: unknown): boolean =>
  metadataItem !== null &&
  metadataItem !== undefined &&
  typeof metadataItem === "object" &&
  Object.prototype.hasOwnProperty.call(metadataItem, propertyKey)

const accountingFlagProperties = {
  ...commonRegisterFieldProperties,
  synonym: {
    ...commonRegisterFieldProperties.synonym,
    defaultValue: ({
      context,
      name,
      operation,
    }: {
      context: ConfigurationContext
      yaml?: unknown
      name?: string
      operation?: string
    }) =>
      operation === "importFromYAML" && name
        ? addDefaultLanguageNameToSynonym(context, undefined, name)
        : { items: {} },
  },
  indexing: {
    ...commonRegisterFieldProperties.indexing,
    toXML: hasExplicitProperty("indexing"),
  },
  fullTextSearch: {
    ...commonRegisterFieldProperties.fullTextSearch,
    toXML: hasExplicitProperty("fullTextSearch"),
  },
  binaryDataStorageLocationUse: {
    ...commonRegisterFieldProperties.binaryDataStorageLocationUse,
    noImplicitValueYAML: true,
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
