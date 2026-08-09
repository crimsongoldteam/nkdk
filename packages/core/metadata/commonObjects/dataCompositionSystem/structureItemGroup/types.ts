import { registerMetadataItemRule } from "../../../ruleRuntime"
import { registerTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"
import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import "./collection/index"
import { StructureItemGroupRules } from "./rules"
import { importStructureItemGroupFromXMLToYAML } from "./fromXMLToYAML"

export type StructureItemGroup = MetadataTypeByRule<typeof StructureItemGroupRules>
export type StructureItemGroupYAML = YAMLTypeByRule<typeof StructureItemGroupRules>

registerMetadataItemRule({
  propertyType: "StructureItemGroup",
  itemRule: StructureItemGroupRules,
})

registerTypeRule("StructureItemGroup", "importFromXMLToYAML", importStructureItemGroupFromXMLToYAML)
registerTypeRule("StructureItemGroup", "yamlToXMLNestedRule", {
  kind: "item",
  itemRule: StructureItemGroupRules,
  configurationIndexAddressing: "yamlPath",
  normalizeYAML: ({ yaml }) => normalizeStructureItemGroupYAML(yaml),
})

function normalizeStructureItemGroupYAML(yaml: unknown): unknown {
  if (!Array.isArray(yaml)) return yaml
  if (yaml.length === 0) return undefined
  const [head, ...tail] = yaml
  return {
    ПоляГруппировки: [head],
    ...(tail.length === 0 ? {} : { Структура: normalizeStructureItemGroupYAML(tail) }),
  }
}
