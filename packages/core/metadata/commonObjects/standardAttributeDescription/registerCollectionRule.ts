import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import type { PropertyRule, StandardAttributeDescriptionsPropertyRule } from "../../ruleRuntime/property/types"
import { StandardAttributeDescriptionRules } from "./rules"
import { importStandardAttributeDescriptionsFromXMLToYAML } from "./fromXMLToYAML"
import { StandartAttributeNameFromYAML, StandartAttributeNameToYAML } from "./standartAttributeNames"
import { registerExplicitXMLPropertyType } from "../../ruleRuntime/property/explicitXMLPropertyRegistry"
import { EMPTY_XML_TAG_VALUE } from "../../../yaml/scalarTags"

function buildNameFromYAML(rule: PropertyRule | undefined): (yamlKey: string) => string {
  const names = (rule as StandardAttributeDescriptionsPropertyRule | undefined)?.standartAttributeNames
  if (!names) return StandartAttributeNameFromYAML

  const reverse = new Map(Object.entries(names).map(([internalName, yamlName]) => [yamlName, internalName]))
  return (yamlKey) => reverse.get(yamlKey) ?? StandartAttributeNameFromYAML(yamlKey)
}

registerExplicitXMLPropertyType({
  propertyType: "StandardAttributeDescriptions",
  action: "materializeCollection",
  yamlValue: EMPTY_XML_TAG_VALUE,
})

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "StandardAttributeDescriptions",
  itemRule: StandardAttributeDescriptionRules,
  xmlElement: "xr:StandardAttribute",
  keyField: "name",
  nameFromYAMLKey: StandartAttributeNameFromYAML,
  nameFromYAMLKeyForProperty: ({ yamlKey, propertyRule }) => buildNameFromYAML(propertyRule)(yamlKey),
  completeItemNames: ({ source, propertyRule }) =>
    Object.keys(
      (propertyRule as StandardAttributeDescriptionsPropertyRule).standartAttributeNamesXML?.(source) ??
        (propertyRule as StandardAttributeDescriptionsPropertyRule).standartAttributeNames ??
        {}
  ),
  preserveReferenceItems: true,
  sparseItems: true,
  omitDefaultsForSparseItems: true,
  omitDefaultsForSparseItem: ({ name }) => name !== undefined && /^ExtDimension(Type)?\d+$/.test(name),
  omitEmptyOutput: true,
  recordYamlKeyFromYAML: ({ name }) => StandartAttributeNameToYAML[name as keyof typeof StandartAttributeNameToYAML],
  fromXMLToYAML: importStandardAttributeDescriptionsFromXMLToYAML,
})
