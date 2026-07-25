import { registerMetadataItemRule } from "../../../orchestration"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { MetadataTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import "./collection/index"
import { StructureItemGroupRules } from "./rules"
import { importStructureItemGroupFromXMLToYAML } from "./fromXMLToYAML"
import {
  collectStructureItemGroupTopology,
  restoreStructureItemGroupTopology,
} from "./configurationIndex"

export type StructureItemGroup = MetadataTypeByRule<typeof StructureItemGroupRules>
export type StructureItemGroupYAML = YAMLTypeByRule<typeof StructureItemGroupRules>

registerMetadataItemRule({
  propertyType: "StructureItemGroup",
  itemRule: StructureItemGroupRules,
})

registerTypeRule("StructureItemGroup", "importFromXMLToYAML", importStructureItemGroupFromXMLToYAML)
registerTypeRule("StructureItemGroup", "collectConfigurationIndexFromXML", ({ context, xml }) => {
  collectStructureItemGroupTopology(context, xml)
})
registerTypeRule("StructureItemGroup", "yamlToXMLNestedRule", {
  kind: "item",
  itemRule: StructureItemGroupRules,
  configurationIndexAddressing: "yamlPath",
  normalizeYAML: ({ yaml }) => normalizeStructureItemGroupYAML(yaml),
  transformOutput: ({ context, xml }) => restoreStructureItemGroupTopology({ context, xml }),
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
