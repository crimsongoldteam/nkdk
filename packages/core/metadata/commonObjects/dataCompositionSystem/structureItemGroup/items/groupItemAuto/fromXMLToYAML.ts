import { importMetadataItemFromXMLToYAML } from "../../../../../ruleRuntime/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "../../../../../ruleRuntime/property/importYamlTypes"
import { definePropertyTypeRule } from "../../../../../ruleRuntime/property/typeRuleRegistry"
import { GroupItemAutoRules } from "./rules"

export const importGroupItemAutoFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  name,
  traversal,
}) => {
  const yaml = importMetadataItemFromXMLToYAML({
    context,
    rule: GroupItemAutoRules,
    xml,
    name,
    traversal,
  })
  if (yaml === undefined || yaml === null || typeof yaml !== "object" || Array.isArray(yaml)) return undefined

  return (yaml as Record<string, unknown>).Использование === "Ложь" ? "([Авто])" : "[Авто]"
}

export const metadataPropertyRule000 = definePropertyTypeRule("GroupItemAuto", "importFromXMLToYAML", importGroupItemAutoFromXMLToYAML)
