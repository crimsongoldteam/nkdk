import { ConfigurationContextFromXML } from "../../context/types"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { importMetadataItemCollectionFromXML } from "../../orchestration/metadataCollection/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { StandardAttributeDescriptionRules } from "../standardAttributeDescription/rules"
import { StandardTabularSectionDescriptionRules } from "./rules"
import { StandardTabularSectionDescriptions } from "./types"

const xmlElement = "xr:StandardTabularSection"
const standardAttributeXmlElement = "xr:StandardAttribute"

registerMetadataItemCollectionRule({
  propertyType: "StandardTabularSectionDescriptions",
  itemRule: StandardTabularSectionDescriptionRules,
  xmlElement,
  keyField: "name",
  fromXML: (context: ConfigurationContextFromXML, rule: PropertyRule, xml: unknown) => {
    return importMetadataItemCollectionFromXML(StandardTabularSectionDescriptionRules, xmlElement, {
      configurationIndexUidSegment: rule.configurationIndexUidSegment,
    })(context, rule, xml) as StandardTabularSectionDescriptions | undefined
  },
})

registerMetadataItemCollectionRule({
  propertyType: "StandardTabularSectionAttributeDescriptions",
  itemRule: StandardAttributeDescriptionRules,
  xmlElement: standardAttributeXmlElement,
  keyField: "name",
  fromXML: (context: ConfigurationContextFromXML, rule: PropertyRule, xml: unknown) => {
    return importMetadataItemCollectionFromXML(StandardAttributeDescriptionRules, standardAttributeXmlElement, {
      configurationIndexUidSegment: rule.configurationIndexUidSegment,
    })(context, rule, xml)
  },
})
