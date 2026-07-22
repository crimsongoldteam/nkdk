import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { StandardAttributeDescriptionRules } from "../standardAttributeDescription/rules"
import { StandardTabularSectionDescriptionRules } from "./rules"

const xmlElement = "xr:StandardTabularSection"
const standardAttributeXmlElement = "xr:StandardAttribute"

registerMetadataItemCollectionRule({
  propertyType: "StandardTabularSectionDescriptions",
  itemRule: StandardTabularSectionDescriptionRules,
  xmlElement,
  keyField: "name",
})

registerMetadataItemCollectionRule({
  propertyType: "StandardTabularSectionAttributeDescriptions",
  itemRule: StandardAttributeDescriptionRules,
  xmlElement: standardAttributeXmlElement,
  keyField: "name",
})
