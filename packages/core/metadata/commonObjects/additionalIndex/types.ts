import { IndexFieldsXML } from "../indexField/types"
import { defineMetadataItemCollectionRule, defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { AdditionalIndexItemRules, AdditionalIndexRules } from "./rules"

export type AdditionalIndexItem = MetadataTypeByRule<typeof AdditionalIndexItemRules>
export type AdditionalIndexItemYAML = YAMLTypeByRule<typeof AdditionalIndexItemRules>

export type AdditionalIndexCollection = AdditionalIndexItem[]
export type AdditionalIndexCollectionYAML = AdditionalIndexItemYAML[]

export type AdditionalIndex = MetadataTypeByRule<typeof AdditionalIndexRules>
export type AdditionalIndexYAML = YAMLTypeByRule<typeof AdditionalIndexRules>

/**
 * Legacy-типы для совместимости со старым XML-кодом metadataDocument/metadataSequence.
 * После миграции этих объектов на rules.ts типы будут удалены.
 */
export interface AdditionalIndexXML {
  _id?: string
  AdditionalFields?: IndexFieldsXML
  IndexedFields?: IndexFieldsXML
  Name?: string
  Table?: string
}

export type AdditionalIndexesXML = AdditionalIndexXML[]
export type AdditionalIndexes = AdditionalIndexItem[]
export type AdditionalIndexesYAML = AdditionalIndexItemYAML[]

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "AdditionalIndexItem",
  itemRule: AdditionalIndexItemRules,
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "AdditionalIndexCollection",
  itemRule: AdditionalIndexItemRules,
  xmlElement: "AdditionalIndex",
  keyField: "name",
  yamlAsArray: true,
})

export const metadataRuleLayer002 = defineMetadataItemRule({
  propertyType: "AdditionalIndex",
  itemRule: AdditionalIndexRules,
})
