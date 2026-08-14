import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import type { PropertyRule, StandardAttributeDescriptionsPropertyRule } from "@nkdk/runtime/rule-kit"
import { StandardAttributeDescriptionRules } from "./rules"
import { importStandardAttributeDescriptionsFromXMLToYAML } from "./fromXMLToYAML"
import { StandartAttributeNameFromYAML, StandartAttributeNameToYAML } from "./standartAttributeNames"
import { XML_ABSENT_TAG_VALUE, XML_PRESENT_TAG_VALUE } from "@nkdk/runtime"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import {
  isAbsentStandardAttributeItem,
  sourceWithoutAbsentStandardAttributes,
} from "./absentItems"
import { exportStandardAttributeDescriptionToJSONSchema } from "./toJSONSchema"

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
  completeItemNames: ({ source, propertyRule }) => {
    const rule = propertyRule as StandardAttributeDescriptionsPropertyRule
    return Object.keys(
      rule.standartAttributeNamesXML?.(sourceWithoutAbsentStandardAttributes(source, rule)) ??
        rule.standartAttributeNames ??
        {},
    )
  },
  normalizeItemYAML: ({ yaml, name, propertyRule }) => {
    const rule = propertyRule as StandardAttributeDescriptionsPropertyRule | undefined
    return yaml === XML_ABSENT_TAG_VALUE && name !== undefined && rule?.standartAttributeNames?.[name] !== undefined
      ? {}
      : yaml
  },
  mapItemOutput: ({ xml, name, collectionYAML, propertyRule }) =>
    isAbsentStandardAttributeItem({ collectionYAML, internalName: name, propertyRule }) ? undefined : xml,
  preserveReferenceItems: true,
  sparseItems: true,
  omitDefaultsForSparseItems: true,
  omitEmptyOutput: true,
  recordYamlKeyFromYAML: ({ name }) => StandartAttributeNameToYAML[name as keyof typeof StandartAttributeNameToYAML],
  fromXMLToYAML: importStandardAttributeDescriptionsFromXMLToYAML,
  toJSONSchema: exportStandardAttributeDescriptionToJSONSchema,
})

export const metadataRuleLayer000 = defineMetadataRules({
  ...collectionRule,
  schemaPropertyRefs: {
    ...collectionRule.schemaPropertyRefs,
    StandardAttributeDescriptions: ({ context, rule, execution }) =>
      exportStandardAttributeDescriptionToJSONSchema({
        context,
        rule,
        value: undefined,
        execution,
      }),
  },
  explicitXMLPropertyTypes: {
    StandardAttributeDescriptions: {
      propertyType: "StandardAttributeDescriptions",
      action: "materializeCollection",
      yamlValue: XML_PRESENT_TAG_VALUE,
    },
  },
})
