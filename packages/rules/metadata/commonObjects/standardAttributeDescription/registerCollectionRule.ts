import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import type { PropertyRule, StandardAttributeDescriptionsPropertyRule } from "@nkdk/runtime/rule-kit"
import { StandardAttributeDescriptionRules } from "./rules"
import { importStandardAttributeDescriptionsFromXMLToYAML } from "./fromXMLToYAML"
import { StandartAttributeNameFromYAML, StandartAttributeNameToYAML } from "./standartAttributeNames"
import { EMPTY_XML_TAG_VALUE } from "@nkdk/runtime"
import { defineMetadataRules } from "../../ruleRuntime/definition"

function buildNameFromYAML(rule: PropertyRule | undefined): (yamlKey: string) => string {
  const names = (rule as StandardAttributeDescriptionsPropertyRule | undefined)?.standartAttributeNames
  if (!names) return StandartAttributeNameFromYAML

  const reverse = new Map(Object.entries(names).map(([internalName, yamlName]) => [yamlName, internalName]))
  return (yamlKey) => reverse.get(yamlKey) ?? StandartAttributeNameFromYAML(yamlKey)
}

const collectionRule = defineMetadataItemCollectionRule({
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
  omitEmptyOutput: true,
  recordYamlKeyFromYAML: ({ name }) => StandartAttributeNameToYAML[name as keyof typeof StandartAttributeNameToYAML],
  fromXMLToYAML: importStandardAttributeDescriptionsFromXMLToYAML,
})

export const metadataRuleLayer000 = defineMetadataRules({
  ...collectionRule,
  explicitXMLPropertyTypes: {
    StandardAttributeDescriptions: {
      propertyType: "StandardAttributeDescriptions",
      action: "materializeCollection",
      yamlValue: EMPTY_XML_TAG_VALUE,
    },
  },
})
