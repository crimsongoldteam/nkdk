import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import type { PropertyRule, StandardAttributeDescriptionsPropertyRule } from "../../orchestration/property/types"
import { StandardAttributeDescriptionRules } from "./rules"
import { importStandardAttributeDescriptionsFromXMLToYAML } from "./fromXMLToYAML"
import { StandartAttributeNameFromYAML, StandartAttributeNameToYAML } from "./standartAttributeNames"

function buildNameFromYAML(rule: PropertyRule | undefined): (yamlKey: string) => string {
  const names = (rule as StandardAttributeDescriptionsPropertyRule | undefined)?.standartAttributeNames
  if (!names) return StandartAttributeNameFromYAML

  const reverse = new Map(Object.entries(names).map(([internalName, yamlName]) => [yamlName, internalName]))
  return (yamlKey) => reverse.get(yamlKey) ?? StandartAttributeNameFromYAML(yamlKey)
}

registerMetadataItemCollectionRule({
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
  mapItemOutput: ({ xml, name, propertyRule, collectionYAML, referenceXML }) => {
    if (
      name !== undefined &&
      Object.prototype.hasOwnProperty.call(
        (propertyRule as StandardAttributeDescriptionsPropertyRule | undefined)?.standartAttributeNames ?? {},
        name
      ) &&
      !/^ExtDimension(Type)?\d+$/.test(name) &&
      !hasMeaningfulCollectionEntry(collectionYAML) &&
      referenceXML === undefined
    ) {
      return undefined
    }
    return xml
  },
  recordYamlKeyFromYAML: ({ name }) => StandartAttributeNameToYAML[name as keyof typeof StandartAttributeNameToYAML],
  fromXMLToYAML: importStandardAttributeDescriptionsFromXMLToYAML,
})

function hasMeaningfulCollectionEntry(value: unknown): boolean {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  return Object.values(value).some(
    (entry) =>
      entry !== null &&
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      Object.keys(entry as Record<string, unknown>).length > 0
  )
}
