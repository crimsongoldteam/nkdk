import { commonRegisterFieldProperties } from "../metadataRegisterField/rules"
import { addDefaultLanguageNameToSynonym } from "../../helpers/synonymHelpers"
import { ConfigurationContext } from "../../context/types"
import type { MetadataItemRule, PropertyRule } from "../../orchestration/property/types"
import type { YAMLPropertySource } from "../../orchestration/property/fromYAMLToXMLTypes"

const hasExplicitProperty =
  (propertyKey: string) =>
  (source: YAMLPropertySource | unknown): boolean =>
    hasProperty(source, propertyKey)

const hasProperty = (source: YAMLPropertySource | unknown, propertyKey: string): boolean =>
  source !== null &&
  source !== undefined &&
  typeof source === "object" &&
  ("has" in source && typeof source.has === "function"
    ? source.has(propertyKey)
    : Object.prototype.hasOwnProperty.call(source, propertyKey))

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
  } satisfies PropertyRule,
}

export const AccountingFlagRules = {
  itemType: "AccountingFlag",
  properties: accountingFlagProperties,
} as const satisfies MetadataItemRule

export const ExtDimensionAccountingFlagRules = {
  itemType: "ExtDimensionAccountingFlag",
  properties: accountingFlagProperties,
} as const satisfies MetadataItemRule
