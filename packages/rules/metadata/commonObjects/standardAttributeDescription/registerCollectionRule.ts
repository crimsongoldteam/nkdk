import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import type { PropertyRule, StandardAttributeDescriptionsPropertyRule } from "@nkdk/runtime/rule-kit"
import { StandardAttributeDescriptionRules } from "./rules"
import { importStandardAttributeDescriptionsFromXMLToYAML } from "./fromXMLToYAML"
import { StandartAttributeNameFromYAML, StandartAttributeNameToYAML } from "./standartAttributeNames"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { exportStandardAttributeDescriptionToJSONSchema } from "./toJSONSchema"

function buildNameFromYAML(rule: PropertyRule | undefined): (yamlKey: string) => string {
  const names = (rule as StandardAttributeDescriptionsPropertyRule | undefined)?.standartAttributeNames
  if (!names) return StandartAttributeNameFromYAML

  const reverse = new Map(Object.entries(names).map(([internalName, yamlName]) => [yamlName, internalName]))
  return (yamlKey) => reverse.get(yamlKey) ?? StandartAttributeNameFromYAML(yamlKey)
}

function buildYamlName(rule: PropertyRule | undefined): (name: string) => string {
  const names = (rule as StandardAttributeDescriptionsPropertyRule | undefined)?.standartAttributeNames
  return (name) => names?.[name]
    ?? StandartAttributeNameToYAML[name as keyof typeof StandartAttributeNameToYAML]
    ?? name
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
      rule.standartAttributeNamesXML?.(source) ??
        rule.standartAttributeNames ??
        {},
    )
  },
  preserveReferenceItems: true,
  sparseItems: true,
  omitDefaultsForSparseItems: true,
  omitEmptyOutput: true,
  recordYamlKeyFromYAML: ({ name, propertyRule }) => buildYamlName(propertyRule)(name),
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
})
