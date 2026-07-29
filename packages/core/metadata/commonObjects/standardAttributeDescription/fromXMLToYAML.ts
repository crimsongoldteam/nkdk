import { importMetadataItemCollectionFromXMLToYAML } from "../../orchestration/metadataCollection/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "../../orchestration/property/importYamlTypes"
import type { StandardAttributeDescriptionsPropertyRule } from "../../orchestration/property/types"
import { StandardAttributeDescriptionRules } from "./rules"
import { StandartAttributeNameToYAML, type StandartAttributeName } from "./standartAttributeNames"

export const importStandardAttributeDescriptionsFromXMLToYAML: ImportFromXMLToYAMLFunction = (params) => {
  const rule = params.rule as StandardAttributeDescriptionsPropertyRule
  const names = rule.standartAttributeNames ?? StandartAttributeNameToYAML
  const yaml = importMetadataItemCollectionFromXMLToYAML({
    context: params.context,
    rule: params.rule,
    xml: params.xml,
    itemRule: StandardAttributeDescriptionRules,
    xmlElement: "xr:StandardAttribute",
    keyField: "name",
    configurationIndexUidSegment: rule.configurationIndexUidSegment,
    preserveItemPropertyPresence: true,
    recordYamlKeyFromYAML: ({ name }) => names[name] ?? StandartAttributeNameToYAML[name as StandartAttributeName] ?? name,
    traversal: params.traversal,
  })
  return yaml
}
