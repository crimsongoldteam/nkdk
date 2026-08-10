import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { StandardAttributeDescriptionRules } from "../standardAttributeDescription/rules"
import { StandardTabularSectionDescriptionRules } from "./rules"

const xmlElement = "xr:StandardTabularSection"
const standardAttributeXmlElement = "xr:StandardAttribute"

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "StandardTabularSectionDescriptions",
  itemRule: StandardTabularSectionDescriptionRules,
  xmlElement,
  keyField: "name",
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "StandardTabularSectionAttributeDescriptions",
  itemRule: StandardAttributeDescriptionRules,
  xmlElement: standardAttributeXmlElement,
  keyField: "name",
})
